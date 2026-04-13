const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: "*" } });

app.use(express.static(path.join(__dirname, 'public')));

// আপনার চিরকুটের সংশোধিত প্রাইজ তালিকা
const multipliers = {
    'seven.png': 100,        // ১০০ গুণ
    'beer-bottle.png': 50,   // ৫০ গুণ
    'coin.png': 10,          // ১০ গুণ
    'dollar.png': 5,         // ৫ গুণ
    'rose.png': 2,           // ২ গুণ
    'apple.png': 1.5,        // ১.৫ গুণ
    'jambura.png': 1.2,      // ১.২ গুণ
    'banana.png': 0.8,       // ০.৮ গুণ
    'begun.png': 0.5,        // ০.৫ গুণ
    'water-bottle.png': 0    // ০ গুণ
};

const images = Object.keys(multipliers);

io.on('connection', (socket) => {
    socket.on('request-spin', (data) => {
        let grid = [];
        for (let i = 0; i < 4; i++) {
            grid.push([
                images[Math.floor(Math.random() * images.length)],
                images[Math.floor(Math.random() * images.length)],
                images[Math.floor(Math.random() * images.length)]
            ]);
        }

        let win = false;
        let totalPrize = 0;

        // ১. সারি চেক (Horizontal - ৪টি উপায়)
        grid.forEach(row => {
            if (row[0] === row[1] && row[1] === row[2]) {
                win = true;
                totalPrize += data.bet * multipliers[row[0]];
            }
        });

        // ২. কলাম চেক (Vertical - ৩টি উপায়)
        for (let col = 0; col < 3; col++) {
            if (grid[0][col] === grid[1][col] && grid[1][col] === grid[2][col] && grid[2][col] === grid[3][col]) {
                win = true;
                // কলামে ৪টি মিললে বোনাস হিসেবে ২ গুণ বেশি প্রাইজ
                totalPrize += data.bet * multipliers[grid[0][col]] * 2;
            }
        }

        // ৩. কোণাকুণি চেক (Diagonal - ৪টি প্রধান উপায়)
        // উদাহরণ: উপরের বাম থেকে নিচের ডান
        if (grid[0][0] === grid[1][1] && grid[1][1] === grid[2][2]) {
            win = true;
            totalPrize += data.bet * multipliers[grid[0][0]];
        }
        if (grid[1][0] === grid[2][1] && grid[2][1] === grid[3][2]) {
            win = true;
            totalPrize += data.bet * multipliers[grid[1][0]];
        }

        socket.emit('receive-spin', { grid, win, prize: Math.floor(totalPrize) });
    });
});

const PORT = process.env.PORT || 10000;
server.listen(PORT, '0.0.0.0', () => { console.log(`Server running on port ${PORT}`); });

