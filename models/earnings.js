const mongoose = require("mongoose");
const { ObjectId } = mongoose.Schema;

const earnings = new mongoose.Schema(
  {
    title: { type: String },
    amount: { type: Number },
    mode: { type: String },
    status: { type: String, default: "pending" },
    id: { type: ObjectId, ref: "DelUser" },
  },
  { timestamps: true }
);

earnings.index({ title: "text" });

module.exports = mongoose.model("Earnings", earnings);
