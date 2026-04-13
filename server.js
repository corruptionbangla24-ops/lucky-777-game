const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path'); // এটি অবশ্যই থাকতে হবে

const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: "*" } });

const PORT = process.env.PORT || 10000;

// এই লাইনটি রেন্ডার সার্ভারকে বলে দেবে ফাইলগুলো কোথায় আছে
app.use(express.static(path.join(__dirname, 'public')));

const images = ['apple.png', 'banana.png', 'coin.png', 'dollar.png', 'seven.png', 'begun.png', 'jambura.png', 'rose.png', 'beer-bottle.png', 'water-bottle.png'];

io.on('connection', (socket) => {
    socket.on('request-spin', (data) => {
        const grid = [
            images[Math.floor(Math.random() * images.length)],
            images[Math.floor(Math.random() * images.length)],
            images[Math.floor(Math.random() * images.length)]
        ];
        
        // উইন লজিক: ৩টি এক হলে
        let win = (grid[0] === grid[1] && grid[1] === grid[2]);
        let prize = win ? data.bet * 10 : 0;

        socket.emit('receive-spin', { grid, win, prize });
    });
});

server.listen(PORT, '0.0.0.0', () => {
    console.log(`Server is running on port ${PORT}`);
});

