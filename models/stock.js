const mongoose = require("mongoose");
const { ObjectId } = mongoose.Schema;

const stock = new mongoose.Schema(
  {
    data: Array,
    prevdriverid: { type: ObjectId, ref: "DelUser" },
    when: { type: String },
    qty: { type: Number, default: 0 },
    price: { type: Number },
    qr: { type: String },
    nextby: { type: ObjectId, ref: "DelUser" },
    currentholder: { type: ObjectId, ref: "DelUser" },
    buyer: { type: ObjectId, ref: "User" },
    orderid: { type: String },
    active: { type: Boolean, default: false },
  },
  { timestamps: true }
);

stock.index({ title: "text" });

module.exports = mongoose.model("Stock", stock);
