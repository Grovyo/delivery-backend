const mongoose = require("mongoose");

const achievements = new mongoose.Schema({
  title: { type: String },
  amount: { type: Number },
  participants: [{ type: ObjectId, ref: "DelUser" }],
});

achievements.index({ title: "text" });

module.exports = mongoose.model("Achievements", achievements);
