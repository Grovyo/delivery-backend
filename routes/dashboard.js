const express = require("express");
const router = express.Router();
const multer = require("multer");
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

const {
  getdashboard,
  getallorders,
  changestatus,
  updateprofile,
  takebank,
  reporterror,
  takefeedback,
  scannedqr,
  enterotp,
  startdelivery,
  getachievements,
  createachiv,
  enddelivery,
  getwallet,
  updatenotification,
  markdone,
  getstock,
} = require("../controllers/dashboard");

//dashboard
router.get("/dashboard/:id", getdashboard);

//getallorders
router.get("/getallorders/:id", getallorders);

//changestatus
router.post("/changestatus/:id", changestatus);

//updateprofile
router.post("/updateprofile/:id", upload?.single("image"), updateprofile);

//take bank
router.post("/takebank/:id", takebank);

//report an error
router.post("/reporterror/:id", reporterror);

//take feedback
router.post("/takefeedback/:id", takefeedback);

//get wallet
router.get("/getwallet/:id", getwallet);

//start the delivery
router.post("/startdelivery/:id/:delid", startdelivery);

//end the delivery
router.post("/enddelivery/:id/:delid", enddelivery);

//get achievements
router.get("/getachievements/:id", getachievements);

//create achievements
router.get("/createachiv", createachiv);

//create achievements
router.get("/updatenotification/:id", updatenotification);

//marking delivery as done
router.post("/markdone", upload.single("image"), markdone);

//get stock
router.get("/getstock/:id", getstock);

module.exports = router;
