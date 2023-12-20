const mongoose = require("mongoose");
const { ObjectId } = mongoose.Schema;

const locations = new mongoose.Schema({
  title: { type: String },
  stores: [
    {
      time: { type: String, default: Date.now().toString() },
      name: { type: String },
      storeid: { type: ObjectId, ref: "User" },
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
          provider: { type: Number },
          accuracy: { type: Number },
          speed: { type: Number },
          bearing: { type: Number },
        },
      },
    },
  ],
});

locations.index({ title: "text" });

module.exports = mongoose.model("Locations", locations);
