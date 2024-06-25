const mongoose = require("mongoose");
const { ObjectId } = mongoose.Schema;

const deliveries = new mongoose.Schema({
  title: { type: String },
  amount: { type: Number },
  orderId: { type: Number },
  time: { type: Number },
  type: { type: String },
  data: Array,
  partner: { type: ObjectId, ref: "DelUser" },
  mode: { type: String },
  status: { type: String, default: "Not started" },
  reason: { type: String },
  pickupaddress: {
    streetaddress: { type: String },
    state: { type: String },
    city: { type: String },
    landmark: { type: String },
    pincode: { type: Number },
    country: { type: String },
    coordinates: {
      latitude: { type: Number },
      longitude: { type: Number },
      altitude: { type: Number },
      provider: { type: String },
      accuracy: { type: Number },
      speed: { type: Number },
      bearing: { type: Number },
    },
  },
  droppingaddress: {
    streetaddress: { type: String },
    state: { type: String },
    city: { type: String },
    landmark: { type: String },
    pincode: { type: Number },
    country: { type: String },
    coordinates: {
      latitude: { type: Number },
      longitude: { type: Number },
      altitude: { type: Number },
      provider: { type: String },
      accuracy: { type: Number },
      speed: { type: Number },
      bearing: { type: Number },
    },
  },
  phonenumber: { type: Number },
  remarks: { type: String },
  timing: { type: String },
  current: { type: Number, default: 0 },
  // data: [
  //   {
  //     product: { type: ObjectId, ref: "Product" },
  //     qty: { type: Number },
  //     seller: { type: ObjectId, ref: "User" },
  //     price: { type: Number, default: 0 },
  //   },
  // ],
  verifypic: [{ type: String }],
  marks: [
    {
      latitude: String,
      longitude: String,
      address: Object,
      done: Boolean,
      pic: String,
    },
  ],
  where: { type: String, enum: ["affiliate", "customer"] },
  earning: { type: Number },
  affid: { type: ObjectId, ref: "DelUser" },
  buyer: { type: ObjectId, ref: "User" },
  from: String,
});

deliveries.index({ title: "text" });

module.exports = mongoose.model("DeliveriesSchema", deliveries);
