const mongoose = require("mongoose");

const earnings = new mongoose.Schema({
  title: { type: String },
  amount: { type: Number },
  mode: { type: String },
});

earnings.index({ title: "text" });

module.exports = mongoose.model("Earnings", earnings);
