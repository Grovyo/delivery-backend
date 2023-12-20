const User = require("../models/deluser");
const Feedback = require("../models/feedback");
const Minio = require("minio");
const uuid = require("uuid").v4;
const sharp = require("sharp");

const minioClient = new Minio.Client({
  endPoint: "minio.grovyo.site",

  useSSL: true,
  accessKey: "shreyansh379",
  secretKey: "shreyansh379",
});

//function to generate a presignedurl of minio
async function generatePresignedUrl(bucketName, objectName, expiry = 604800) {
  try {
    const presignedUrl = await minioClient.presignedGetObject(
      bucketName,
      objectName,
      expiry
    );
    return presignedUrl;
  } catch (err) {
    console.error(err);
    throw new Error("Failed to generate presigned URL");
  }
}

//function to generate random id
function generateRandomId() {
  const min = 100000000;
  const max = 999999999;

  const randomId = Math.floor(Math.random() * (max - min + 1)) + min;

  return randomId.toString();
}

//get user dashboard
exports.getdashboard = async (req, res) => {
  const { id } = req.params;
  try {
    const user = await User.findById(id);
    if (!user) {
      res
        .status(404)
        .json({ message: "User not found!", success: true, userexists: false });
    } else {
      let dp = [];
      for (let i = 0; i < user.photos?.length; i++) {
        if (user?.photos[i].type === "dp") {
        }
        const d = await generatePresignedUrl(
          "documents",
          user.photos[i].content.toString(),
          60 * 60
        );
        dp.push(d);
      }
      if (user?.accounttype === "affiliate") {
        res.status(200).json({
          referalid: user.referalid,
          earnings: user.totalearnings,
          partner: user.deliverypartners.length,
          totalorder: user.deliverycount,
          achievements: user.achievements,
          dp: dp[0],
          success: true,
        });
      } else {
        res.status(200).json({
          earnings: user.totalearnings,
          totalorder: user.deliverycount,
          achievements: user.achievements,
          dp: dp[0],
          success: true,
        });
      }
    }
  } catch (e) {
    res.status(404).json({
      message: "Something went wrong...",
      success: false,
      userexists: false,
    });
  }
};

//list of orders
exports.getallorders = async (req, res) => {
  const { id } = req.params;
  try {
    const user = await User.findById(id);
    if (user) {
      res.status(200).json({ deliveries: user?.deliveries, success: true });
    } else {
      res.status(404).json({ message: "User not found", success: false });
    }
  } catch (e) {
    console.log(e);
    res
      .status(400)
      .json({ message: "Something went wrong...", success: false });
  }
};

//change online and offline status
exports.changestatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const user = await User.findById(id);
    if (user) {
      if (status === "online") {
        await User.updateOne(
          { _id: user?._id },
          {
            $set: {
              activestatus: "online",
            },
          }
        );
      } else {
        await User.updateOne(
          { _id: user?._id },
          {
            $set: {
              activestatus: "offline",
            },
          }
        );
      }
      res.status(200).json({ success: true });
    } else {
      res.status(404).json({ message: "User not found", success: false });
    }
  } catch (e) {
    console.log(e);
    res
      .status(400)
      .json({ message: "Something went wrong...", success: false });
  }
};

//update profile
exports.updateprofile = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      fullname,
      phone,
      streetaddress,
      city,
      pincode,
      state,
      country,
      landmark,
      latitude,
      longitude,
      altitude,
      bearing,
      speed,
      accuracy,
      provider,
      email,
    } = req.body;
    const user = await User.findById(id);
    const address = {
      streetaddress: streetaddress,
      landmark: landmark,
      pincode: pincode,
      city: city,
      state: state,
      country: country,
      coordinates: {
        latitude: latitude,
        longitude: longitude,
        bearing: bearing,
        provider: provider,
        speed: speed,
        accuracy: accuracy,
        altitude: altitude,
      },
    };
    if (user) {
      const uuidString = uuid();
      let po;
      if (req.file) {
        const bucketName = "posts";
        const objectName = `${Date.now()}_${uuidString}_${
          req.file.originalname
        }`;

        await User.findOneAndUpdate(
          { _id: user?._id },
          { $pull: { photos: { type: "dp" } } },
          { new: true }
        );

        await sharp(req.file.buffer)
          .jpeg({ quality: 50 })
          .toBuffer()
          .then(async (data) => {
            await minioClient.putObject(bucketName, objectName, data);
          })
          .catch((err) => {
            console.log(err.message, "-error");
          });

        po = { content: objectName, type: "dp" };
      }
      await User.updateOne(
        { _id: user?._id },
        {
          $set: {
            fullname: fullname,
            phone: phone,
            email: email,
            address: address,
          },
          $push: {
            photos: po,
          },
        }
      );
      res.status(200).json({ success: true });
    } else {
      res.status(404).json({ message: "User not found", success: false });
    }
  } catch (e) {
    console.log(e);
    res
      .status(400)
      .json({ message: "Something went wrong...", success: false });
  }
};

//take user account no.
exports.takebank = async (req, res) => {
  try {
    const { id } = req.params;
    const { accno, ifsc } = req.body;
    const user = await User.findById(id);
    if (user) {
      let bank = {
        accno: accno,
        ifsccode: ifsc,
      };
      await User.updateOne({ _id: user?._id }, { $set: { bank: bank } });
      res.status(200).json({ success: true });
    } else {
      res.status(404).json({ message: "User not found", success: false });
    }
  } catch (e) {
    console.log(e);
    res
      .status(400)
      .json({ message: "Something went wrong...", success: false });
  }
};

//report errors
exports.reporterror = async (req, res) => {
  try {
    const { id } = req.params;
    const { text } = req.body;
    const user = await User.findById(id);
    let rid = generateRandomId();
    let report = {
      text: text,
      timing: Date.now().toString(),
      id: rid,
    };
    if (user) {
      await User.updateOne(
        { _id: user?._id },
        {
          $push: { reports: report },
        }
      );
      res.status(200).json({ success: true });
    } else {
      res.status(404).json({ message: "User not found", success: false });
    }
  } catch (e) {
    console.log(e);
    res
      .status(400)
      .json({ message: "Something went wrong...", success: false });
  }
};

//for admin - resolve reported error - incomplete
exports.resolvereport = async (req, res) => {
  try {
    const { id, reportid } = req.params;

    const user = await User.findById(id);

    if (user) {
      await User.updateOne(
        { _id: user?._id, "reports.id": reportid },
        { $set: { "reports.$.status": "completed" } }
      );

      res.status(200).json({ success: true });
    } else {
      res.status(404).json({ message: "User not found", success: false });
    }
  } catch (e) {
    console.log(e);
    res
      .status(400)
      .json({ message: "Something went wrong...", success: false });
  }
};

//take feedback
exports.takefeedback = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, text } = req.body;
    const user = await User.findById(id);

    if (user) {
      const feedback = new Feedback({
        title: title,
        text: text,
        id: user?._id,
      });
      await feedback.save();
      res.status(200).json({ success: true });
    } else {
      res.status(404).json({ message: "User not found", success: false });
    }
  } catch (e) {
    console.log(e);
    res
      .status(400)
      .json({ message: "Something went wrong...", success: false });
  }
};

//get wallet
exports.getwallet = async (req, res) => {
  try {
    const { id } = req.params;
    const user = await User.findById(id);
    if (user) {
      res.status(200).json({
        totalearnings: user.totalearnings,
        earnings: user.earnings,
        currentbalance: user?.currentbalance,
        success: true,
      });
    } else {
      res.status(404).json({ message: "User not found", success: false });
    }
  } catch (e) {
    console.log(e);
    res
      .status(400)
      .json({ message: "Something went wrong...", success: false });
  }
};

//starting a delivery
exports.startdelivery = async (req, res) => {};

//get achievments

//for admin - create achivements

//start delivery and checking if amount is gretar than 3000,delievring to the greatest ordercount store of that area, money divison during delivery per km btw driver and affiliate
