const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const axios = require('axios');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.static('public'));

// আপনার সিম্বল লিস্ট
const symbols = ['apple.png', 'banana.png', 'coin.png', 'dollar.png', 'seven.png', 'begun.png', 'jambura.png', 'rose.png', 'beer-bottle.png', 'water-bottle.png'];

// --- আপনার ইনফিনিটি ফ্রি সাইটের তথ্য ---
const API_URL = 'https://আপনার-সাইটের-লিঙ্://xn--p5b.com'; 
const SECRET_KEY = "betlover24_secure_key";

io.on('connection', (socket) => {
    socket.on('request-spin', async (data) => {
        const { username, bet } = data;

        try {
            // ১. বাজি ধরলে ইনফিনিটি ফ্রি থেকে টাকা কাটা
            const res = await axios.post(API_URL, new URLSearchParams({
                username: username, amount: -bet, token: SECRET_KEY
            }));

            if (res.data.status === 'success') {
                // ২. ২৪৩ ওয়েজ গ্রিড তৈরি (৩ কলাম x ৪ সারি = ১২টি ঘর)
                let grid = [];
                for (let i = 0; i < 4; i++) {
                    let row = [];
                    for (let j = 0; j < 3; j++) row.push(symbols[Math.floor(Math.random() * symbols.length)]);
                    grid.push(row);
                }

                // ৩. ২৪৩ উইনিং লজিক (৩টি বা তার বেশি মিললে)
                let win = false;
                let prize = 0;
                let winningImg = null;

                const flatGrid = grid.flat();
                for (let sym of symbols) {
                    const count = flatGrid.filter(s => s === sym).length;
                    if (count >= 3) {
                        win = true;
                        winningImg = sym;
                        // আপনার সেই বিশেষ প্রাইজ লজিক
                        if (sym === 'seven.png') prize = bet * 10;
                        else if (sym === 'dollar.png') prize = bet * 5;
                        else prize = bet * 2;
                        break;
                    }
                }

                // ৪. যদি প্লেয়ার জেতে, তবে ইনফিনিটি ফ্রিতে টাকা যোগ করা
                if (win && prize > 0) {
                    await axios.post(API_URL, new URLSearchParams({
                        username: username, amount: prize, token: SECRET_KEY
                    }));
                }

                // ৫. রেজাল্ট পাঠানো
                socket.emit('receive-spin', { 
                    grid, 
                    win, 
                    prize, 
                    winningImg,
                    newBalance: win ? res.data.new_balance + prize : res.data.new_balance 
                });
            }
        } catch (e) {
            console.log("API Connection Error");
        }
    });
});

server.listen(3000, () => { console.log('Server is running on port 3000'); });

