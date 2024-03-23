const User = require("../models/deluser");
const Feedback = require("../models/feedback");
const Minio = require("minio");
const uuid = require("uuid").v4;
const sharp = require("sharp");
const Delivery = require("../models/deliveries");
const Earnings = require("../models/earnings");
const Achievement = require("../models/achievements");
const Appuser = require("../models/userAuth");
const Order = require("../models/orders");
const Conversation = require("../models/conversation");
const Message = require("../models/message");

const minioClient = new Minio.Client({
  endPoint: "minio.grovyo.xyz",

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
    const user = await User.findById(id).populate({
      path: "deliveries",
      select:
        "phonenumber pickupaddress droppingaddress amount orderId status title",
      options: {
        limit: 10,
        sort: { createdAt: -1 },
      },
    });
    const undels = await User.findById(id).populate({
      path: "deliveries",
      select: "status",
    });

    let undeliverd = 0;
    if (undels && undels.deliveries && Array.isArray(undels.deliveries)) {
      undels.deliveries.forEach((d) => {
        if (d.status && d.status.toLowerCase() === "not started") {
          undeliverd++;
        }
      });
    }

    if (!user) {
      res.status(404).json({ message: "User not found!", success: true });
    } else {
      if (user?.accounttype === "affiliate") {
        res.status(200).json({
          earnings: user.totalearnings,
          partner: user.deliverypartners.length,
          totalorder: user.deliverycount,
          achievements: user.achievements,
          success: true,
          orders: user.deliveries,
          type: "affiliate",
          pickup: user.pickup.length,
        });
      } else {
        res.status(200).json({
          earnings: user.totalearnings,
          totalorder: user.deliverycount, //total delievers whether completed or not
          achievements: user.achievements,
          success: true,
          deliveries: user.deliveries, //latest 10 deliveries
          cash: user.totalbalance,
          undelivered: undeliverd, //yet to be delivered
          type: "partner",
        });
      }
    }
  } catch (e) {
    console.log(e);
    res.status(404).json({
      message: "Something went wrong...",
      success: false,
    });
  }
};

//list of orders
exports.getallorders = async (req, res) => {
  const { id } = req.params;
  try {
    const user = await User.findById(id).populate({
      path: "deliveries",
      select:
        "phonenumber pickupaddress droppingaddress amount title orderId status",
      options: {
        sort: { createdAt: -1 },
      },
    });
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
    const { accno, ifsc, name } = req.body;
    const user = await User.findById(id);
    if (user) {
      let bank = {
        accno: accno,
        ifsccode: ifsc,
        name,
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

//starting a delivery
exports.startdelivery = async (req, res) => {
  try {
    const { id, delid } = req.params;

    const user = await User.findById(id).populate(
      "currentdoing",
      "title amount orderId status pickupaddress droppingaddress"
    );
    const delivery = await Delivery.findById(delid);

    if (user && delivery) {
      //if user is asking for current delivery details
      if (user?.currentdoing?._id.toString() === delid) {
        res.status(200).json({ success: true, data: user.currentdoing });
      } else {
        //starting a new delivery
        console.log(
          user.totalbalance < 3000,
          user.activestatus === "online",
          !user.currentdoing,
          delivery.status !== "cancelled" ||
            delivery?.status !== "Completed" ||
            delivery?.status !== "In progress"
        );
        if (
          user.totalbalance < 3000 &&
          user.activestatus === "online" &&
          !user.currentdoing &&
          (delivery.status !== "cancelled" ||
            delivery?.status !== "Completed" ||
            delivery?.status !== "In progress")
        ) {
          await Delivery.updateOne(
            { _id: delivery._id },
            { $set: { status: "In progress" } }
          );
          await User.updateOne(
            { _id: user._id },
            { $set: { currentdoing: delivery._id } }
          );
          res.status(200).json({ success: true });
        } else {
          res
            .status(203)
            .json({ success: false, message: "Unable to start the delivery" });
        }
      }
    } else {
      res.status(404).json({ message: "Not Found", success: false });
    }
  } catch (e) {
    console.log(e);
    res
      .status(400)
      .json({ message: "Something went wrong...", success: false });
  }
};

//end a delivery
exports.enddelivery = async (req, res) => {
  try {
    const { id, delid } = req.params;
    const { reason } = req.body;

    const user = await User.findById(id).populate(
      "currentdoing",
      "title amount orerId status pickupaddress droppingaddress"
    );
    const delivery = await Delivery.findById(delid);

    if (user && delivery) {
      //if user is asking for current delivery details
      if (user.currentdoing._id.toString() === delid) {
        await Delivery.updateOne(
          { _id: delivery._id },
          { $set: { status: "cancelled", reason: reason } }
        );
        await User.updateOne(
          { _id: user._id },
          { $set: { currentdoing: null } }
        );
        res.status(200).json({ success: true });
      } else {
        res.status(201).json({
          success: false,
          message: "Can't end delivery",
        });
      }
    } else {
      res.status(404).json({ message: "Not Found", success: false });
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
    const user = await User.findById(id).populate(
      "earnings.id",
      "title mode amount status createdAt"
    );
    if (!user) {
      res.status(404).json({ message: "User not found!", success: false });
    } else {
      res.status(200).json({
        earnings: user.earnings,
        totalearnings: user.totalearnings,
        success: true,
        earnings: user.earnings,
        currentbalance: user?.totalbalance,
        bank: user.bank,
      });
    }
  } catch (e) {
    console.log(e);
    res.status(400).json({ message: "Something went wrong", success: false });
  }
};

//get achievments
exports.getachievements = async (req, res) => {
  try {
    const { id } = req.params;
    const user = await User.findById(id).populate(
      "achievements",
      "title amount start end image"
    );
    if (!user) {
      res.status(404).json({ message: "User not found!", success: false });
    } else {
      res.status(200).json({
        achievements: user.achievements,
        completed: user.successedachievements,
        success: true,
      });
    }
  } catch (e) {
    console.log(e);
    res.status(400).json({ message: "Something went wrong", success: false });
  }
};

//for admin - create achivements
exports.createachiv = async (req, res) => {
  try {
    const { id } = req.params;
    const { data } = req.body;
    const user = await User.findById(id);
    if (user) {
      const achiv = new Achievement(data);
      await achiv.save();
      res.status(200).json({ success: true });
    } else {
      res.status(404).json({ message: "User not found", success: false });
    }
  } catch (e) {
    console.log(e);
    res.status(400).json({ message: "Something went wrong", success: false });
  }
};

//updating notification token of user
exports.updatenotification = async (req, res) => {
  try {
    const { userId } = req.params;
    const { token } = req.body;
    const user = await User.findById(userId);
    if (user) {
      await User.updateOne(
        { _id: user._id },
        {
          $set: { notificationtoken: token },
        }
      );
      res.status(200).json({ success: true });
    } else {
      res.status(404).json({ message: "User not found", success: false });
    }
  } catch (e) {
    res.status(400).json({ message: e.message, success: false });
  }
};

//start delivery - delievring to the greatest ordercount store of that area, money divison during delivery per km btw driver and affiliate
