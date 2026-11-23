import { Request, Response } from 'express';
import { Prisma } from '@prisma/client';
import { prisma } from '../lib/prisma';

// Only these fields may be set by a driver. verificationStatus, driverId etc. are
// controlled by the server/admin, and unknown fields (e.g. registrationState) are dropped.
const pickVehicleFields = (body: Record<string, unknown>) => {
  const data: Record<string, unknown> = {};
  for (const key of ['category', 'manufacturer', 'model', 'registrationNumber', 'fuelType', 'colour'] as const) {
    if (typeof body[key] === 'string') data[key] = (body[key] as string).trim();
  }
  for (const key of ['manufacturingYear', 'seatingCapacity'] as const) {
    if (body[key] !== undefined && body[key] !== '') data[key] = Number(body[key]);
  }
  if (body.hasAC !== undefined) data.hasAC = Boolean(body.hasAC);
  return data;
};

const isDuplicateError = (e: unknown) => (e as { code?: string })?.code === 'P2002';


export class VehicleController {
  create = async (req: Request, res: Response): Promise<void> => {
    try {
      const user = await prisma.user.findUnique({ where: { id: req.user!.userId }, include: { driver: true } });
      if (!user?.driver) { res.status(404).json({ success: false, error: 'Driver not found' }); return; }
      const fields = pickVehicleFields(req.body ?? {});
      const required = ['category', 'manufacturer', 'model', 'registrationNumber', 'manufacturingYear', 'seatingCapacity', 'fuelType', 'colour'];
      const missing = required.filter((k) => fields[k] === undefined || fields[k] === '' || Number.isNaN(fields[k]));
      if (missing.length) { res.status(400).json({ success: false, error: `Missing or invalid: ${missing.join(', ')}` }); return; }
      const vehicle = await prisma.vehicle.create({
        data: { ...fields, driverId: user.driver.id } as Prisma.VehicleUncheckedCreateInput,
      });
      res.status(201).json({ success: true, data: vehicle });
    } catch (e) {
      if (isDuplicateError(e)) { res.status(409).json({ success: false, error: 'A vehicle with this registration number already exists' }); return; }
      console.error(e);
      res.status(500).json({ success: false, error: 'Create failed' });
    }
  };

  getAll = async (req: Request, res: Response): Promise<void> => {
    try {
      const user = await prisma.user.findUnique({ where: { id: req.user!.userId }, include: { driver: true } });
      if (!user?.driver) { res.status(404).json({ success: false, error: 'Driver not found' }); return; }
      const vehicles = await prisma.vehicle.findMany({
        where: { driverId: user.driver.id },
        include: { documents: true, photos: true },
      });
      res.json({ success: true, data: vehicles });
    } catch {
      res.status(500).json({ success: false, error: 'Fetch failed' });
    }
  };

  getById = async (req: Request, res: Response): Promise<void> => {
    try {
      const user = await prisma.user.findUnique({ where: { id: req.user!.userId }, include: { driver: true } });
      if (!user?.driver) { res.status(404).json({ success: false, error: 'Driver not found' }); return; }
      const vehicle = await prisma.vehicle.findFirst({
        where: { id: String(req.params.id), driverId: user.driver.id },
        include: { documents: true, photos: true },
      });
      if (!vehicle) { res.status(404).json({ success: false, error: 'Vehicle not found' }); return; }
      res.json({ success: true, data: vehicle });
    } catch {
      res.status(500).json({ success: false, error: 'Fetch failed' });
    }
  };

  update = async (req: Request, res: Response): Promise<void> => {
    try {
      const user = await prisma.user.findUnique({ where: { id: req.user!.userId }, include: { driver: true } });
      if (!user?.driver) { res.status(404).json({ success: false, error: 'Driver not found' }); return; }
      const vehicle = await prisma.vehicle.findFirst({ where: { id: String(req.params.id), driverId: user.driver.id } });
      if (!vehicle) { res.status(404).json({ success: false, error: 'Vehicle not found' }); return; }
      const updated = await prisma.vehicle.update({ where: { id: vehicle.id }, data: pickVehicleFields(req.body ?? {}) });
      res.json({ success: true, data: updated });
    } catch (e) {
      if (isDuplicateError(e)) { res.status(409).json({ success: false, error: 'A vehicle with this registration number already exists' }); return; }
      console.error(e);
      res.status(500).json({ success: false, error: 'Update failed' });
    }
  };

  delete = async (req: Request, res: Response): Promise<void> => {
    try {
      const user = await prisma.user.findUnique({ where: { id: req.user!.userId }, include: { driver: true } });
      if (!user?.driver) { res.status(404).json({ success: false, error: 'Driver not found' }); return; }
      const vehicle = await prisma.vehicle.findFirst({ where: { id: String(req.params.id), driverId: user.driver.id } });
      if (!vehicle) { res.status(404).json({ success: false, error: 'Vehicle not found' }); return; }
      await prisma.vehicle.delete({ where: { id: vehicle.id } });
      res.json({ success: true, message: 'Vehicle deleted' });
    } catch {
      res.status(500).json({ success: false, error: 'Delete failed' });
    }
  };
}
