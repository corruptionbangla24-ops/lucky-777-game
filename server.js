  const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const mysql = require('mysql2/promise'); // MySQL কানেকশনের জন্য

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.static('public'));

// ১. ডাটাবেস কানেকশন (Environment Variables থেকে তথ্য নেবে)
const dbConfig = {
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASS,
    database: process.env.DB_NAME,
    port: process.env.DB_PORT || 15764,
    ssl: { rejectUnauthorized: false } // Aiven এর জন্য প্রয়োজনীয়
};

// ২. গেম সিম্বল লিস্ট
const symbols = ['apple.png', 'banana.png', 'coin.png', 'dollar.png', 'seven.png', 'begun.png', 'jambura.png', 'rose.png', 'beer-bottle.png', 'water-bottle.png'];

io.on('connection', (socket) => {
    console.log('User Connected to Game');

    socket.on('request-spin', async (data) => {
        const { username, bet } = data;
        let connection;

        try {
            connection = await mysql.createConnection(dbConfig);

            // ৩. ইউজারের ব্যালেন্স চেক এবং টাকা কাটানো
            const [user] = await connection.execute('SELECT balance FROM users WHERE username = ?', [username]);
            
            if (!user.length || user[0].balance < bet) {
                return socket.emit('error-msg', "Insufficient Balance!");
            }

            let newBalance = user[0].balance - bet;
            await connection.execute('UPDATE users SET balance = ? WHERE username = ?', [newBalance, username]);

            // ৪. ৩x৪ গ্রিড জেনারেট করা
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

            // প্রতিটি সিম্বল কতবার আছে তা গুনে দেখা
            const flatGrid = grid.flat();
            for (let sym of symbols) {
                const count = flatGrid.filter(s => s === sym).length;
                if (count >= 3) { 
                    win = true;
                    winningImg = sym;
                    // সিম্বল অনুযায়ী প্রাইজ সেট করা
                    if (sym === 'seven.png') prize = bet * 10;
                    else if (sym === 'dollar.png') prize = bet * 5;
                    else prize = bet * 2;
                    break; 
                }
            }

            // ৬. প্লেয়ার জিতলে ব্যালেন্স আপডেট
            if (win && prize > 0) {
                newBalance += prize;
                await connection.execute('UPDATE users SET balance = ? WHERE username = ?', [newBalance, username]);
            }

            // ৭. ক্লায়েন্টকে রেজাল্ট পাঠানো (এটিই ছবি থামাবে)
            socket.emit('receive-spin', { 
                grid, 
                win, 
                prize, 
                winningImg,
                newBalance: newBalance 
            });

        } catch (err) {
            console.error("Game Error:", err.message);
            socket.emit('error-msg', "Server Connection Error!");
        } finally {
            if (connection) await connection.end();
        }
    });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`Game Server Running on Port: ${PORT}`);
});
              
