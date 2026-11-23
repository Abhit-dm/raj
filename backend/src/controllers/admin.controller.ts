import { Request, Response } from 'express';
import { Prisma } from '@prisma/client';
import { prisma } from '../lib/prisma';
import bcrypt from 'bcryptjs';
import { generateAccessToken, generateRefreshToken } from '../utils/jwt';
import { VEHICLE_TYPES } from './auth.controller';

const DOC_LABELS: Record<string, string> = {
  AADHAAR_CARD: 'Aadhaar card',
  DRIVING_LICENCE_FRONT: 'Driving licence (front)',
  DRIVING_LICENCE_BACK: 'Driving licence (back)',
  PROFILE_PHOTO: 'Profile photo',
  ADDRESS_PROOF: 'Address proof',
  PAN_CARD: 'PAN card',
  RC_BOOK: 'RC book',
};

/* The admin sidebar groups drivers into these buckets */
const BUCKETS: Record<string, Prisma.DriverWhereInput> = {
  all: {},
  incomplete: { verificationStatus: 'PROFILE_INCOMPLETE' },
  completed: { verificationStatus: { in: ['SUBMITTED', 'UNDER_REVIEW'] } },
  rc_pending: { documents: { some: { documentType: 'RC_BOOK', verificationStatus: { in: ['PENDING', 'UNDER_REVIEW'] } } } },
  resubmission: { verificationStatus: 'RESUBMISSION_REQUIRED' },
  approved: { verificationStatus: 'APPROVED' },
  rejected: { verificationStatus: 'REJECTED' },
};

const STATUS_TITLES: Record<string, string> = {
  APPROVED: 'Registration approved!',
  REJECTED: 'Registration rejected',
  RESUBMISSION_REQUIRED: 'Action needed: upload again',
  UNDER_REVIEW: 'Your profile is being reviewed',
};

export class AdminController {
  /* ── Auth ── */
  login = async (req: Request, res: Response): Promise<void> => {
    try {
      const { email, password } = req.body ?? {};
      if (!email || !password) { res.status(400).json({ success: false, error: 'Email and password required' }); return; }
      const user = await prisma.user.findUnique({ where: { email } });
      if (!user || user.role !== 'ADMIN' || !user.passwordHash) {
        res.status(401).json({ success: false, error: 'Invalid credentials' }); return;
      }
      const valid = await bcrypt.compare(password, user.passwordHash);
      if (!valid) { res.status(401).json({ success: false, error: 'Invalid credentials' }); return; }

      const accessToken = generateAccessToken({ userId: user.id, email: user.email ?? '', role: user.role });
      const refreshToken = generateRefreshToken({ userId: user.id });
      const expiresAt = new Date(); expiresAt.setDate(expiresAt.getDate() + 7);
      await prisma.refreshToken.create({ data: { token: refreshToken, userId: user.id, expiresAt } });

      res.json({ success: true, data: { accessToken, refreshToken, user: { id: user.id, email: user.email, role: user.role } } });
    } catch { res.status(500).json({ success: false, error: 'Login failed' }); }
  };

  /* ── Counts for the sidebar and overview ── */
  getStats = async (_req: Request, res: Response): Promise<void> => {
    try {
      const keys = Object.keys(BUCKETS);
      const counts = await Promise.all(keys.map((k) => prisma.driver.count({ where: BUCKETS[k] })));
      const drivers = Object.fromEntries(keys.map((k, i) => [k, counts[i]]));
      const [fleetTotal, fleetPending, fleetApproved, fleetVehicles] = await Promise.all([
        prisma.fleetOwner.count(),
        prisma.fleetOwner.count({ where: { verificationStatus: { in: ['SUBMITTED', 'UNDER_REVIEW'] } } }),
        prisma.fleetOwner.count({ where: { verificationStatus: 'APPROVED' } }),
        prisma.fleetVehicle.count(),
      ]);
      res.json({
        success: true,
        data: {
          drivers,
          fleet: { total: fleetTotal, pending: fleetPending, approved: fleetApproved, vehicles: fleetVehicles },
          // kept for the sprint 1 screens
          total: drivers.all, submitted: drivers.completed, approved: drivers.approved, rejected: drivers.rejected,
        },
      });
    } catch { res.status(500).json({ success: false, error: 'Failed to fetch stats' }); }
  };

  /* ── Drivers list ── */
  getDrivers = async (req: Request, res: Response): Promise<void> => {
    try {
      const { status, search, bucket = 'all', page = '1', limit = '20' } = req.query as Record<string, string>;
      const take = Math.min(Math.max(parseInt(limit) || 20, 1), 100);
      const skip = (Math.max(parseInt(page) || 1, 1) - 1) * take;

      const where: Prisma.DriverWhereInput = { ...(BUCKETS[bucket] ?? {}) };
      if (status) where.verificationStatus = status as Prisma.EnumVerificationStatusFilter['equals'];
      if (search) {
        where.OR = [
          { fullName: { contains: search, mode: 'insensitive' } },
          { mobileNumber: { contains: search } },
          { registrationId: { contains: search, mode: 'insensitive' } },
        ];
      }

      const [drivers, total] = await Promise.all([
        prisma.driver.findMany({
          where,
          include: { address: true, documents: true, drivingLicence: true, vehicles: { select: { id: true } } },
          orderBy: { createdAt: 'desc' },
          skip,
          take,
        }),
        prisma.driver.count({ where }),
      ]);

      res.json({ success: true, data: { drivers, total, page: skip / take + 1, pages: Math.ceil(total / take) } });
    } catch { res.status(500).json({ success: false, error: 'Failed to fetch drivers' }); }
  };

  getDriver = async (req: Request, res: Response): Promise<void> => {
    try {
      const driver = await prisma.driver.findUnique({
        where: { id: String(req.params.id) },
        include: {
          address: true,
          drivingExperience: true,
          drivingLicence: true,
          emergencyContact: true,
          documents: { orderBy: { uploadedAt: 'asc' } },
          vehicles: true,
          user: { select: { email: true, phone: true, language: true, createdAt: true } },
        },
      });
      if (!driver) { res.status(404).json({ success: false, error: 'Driver not found' }); return; }
      res.json({ success: true, data: driver });
    } catch { res.status(500).json({ success: false, error: 'Failed to fetch driver' }); }
  };

  /* ── Admin adds a driver directly. The driver then logs in with this phone number (OTP). ── */
  createDriver = async (req: Request, res: Response): Promise<void> => {
    try {
      const phone = String(req.body?.phone ?? '').replace(/\D/g, '').replace(/^91(?=\d{10}$)/, '');
      const firstName = String(req.body?.firstName ?? '').trim();
      const lastName = String(req.body?.lastName ?? '').trim();
      const dob = req.body?.dateOfBirth ? new Date(req.body.dateOfBirth) : null;
      const registrationType = req.body?.registrationType === 'DRIVER_WITH_VEHICLE' ? 'DRIVER_WITH_VEHICLE' : 'DRIVER_ONLY';
      const vehicleTypes: string[] = Array.isArray(req.body?.vehicleTypes)
        ? req.body.vehicleTypes.filter((v: unknown) => VEHICLE_TYPES.includes(String(v))) : [];

      if (!/^[6-9]\d{9}$/.test(phone)) { res.status(400).json({ success: false, error: 'Enter a valid 10-digit mobile number' }); return; }
      if (firstName.length < 2 || !lastName) { res.status(400).json({ success: false, error: 'First and last name are required' }); return; }
      if (dob && Number.isNaN(dob.getTime())) { res.status(400).json({ success: false, error: 'Invalid date of birth' }); return; }
      if (vehicleTypes.length === 0) { res.status(400).json({ success: false, error: 'Select at least one vehicle type' }); return; }

      const user = await prisma.user.create({
        data: {
          phone, role: 'DRIVER',
          driver: {
            create: {
              firstName, lastName, fullName: `${firstName} ${lastName}`, dateOfBirth: dob,
              mobileNumber: phone, registrationType, vehicleTypes, createdByAdmin: true,
              registrationId: `RW-${Date.now()}`,
            },
          },
        },
        include: { driver: true },
      });
      await prisma.notification.create({
        data: {
          driverId: user.driver!.id,
          title: 'Welcome to RajWorthman!',
          message: 'Our team created your account. Complete the remaining steps on your home screen to get verified.',
          type: 'REGISTRATION',
        },
      });
      await prisma.auditLog.create({
        data: { userId: req.user!.userId, action: 'CREATE_DRIVER', entity: 'Driver', entityId: user.driver!.id, ipAddress: req.ip },
      });
      res.status(201).json({ success: true, data: user.driver });
    } catch (e) {
      if ((e as { code?: string })?.code === 'P2002') { res.status(409).json({ success: false, error: 'This mobile number is already registered' }); return; }
      console.error(e);
      res.status(500).json({ success: false, error: 'Could not create driver' });
    }
  };

  /* ── Overall driver status (approve / reject / ask to resubmit) ── */
  updateStatus = async (req: Request, res: Response): Promise<void> => {
    try {
      const { status, rejectionReason } = req.body ?? {};
      const allowed = ['UNDER_REVIEW', 'APPROVED', 'REJECTED', 'RESUBMISSION_REQUIRED'];
      if (!allowed.includes(status)) { res.status(400).json({ success: false, error: 'Invalid status' }); return; }
      if ((status === 'REJECTED' || status === 'RESUBMISSION_REQUIRED') && !String(rejectionReason ?? '').trim()) {
        res.status(400).json({ success: false, error: 'Please give a reason' }); return;
      }

      const driver = await prisma.driver.update({ where: { id: String(req.params.id) }, data: { verificationStatus: status } });

      // Approving the driver also accepts any documents and vehicles still waiting
      if (status === 'APPROVED') {
        await prisma.driverDocument.updateMany({ where: { driverId: driver.id, verificationStatus: { in: ['PENDING', 'UNDER_REVIEW'] } }, data: { verificationStatus: 'VERIFIED' } });
        await prisma.vehicle.updateMany({ where: { driverId: driver.id, verificationStatus: { in: ['PENDING', 'UNDER_REVIEW'] } }, data: { verificationStatus: 'VERIFIED' } });
      }

      await prisma.notification.create({
        data: {
          driverId: driver.id,
          title: STATUS_TITLES[status] ?? 'Registration update',
          message: status === 'APPROVED'
            ? 'Congratulations! Your profile is verified. You can now receive work.'
            : status === 'UNDER_REVIEW'
            ? 'Our team has started checking your documents.'
            : `${rejectionReason}`,
          type: status === 'APPROVED' ? 'APPROVAL' : status === 'UNDER_REVIEW' ? 'REGISTRATION' : 'REJECTION',
        },
      });
      await prisma.auditLog.create({
        data: { userId: req.user!.userId, action: `DRIVER_${status}`, entity: 'Driver', entityId: driver.id, metadata: { rejectionReason }, ipAddress: req.ip },
      });

      res.json({ success: true, data: driver });
    } catch { res.status(500).json({ success: false, error: 'Failed to update status' }); }
  };

  /* ── Accept or reject one document. Rejecting asks the driver to upload it again. ── */
  reviewDocument = async (req: Request, res: Response): Promise<void> => {
    try {
      const { status, reason } = req.body ?? {};
      if (!['VERIFIED', 'RESUBMISSION_REQUIRED'].includes(status)) { res.status(400).json({ success: false, error: 'Invalid status' }); return; }
      if (status === 'RESUBMISSION_REQUIRED' && !String(reason ?? '').trim()) {
        res.status(400).json({ success: false, error: 'Tell the driver what is wrong with the document' }); return;
      }
      const doc = await prisma.driverDocument.update({
        where: { id: String(req.params.id) },
        data: { verificationStatus: status, rejectionReason: status === 'VERIFIED' ? null : String(reason).trim() },
      });

      // The RC book verifies the driver's own vehicle
      if (doc.documentType === 'RC_BOOK') {
        await prisma.vehicle.updateMany({ where: { driverId: doc.driverId }, data: { verificationStatus: status === 'VERIFIED' ? 'VERIFIED' : 'RESUBMISSION_REQUIRED' } });
      }

      const label = DOC_LABELS[doc.documentType] ?? doc.documentType;
      if (status === 'RESUBMISSION_REQUIRED') {
        await prisma.driver.update({ where: { id: doc.driverId }, data: { verificationStatus: 'RESUBMISSION_REQUIRED' } });
        await prisma.notification.create({
          data: { driverId: doc.driverId, title: `Upload your ${label} again`, message: String(reason).trim(), type: 'DOCUMENT' },
        });
      } else {
        await prisma.notification.create({
          data: { driverId: doc.driverId, title: `${label} verified`, message: `Your ${label} has been accepted.`, type: 'DOCUMENT' },
        });
      }
      await prisma.auditLog.create({
        data: { userId: req.user!.userId, action: `DOCUMENT_${status}`, entity: 'DriverDocument', entityId: doc.id, metadata: { reason }, ipAddress: req.ip },
      });
      res.json({ success: true, data: doc });
    } catch { res.status(500).json({ success: false, error: 'Failed to update document' }); }
  };

  /* ── Fleet owners ── */
  getFleetOwners = async (req: Request, res: Response): Promise<void> => {
    try {
      const { status, search } = req.query as Record<string, string>;
      const where: Prisma.FleetOwnerWhereInput = {};
      if (status === 'pending') where.verificationStatus = { in: ['SUBMITTED', 'UNDER_REVIEW'] };
      else if (status) where.verificationStatus = status as Prisma.EnumVerificationStatusFilter['equals'];
      if (search) {
        where.OR = [
          { firstName: { contains: search, mode: 'insensitive' } },
          { lastName: { contains: search, mode: 'insensitive' } },
          { companyName: { contains: search, mode: 'insensitive' } },
          { mobileNumber: { contains: search } },
        ];
      }
      const owners = await prisma.fleetOwner.findMany({
        where, orderBy: { createdAt: 'desc' }, take: 200,
        include: { _count: { select: { vehicles: true } } },
      });
      res.json({ success: true, data: owners });
    } catch { res.status(500).json({ success: false, error: 'Failed to fetch fleet owners' }); }
  };

  getFleetOwner = async (req: Request, res: Response): Promise<void> => {
    const owner = await prisma.fleetOwner.findUnique({
      where: { id: String(req.params.id) },
      include: { vehicles: { orderBy: { createdAt: 'desc' } }, user: { select: { phone: true, language: true, createdAt: true } } },
    });
    if (!owner) { res.status(404).json({ success: false, error: 'Fleet owner not found' }); return; }
    res.json({ success: true, data: owner });
  };

  updateFleetOwnerStatus = async (req: Request, res: Response): Promise<void> => {
    try {
      const { status, rejectionReason } = req.body ?? {};
      if (!['UNDER_REVIEW', 'APPROVED', 'REJECTED', 'RESUBMISSION_REQUIRED'].includes(status)) {
        res.status(400).json({ success: false, error: 'Invalid status' }); return;
      }
      if ((status === 'REJECTED' || status === 'RESUBMISSION_REQUIRED') && !String(rejectionReason ?? '').trim()) {
        res.status(400).json({ success: false, error: 'Please give a reason' }); return;
      }
      const owner = await prisma.fleetOwner.update({
        where: { id: String(req.params.id) },
        data: { verificationStatus: status, rejectionReason: status === 'APPROVED' || status === 'UNDER_REVIEW' ? null : String(rejectionReason).trim() },
      });
      if (status === 'APPROVED') {
        await prisma.fleetVehicle.updateMany({ where: { ownerId: owner.id, verificationStatus: 'PENDING' }, data: { verificationStatus: 'VERIFIED' } });
      }
      await prisma.auditLog.create({
        data: { userId: req.user!.userId, action: `FLEET_${status}`, entity: 'FleetOwner', entityId: owner.id, metadata: { rejectionReason }, ipAddress: req.ip },
      });
      res.json({ success: true, data: owner });
    } catch { res.status(500).json({ success: false, error: 'Failed to update status' }); }
  };

  /* ── Seed admin user (one-time setup) ── */
  seedAdmin = async (req: Request, res: Response): Promise<void> => {
    try {
      const { email, password, secret } = req.body ?? {};
      const adminSecret = process.env.ADMIN_SETUP_SECRET;
      if (!adminSecret || secret !== adminSecret) {
        res.status(403).json({ success: false, error: 'Invalid setup secret' }); return;
      }
      if (!email || !password || String(password).length < 10) {
        res.status(400).json({ success: false, error: 'Email and a password of at least 10 characters are required' }); return;
      }
      const existing = await prisma.user.findUnique({ where: { email } });
      if (existing) { res.status(409).json({ success: false, error: 'User already exists' }); return; }

      const passwordHash = await bcrypt.hash(password, 12);
      const user = await prisma.user.create({ data: { email, passwordHash, role: 'ADMIN' } });
      res.status(201).json({ success: true, data: { id: user.id, email: user.email, role: user.role } });
    } catch { res.status(500).json({ success: false, error: 'Seed failed' }); }
  };
}
