import { Router } from 'express';
import { FleetController } from '../controllers/fleet.controller';
import { authenticate, requireRole } from '../middlewares/auth.middleware';

const router = Router();
const ctrl = new FleetController();

router.use(authenticate, requireRole('FLEET_OWNER'));
router.get('/me', ctrl.getMe);
router.put('/me', ctrl.updateMe);
router.put('/me/location', ctrl.updateLocation);
router.post('/me/submit', ctrl.submit);
router.post('/vehicles', ctrl.addVehicle);
router.delete('/vehicles/:id', ctrl.deleteVehicle);
router.get('/drivers/nearby', ctrl.nearbyDrivers);

export default router;
