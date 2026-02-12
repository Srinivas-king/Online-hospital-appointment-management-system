import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import * as dotenv from 'dotenv';
import authRoutes from './routes/auth.routes.js';
import appointmentRoutes from './routes/appointment.routes.js';
dotenv.config();
const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
    cors: {
        origin: '*',
        methods: ['GET', 'POST', 'PATCH'],
    },
});
app.use(cors());
app.use(express.json());
// Set socket.io on app to use in controllers
app.set('socketio', io);
// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/appointments', appointmentRoutes);
// Socket.io connection logic
io.on('connection', (socket) => {
    console.log('User connected:', socket.id);
    socket.on('join', (userId) => {
        socket.join(`user_${userId}`);
        console.log(`User ${userId} joined their room`);
    });
    socket.on('disconnect', () => {
        console.log('User disconnected');
    });
});
const PORT = process.env.PORT || 5001;
httpServer.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
