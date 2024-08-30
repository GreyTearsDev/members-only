const express = require("express");
const router = express.Router();
const messageController = require("../controllers/messageController");

router.get("/", messageController.display_all_messages_get);
router.post("/post", messageController.post_message_post);
router.post("/delete", messageController.delete_message_post);

module.exports = router;
