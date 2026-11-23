import { Request, Response } from 'express';
import { prisma } from '../lib/prisma';
import { VEHICLE_TYPES } from './auth.controller';

const str = (v: unknown, max = 80) => (typeof v === 'string' ? v.trim().slice(0, max) : '');

/* Great-circle distance in km */
const haversineKm = (lat1: number, lon1: number, lat2: number, lon2: number) => {
  const R = 6371;
  const toRad = (x: number) => (x * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(a));
};

const getOwner = (userId: string) => prisma.fleetOwner.findUnique({ where: { userId } });

export class FleetController {
  getMe = async (req: Request, res: Response): Promise<void> => {
    try {
      const owner = await prisma.fleetOwner.findUnique({
        where: { userId: req.user!.userId },
        include: { vehicles: { orderBy: { createdAt: 'desc' } } },
      });
      if (!owner) { res.status(404).json({ success: false, error: 'Fleet owner not found' }); return; }
      res.json({ success: true, data: owner });
    } catch {
      res.status(500).json({ success: false, error: 'Failed to load profile' });
    }
  };

  updateMe = async (req: Request, res: Response): Promise<void> => {
    try {
      const owner = await getOwner(req.user!.userId);
      if (!owner) { res.status(404).json({ success: false, error: 'Fleet owner not found' }); return; }
      const data: Record<string, string> = {};
      for (const key of ['firstName', 'lastName', 'companyName', 'city'] as const) {
        if (req.body?.[key] !== undefined) data[key] = str(req.body[key]);
      }
      if (data.firstName === '' || data.lastName === '') { res.status(400).json({ success: false, error: 'Name cannot be empty' }); return; }
      const updated = await prisma.fleetOwner.update({ where: { id: owner.id }, data });
      res.json({ success: true, data: updated });
    } catch {
      res.status(500).json({ success: false, error: 'Update failed' });
    }
  };

  updateLocation = async (req: Request, res: Response): Promise<void> => {
    const lat = Number(req.body?.latitude), lng = Number(req.body?.longitude);
    if (!Number.isFinite(lat) || !Number.isFinite(lng) || Math.abs(lat) > 90 || Math.abs(lng) > 180) {
      res.status(400).json({ success: false, error: 'Invalid location' }); return;
    }
    const owner = await getOwner(req.user!.userId);
    if (!owner) { res.status(404).json({ success: false, error: 'Fleet owner not found' }); return; }
    await prisma.fleetOwner.update({ where: { id: owner.id }, data: { latitude: lat, longitude: lng } });
    res.json({ success: true });
  };

  addVehicle = async (req: Request, res: Response): Promise<void> => {
    try {
      const owner = await getOwner(req.user!.userId);
      if (!owner) { res.status(404).json({ success: false, error: 'Fleet owner not found' }); return; }
      const vehicleType = str(req.body?.vehicleType);
      const registrationNumber = str(req.body?.registrationNumber, 20).toUpperCase().replace(/\s+/g, '');
      const manufacturer = str(req.body?.manufacturer);
      const model = str(req.body?.model);
      const year = req.body?.manufacturingYear ? Number(req.body.manufacturingYear) : null;
      const photos: string[] = Array.isArray(req.body?.photos) ? req.body.photos.filter((p: unknown) => typeof p === 'string').slice(0, 6) : [];

      if (!VEHICLE_TYPES.includes(vehicleType)) { res.status(400).json({ success: false, error: 'Choose a vehicle type' }); return; }
      if (registrationNumber.length < 6) { res.status(400).json({ success: false, error: 'Enter the registration number' }); return; }
      if (!manufacturer || !model) { res.status(400).json({ success: false, error: 'Enter the make and model' }); return; }
      if (year !== null && (!Number.isInteger(year) || year < 1980 || year > new Date().getFullYear() + 1)) {
        res.status(400).json({ success: false, error: 'Enter a valid year' }); return;
      }
      if (photos.length === 0) { res.status(400).json({ success: false, error: 'Add at least one photo of the vehicle' }); return; }

      const vehicle = await prisma.fleetVehicle.create({
        data: {
          ownerId: owner.id, vehicleType, registrationNumber, manufacturer, model,
          manufacturingYear: year, capacity: str(req.body?.capacity, 40) || null, photos,
          rcUrl: str(req.body?.rcUrl, 500) || null,
        },
      });
      res.status(201).json({ success: true, data: vehicle });
    } catch (e) {
      if ((e as { code?: string })?.code === 'P2002') { res.status(409).json({ success: false, error: 'A vehicle with this registration number already exists' }); return; }
      console.error(e);
      res.status(500).json({ success: false, error: 'Could not add vehicle' });
    }
  };

  deleteVehicle = async (req: Request, res: Response): Promise<void> => {
    const owner = await getOwner(req.user!.userId);
    if (!owner) { res.status(404).json({ success: false, error: 'Fleet owner not found' }); return; }
    const result = await prisma.fleetVehicle.deleteMany({ where: { id: String(req.params.id), ownerId: owner.id } });
    if (result.count === 0) { res.status(404).json({ success: false, error: 'Vehicle not found' }); return; }
    res.json({ success: true });
  };

  submit = async (req: Request, res: Response): Promise<void> => {
    const owner = await prisma.fleetOwner.findUnique({ where: { userId: req.user!.userId }, include: { vehicles: true } });
    if (!owner) { res.status(404).json({ success: false, error: 'Fleet owner not found' }); return; }
    if (owner.vehicles.length === 0) { res.status(400).json({ success: false, error: 'Add at least one vehicle first' }); return; }
    const updated = await prisma.fleetOwner.update({
      where: { id: owner.id },
      data: { verificationStatus: 'SUBMITTED', submittedAt: new Date(), rejectionReason: null },
    });
    res.json({ success: true, data: { verificationStatus: updated.verificationStatus } });
  };

  /* Drivers near a point, nearest first. Locations are rounded (~100 m) so exact positions aren't exposed,
     and phone numbers are only shared for verified drivers. */
  nearbyDrivers = async (req: Request, res: Response): Promise<void> => {
    try {
      const lat = Number(req.query.lat), lng = Number(req.query.lng);
      if (!Number.isFinite(lat) || !Number.isFinite(lng)) { res.status(400).json({ success: false, error: 'lat and lng are required' }); return; }
      const radiusKm = Math.min(Math.max(Number(req.query.radiusKm) || 25, 1), 500);
      const vehicleType = typeof req.query.vehicleType === 'string' && VEHICLE_TYPES.includes(req.query.vehicleType) ? req.query.vehicleType : null;

      // Rough bounding box first, exact distance after
      const dLat = radiusKm / 111;
      const dLng = radiusKm / (111 * Math.max(Math.cos((lat * Math.PI) / 180), 0.1));
      const drivers = await prisma.driver.findMany({
        where: {
          latitude: { gte: lat - dLat, lte: lat + dLat },
          longitude: { gte: lng - dLng, lte: lng + dLng },
          ...(vehicleType ? { vehicleTypes: { has: vehicleType } } : {}),
          user: { isActive: true },
        },
        include: { drivingExperience: { select: { totalYears: true } } },
        take: 300,
      });

      const result = drivers
        .map((d) => ({ d, distanceKm: haversineKm(lat, lng, d.latitude!, d.longitude!) }))
        .filter((x) => x.distanceKm <= radiusKm)
        .sort((a, b) => Number(b.d.isAvailable) - Number(a.d.isAvailable) || a.distanceKm - b.distanceKm)
        .slice(0, 100)
        .map(({ d, distanceKm }) => {
          const verified = d.verificationStatus === 'APPROVED';
          return {
            id: d.id,
            name: d.firstName ? `${d.firstName} ${(d.lastName ?? '').charAt(0)}.`.trim() : d.fullName,
            photoUrl: d.profilePhotoUrl,
            vehicleTypes: d.vehicleTypes,
            registrationType: d.registrationType,
            experienceYears: d.drivingExperience?.totalYears ?? null,
            isAvailable: d.isAvailable,
            verified,
            phone: verified ? d.mobileNumber : null,
            latitude: Math.round(d.latitude! * 1000) / 1000,
            longitude: Math.round(d.longitude! * 1000) / 1000,
            distanceKm: Math.round(distanceKm * 10) / 10,
            lastSeenAt: d.locationUpdatedAt,
          };
        });

      res.json({ success: true, data: result });
    } catch (e) {
      console.error(e);
      res.status(500).json({ success: false, error: 'Search failed' });
    }
  };
}
