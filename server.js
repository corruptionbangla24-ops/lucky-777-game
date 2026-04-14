const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const axios = require('axios');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.static('public'));

const symbols = ['apple.png', 'banana.png', 'coin.png', 'dollar.png', 'seven.png', 'begun.png', 'jambura.png', 'rose.png', 'beer-bottle.png', 'water-bottle.png'];

// --- আপনার ইনফিনিটি ফ্রি সাইটের সঠিক API লিঙ্ক ---
const API_URL = 'https://betlover365.gamer.gd/slot_api.php";
const SECRET_KEY = "betlover24_secure_key";

io.on('connection', (socket) => {
    socket.on('request-spin', async (data) => {
        const { username, bet } = data;

        // নিরাপত্তা ১: ইউজারনেম চেক
        if (!username) {
            return socket.emit('error-msg', "দয়া করে আপনার মেইন সাইট থেকে লগইন করে গেমটি ওপেন করুন।");
        }

        try {
            // ১. ইনফিনিটি ফ্রি সাইট থেকে টাকা কাটানো
            const res = await axios.post(API_URL, new URLSearchParams({
                username: username, amount: -bet, token: SECRET_KEY
            }));

            // নিরাপত্তা ২: ব্যালেন্স চেক (টাকা থাকলেই স্পিন হবে)
            if (res.data && res.data.status === 'success') {
                let currentBalance = parseFloat(res.data.new_balance);

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
                        // প্রাইজ ক্যালকুলেশন
                        if (sym === 'seven.png') prize = bet * 10;
                        else if (sym === 'dollar.png') prize = bet * 5;
                        else prize = bet * 2;
                        break;
                    }
                }

                // ৪. জিতলে টাকা যোগ করা
                if (win && prize > 0) {
                    const winRes = await axios.post(API_URL, new URLSearchParams({
                        username: username, amount: prize, token: SECRET_KEY
                    }));
                    currentBalance = parseFloat(winRes.data.new_balance);
                }

                // ৫. ক্লায়েন্টকে ডেটা পাঠানো (স্পিন থামানোর সংকেত)
                socket.emit('receive-spin', { 
                    grid, win, prize, winningImg, 
                    newBalance: currentBalance 
                });

            } else {
                socket.emit('error-msg', "আপনার অ্যাকাউন্টে পর্যাপ্ত ব্যালেন্স নেই!");
            }
        } catch (e) {
            console.log("API Connection Error");
            socket.emit('error-msg', "সার্ভারের সাথে সংযোগ বিচ্ছিন্ন হয়েছে। আবার চেষ্টা করুন।");
        }
    });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => { console.log(`গেম সার্ভার সচল হয়েছে পোর্ট: ${PORT}`); });


