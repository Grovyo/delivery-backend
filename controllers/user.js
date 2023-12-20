const User = require("../models/deluser");
const Minio = require("minio");
const uuid = require("uuid").v4;
const sharp = require("sharp");
const Locations = require("../models/locations");
const natural = require("natural");

//minio client configuration
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
    username,
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

      //address
      const address = {
        streetaddress: streetaddress,
        state: state,
        city: city,
        landmark: landmark,
        pincode: pincode,
        country: country,
        coordinates: {
          latitude: latitude,
          longitude: longitude,
          altitude: altitude,
          provider: provider,
          accuracy: accuracy,
          bearing: bearing,
        },
      };

      //current location
      const culoc = {
        latitude: latitude,
        longitude: longitude,
      };

      //activity
      const activity = {
        time: time,
        type: type,
        deviceinfo: deviceinfo,
        location: location,
      };
      if (accounttype === "affiliate") {
        //generating a random refid
        const refid = generateRandomId();

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
          username: username,
          currentlocation: culoc,
        });

        await user.save();

        res.status(200).json({ user, success: true, userexists: true });
      } else {
        if (referalid) {
          const checkuser = await User.findOne({ referalid: referalid });
          if (checkuser && checkuser.accstatus !== "blocked") {
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
              referalid: referalid,
              activity: activity,
              photos: photos,
              username: username,
              currentlocation: culoc,
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

            res.status(200).json({ user, success: true, userexists: true });
          } else {
            res.status(404).json({
              message: "Invalid referal id",
              success: false,
              userexists: false,
            });
          }
        } else {
          res.status(403).json({
            message: "Must use referal id",
            success: false,
            userexists: false,
          });
        }
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
