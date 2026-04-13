const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: "*" } });

const PORT = process.env.PORT || 10000;

app.use(express.static(path.join(__dirname, 'public')));

const images = ['apple.png', 'banana.png', 'coin.png', 'dollar.png', 'seven.png', 'begun.png', 'jambura.png', 'rose.png', 'beer-bottle.png', 'water-bottle.png'];

io.on('connection', (socket) => {
    socket.on('request-spin', (data) => {
        // ৩টি কলাম এবং ৪টি সারির (১২টি ছবি) ডাটা তৈরি করা
        let resultGrid = [];
        for (let i = 0; i < 4; i++) {
            resultGrid.push([
                images[Math.floor(Math.random() * images.length)],
                images[Math.floor(Math.random() * images.length)],
                images[Math.floor(Math.random() * images.length)]
            ]);
        }

        // উইন লজিক: যেকোনো ১টি সারিতে ৩টি মিললে জয়
        let win = false;
        resultGrid.forEach(row => {
            if (row[0] === row[1] && row[1] === row[2]) win = true;
        });

        let prize = win ? data.bet * 5 : 0;
        
        // ১২টি ছবির ডাটা ক্লায়েন্টে পাঠানো
        socket.emit('receive-spin', { grid: resultGrid, win, prize });
    });
});

server.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on port ${PORT}`);
});

