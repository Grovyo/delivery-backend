const User = require("../models/deluser");
const MainUser = require("../models/userAuth");
const Minio = require("minio");
const uuid = require("uuid").v4;
const sharp = require("sharp");
const Locations = require("../models/locations");
const Delivery = require("../models/deliveries");
const Earn = require("../models/earnings");
const Order = require("../models/orders");
const natural = require("natural");
const serviceKey = require("../grovyo-e3603-firebase-adminsdk-3jqvt-b10eb47254.json");
const admin = require("firebase-admin");
const {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
} = require("@aws-sdk/client-s3");
const Stock = require("../models/stock");
const geolib = require("geolib");
const { default: axios } = require("axios");

require("dotenv").config();

const BUCKET_NAME = process.env.BUCKET_NAME;
const apiKey = process.env.GEOCODE;

const s3 = new S3Client({
  region: process.env.BUCKET_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY,
    secretAccessKey: process.env.AWS_SECRET_KEY,
  },
});

function sumArray(arr) {
  let total = 0;
  for (let i = 0; i < arr.length; i++) {
    total += arr[i];
  }
  return total;
}

function calculateTotalDistance(coordinates) {
  let totalDistance = 0;

  for (let i = 1; i < coordinates.length; i++) {
    const coord1 = coordinates[i - 1];
    const coord2 = coordinates[i];
    totalDistance += geolib.getDistance(coord1, coord2);
  }

  return totalDistance / 1000;
}

//minio client configuration
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

//firebase initialization for notfication
admin.initializeApp({
  credential: admin.credential.cert(serviceKey),
  databaseURL: "https://grovyo-89dc2.firebaseio.com",
});

//function to generate random id
function generateRandomId() {
  const min = 100000000;
  const max = 999999999;

  const randomId = Math.floor(Math.random() * (max - min + 1)) + min;

  return randomId.toString();
}

//string matching function
function findBestMatch(inputString, stringArray) {
  let bestMatch = null;
  let bestScore = -1;

  stringArray.forEach((str) => {
    const distance = natural.LevenshteinDistance(inputString, str);
    const similarity = 1 - distance / Math.max(inputString.length, str.length);

    if (similarity > bestScore) {
      bestScore = similarity;
      bestMatch = str;
    }
  });

  return { bestMatch, bestScore };
}

//signup or login user
exports.usercheck = async (req, res) => {
  const { phone } = req.body;
  try {
    const user = await User.findOne({ phone: phone });
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

      res
        .status(200)
        .json({ user, dp: dp[0], success: true, userexists: true });
    }
  } catch (e) {
    res.status(404).json({
      message: "Something went wrong...",
      success: false,
      userexists: false,
    });
  }
};

//user signup
exports.usersignup = async (req, res) => {
  const {
    phone,
    fullname,
    adharnumber,
    liscenenumber,
    email,
    streetaddress,
    state,
    city,
    country,
    landmark,
    pincode,
    accounttype,
    vehicletype,
    time,
    type,
    deviceinfo,
    location,
    notificationtoken,
    referalid,
    latitude,
    longitude,
    altitude,
    provider,
    accuracy,
    bearing,
  } = req.body;

  try {
    if (phone) {
      const photos = [];
      //saving photo
      for (let i = 0; i < req?.files?.length; i++) {
        const uuidString = uuid();

        const objectName = `${Date.now()}_${uuidString}_${
          req.files[i].originalname
        }`;

        const result = await s3.send(
          new PutObjectCommand({
            Bucket: BUCKET_NAME,
            Key: objectName,
            Body: req.files[i].buffer,
            ContentType: req.files[i].mimetype,
          })
        );

        const type = req.files[i].fieldname.toLowerCase();

        photos.push({
          content: objectName,
          type: type,
        });
      }

      let latitude;
      let longitude;

      let add = streetaddress + city + pincode + state;

      const endpoint = "https://maps.googleapis.com/maps/api/geocode/json";
      const params = {
        address: add,
        key: apiKey,
      };

      const response = await axios.get(endpoint, { params });
      const data = response.data;
      if (data.status === "OK") {
        const location = data.results[0].geometry.location;
        latitude = location.lat;
        longitude = location.lng;
      }

      console.log("lat", latitude, longitude);
      //current location
      const culoc = {
        latitude: latitude ? latitude : 0,
        longitude: longitude ? longitude : 0,
      };

      //address
      const address = {
        streetaddress: streetaddress,
        state: state,
        city: city,
        landmark: landmark,
        pincode: pincode,
        country: country,
        coordinates: {
          latitude: latitude ? latitude : 0,
          longitude: longitude ? longitude : 0,
          // altitude: altitude ? altitude : 0,
          // provider: provider ? provider : 0,
          // accuracy: accuracy ? accuracy : 0,
          // bearing: bearing ? bearing : 0,
        },
      };

      //activity
      const activity = {
        time: time,
        type: type,
        deviceinfo: deviceinfo,
        location: location,
      };
      //generating a random refid
      const refid = generateRandomId();
      if (accounttype === "affiliate") {
        const user = new User({
          fullname: fullname,
          adharnumber: adharnumber,
          phone: phone,
          accstatus: "review",
          email: email,
          accounttype: accounttype,
          vehicletype: vehicletype,
          liscenenumber: liscenenumber,
          notificationtoken: notificationtoken,
          address: address,
          referalid: refid,
          activity: activity,
          photos: photos,
          currentlocation: culoc,
          primaryloc: city,
        });

        await user.save();

        let data = {
          fullname,
          email,
          address,
          refid,
          id: user._id,
          accounttype,
          isverified: user.isverified,
          state,
          city,
          pin: pincode,
        };
        res.status(200).json({ data, success: true, userexists: true });
      } else {
        // if (referalid) {
        const checkuser = await User.findOne({ referalid: referalid });
        // if (checkuser && checkuser.accstatus !== "blocked") {
        const user = new User({
          fullname: fullname,
          adharnumber: adharnumber,
          phone: phone,
          accstatus: "review",
          email: email,
          accounttype: accounttype,
          vehicletype: vehicletype,
          liscenenumber: liscenenumber,
          notificationtoken: notificationtoken,
          address: address,
          referalid: refid,
          activity: activity,
          photos: photos,
          currentlocation: culoc,
          primaryloc: city,
          // attachedid: referalid,
        });

        await user.save();
        const partnerid = {
          id: user?._id,
        };
        await User.updateOne(
          { _id: checkuser?._id },
          {
            $push: {
              deliverypartners: partnerid,
            },
          }
        );
        let data = {
          fullname,
          email,
          address,
          referalid: user.referalid,
          id: user._id,
          accounttype,
          isverified: user.isverified,
          state,
          city,
          pin: pincode,
        };
        res.status(200).json({ data, success: true, userexists: true });
        // } else {
        //   console.log("invalid refid");
        //   res.status(404).json({
        //     message: "Invalid referal id",
        //     success: false,
        //     userexists: false,
        //   });
        // }
        // } else {
        //   res.status(403).json({
        //     message: "Must use referal id",
        //     success: false,
        //     userexists: false,
        //   });
        // }
      }
    } else {
      res.status(403).json({
        message: "Something went wrong...",
        success: false,
        userexists: false,
      });
    }
  } catch (e) {
    console.log(e);
    res.status(400).json({
      message: "Something went wrong...",
      success: false,
      userexists: false,
    });
  }
};

//getinitaldata
exports.getinitaldata = async (req, res) => {
  try {
    const { id } = req.params;
    const user = await User.findById(id);
    if (!user) {
      res.status(404).json({ message: "User not found", success: false });
    } else {
      let dp;
      for (let i = 0; i < user.photos?.length; i++) {
        if (user?.photos[i].type === "dp") {
          const d = process.env.URL + user.photos[i].content.toString();
          dp = d;
        }
      }

      res.status(200).json({
        status: user.accstatus,
        accounttype: user.accounttype,
        success: true,
        data: {
          fullname: user.fullname,
          phone: user.phone,
          email: user.email,
          id: user._id,
          refid: user.referalid,
          dp: dp,
          activestatus: user.activestatus,
        },
      });
    }
  } catch (e) {
    console.log(e);
    res.status(400).json({ message: "Something went wrong", success: false });
  }
};

//update user
exports.updateuser = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      name,
      phone,
      email,
      streetaddress,
      state,
      city,
      pin,
      country,
      latitude,
      longitude,
      altitude,
      provider,
      accuracy,
      bearing,
    } = req.body;

    const user = await User.findById(id);
    if (!user) {
      res.status(404).json({ message: "User not found", success: false });
    } else {
      let photos = [];
      //saving photo
      for (let i = 0; i < req?.files?.length; i++) {
        const uuidString = uuid();
        const bucketName = "documents";
        const objectName = `${Date.now()}_${uuidString}_${
          req.files[i].originalname
        }`;

        await sharp(req.files[i].buffer)
          .jpeg({ quality: 50 })
          .toBuffer()
          .then(async (data) => {
            await minioClient.putObject(bucketName, objectName, data);
          })
          .catch((err) => {
            console.log(err.message, "-error");
          });

        const type = req.files[i].fieldname.toLowerCase();

        photos.push({
          content: objectName,
          type: type,
        });
      }

      //current location
      const culoc = {
        latitude: latitude ? latitude : 0,
        longitude: longitude ? longitude : 0,
      };

      //address
      const address = {
        streetaddress: streetaddress,
        state: state,
        city: city,
        pincode: pin,
        country: country,
        coordinates: {
          latitude: latitude ? latitude : 0,
          longitude: longitude ? longitude : 0,
          altitude: altitude ? altitude : 0,
          provider: provider ? provider : 0,
          accuracy: accuracy ? accuracy : 0,
          bearing: bearing ? bearing : 0,
        },
      };

      //activity
      const activity = {
        time: Date.now(),
        type: "update",
        // deviceinfo: deviceinfo,
        // location: location,
      };

      //udpate user dp
      await User.updateOne(
        {
          _id: user._id,
          "photos.type": "dp",
        },
        {
          $set: {
            "photos.$.content": photos[0].content,
          },
        }
      );

      //udpate other details
      await User.updateOne(
        { _id: user._id },
        {
          $set: {
            fullname: name,
            phone: phone,
            email: email,
            address: address,
            currentlocation: culoc,
          },
          $push: {
            activity: activity,
          },
        }
      );
      let dp = [];
      for (let i = 0; i < user.photos?.length; i++) {
        if (user?.photos[i].type === "dp") {
          const d = await generatePresignedUrl(
            "documents",
            user.photos[i].content.toString(),
            60 * 60
          );
          dp.push(d);
        }
      }

      res.status(200).json({ success: true, dp: dp[0], address: user.address });
    }
  } catch (e) {
    console.log(e);
    res.status(400).json({ message: "Something went wrong", success: false });
  }
};

//user logout
exports.userlogout = async (req, res) => {
  const { id } = req.params;
  const { time, type, deviceinfo, location } = req.body;
  try {
    const user = await User.findById(id);
    if (!user) {
      res.status(404).json({ success: false, message: "User not found" });
    } else {
      const activity = {
        time: time,
        type: type,
        deviceinfo: deviceinfo,
        location: location,
      };
      await User.updateOne(
        { _id: id },
        {
          $push: { activity: activity },
        }
      );
      res.status(200).json({ success: true });
    }
  } catch (e) {
    res.status(400).json({ message: "Something went wrong", success: false });
  }
};

//approving a store
exports.approvestore = async (req, res) => {
  const { id } = req.params;
  try {
    const user = await User.findById(id);

    if (!user) {
      return res
        .status(404)
        .json({ message: "User not found", success: false });
    }

    // Getting and saving location of store
    const locs = await Locations.find();
    let result;

    for (let i = 0; i < locs.length; i++) {
      const titleArray = Array.isArray(locs[i]?.title)
        ? locs[i]?.title
        : [locs[i]?.title];
      result = findBestMatch(
        user?.address.city.toLowerCase().trim() ||
          user?.addresscity.toLowerCase(),
        titleArray
      );
    }

    const savableloc = {
      name: user?.fullname,
      storeid: user._id,
      address: {
        streetaddress: user?.address?.streetaddress,
        state: user?.address?.state,
        city: user?.address?.city,
        landmark: user?.address?.landmark,
        pincode: user?.address?.pincode,
        coordinates: {
          latitude: user?.address?.coordinates.latitude,
          longitude: user?.address?.coordinates.longitude,
          altitude: user?.address?.coordinates.altitude,
          provider: user?.address?.coordinates.provider,
          accuracy: user?.address?.coordinates.accuracy,
          bearing: user?.address?.coordinates.bearing,
        },
      },
    };

    if (result?.bestMatch) {
      const bestloc = await Locations.findOne({
        title: result?.bestMatch?.toLowerCase().toString(),
      });

      if (
        bestloc?.stores.some(
          (store) => store.storeid.toString() === user?._id.toString()
        )
      ) {
        return res
          .status(200)
          .json({ message: "Store already exists", success: true });
      }

      await Locations.updateOne(
        { _id: bestloc._id },
        {
          $push: {
            stores: savableloc,
          },
        }
      );
    } else {
      const createloc = new Locations({
        title: user?.address.city?.toLowerCase().trim(),
      });
      await createloc.save();
      await Locations.updateOne(
        { _id: createloc._id },
        {
          $push: {
            stores: savableloc,
          },
        }
      );
    }

    await User.updateOne(
      { _id: user._id },
      {
        $set: {
          accstatus: "approved",
        },
      }
    );

    return res.status(200).json({ success: true });
  } catch (e) {
    console.error(e);
    return res
      .status(500)
      .json({ message: "Something went wrong", success: false });
  }
};

//approve id of delivery partner
exports.approveid = async (req, res) => {
  try {
    const { id } = req.params;
    const user = await User.findById(id);
    if (!user) {
      res.status(404).json({ message: "User not found", success: false });
    } else {
      await User.updateOne(
        { _id: user._id },
        {
          $set: { accstatus: "active" },
        }
      );
      //sending notification
      const message = {
        notification: {
          title: `Hi, ${user.fullname}`,
          body: "Your account has been approved!",
        },
        data: {
          screen: "Navbar",
        },
        token: user?.notificationtoken,
      };
      await admin
        .messaging()
        .send(message)
        .then((response) => {
          console.log("Successfully sent message");
        })
        .catch((error) => {
          console.log("Error sending message:", error);
        });
      res.status(200).json({ success: true });
    }
  } catch (e) {
    console.log(e);
    res.status(400).json({ message: "Something went wrong", success: false });
  }
};

//change active status
exports.changeactive = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const user = await User.findById(id);
    if (!user) {
      res.status(404).json({ message: "User not found", success: false });
    } else {
      await User.updateOne(
        { _id: user._id },
        {
          $set: { activestatus: status },
        }
      );
      res.status(200).json({ success: true });
    }
  } catch (e) {
    console.log(e);
    res
      .status(400)
      .json({ message: "Something went wrong...", success: false });
  }
};

//current delivery status
exports.deliverystatus = async (req, res) => {
  try {
    const { id } = req.params;
    const del = await Delivery.findById(id);
    if (del) {
      res.status(200).json({
        success: true,
        data: del?.data,
        current: del?.current,
        mode: del.mode,
      });
    } else {
      res.status(404).json({ message: "Delivery not found", success: false });
    }
  } catch (e) {
    console.log(e);
    res
      .status(400)
      .json({ message: "Something went wrong...", success: false });
  }
};

//getting verification pic
exports.verifypic = async (req, res) => {
  try {
    const { id, dev, mark } = req.params;
    const user = await User.findById(id);
    const delivery = await Delivery.findById(dev);
    const order = await Order.findOne({ orderId: delivery?.orderId });

    if (user) {
      const uuidString = uuid();
      const objectName = `${Date.now()}_${uuidString}_${req.file.originalname}`;

      const result = await s3.send(
        new PutObjectCommand({
          Bucket: BUCKET_NAME,
          Key: objectName,
          Body: req.file.buffer,
          ContentType: req.file.mimetype,
        })
      );

      await Delivery.updateOne(
        { _id: dev },
        { $push: { verifypic: objectName }, $inc: { current: 1 } }
      );
      fall = true;
      await Delivery.updateOne(
        { _id: delivery?._id },
        { $set: { status: "Completed" } }
      );

      const earn = new Earn({
        title: user.fullname,
        id: user._id,
        amount: delivery.earning,
      });
      await earn.save();
      let earning = {
        timing: Date.now(),
        amount: delivery.earning,
        id: earn._id,
        mode: "Delivery",
      };
      //if order was supposed to be paid in cash mode

      let balance = {
        amount: order.total,
        time: Date.now(),
        delid: user._id,
        mode: "Delivery",
      };

      await User.updateOne(
        { _id: user._id },
        {
          $set: { currentdoing: null },
          $inc: {
            totalearnings: delivery.earning,
            totalbalance: order.total,
            deliverycount: 1,
          },
          $push: {
            balance: balance,
            earnings: earning,
            finisheddeliveries: delivery._id,
          },
        }
      );

      const date = new Date(Date.now());

      const formattedDate =
        date.toLocaleDateString("en-US", {
          weekday: "long",
          year: "numeric",
          month: "long",
          day: "numeric",
        }) +
        " at " +
        date.toLocaleTimeString("en-US", {
          hour: "numeric",
          minute: "numeric",
          hour12: true,
        });

      await Order.updateOne(
        { orderId: delivery?.orderId },
        {
          $set: {
            currentStatus: "completed",
            timing: formattedDate,
          },
        }
      );

      //marking as done and storing the pick
      let index = delivery.marks.findIndex(
        (item) => item._id.toString() === mark
      );

      if (index !== -1) {
        delivery.marks[index].done = true;
        delivery.marks[index].pic = objectName;

        await delivery.save();
      }

      //create a stock
      if (delivery.where === "affiliate") {
        const stock = new Stock({
          prevdriverid: user._id,
          data: delivery.data,
          when: Date.now(),
          currentholder: delivery.affid,
          price: order.total,
          qty: order.quantity,
          orderid: order.orderId,
          active: true,
        });

        await stock.save();

        //update store

        await User.updateOne(
          { _id: delivery.affid },
          {
            $push: { stock: stock._id },
            $pull: { pickup: delivery._id, deliveries: delivery._id },
          }
        );

        credeli({
          storeid: delivery.affid,
          total: order.total,
          stockid: stock._id,
          oid: order._id,
        });
      }
      if (delivery.from === "affiliate") {
        const stock = await Stock.findOne({ orderid: order.orderId });

        //update store
        await User.updateOne(
          { _id: delivery.affid },
          {
            $pull: {
              stock: stock._id,
              pickup: delivery._id,
              deliveries: delivery._id,
            },
            $set: { active: false },
          }
        );
      }
      res.status(200).json({ success: true, fall: fall });
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

const credeli = async ({ storeid, stockid, oid, total }) => {
  try {
    const order = await Order.findById(oid);

    const store = await User.findById(storeid);
    const user = await MainUser.findById(order.buyerId);
    const stock = await Stock.findById(stockid);

    let usualamount = 5;

    //finding the nearest delivery partner to the store
    let partners = [];

    const deliverypartners = await User.find({
      accounttype: "partner",
      primaryloc: store.primaryloc,
    });
    for (let deliverypartner of deliverypartners) {
      if (
        deliverypartner &&
        deliverypartner.accstatus !== "banned" &&
        deliverypartner.accstatus !== "review" &&
        deliverypartner.deliveries?.length < 21 &&
        deliverypartner.totalbalance < 3000
      ) {
        let driverloc = {
          latitude: deliverypartner.currentlocation?.latitude,
          longitude: deliverypartner.currentlocation?.longitude,
          id: deliverypartner?._id,
        };
        partners.push(driverloc);
      }
    }

    let storeaddress = {
      latitude: store.address.coordinates.longitude,
      longitude: store.address.coordinates.longitude,
    };
    let eligiblepartner = geolib.findNearest(storeaddress, partners);

    //assiging the delivery to partner

    if (eligiblepartner) {
      const driver = await User?.findById(eligiblepartner?.id);

      const finalcoordinates = [
        {
          latitude: eligiblepartner.latitude,
          longitude: eligiblepartner.longitude,
        },
        {
          latitude: user.address.coordinates.latitude,
          longitude: user.address.coordinates.longitude,
        },
        {
          latitude: store.address.coordinates.latitude,
          longitude: store.address.coordinates.longitude,
        },
      ];
      //total distance travelled
      const totalDistance = calculateTotalDistance(finalcoordinates);
      //earning of driver
      const earning = totalDistance * usualamount;

      //markings
      let marks = [
        {
          latitude: eligiblepartner.latitude,
          longitude: eligiblepartner.longitude,
          done: true,
        },
        {
          latitude: store.address.coordinates.latitude,
          longitude: store.address.coordinates.longitude,
          done: false,
          address: store?.address,
        },
        {
          latitude: user.address.coordinates.latitude,
          longitude: user.address.coordinates.longitude,
          done: false,
          address: user?.address,
        },
      ];

      const newDeliveries = new Delivery({
        title: user?.fullname,
        amount: total,
        orderId: order.orderId,
        pickupaddress: store.address,
        partner: driver?._id,
        droppingaddress: user?.address,
        phonenumber: user.phone,
        mode: order.paymentMode ? order?.paymentMode : "Cash",
        marks: marks,
        earning: earning > 150 ? 150 : earning,
        where: "customer",
        data: order.data,
        from: "affiliate",
      });
      await newDeliveries.save();

      //pushing delivery for driver
      await User.updateOne(
        { _id: driver._id },
        { $push: { deliveries: newDeliveries?._id } }
      );
      //store
      await User.updateOne(
        { _id: store._id },
        { $push: { deliveries: newDeliveries?._id, pickup: newDeliveries._id } }
      );

      //stock update
      await Stock.updateOne(
        { _id: stockid },
        { $set: { nextby: driver?._id } }
      );

      const msg = {
        notification: {
          title: "A new delivery has arrived.",
          body: `From ${user?.fullname} OrderId #${oid}`,
        },
        data: {},
        tokens: [
          driver?.notificationtoken,
          // user?.notificationtoken,
          // store?.notificationtoken, //person who selles this item
        ],
      };

      await admin
        .messaging()
        .sendEachForMulticast(msg)
        .then((response) => {
          console.log("Successfully sent message");
        })
        .catch((error) => {
          console.log("Error sending message:", error);
        });
      console.log("Booked Instant");
    } else {
      console.log("No drivers available at the moment!");
    }
  } catch (e) {
    console.log(e, "Cannot assign delivery");
  }
};
