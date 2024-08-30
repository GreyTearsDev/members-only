const { body, validationResult } = require("express-validator");
const db = require("../db/queries");
const asyncHandler = require("express-async-handler");

exports.display_all_messages_get = asyncHandler(async (req, res, next) => {
  const messages = await db.getAllMessages();

  return res.render("messages", {
    title: "Messages",
    currentUser: res.locals.currentUser,
    messages: messages,
    rantTitle: undefined,
    rantContent: undefined,
    errors: undefined,
  });
});

exports.post_message_post = [
  body("title", "Title can't be empty").trim().notEmpty().escape(),
  body("message", "You must rant about something").trim().notEmpty().escape(),

  asyncHandler(async (req, res, next) => {
    if (!res.locals.currentUser) {
      return res.render("error", {
        title: "Forbiden Route",
        code: "403",
        message: "You're not logged in",
      });
    }

    const errors = validationResult(req);
    const user = res.locals.currentUser;
    const rantTitle = req.body.title;
    const rantContent = req.body.message;

    if (!errors.isEmpty()) {
      const messages = await db.getAllMessages();

      return res.render("messages", {
        title: "Messages",
        currentUser: res.locals.currentUser,
        messages: messages,
        rantTitle: rantTitle,
        rantContent: rantContent,
        errors: errors.array(),
      });
    }

    db.addNewMessage(rantTitle, rantContent, user.id);
    res.redirect("/");
  }),
];

exports.delete_message_post = asyncHandler(async (req, res, next) => {
  const user = res.locals.currentUser;

  if (!user) {
    return res.render("error", {
      title: "Forbiden Route",
      code: "403",
      message: "You're not logged in",
    });
  }

  if (!user.is_admin) {
    return res.render("error", {
      title: "Forbiden Route",
      code: "403",
      message: "You're not allowed to perform this action",
    });
  }

  db.deleteMessage(req.body.message_id);
  res.redirect("/");
});
