const mongoose = require("mongoose");
const { ObjectId } = mongoose.Schema;

const deluser = new mongoose.Schema({
  phone: { type: Number, unique: true, required: true },
  username: { type: String, unique: true },
  fullname: { type: String },
  adharnumber: { type: Number },
  accstatus: { type: String, default: "review" },
  liscenenumber: { type: String },
  email: { type: String },
  address: {
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
  referalid: { type: String },
  accounttype: { type: String },
  vehicletype: { type: String },
  photos: [
    {
      content: { type: String },
      type: { type: String },
      size: { type: String },
    },
  ],
  activestatus: { type: String, default: "online" },
  activity: [
    {
      time: { type: String, default: Date.now().toString() },
      type: { type: String },
      deviceinfo: { type: [Array] },
      location: { type: [Array] },
    },
  ],
  notificationtoken: { type: String },
  //for amount that driver earns
  earnings: [
    {
      timing: { type: String, default: Date.now().toString() },
      amount: { type: String },
      mode: { type: String },
      type: ObjectId,
      ref: "Earnings",
    },
  ],
  //for amount that driver collects
  balance: {
    amount: { type: Number },
    time: { type: Number },
    delid: { type: ObjectId, ref: "Delivery" },
    mode: { type: String, default: "Cash" },
  },
  totalbalance: { type: Number, default: 0 },
  currentotp: {
    otp: { type: Number },
    timing: { type: Number, default: Date.now().toString() },
  },
  deliveries: [
    {
      time: { type: String, default: Date.now().toString() },
      amount: { type: String },
      status: { type: String },
      timing: { type: String },
      phonenumber: { type: Number },
      type: { type: String },
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
      name: { type: String },
      id: {
        type: ObjectId,
        ref: "Deliveries",
      },
    },
  ],
  achievements: [
    {
      time: { type: String, default: Date.now().toString() },
      achievements: { type: String },
      type: ObjectId,
      ref: "Achievements",
    },
  ],
  successedachievements: [
    {
      time: { type: String, default: Date.now().toString() },
      achievements: { type: String },
      type: ObjectId,
      ref: "Achievements",
    },
  ],
  deliverypartners: [
    {
      time: { type: String, default: Date.now().toString() },
      id: { type: ObjectId, ref: "User" },
    },
  ],
  totalearnings: { type: Number, default: 0 },
  deliverycount: { type: Number, default: 0 },
  currentlocation: {
    latitude: { type: Number },
    longitude: { type: Number },
  },
  bank: {
    accno: { type: String },
    ifsccode: { type: String },
  },
  reports: [
    {
      text: { type: String },
      timing: { type: Number },
      status: { type: String, default: "pending" },
      id: { type: String },
    },
  ],
});

deluser.index({ phone: "Number" });

module.exports = mongoose.model("DelUser", deluser);
