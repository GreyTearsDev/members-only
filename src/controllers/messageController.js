const { body, validationResult } = require("express-validator");
const db = require("../db/queries");
const asyncHandler = require("express-async-handler");
const Error = require("../util/error_handlers/customErrorHandler");

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
    const user = res.locals.currentUser;
    if (!user) return next(Error.alreadyLoggedIn);

    const errors = validationResult(req);
    const rantTitle = req.body.title;
    const rantContent = req.body.message;

    if (!errors.isEmpty()) {
      const messages = await db.getAllMessages();

      return res.render("messages", {
        title: "Messages",
        currentUser: user,
        messages: messages,
        rantTitle: rantTitle,
        rantContent: rantContent,
        errors: errors.array(),
      });
    }

    await db.addNewMessage(rantTitle, rantContent, user.id);
    res.redirect("/");
  }),
];

exports.delete_message_post = asyncHandler(async (req, res, next) => {
  const user = res.locals.currentUser;

  if (!user) return next(Error.alreadyLoggedIn);
  if (!user.is_admin) return next(Error.actionNotAllowed);

  await db.deleteMessage(req.body.message_id);
  res.redirect("/");
});
