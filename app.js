
const express = require('express');
const app = express();
const mongoose = require('mongoose');
const axios = require('axios');
const Gopay = require('gopay-node');
const path = require('path');
const User = require('./user');
const Transaction = require('./transaction');

mongoose.connect('mongodb://localhost:27017/mydatabase', { useNewUrlParser: true, useUnifiedTopology: true });

const apiKey = 'YOUR_API_KEY';
const apiSecret = 'YOUR_API_SECRET';

const gopay = new Gopay(apiKey, apiSecret);

const indexPath = path.join(__dirname, 'index.html');
const userPath = path.join(__dirname, 'user.js');
const transactionPath = path.join(__dirname, 'transaction.js');

app.use(express.static(indexPath));
app.use('/user', express.static(userPath));
app.use('/transaction', express.static(transactionPath));

app.post('/login', (req, res) => {
const { email, password } = req.body;
User.findOne({ email }, (err, user) => {
if (err || !user) {
return res.status(401).send({ message: 'Email atau password salah' });
}
if (password !== user.password) {
return res.status(401).send({ message: 'Email atau password salah' });
}
const token = generateToken(user);
res.send({ token });
});
});

app.post('/top-up', (req, res) => {
const { nominal } = req.body;
const userId = req.user.id;
User.findById(userId, (err, user) => {
if (err || !user) {
return res.status(404).send({ message: 'Pengguna tidak ditemukan' });
}
const transaction = new Transaction({
userId,
tanggal: new Date(),
jumlah: nominal,
jenis: 'top-up'
});
transaction.save((err) => {
if (err) {
return res.status(500).send({ message: 'Gagal melakukan top-up' });
}
user.saldo += nominal;
user.save((err) => {
if (err) {
return res.status(500).send({ message: 'Gagal melakukan top-up' });
}
res.send({ message: 'Top-up berhasil' });
});
});
});
});

app.post('/transfer', (req, res) => {
const { nominal } = req.body;
const userId = req.user.id;
User.findById(userId, (err, user) => {
if (err || !user) {
return res.status(404).send({ message: 'Pengguna tidak ditemukan' });
}
if (user.saldo < nominal) {
return res.status(400).send({ message: 'Saldo tidak cukup' });
}
const transferData = {
amount: nominal,
payment_method: 'GOPAY',
gopay: {
customer_name: user.nama,
customer_phone: user.email
}
};
gopay.createTransaction(transferData)
.then((transaction) => {
user.saldo -= nominal;
user.save((err) => {
if (err) {
return res.status(500).send({ message: 'Gagal melakukan transfer' });
}
res.send({ message: 'Transfer berhasil' });
});
})
.catch((error) => {
console.error(error);
res.status(500).send({ message: 'Gagal melakukan transfer' });
});
});
});

app.get('/', (req, res) => {
res.sendFile(indexPath);
});

const port = 8080;
app.listen(port, () => {
console.log(`Aplikasi berjalan di port ${port}`);
});