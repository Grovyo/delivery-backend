const mongoose = require("mongoose");
const { ObjectId } = mongoose.Schema;

const deluser = new mongoose.Schema({
  phone: { type: Number, unique: true, required: true },
  username: { type: String },
  fullname: { type: String },
  adharnumber: { type: Number },
  accstatus: { type: String, default: "review" },
  attachedid: { type: Number },
  liscenenumber: { type: String },
  email: { type: String },
  isverified: { type: Boolean, default: false },
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

  currentotp: {
    otp: { type: Number },
    timing: { type: Number, default: Date.now().toString() },
  },
  // deliveries: [
  //   {
  //     time: { type: String, default: Date.now().toString() },
  //     amount: { type: String },
  //     status: { type: String },
  //     timing: { type: String },
  //     phonenumber: { type: Number },
  //     type: { type: String },
  //     pickupaddress: {
  //       streetaddress: { type: String },
  //       state: { type: String },
  //       city: { type: String },
  //       landmark: { type: String },
  //       pincode: { type: Number },
  //       country: { type: String },
  //       coordinates: {
  //         latitude: { type: Number },
  //         longitude: { type: Number },
  //         altitude: { type: Number },
  //         provider: { type: String },
  //         accuracy: { type: Number },
  //         speed: { type: Number },
  //         bearing: { type: Number },
  //       },
  //     },
  //     droppingaddress: {
  //       streetaddress: { type: String },
  //       state: { type: String },
  //       city: { type: String },
  //       landmark: { type: String },
  //       pincode: { type: Number },
  //       country: { type: String },
  //       coordinates: {
  //         latitude: { type: Number },
  //         longitude: { type: Number },
  //         altitude: { type: Number },
  //         provider: { type: String },
  //         accuracy: { type: Number },
  //         speed: { type: Number },
  //         bearing: { type: Number },
  //       },
  //     },
  //     name: { type: String },
  //     id: {
  //       type: ObjectId,
  //       ref: "Deliveries",
  //     },
  //   },
  // ],
  deliveries: [{ type: ObjectId, ref: "DeliveriesSchema" }], //total deliveries
  finisheddeliveries: [{ type: ObjectId, ref: "DeliveriesSchema" }], //compeleted deliveries
  deliverycount: { type: Number, default: 0 }, //compeleted deliveries count
  deliverypartners: [
    {
      time: { type: String, default: Date.now().toString() },
      id: { type: ObjectId, ref: "DelUser" },
    },
  ],
  pickup: [{ type: ObjectId, ref: "DeliveriesSchema" }],

  currentlocation: {
    latitude: { type: Number },
    longitude: { type: Number },
  },
  bank: {
    accno: { type: String },
    ifsccode: { type: String },
    name: { type: String },
  },
  reports: [
    {
      text: { type: String },
      timing: { type: Number },
      status: { type: String, default: "pending" },
      id: { type: String },
    },
  ],
  earnings: [
    {
      timing: { type: String, default: Date.now().toString() },
      amount: { type: Number },
      mode: { type: String },
      id: { type: ObjectId, ref: "Earnings" },
    },
  ],
  totalearnings: { type: Number, default: 0 },
  balance: [
    {
      amount: { type: Number },
      time: { type: Number },
      delid: { type: ObjectId, ref: "Delivery" },
      mode: { type: String, default: "Cash" },
    },
  ],
  totalbalance: { type: Number, default: 0 },
  //achievements
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
  currentdoing: { type: ObjectId, ref: "DeliveriesSchema" }, //is user currently doing any delivery
  primaryloc: {
    type: String,
  }, // for city
  stock: [{ type: ObjectId, ref: "Stock" }],
});

deluser.index({ phone: "Number" });

module.exports = mongoose.model("DelUser", deluser);
