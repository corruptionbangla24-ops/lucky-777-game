const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const axios = require('axios');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.static('public'));

// ১. গেমের সিম্বল লিস্ট
const symbols = ['apple.png', 'banana.png', 'coin.png', 'dollar.png', 'seven.png', 'begun.png', 'jambura.png', 'rose.png', 'beer-bottle.png', 'water-bottle.png'];

// ২. আপনার ইনফিনিটি ফ্রি সাইটের সঠিক API লিঙ্ক এবং সিক্রেট কি
const API_URL = 'https://gamer.gd';
const SECRET_KEY = "betlover24_secure_key";

io.on('connection', (socket) => {
    console.log('User Connected to Game');

    socket.on('request-spin', async (data) => {
        const { username, bet } = data;

        // ইউজারনেম না থাকলে স্পিন হবে না (নিরাপত্তা)
        if (!username) {
            return socket.emit('error-msg', "দয়া করে আপনার মেইন সাইট থেকে লগইন করে গেমটি ওপেন করুন।");
        }

        try {
            // ৩. বাজি ধরলে ইনফিনিটি ফ্রি সাইট থেকে টাকা কাটানো
            const res = await axios.post(API_URL, new URLSearchParams({
                username: username, 
                amount: -bet, 
                token: SECRET_KEY
            }));

            // টাকা সফলভাবে কাটলে স্পিন শুরু হবে
            if (res.data && res.data.status === 'success') {
                let currentBalance = parseFloat(res.data.new_balance);

                // ৪. ৩x৪ গ্রিডে ১২টি ঘর জেনারেট করা
                let grid = [];
                for (let i = 0; i < 4; i++) {
                    let row = [];
                    for (let j = 0; j < 3; j++) row.push(symbols[Math.floor(Math.random() * symbols.length)]);
                    grid.push(row);
                }

                // ৫. ২৪৩ ওয়েজ উইনিং লজিক (৩টি বা তার বেশি মিললে)
                let win = false;
                let prize = 0;
                let winningImg = null;

                const flatGrid = grid.flat();
                for (let sym of symbols) {
                    const count = flatGrid.filter(s => s === sym).length;
                    if (count >= 3) {
                        win = true;
                        winningImg = sym;
                        // আপনার প্রাইজ লজিক
                        if (sym === 'seven.png') prize = bet * 10;
                        else if (sym === 'dollar.png') prize = bet * 5;
                        else prize = bet * 2;
                        break;
                    }
                }

                // ৬. প্লেয়ার জিতলে ডাটাবেসে টাকা যোগ করা
                if (win && prize > 0) {
                    const winRes = await axios.post(API_URL, new URLSearchParams({
                        username: username, 
                        amount: prize, 
                        token: SECRET_KEY
                    }));
                    if(winRes.data.status === 'success') {
                        currentBalance = parseFloat(winRes.data.new_balance);
                    }
                }

                // ৭. ক্লায়েন্টকে রেজাল্ট পাঠানো (স্পিন থামানোর সংকেত)
                socket.emit('receive-spin', { 
                    grid, 
                    win, 
                    prize, 
                    winningImg,
                    newBalance: currentBalance
                });
            } else {
                socket.emit('error-msg', res.data.message || "ব্যালেন্স নেই বা এরর হয়েছে!");
            }
        } catch (e) {
            console.log("Connection Failed to InfinityFree API");
            socket.emit('error-msg', "সার্ভারের সাথে সংযোগ বিচ্ছিন্ন হয়েছে।");
        }
    });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => { console.log(`গেম সার্ভার সচল হয়েছে পোর্ট: ${PORT}`); });


