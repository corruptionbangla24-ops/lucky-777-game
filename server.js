const express = require('express');
const http = require('http');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: "*" } });

const PORT = process.env.PORT || 10000;

app.use(express.static(__dirname));

const images = ['apple.png', 'banana.png', 'coin.png', 'dollar.png', 'seven.png', 'begun.png', 'jambura.png', 'rose.png', 'beer-bottle.png', 'water-bottle.png'];

io.on('connection', (socket) => {
    console.log('User connected:', socket.id);
    socket.on('request-spin', (data) => {
        const generateReel = () => [
            images[Math.floor(Math.random() * images.length)],
            images[Math.floor(Math.random() * images.length)],
            images[Math.floor(Math.random() * images.length)]
        ];
        const grid = [generateReel(), generateReel(), generateReel()];
        
        // উইন লজিক: মাঝখানের সারিতে ৩টি মিললে ১০ গুণ প্রাইজ
        const win = (grid[0][1] === grid[1][1] && grid[1][1] === grid[2][1]);
        const prize = win ? data.bet * 10 : 0;

        socket.emit('receive-spin', { grid, win, prize });
    });
});

server.listen(PORT, '0.0.0.0', () => {
    console.log(`সার্ভার চলছে পোর্টে: ${PORT}`);
});

