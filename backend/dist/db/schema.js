import { mysqlTable, serial, varchar, timestamp, boolean, int, text } from 'drizzle-orm/mysql-core';
export const users = mysqlTable('users', {
    id: serial('id').primaryKey(),
    name: varchar('name', { length: 255 }).notNull(),
    email: varchar('email', { length: 255 }).notNull().unique(),
    password: varchar('password', { length: 255 }).notNull(),
    role: varchar('role', { length: 20 }).default('patient').notNull(), // patient, admin
    createdAt: timestamp('created_at').defaultNow(),
});
export const slots = mysqlTable('slots', {
    id: serial('id').primaryKey(),
    doctorName: varchar('doctor_name', { length: 255 }).notNull(),
    department: varchar('department', { length: 255 }).notNull(),
    date: varchar('date', { length: 50 }).notNull(), // YYYY-MM-DD
    time: varchar('time', { length: 50 }).notNull(), // HH:mm
    isAvailable: boolean('is_available').default(true),
    createdAt: timestamp('created_at').defaultNow(),
});
export const appointments = mysqlTable('appointments', {
    id: serial('id').primaryKey(),
    patientId: int('patient_id').references(() => users.id),
    slotId: int('slot_id').references(() => slots.id),
    // Additional details from the form
    fullName: varchar('full_name', { length: 255 }).notNull(),
    age: int('age').notNull(),
    email: varchar('email', { length: 255 }).notNull(),
    phone: varchar('phone', { length: 50 }).notNull(),
    gender: varchar('gender', { length: 20 }).notNull(),
    department: varchar('department', { length: 255 }).notNull(),
    appointmentDate: varchar('appointment_date', { length: 50 }),
    appointmentTime: varchar('appointment_time', { length: 50 }),
    reason: text('reason').notNull(),
    status: varchar('status', { length: 50 }).default('pending').notNull(), // pending, approved, rejected
    createdAt: timestamp('created_at').defaultNow(),
});
