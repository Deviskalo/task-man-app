// pages/api/start-cron.js
import cron from 'node-cron';

let cronJobStarted = false;

export default function handler(req, res) {
    if (!cronJobStarted) {
        cron.schedule('* * * * *', () => {
            // Call your checkDueTasks function here
            checkDueTasks();
            console.log('Cron job is running');
        });
        cronJobStarted = true;
        res.status(200).json({ message: 'Cron job started' });
    } else {
        res.status(200).json({ message: 'Cron job is already running' });
    }
}

