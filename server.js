const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: "*" } });

const PORT = process.env.PORT || 10000;
app.use(express.static(path.join(__dirname, 'public')));

// আপনার চিরকুট অনুযায়ী প্রাইজ লিস্ট
const multipliers = {
    'seven.png': 700,
    'beer-bottle.png': 500,
    'coin.png': 200,
    'dollar.png': 50,
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
        let winningImg = "";

        // ১. মেগা উইন লজিক (ভাগ্যক্রমে বড় উইন - ৭০০x, ৫০০x, ২০০x)
        let luckFactor = Math.random() * 1500; // ১৫০০ স্পিনে ১ বার বড় জয়ের সুযোগ

        if (luckFactor < 1) { 
            win = true; winningImg = 'seven.png';
            totalPrize = data.bet * 700;
            grid = [['seven.png','seven.png','seven.png'],['seven.png','seven.png','seven.png'],['seven.png','seven.png','seven.png'],['seven.png','seven.png','seven.png']];
        } else if (luckFactor < 3) {
            win = true; winningImg = 'beer-bottle.png';
            totalPrize = data.bet * 500;
            grid = [['beer-bottle.png','beer-bottle.png','beer-bottle.png'],['beer-bottle.png','beer-bottle.png','beer-bottle.png'],['beer-bottle.png','beer-bottle.png','beer-bottle.png'],['beer-bottle.png','beer-bottle.png','beer-bottle.png']];
        } else {
            // ২. সাধারণ ২৪৩ ওয়েজ লজিক (ঘন ঘন ছোট জয়)
            images.forEach(img => {
                let col1 = grid.filter(row => row[0] === img).length;
                let col2 = grid.filter(row => row[1] === img).length;
                let col3 = grid.filter(row => row[2] === img).length;

                if (col1 > 0 && col2 > 0 && col3 > 0) {
                    if (multipliers[img] < 100) {
                        win = true;
                        winningImg = img;
                        let ways = col1 * col2 * col3;
                        totalPrize += (data.bet * multipliers[img] * ways) / 5;
                    }
                }
            });
        }

        socket.emit('receive-spin', { 
            grid: grid, 
            win: win, 
            prize: Math.floor(totalPrize),
            winningImg: winningImg 
        });
    });
});

server.listen(PORT, '0.0.0.0', () => { console.log(`Server is running on port ${PORT}`); });

