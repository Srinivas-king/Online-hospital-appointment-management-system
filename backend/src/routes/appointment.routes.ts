import { Router } from 'express';
import * as appController from '../controllers/appointment.controller.js';
import { authenticate, authorize } from '../middlewares/auth.middleware.js';

const router = Router();

router.get('/slots', appController.getAvailableSlots);
router.post('/slots', authenticate, authorize(['admin']), appController.createSlot);
router.delete('/slots/:id', authenticate, authorize(['admin']), appController.deleteSlot);
router.post('/book', authenticate, authorize(['patient']), appController.bookAppointment);
router.get('/patient', authenticate, authorize(['patient']), appController.getPatientAppointments);
// Manage active appointments (admin)
router.get('/', authenticate, authorize(['admin']), appController.getAllAppointments);
router.get('/all', authenticate, authorize(['admin']), appController.getAllAppointments);

// GET completed appointments (new API)
router.get('/completed', authenticate, authorize(['admin']), appController.getCompletedAppointments);

router.patch('/:id/status', authenticate, authorize(['admin']), appController.updateAppointmentStatus);

export default router;
