// pages/api/cron.js
import cron from 'node-cron';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Function to check for due tasks
const checkDueTasks = async () => {
    const now = new Date();
    console.log('Checking for due tasks at:', now); // Log the current time

    const dueTasks = await prisma.task.findMany({
        where: {
            dueDate: {
                lte: now,
            },
            completed: false,
        },
    });

    dueTasks.forEach(task => {
        console.log(`Task due: ${task.title}`); // Log the due task
        const io = req.socket.server.io; // Ensure you have access to the Socket.IO instance
        io.emit('taskDue', task); // Emit the due task to all connected clients
    });
};

// Schedule the cron job to run every minute
cron.schedule('* * * * *', checkDueTasks);

export default function handler(req, res) {
    res.status(200).json({ message: 'Cron job is running' });
}
