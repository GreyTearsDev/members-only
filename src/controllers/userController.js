const { body, validationResult } = require("express-validator");
const db = require("../db/queries");
const asyncHandler = require("express-async-handler");
const colNames = require("../util/colNames");
const passport = require("passport");

// handler for displaying the sign-up form to the user
exports.sign_up_get = (req, res, next) => {
  res.render("sign-up-form", {
    title: "Sign up",
    errors: undefined,
    username: undefined,
    first_name: undefined,
    last_name: undefined,
    password: undefined,
  });
};

// handler for validating and adding user to the datatbase
exports.sign_up_post = [
  body("username", "You must create a username").trim().notEmpty().escape(),
  body("first_name", "You must add a first name").trim().notEmpty().escape(),
  body("last_name", "You must add a last name").trim().notEmpty().escape(),
  body("password")
    .trim()
    .notEmpty()
    .withMessage("You must add a password")
    .isLength({ min: 3 })
    .withMessage("Passwords should be at least 3 characters long")
    .escape(),
  body("password_confirmation")
    .trim()
    .escape()
    .custom((value, { req }) => {
      if (value !== req.body.password) {
        throw new Error("Passwords do not match");
      }
      return true;
    }),
  asyncHandler(async (req, res, next) => {
    const errors = validationResult(req);
    const user = {
      username: req.body.username,
      first_name: req.body.first_name,
      last_name: req.body.last_name,
      password: req.body.password,
      //by default, new users are neither members nor admins
      is_admin: false,
      is_member: false,
    };

    if (!errors.isEmpty()) {
      res.render("sign-up-form", {
        title: "Sign up",
        errors: errors.array(),
        username: user.username,
        first_name: user.first_name,
        last_name: user.last_name,
        password: user.password,
      });
      return;
    }

    // Check if a user with the same username already exists
    const existingUser = await db.getUserBy(colNames.USERNAME, user.username);

    if (existingUser) {
      const errMessage = `Username '${user.username}' is already taken. Try another one.`;
      res.render("sign-up-form", {
        title: "Sign up",
        errors: [{ msg: errMessage }],
        user: user,
      });
      return;
    }

    await db.insertUser(user);
    res.redirect("/");
  }),
];

// handler for displaying the log-in form to the user
exports.log_in_get = (req, res, next) => {
  res.render("log_in_form", {
    title: "Log in",
    errors: undefined,
    user: undefined,
    username: undefined,
    password: undefined,
  });
};

// handler for validating and logging the user
exports.log_in_post = [
  body("username", "Invalid username").trim().notEmpty().escape(),
  body("password", "Invalid password").trim().notEmpty().escape(),

  (req, res, next) => {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
      res.render("log_in_form", {
        title: "Oops... Something went wrong!",
        username: req.body.username,
        errors: errors.array(),
      });
      return;
    }

    passport.authenticate("local", {
      successRedirect: "/",
      failureRedirect: "/user/log-in",
    })(req, res, next);
  },
];

// handler for validating and logging the user out
exports.log_out_get = (req, res, next) => {
  req.logout((err) => {
    if (err) return next(err);
    res.redirect("/");
  });
};
