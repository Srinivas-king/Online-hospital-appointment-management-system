import nodemailer from 'nodemailer';
import * as dotenv from 'dotenv';
dotenv.config();

const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.MAIL_USER,
        pass: process.env.MAIL_PASS,
    },
});

export const sendMail = async (to: string, subject: string, text: string, html?: string) => {
    try {
        await transporter.sendMail({
            from: `"Sentini Hospital" <${process.env.MAIL_USER}>`,
            to,
            subject,
            text,
            html,
        });
        console.log(`Email sent to ${to}`);
    } catch (error) {
        console.error('Error sending email:', error);
    }
};

export const notifyRegistration = async (email: string, name: string) => {
    const subject = 'Welcome to Sentini Hospital';
    const text = `Dear ${name}, thank you for registering with Sentini Hospital. You can now book appointments online.`;
    const html = `
    <div style="font-family: Arial, sans-serif; padding: 20px; color: #333;">
      <h2 style="color: #2563eb;">Welcome to Sentini Hospital</h2>
      <p>Dear <strong>${name}</strong>,</p>
      <p>Thank you for registering with us. We are committed to providing you with the best healthcare services.</p>
      <p>You can now log in to your dashboard to book appointments and view your health records.</p>
      <p>Stay healthy!</p>
    </div>
  `;
    await sendMail(email, subject, text, html);
};

export const notifyAppointmentBooking = async (email: string, name: string, department: string, date: string) => {
    const subject = 'Appointment Booking Received - Sentini Hospital';
    const text = `Dear ${name}, your appointment request for ${department} on ${date} has been received and is pending approval.`;
    const html = `
    <div style="font-family: Arial, sans-serif; padding: 20px; color: #333;">
      <h2 style="color: #2563eb;">Sentini Hospital</h2>
      <p>Dear <strong>${name}</strong>,</p>
      <p>Your appointment request has been received:</p>
      <div style="background: #f3f4f6; padding: 15px; border-radius: 8px; margin: 20px 0;">
        <p><strong>Department:</strong> ${department}</p>
        <p><strong>Date:</strong> ${date}</p>
        <p><strong>Status:</strong> <span style="font-weight: bold; color: #f59e0b;">PENDING</span></p>
      </div>
      <p>We will notify you once your appointment is confirmed.</p>
    </div>
  `;
    await sendMail(email, subject, text, html);
};

export const notifyAppointmentStatus = async (email: string, name: string, status: string, doctorName: string, date: string, time: string) => {
    const subject = `Appointment Status Updated - Sentini Hospital`;
    const text = `Dear ${name}, your appointment ${doctorName !== 'Assigned Doctor' ? `with ${doctorName}` : ''} on ${date} ${time !== 'TBD' ? `at ${time}` : ''} has been ${status}.`;
    const html = `
    <div style="font-family: Arial, sans-serif; padding: 20px; color: #333;">
      <h2 style="color: #2563eb;">Sentini Hospital</h2>
      <p>Dear <strong>${name}</strong>,</p>
      <p>Your appointment status has been updated:</p>
      <div style="background: #f3f4f6; padding: 15px; border-radius: 8px; margin: 20px 0;">
        ${doctorName !== 'Assigned Doctor' ? `<p><strong>Doctor:</strong> ${doctorName}</p>` : ''}
        <p><strong>Date:</strong> ${date}</p>
        ${time !== 'TBD' ? `<p><strong>Time:</strong> ${time}</p>` : ''}
        <p><strong>Status:</strong> <span style="text-transform: uppercase; font-weight: bold; color: ${status === 'approved' ? '#10b981' : '#ef4444'}">${status}</span></p>
      </div>
      <p>Thank you for choosing Sentini Hospital.</p>
    </div>
  `;
    await sendMail(email, subject, text, html);
};

