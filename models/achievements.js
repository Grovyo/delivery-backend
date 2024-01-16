const mongoose = require("mongoose");
const { ObjectId } = mongoose.Schema;

const achievements = new mongoose.Schema({
  title: { type: String },
  amount: { type: Number },
  participants: [{ type: ObjectId, ref: "DelUser" }],
  category: { type: String },
  completedby: [{ type: ObjectId, ref: "DelUser" }],
  start: { type: String },
  end: { type: String },
  image: { type: String },
});

achievements.index({ title: "text" });

module.exports = mongoose.model("Achievements", achievements);
