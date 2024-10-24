// pages/api/socket.js
import { Server } from 'socket.io';

export default function handler(req, res) {
    if (res.socket.server.io) {
        console.log('Socket is already set up');
        res.end();
        return;
    }

    const io = new Server(res.socket.server);
    res.socket.server.io = io;

    io.on('connection', (socket) => {
        console.log('A user connected');

        socket.on('addTask', (task) => {
            io.emit('newTask', task); // Broadcast the new task to all connected clients
        });

        socket.on('disconnect', () => {
            console.log('User disconnected');
        });
    });

    res.end();
}

