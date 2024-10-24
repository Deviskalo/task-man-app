// pages/api/cron.js
import cron from 'node-cron';
import { open } from 'sqlite';
import sqlite3 from 'sqlite3';
import nodemailer from 'nodemailer'; // Optional: For sending email notifications

// Function to check for due tasks
const checkDueTasks = async () => {
    const db = await open({
        filename: './tasks.sqlite',
        driver: sqlite3.Database
    });

    const now = new Date();
    const dueTasks = await db.all('SELECT * FROM tasks WHERE dueDateTime <= ? AND completed = 0', [now.toISOString()]);

    dueTasks.forEach(task => {
        console.log(`Task due: ${task.title}`); // Log to console or send notification
        // Optionally, send an email notification
        sendEmailNotification(task);
    });

    await db.close();
};

// Optional: Function to send email notifications
const sendEmailNotification = (task) => {
    const transporter = nodemailer.createTransport({
        service: 'gmail', // Use your email service
        auth: {
            user: 'your-email@gmail.com', // Your email
            pass: 'your-email-password' // Your email password or app password
        }
    });

    const mailOptions = {
        from: 'your-email@gmail.com',
        to: 'recipient-email@example.com', // Recipient's email
        subject: `Task Due: ${task.title}`,
        text: `Your task "${task.title}" is due!`
    };

    transporter.sendMail(mailOptions, (error, info) => {
        if (error) {
            return console.log(error);
        }
        console.log('Email sent: ' + info.response);
    });
};

// Schedule the cron job to run every minute
cron.schedule('* * * * *', checkDueTasks);

export default function handler(req, res) {
    res.status(200).json({ message: 'Cron job is running' });
}

