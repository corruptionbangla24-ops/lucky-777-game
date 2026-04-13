const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: "*" } });

app.use(express.static(path.join(__dirname, 'public')));

// প্রাইজ লিস্ট (আপনার চিরকুট ও ব্যবসায়িক লজিক অনুযায়ী)
const multipliers = {
    'seven.png': 700,        // মেগা উইন ১
    'beer-bottle.png': 500,  // মেগা উইন ২
    'coin.png': 200,         // মেগা উইন ৩
    'dollar.png': 50,        // বিগ উইন
    'rose.png': 10,
    'apple.png': 2,
    'jambura.png': 1.5,
    'banana.png': 1,
    'begun.png': 0.5,
    'water-bottle.png': 0.2
};

const images = Object.keys(multipliers);

io.on('connection', (socket) => {
    socket.on('request-spin', (data) => {
        let grid = [];
        // ৩ কলাম x ৪ সারির গ্রিড তৈরি
        for (let i = 0; i < 4; i++) {
            grid.push([
                images[Math.floor(Math.random() * images.length)],
                images[Math.floor(Math.random() * images.length)],
                images[Math.floor(Math.random() * images.length)]
            ]);
        }

        let totalPrize = 0;
        let win = false;
        let isMegaWin = false;

        // --- মেগা উইন কন্ট্রোল (র্যান্ডমলি ভাগ্যক্রমে আসবে) ---
        let luckFactor = Math.random() * 2000; // ২০০০ বারের মধ্যে ১ বার মেগা উইন

        if (luckFactor < 1) { // ৭০০ গুণ
            win = true; isMegaWin = true;
            totalPrize = data.bet * 700;
            grid = [['seven.png', 'seven.png', 'seven.png'], ['seven.png', 'seven.png', 'seven.png'], ['seven.png', 'seven.png', 'seven.png'], ['seven.png', 'seven.png', 'seven.png']];
        } else if (luckFactor < 3) { // ৫০০ গুণ
            win = true; isMegaWin = true;
            totalPrize = data.bet * 500;
            grid = [['beer-bottle.png', 'beer-bottle.png', 'beer-bottle.png'],['beer-bottle.png', 'beer-bottle.png', 'beer-bottle.png'],['beer-bottle.png', 'beer-bottle.png', 'beer-bottle.png'],['beer-bottle.png', 'beer-bottle.png', 'beer-bottle.png']];
        } else if (luckFactor < 10) { // ২০০ গুণ
            win = true; isMegaWin = true;
            totalPrize = data.bet * 200;
            grid = [['coin.png', 'coin.png', 'coin.png'],['coin.png', 'coin.png', 'coin.png'],['coin.png', 'coin.png', 'coin.png'],['coin.png', 'coin.png', 'coin.png']];
        } else {
            // --- সাধারণ ২৪৩ ওয়েজ উইনিং লজিক ---
            images.forEach(img => {
                let col1 = grid.filter(row => row[0] === img).length;
                let col2 = grid.filter(row => row[1] === img).length;
                let col3 = grid.filter(row => row[2] === img).length;

                if (col1 > 0 && col2 > 0 && col3 > 0) {
                    // শুধু ছোট প্রাইজগুলো ২৪৩ ওয়েজে বারবার মিলবে
                    if (multipliers[img] < 100) {
                        win = true;
                        let ways = col1 * col2 * col3;
                        totalPrize += (data.bet * multipliers[img] * ways) / 5;
                    }
                }
            });
        }

        // আউটপুট পাঠানো
        socket.emit('receive-spin', { grid, win, prize: Math.floor(totalPrize), isMegaWin });
    });
});

const PORT = process.env.PORT || 10000;
server.listen(PORT, '0.0.0.0', () => { console.log(`243 Ways & Mega Win Active`); });

