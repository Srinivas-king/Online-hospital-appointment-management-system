import { Request, Response } from 'express';
import { db, schema } from '../db/index.js';
import { eq, and } from 'drizzle-orm';
import { notifyAppointmentStatus, notifyAppointmentBooking } from '../services/mail.service.js';
import { AuthRequest } from '../middlewares/auth.middleware.js';

export const getAvailableSlots = async (req: Request, res: Response) => {
    try {
        const slots = await db.query.slots.findMany({
            where: eq(schema.slots.isAvailable, true),
        });
        res.json(slots);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching slots' });
    }
};

export const createSlot = async (req: AuthRequest, res: Response) => {
    const { doctorName, department, date, time } = req.body;
    try {
        await db.insert(schema.slots).values({
            doctorName,
            department,
            date,
            time,
            isAvailable: true,
        });
        res.status(201).json({ message: 'Slot created' });
    } catch (error: any) {
        console.error('Error creating slot:', error);
        res.status(500).json({
            message: 'Failed to create slot',
            error: error.message,
            code: error.code
        });
    }
};

export const deleteSlot = async (req: AuthRequest, res: Response) => {
    const { id } = req.params;
    try {
        await db.delete(schema.slots).where(eq(schema.slots.id, parseInt(id)));
        res.json({ message: 'Slot deleted' });
    } catch (error: any) {
        console.error('Error deleting slot:', error);
        res.status(500).json({ message: 'Error deleting slot', error: error.message });
    }
};

export const bookAppointment = async (req: AuthRequest, res: Response) => {
    const { slotId, fullName, age, email, phone, gender, department, appointmentDate, appointmentTime, reason } = req.body;
    const patientId = req.user?.id;

    if (!patientId) return res.status(401).json({ message: 'Unauthorized' });

    try {
        // If slotId is provided and not 0, validate it
        let validSlotId = null;
        if (slotId && slotId !== 0) {
            const slot = await db.query.slots.findFirst({
                where: and(eq(schema.slots.id, slotId), eq(schema.slots.isAvailable, true)),
            });
            if (!slot) return res.status(400).json({ message: 'Selected slot is not available' });
            validSlotId = slotId;
        }

        await db.transaction(async (tx) => {
            await tx.insert(schema.appointments).values({
                patientId,
                slotId: validSlotId,
                fullName,
                age,
                email,
                phone,
                gender,
                department,
                appointmentDate,
                appointmentTime,
                reason,
                status: 'pending',
            });

            if (validSlotId) {
                await tx.update(schema.slots).set({ isAvailable: false }).where(eq(schema.slots.id, validSlotId));
            }
        });

        // Notify admins in real-time
        const io = req.app.get('socketio');
        io.emit('newAppointment', { fullName, department, appointmentDate });

        // Send confirmation email to patient
        await notifyAppointmentBooking(email, fullName, department, appointmentDate);

        res.status(201).json({ message: 'Appointment booked successfully' });
    } catch (error: any) {
        console.error('Error booking appointment:', error);
        res.status(500).json({ message: 'Error booking appointment', error: error.message });
    }
};

export const getPatientAppointments = async (req: AuthRequest, res: Response) => {
    const patientId = req.user?.id;
    if (!patientId) return res.status(401).json({ message: 'Unauthorized' });

    try {
        const result = await db.select()
            .from(schema.appointments)
            .leftJoin(schema.slots, eq(schema.appointments.slotId, schema.slots.id))
            .where(eq(schema.appointments.patientId, patientId));

        res.json(result.map(r => ({
            ...r.appointments,
            slot: r.slots,
            // Fallback for missing slot data
            doctorName: r.slots?.doctorName || 'TBD',
            displayDate: r.slots?.date || r.appointments.appointmentDate,
            displayTime: r.slots?.time || 'Flexible'
        })));
    } catch (error: any) {
        console.error('Error fetching patient appointments:', error);
        res.status(500).json({ message: 'Error fetching appointments' });
    }
};

export const getAllAppointments = async (req: AuthRequest, res: Response) => {
    try {
        const appointments = await db.select()
            .from(schema.appointments)
            .leftJoin(schema.slots, eq(schema.appointments.slotId, schema.slots.id));

        res.json(appointments.map(app => ({
            ...app.appointments,
            // Use slot data if available, otherwise original appointment data
            doctorName: app.slots?.doctorName,
            appointmentDate: app.slots?.date || app.appointments.appointmentDate,
            appointmentTime: app.slots?.time || app.appointments.appointmentTime || 'Flexible',
            name: app.appointments.fullName
        })));
    } catch (error: any) {
        console.error('Error fetching all appointments:', error);
        res.status(500).json({ message: 'Error fetching appointments' });
    }
};

export const updateAppointmentStatus = async (req: AuthRequest, res: Response) => {
    const { id } = req.params;
    const { status, slotId } = req.body;

    try {
        const appointmentResult = await db.select()
            .from(schema.appointments)
            .leftJoin(schema.slots, eq(schema.appointments.slotId, schema.slots.id))
            .where(eq(schema.appointments.id, parseInt(id)));

        if (!appointmentResult.length) return res.status(404).json({ message: 'Not found' });

        const app = appointmentResult[0].appointments;
        let slot = appointmentResult[0].slots;

        // If a new slotId is provided, fetch and link it
        if (status === 'approved' && slotId) {
            const newSlot = await db.query.slots.findFirst({
                where: eq(schema.slots.id, slotId)
            });
            if (newSlot) {
                await db.update(schema.appointments)
                    .set({ slotId, status })
                    .where(eq(schema.appointments.id, parseInt(id)));

                await db.update(schema.slots)
                    .set({ isAvailable: false })
                    .where(eq(schema.slots.id, slotId));

                slot = newSlot;
            } else {
                await db.update(schema.appointments)
                    .set({ status })
                    .where(eq(schema.appointments.id, parseInt(id)));
            }
        } else {
            await db.update(schema.appointments)
                .set({ status })
                .where(eq(schema.appointments.id, parseInt(id)));
        }

        // Real-time update via Socket.io
        const io = req.app.get('socketio');
        io.to(`user_${app.patientId}`).emit('appointmentUpdate', {
            id: app.id,
            status,
            doctorName: slot?.doctorName || 'Assigned Doctor',
            date: slot?.date || app.appointmentDate,
            time: slot?.time || 'Flexible'
        });

        // Email notification
        const doctorName = slot?.doctorName || 'Assigned Doctor';
        const date = slot?.date || app.appointmentDate || 'TBD';
        const time = slot?.time || 'TBD';

        await notifyAppointmentStatus(app.email, app.fullName, status, doctorName, date, time);

        res.json({ message: `Status updated to ${status}` });
    } catch (error: any) {
        console.error('Error updating status:', error);
        res.status(500).json({ message: 'Error updating status', error: error.message });
    }
};
