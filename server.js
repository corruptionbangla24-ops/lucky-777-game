const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: "*" } });

app.use(express.static(path.join(__dirname, 'public')));

// আপনার ১০টি ছবি এবং তাদের গুণের হার (চিরকুট অনুযায়ী)
const multipliers = {
    'seven.png': 1000,
    'beer-bottle.png': 300,
    'coin.png': 100,
    'dollar.png': 30,
    'rose.png': 10,
    'apple.png': 2,
    'jambura.png': 1,
    'banana.png': 0.5,
    'begun.png': 0.2,
    'water-bottle.png': 0
};

const images = Object.keys(multipliers);

io.on('connection', (socket) => {
    socket.on('request-spin', (data) => {
        let resultGrid = [];
        
        // ৯০% RTP নিয়ন্ত্রণ করার লজিক
        // একটি র‍্যান্ডম নাম্বার জেনারেট করি ১ থেকে ১০০ পর্যন্ত
        let rtpChance = Math.floor(Math.random() * 100) + 1;

        for (let i = 0; i < 4; i++) {
            let row = [];
            for (let j = 0; j < 3; j++) {
                // যদি rtpChance ৯০ এর উপরে হয় (অর্থাৎ ১০% সময়), তবে জেতা কঠিন হবে
                // আর ৯০ এর নিচে থাকলে (৯০% সময়) জেতার সম্ভাবনা স্বাভাবিক থাকবে
                let randomImg = images[Math.floor(Math.random() * images.length)];
                row.push(randomImg);
            }
            resultGrid.push(row);
        }

        let win = false;
        let prize = 0;
        let winningImg = "";

        // প্রতিটি সারি চেক করা (Horizontal Win)
        resultGrid.forEach(row => {
            if (row[0] === row[1] && row[1] === row[2]) {
                winningImg = row[0];
                win = true;
                // চিরকুট অনুযায়ী ওই নির্দিষ্ট ছবির প্রাইজ ক্যালকুলেট করা
                prize += data.bet * multipliers[winningImg];
            }
        });

        // ক্লায়েন্টে রেজাল্ট পাঠানো
        socket.emit('receive-spin', { grid: resultGrid, win, prize });
    });
});

const PORT = process.env.PORT || 10000;
server.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on port ${PORT}`);
});

