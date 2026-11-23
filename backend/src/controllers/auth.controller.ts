import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { prisma } from '../lib/prisma';
import { config } from '../config';
import { generateAccessToken, generateRefreshToken, verifyRefreshToken } from '../utils/jwt';

/* Indian mobile number: 10 digits starting 6-9 */
const PHONE_RE = /^[6-9]\d{9}$/;
const LANGUAGES = ['en', 'hi', 'te', 'ta', 'kn', 'ml', 'mr', 'bn', 'gu', 'pa', 'or'];
export const VEHICLE_TYPES = ['CAR', 'VAN', 'BUS', 'MINI_TRUCK', 'LORRY', 'TRUCK', 'TRAILER', 'TANKER', 'CRANE', 'TRACTOR', 'AUTO', 'AMBULANCE'];

const normalizePhone = (raw: unknown) => String(raw ?? '').replace(/\D/g, '').replace(/^91(?=\d{10}$)/, '');

/* Until an SMS provider is connected, OTP_TEST_MODE accepts the fixed code 1234 for every number. */
const otpIsValid = (otp: unknown) => config.otp.testMode && String(otp) === config.otp.testCode;

type UserWithProfiles = NonNullable<Awaited<ReturnType<typeof findUserWithProfiles>>>;
const findUserWithProfiles = (where: { id: string } | { phone: string }) =>
  prisma.user.findUnique({ where, include: { driver: true, fleetOwner: true } });

const publicUser = (user: UserWithProfiles) => ({
  id: user.id,
  email: user.email,
  phone: user.phone,
  role: user.role,
  language: user.language,
});

const publicProfile = (user: UserWithProfiles) => {
  if (user.driver) {
    const d = user.driver;
    return {
      id: d.id, registrationId: d.registrationId, fullName: d.fullName, firstName: d.firstName, lastName: d.lastName,
      mobileNumber: d.mobileNumber, registrationType: d.registrationType, vehicleTypes: d.vehicleTypes,
      verificationStatus: d.verificationStatus,
    };
  }
  if (user.fleetOwner) {
    const f = user.fleetOwner;
    return {
      id: f.id, fullName: `${f.firstName} ${f.lastName}`.trim(), firstName: f.firstName, lastName: f.lastName,
      mobileNumber: f.mobileNumber, verificationStatus: f.verificationStatus,
    };
  }
  return null;
};

const issueSession = async (user: UserWithProfiles) => {
  const accessToken = generateAccessToken({ userId: user.id, email: user.email ?? '', role: user.role });
  const refreshToken = generateRefreshToken({ userId: user.id });
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 7);
  await prisma.refreshToken.create({ data: { token: refreshToken, userId: user.id, expiresAt } });
  return { accessToken, refreshToken, user: publicUser(user), profile: publicProfile(user) };
};

const signSignupToken = (phone: string) =>
  jwt.sign({ phone, purpose: 'signup' }, config.jwtSecret, { expiresIn: '30m' });

const readSignupToken = (token: unknown): string | null => {
  try {
    const payload = jwt.verify(String(token), config.jwtSecret) as { phone?: string; purpose?: string };
    return payload.purpose === 'signup' && payload.phone ? payload.phone : null;
  } catch {
    return null;
  }
};

const parseDob = (value: unknown): Date | null => {
  if (!value) return null;
  const d = new Date(String(value));
  if (Number.isNaN(d.getTime())) return null;
  const age = (Date.now() - d.getTime()) / (365.25 * 24 * 3600 * 1000);
  return age >= 18 && age <= 80 ? d : null;
};

const cleanName = (v: unknown) => String(v ?? '').trim().replace(/\s+/g, ' ').slice(0, 60);

export class AuthController {
  /* Step 1 of phone sign-in: "send" an OTP. Tells the app whether this number already has an account. */
  sendOtp = async (req: Request, res: Response): Promise<void> => {
    try {
      const phone = normalizePhone(req.body?.phone);
      if (!PHONE_RE.test(phone)) { res.status(400).json({ success: false, error: 'Enter a valid 10-digit mobile number' }); return; }
      if (!config.otp.testMode) {
        res.status(503).json({ success: false, error: 'SMS service is not configured yet' }); return;
      }
      const user = await prisma.user.findUnique({ where: { phone }, select: { role: true } });
      res.json({ success: true, data: { phone, isRegistered: !!user, role: user?.role ?? null, testMode: true } });
    } catch (e) {
      console.error(e);
      res.status(500).json({ success: false, error: 'Could not send OTP' });
    }
  };

  /* Step 2: verify the OTP. Existing users are signed in; new numbers get a short-lived sign-up token. */
  verifyOtp = async (req: Request, res: Response): Promise<void> => {
    try {
      const phone = normalizePhone(req.body?.phone);
      if (!PHONE_RE.test(phone)) { res.status(400).json({ success: false, error: 'Enter a valid 10-digit mobile number' }); return; }
      if (!otpIsValid(req.body?.otp)) { res.status(401).json({ success: false, error: 'Incorrect OTP' }); return; }

      const user = await findUserWithProfiles({ phone });
      if (user) {
        if (!user.isActive || user.role === 'ADMIN') { res.status(403).json({ success: false, error: 'This account cannot sign in here' }); return; }
        res.json({ success: true, data: { isNewUser: false, ...(await issueSession(user)) } });
        return;
      }
      res.json({ success: true, data: { isNewUser: true, signupToken: signSignupToken(phone) } });
    } catch (e) {
      console.error(e);
      res.status(500).json({ success: false, error: 'OTP verification failed' });
    }
  };

  /* Step 3 (new users): create the driver or fleet owner account with the details collected in the app. */
  signup = async (req: Request, res: Response): Promise<void> => {
    try {
      const phone = readSignupToken(req.body?.signupToken);
      if (!phone) { res.status(401).json({ success: false, error: 'Your verification expired. Please verify your number again.' }); return; }

      const role = req.body?.role === 'FLEET_OWNER' ? 'FLEET_OWNER' : req.body?.role === 'DRIVER' ? 'DRIVER' : null;
      const firstName = cleanName(req.body?.firstName);
      const lastName = cleanName(req.body?.lastName);
      const dob = parseDob(req.body?.dateOfBirth);
      const language = LANGUAGES.includes(req.body?.language) ? req.body.language : 'en';
      const permissions = typeof req.body?.permissions === 'object' && req.body.permissions ? req.body.permissions : undefined;

      if (!role) { res.status(400).json({ success: false, error: 'Choose driver or fleet owner' }); return; }
      if (firstName.length < 2 || lastName.length < 1) { res.status(400).json({ success: false, error: 'Enter your first and last name' }); return; }
      if (!dob) { res.status(400).json({ success: false, error: 'Enter a valid date of birth (age 18 to 80)' }); return; }

      if (await prisma.user.findUnique({ where: { phone } })) {
        res.status(409).json({ success: false, error: 'This number is already registered. Please log in.' }); return;
      }

      let created;
      if (role === 'DRIVER') {
        const registrationType = req.body?.registrationType === 'DRIVER_WITH_VEHICLE' ? 'DRIVER_WITH_VEHICLE' : 'DRIVER_ONLY';
        const vehicleTypes: string[] = Array.isArray(req.body?.vehicleTypes)
          ? req.body.vehicleTypes.filter((v: unknown) => VEHICLE_TYPES.includes(String(v)))
          : [];
        if (vehicleTypes.length === 0) { res.status(400).json({ success: false, error: 'Select at least one vehicle you can drive' }); return; }

        created = await prisma.user.create({
          data: {
            phone, role, language, permissions,
            driver: {
              create: {
                firstName, lastName, fullName: `${firstName} ${lastName}`, dateOfBirth: dob,
                mobileNumber: phone, registrationType, vehicleTypes,
                registrationId: `RW-${Date.now()}`,
              },
            },
          },
          include: { driver: true, fleetOwner: true },
        });
        await prisma.notification.create({
          data: {
            driverId: created.driver!.id,
            title: 'Welcome to RajWorthman!',
            message: 'Your account is ready. Complete the remaining steps on your home screen to get verified.',
            type: 'REGISTRATION',
          },
        });
      } else {
        created = await prisma.user.create({
          data: {
            phone, role, language, permissions,
            fleetOwner: { create: { firstName, lastName, dateOfBirth: dob, mobileNumber: phone } },
          },
          include: { driver: true, fleetOwner: true },
        });
      }

      res.status(201).json({ success: true, data: await issueSession(created) });
    } catch (e) {
      if ((e as { code?: string })?.code === 'P2002') { res.status(409).json({ success: false, error: 'This number is already registered. Please log in.' }); return; }
      console.error(e);
      res.status(500).json({ success: false, error: 'Sign-up failed' });
    }
  };

  /* Email + password login, kept for accounts created before phone sign-in (sprint 1). */
  login = async (req: Request, res: Response): Promise<void> => {
    try {
      const { email, password } = req.body ?? {};
      if (!email || !password) { res.status(400).json({ success: false, error: 'Email and password required' }); return; }
      const user = await prisma.user.findUnique({ where: { email }, include: { driver: true, fleetOwner: true } });
      if (!user || !user.isActive || !user.passwordHash || user.role === 'ADMIN') {
        res.status(401).json({ success: false, error: 'Invalid credentials' }); return;
      }
      if (!(await bcrypt.compare(password, user.passwordHash))) {
        res.status(401).json({ success: false, error: 'Invalid credentials' }); return;
      }
      res.json({ success: true, data: await issueSession(user) });
    } catch (error) {
      console.error(error);
      res.status(500).json({ success: false, error: 'Login failed' });
    }
  };

  refresh = async (req: Request, res: Response): Promise<void> => {
    try {
      const { refreshToken } = req.body ?? {};
      if (!refreshToken) { res.status(400).json({ success: false, error: 'Refresh token required' }); return; }

      const stored = await prisma.refreshToken.findUnique({ where: { token: refreshToken } });
      if (!stored || stored.isRevoked || stored.expiresAt < new Date()) {
        res.status(401).json({ success: false, error: 'Invalid refresh token' }); return;
      }

      const payload = verifyRefreshToken(refreshToken);
      const user = await prisma.user.findUnique({ where: { id: payload.userId } });
      if (!user || !user.isActive) { res.status(401).json({ success: false, error: 'User not found' }); return; }

      await prisma.refreshToken.update({ where: { id: stored.id }, data: { isRevoked: true } });
      const newRefreshToken = generateRefreshToken({ userId: user.id });
      const newAccessToken = generateAccessToken({ userId: user.id, email: user.email ?? '', role: user.role });

      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 7);
      await prisma.refreshToken.create({ data: { token: newRefreshToken, userId: user.id, expiresAt } });

      res.json({ success: true, data: { accessToken: newAccessToken, refreshToken: newRefreshToken } });
    } catch {
      res.status(401).json({ success: false, error: 'Token refresh failed' });
    }
  };

  logout = async (req: Request, res: Response): Promise<void> => {
    try {
      const { refreshToken } = req.body ?? {};
      if (refreshToken) {
        await prisma.refreshToken.updateMany({ where: { token: refreshToken, userId: req.user!.userId }, data: { isRevoked: true } });
      }
      res.json({ success: true, message: 'Logged out successfully' });
    } catch {
      res.status(500).json({ success: false, error: 'Logout failed' });
    }
  };

  me = async (req: Request, res: Response): Promise<void> => {
    try {
      const user = await findUserWithProfiles({ id: req.user!.userId });
      if (!user) { res.status(404).json({ success: false, error: 'User not found' }); return; }
      res.json({ success: true, data: { user: publicUser(user), profile: publicProfile(user) } });
    } catch {
      res.status(500).json({ success: false, error: 'Failed to fetch user' });
    }
  };

  setLanguage = async (req: Request, res: Response): Promise<void> => {
    const language = req.body?.language;
    if (!LANGUAGES.includes(language)) { res.status(400).json({ success: false, error: 'Unsupported language' }); return; }
    await prisma.user.update({ where: { id: req.user!.userId }, data: { language } });
    res.json({ success: true, data: { language } });
  };
}
