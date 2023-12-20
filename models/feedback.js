const mongoose = require("mongoose");
const { ObjectId } = mongoose.Schema;

const feedback = new mongoose.Schema({
  title: { type: String },
  text: { type: String },
  id: { type: ObjectId, ref: "DelUser" },
});

feedback.index({ id: "text" });

module.exports = mongoose.model("feedback", feedback);
