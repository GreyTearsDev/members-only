const express = require("express");
const router = express.Router();
const userController = require("../controllers/userController");

router.get("/sign-up", userController.sign_up_get);
router.post("/sign-up", userController.sign_up_post);
router.get("/log-in", userController.log_in_get);
router.post("/log-in", userController.log_in_post);
router.get("/log-out", userController.log_out_get);
router.get("/grant-privileges", userController.grant_privileges_get);
router.post("/grant-privileges", userController.grant_privileges_post);
router.get("/renounce-privileges", userController.renounce_privileges_get);
router.post("/renounce-privileges", userController.renounce_privileges_post);

module.exports = router;
