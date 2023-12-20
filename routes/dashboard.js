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
  getwallet,
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

module.exports = router;
