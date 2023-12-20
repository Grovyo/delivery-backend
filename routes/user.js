const express = require("express");
const router = express.Router();
const multer = require("multer");
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

const {
  usercheck,
  usersignup,
  userlogout,
  approvestore,
} = require("../controllers/user");

//signup or login user check
router.post("/usercheck", usercheck);

//signup user
router.post("/usersignup", upload.any(), usersignup);

//approve a store
router.post("/approvestore/:id", approvestore);

//logout user
router.post("/userlogout/:id", userlogout);

module.exports = router;
