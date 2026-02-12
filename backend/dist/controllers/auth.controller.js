import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { db, schema } from '../db/index.js';
import { eq } from 'drizzle-orm';
import { notifyRegistration } from '../services/mail.service.js';
import * as dotenv from 'dotenv';
dotenv.config();
export const register = async (req, res) => {
    const { name, email, password, role } = req.body;
    try {
        const existing = await db.query.users.findFirst({
            where: eq(schema.users.email, email),
        });
        if (existing) {
            return res.status(400).json({ message: 'Email already registered' });
        }
        const hashedPassword = await bcrypt.hash(password, 10);
        const [result] = await db.insert(schema.users).values({
            name,
            email,
            password: hashedPassword,
            role: role || 'patient',
        });
        // Send registration email
        await notifyRegistration(email, name);
        res.status(201).json({ message: 'User registered successfully' });
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};
export const login = async (req, res) => {
    const { email, password } = req.body;
    try {
        const user = await db.query.users.findFirst({
            where: eq(schema.users.email, email),
        });
        if (!user || !(await bcrypt.compare(password, user.password))) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }
        const token = jwt.sign({ id: user.id, email: user.email, role: user.role, name: user.name }, process.env.JWT_SECRET || 'secret', { expiresIn: '24h' });
        res.json({
            token,
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                role: user.role,
            },
        });
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};
