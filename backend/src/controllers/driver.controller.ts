import { Request, Response } from 'express';
import { prisma } from '../lib/prisma';


export class DriverController {
  getMe = async (req: Request, res: Response): Promise<void> => {
    try {
      const user = await prisma.user.findUnique({
        where: { id: req.user!.userId },
        include: {
          driver: {
            include: {
              address: true,
              drivingExperience: true,
              drivingLicence: true,
              emergencyContact: true,
              documents: true,
              vehicles: { include: { documents: true, photos: true } },
            },
          },
        },
      });
      if (!user?.driver) {
        res.status(404).json({ success: false, error: 'Driver not found' });
        return;
      }
      res.json({ success: true, data: user.driver });
    } catch {
      res.status(500).json({ success: false, error: 'Failed to fetch driver' });
    }
  };

  updateMe = async (req: Request, res: Response): Promise<void> => {
    try {
      const user = await prisma.user.findUnique({ where: { id: req.user!.userId }, include: { driver: true } });
      if (!user?.driver) { res.status(404).json({ success: false, error: 'Driver not found' }); return; }

      const { fullName, dateOfBirth, gender, mobileNumber, alternateMobile } = req.body;
      const driver = await prisma.driver.update({
        where: { id: user.driver.id },
        data: {
          fullName,
          dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : undefined,
          gender,
          mobileNumber,
          alternateMobile,
        },
      });
      res.json({ success: true, data: driver });
    } catch {
      res.status(500).json({ success: false, error: 'Update failed' });
    }
  };

  updateStep = async (req: Request, res: Response): Promise<void> => {
    try {
      const user = await prisma.user.findUnique({ where: { id: req.user!.userId }, include: { driver: true } });
      if (!user?.driver) { res.status(404).json({ success: false, error: 'Driver not found' }); return; }
      const driverId = user.driver.id;
      const step = parseInt(String(req.params.step));

      if (step === 1) {
        const { fullName, dateOfBirth, gender, mobileNumber, alternateMobile, registrationType, profilePhotoUrl, address } = req.body;
        await prisma.driver.update({
          where: { id: driverId },
          data: {
            fullName,
            dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : undefined,
            gender,
            mobileNumber,
            alternateMobile,
            registrationType,
            profilePhotoUrl: profilePhotoUrl || undefined,
          },
        });
        if (address) {
          await prisma.driverAddress.upsert({
            where: { driverId },
            create: { ...address, driverId },
            update: { ...address, driverId },
          });
        }
      } else if (step === 2) {
        const { experience, licence, emergencyContact } = req.body;
        if (experience) {
          await prisma.drivingExperience.upsert({
            where: { driverId },
            create: { ...experience, driverId },
            update: { ...experience, driverId },
          });
        }
        if (licence) {
          await prisma.drivingLicence.upsert({
            where: { driverId },
            create: {
              ...licence,
              driverId,
              issueDate: new Date(licence.issueDate),
              expiryDate: new Date(licence.expiryDate),
            },
            update: {
              ...licence,
              driverId,
              issueDate: new Date(licence.issueDate),
              expiryDate: new Date(licence.expiryDate),
            },
          });
        }
        if (emergencyContact) {
          await prisma.emergencyContact.upsert({
            where: { driverId },
            create: { ...emergencyContact, driverId },
            update: { ...emergencyContact, driverId },
          });
        }
      }

      res.json({ success: true, message: `Step ${step} saved` });
    } catch (error) {
      console.error(error);
      res.status(500).json({ success: false, error: 'Step update failed' });
    }
  };

  /* Live location, used by fleet owners' "find drivers nearby" map */
  updateLocation = async (req: Request, res: Response): Promise<void> => {
    try {
      const lat = Number(req.body?.latitude), lng = Number(req.body?.longitude);
      if (!Number.isFinite(lat) || !Number.isFinite(lng) || Math.abs(lat) > 90 || Math.abs(lng) > 180) {
        res.status(400).json({ success: false, error: 'Invalid location' }); return;
      }
      const user = await prisma.user.findUnique({ where: { id: req.user!.userId }, include: { driver: true } });
      if (!user?.driver) { res.status(404).json({ success: false, error: 'Driver not found' }); return; }
      await prisma.driver.update({ where: { id: user.driver.id }, data: { latitude: lat, longitude: lng, locationUpdatedAt: new Date() } });
      res.json({ success: true });
    } catch {
      res.status(500).json({ success: false, error: 'Location update failed' });
    }
  };

  updateAvailability = async (req: Request, res: Response): Promise<void> => {
    try {
      const user = await prisma.user.findUnique({ where: { id: req.user!.userId }, include: { driver: true } });
      if (!user?.driver) { res.status(404).json({ success: false, error: 'Driver not found' }); return; }
      const driver = await prisma.driver.update({ where: { id: user.driver.id }, data: { isAvailable: Boolean(req.body?.isAvailable) } });
      res.json({ success: true, data: { isAvailable: driver.isAvailable } });
    } catch {
      res.status(500).json({ success: false, error: 'Update failed' });
    }
  };

  submitRegistration = async (req: Request, res: Response): Promise<void> => {
    try {
      const user = await prisma.user.findUnique({
        where: { id: req.user!.userId },
        include: { driver: { include: { address: true, drivingLicence: true, documents: true, vehicles: true } } },
      });
      if (!user?.driver) { res.status(404).json({ success: false, error: 'Driver not found' }); return; }
      const d = user.driver;

      const missing = missingForSubmission(d);
      if (missing.length) {
        res.status(400).json({ success: false, error: `Please complete: ${missing.join(', ')}`, data: { missing } }); return;
      }
      if (d.verificationStatus === 'APPROVED') { res.status(400).json({ success: false, error: 'Already approved' }); return; }

      const driver = await prisma.driver.update({
        where: { id: d.id },
        data: { verificationStatus: 'SUBMITTED', submittedAt: new Date(), profileCompletionPercent: 100 },
      });

      await prisma.notification.create({
        data: {
          driverId: driver.id,
          title: 'Sent for verification',
          message: 'Your profile and documents were sent to our team. We will notify you once they are checked.',
          type: 'REGISTRATION',
        },
      });

      res.json({
        success: true,
        data: { registrationId: driver.registrationId, submittedAt: driver.submittedAt, verificationStatus: driver.verificationStatus },
      });
    } catch {
      res.status(500).json({ success: false, error: 'Submission failed' });
    }
  };
}

type DriverForChecks = {
  registrationType: string;
  address: unknown;
  drivingLicence: unknown;
  documents: { documentType: string; verificationStatus: string }[];
  vehicles: unknown[];
};

export const requiredDocuments = (registrationType: string) => {
  const docs = ['PROFILE_PHOTO', 'AADHAAR_CARD', 'DRIVING_LICENCE_FRONT', 'DRIVING_LICENCE_BACK'];
  if (registrationType === 'DRIVER_WITH_VEHICLE') docs.push('RC_BOOK');
  return docs;
};

/* What a driver still has to add before the profile can go to the admin team */
export const missingForSubmission = (d: DriverForChecks) => {
  const missing: string[] = [];
  if (!d.address) missing.push('address');
  if (!d.drivingLicence) missing.push('driving licence details');
  for (const type of requiredDocuments(d.registrationType)) {
    const doc = d.documents.find((x) => x.documentType === type);
    if (!doc || doc.verificationStatus === 'RESUBMISSION_REQUIRED' || doc.verificationStatus === 'REJECTED') {
      missing.push(type.toLowerCase().replace(/_/g, ' '));
    }
  }
  if (d.registrationType === 'DRIVER_WITH_VEHICLE' && d.vehicles.length === 0) missing.push('vehicle details');
  return missing;
};
