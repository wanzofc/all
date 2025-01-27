const mongoose = require('mongoose');

const transactionSchema = new mongoose.Schema({
  userId: String,
  tanggal: Date,
  jumlah: Number,
  jenis: String
});
const Transaction = mongoose.model('Transaction', transactionSchema);

module.exports = Transaction;