const mongoose = require("mongoose");

const withdrawRequest = new mongoose.Schema({
  userid: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  amount: { type: Number },
  transcationId: { type: Number },
  bank: { type: Object },
  status: {
    type: String,
    enum: ["pending", "completed", "rejected", "failed"],
    default: "pending",
  },
  generatedAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model("WithDrawRequest", withdrawRequest);
