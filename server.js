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

// --- আপনার ইনফিনিটি ফ্রি সাইটের সঠিক API লিঙ্ক (এটি আপডেট করা হয়েছে) ---
const API_URL = 'https://gamer.gd';
const SECRET_KEY = "betlover24_secure_key";

io.on('connection', (socket) => {
    console.log('একটি ইউজার কানেক্ট হয়েছে');

    socket.on('request-spin', async (data) => {
        const { username, bet } = data;

        if (!username) {
            console.log("Username missing!");
            return;
        }

        try {
            // ১. বাজি ধরলে আপনার সাইট থেকে টাকা কাটা
            const res = await axios.post(API_URL, new URLSearchParams({
                username: username, 
                amount: -bet, 
                token: SECRET_KEY
            }));

            if (res.data && res.data.status === 'success') {
                // ২. গ্রিড তৈরি (৩ কলাম x ৪ সারি = ১২টি ঘর)
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
                        // প্রাইজ লজিক
                        if (sym === 'seven.png') prize = bet * 10;
                        else if (sym === 'dollar.png') prize = bet * 5;
                        else prize = bet * 2;
                        break;
                    }
                }

                // ৪. যদি প্লেয়ার জেতে, তবে সাইটে টাকা যোগ করা
                if (win && prize > 0) {
                    await axios.post(API_URL, new URLSearchParams({
                        username: username, 
                        amount: prize, 
                        token: SECRET_KEY
                    }));
                }

                // ৫. রেজাল্ট পাঠানো (নতুন ব্যালেন্সসহ)
                socket.emit('receive-spin', { 
                    grid, 
                    win, 
                    prize, 
                    winningImg,
                    newBalance: win ? parseFloat(res.data.new_balance) + prize : res.data.new_balance 
                });
            } else {
                console.log("Balance deduction failed:", res.data ? res.data.message : "No response");
            }
        } catch (e) {
            console.log("API Connection Error - চেক করুন slot_api.php ফাইলটি ঠিক আছে কি না");
        }
    });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => { console.log(`Server is running on port ${PORT}`); });

