const { body, validationResult } = require("express-validator");
const db = require("../db/queries");
const asyncHandler = require("express-async-handler");
const colNames = require("../util/colNames");
const passport = require("passport");
const bcryptjs = require("bcryptjs");
const Error = require("../util/error_handlers/customErrorHandler");

// handler for displaying the sign-up form to the user
exports.sign_up_get = (req, res, next) => {
  const user = res.locals.currentUser;

  if (user) return next(Error.alreadyLoggedIn());

  res.render("sign-up-form", {
    title: "Sign up",
    errors: undefined,
    username: undefined,
    first_name: undefined,
    last_name: undefined,
    password: undefined,
    currentUser: user,
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
        throw new Error("Passwords did not match");
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
        currentUser: res.locals.currentUser,
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
    res.redirect("/user/log-in");
  }),
];

// handler for displaying the log-in form to the user
exports.log_in_get = (req, res, next) => {
  const user = res.locals.currentUser;

  if (user) return next(Error.alreadyLoggedIn());

  res.render("log_in_form", {
    title: "Log in",
    errors: undefined,
    user: undefined,
    currentUser: user,
    username: undefined,
    password: undefined,
  });
};

// handler for validating and logging the user
exports.log_in_post = [
  body("username", "Invalid username").trim().notEmpty().escape(),
  body("password", "Invalid password").trim().notEmpty().escape(),

  async (req, res, next) => {
    const currentUser = res.locals.currentUser;
    const errors = validationResult(req);

    if (currentUser) return next(Error.alreadyLoggedIn());

    if (!errors.isEmpty()) {
      return res.render("log_in_form", {
        title: "Oops... Something went wrong!",
        username: req.body.username,
        errors: errors.array(),
        currentUser: user,
      });
    }

    passport.authenticate("local", (err, user, info) => {
      if (err) {
        // Handle unexpected errors
        return res.render("log_in_form", {
          title: "Oops... Something went wrong!",
          username: req.body.username,
          errors: [
            { msg: "An unexpected error occurred. Please try again later." },
          ],
          currentUser: currentUser,
        });
      }

      if (!user) {
        // Handle authentication errors
        return res.render("log_in_form", {
          title: "Oops... Something went wrong!",
          username: req.body.username,
          errors: [{ msg: info.message || "Authentication failed." }],
          currentUser: currentUser,
        });
      }

      req.logIn(user, (err) => {
        if (err) {
          // Handle login errors
          return res.render("log_in_form", {
            title: "Oops... Something went wrong!",
            username: req.body.username,
            errors: [
              { msg: "An unexpected error occurred. Please try again later." },
            ],
            currentUser: currentUser,
          });
        }

        res.redirect("/");
      });
    })(req, res, next);
  },
];

// handler for logging the user out
exports.log_out_get = (req, res, next) => {
  const user = res.locals.currentUser;

  if (!user) return next(Error.notLoggedIn());

  req.logout((err) => {
    if (err) return next(err);
    res.redirect("/");
  });
};

// handler for rendering the form for granting user privileges
exports.grant_privileges_get = (req, res, next) => {
  const user = res.locals.currentUser;

  if (!user) return next(Error.notLoggedIn());

  res.render("privileges_form", {
    title: "Gain privileges",
    currentUser: user,
    errors: undefined,
  });
};

// handler for granting privileges to the user
exports.grant_privileges_post = [
  body("member").trim().escape(),
  body("admin").trim().escape(),

  asyncHandler(async (req, res, next) => {
    const errors = validationResult(req);
    const user = res.locals.currentUser;
    const member_pass = req.body.member;
    const admin_pass = req.body.admin;

    if (!user) return next(Error.notLoggedIn());

    if (!errors.isEmpty()) {
      return res.render("privileges_form", {
        title: "Gain privileges",
        currentUser: user,
        errors: errors.array(),
      });
    }

    if (member_pass) {
      let secret_pass = await db.getSecretPassword(colNames.PASS_MEMBER);
      let match = await bcryptjs.compare(member_pass, secret_pass);

      if (!match) {
        return res.render("privileges_form", {
          title: "Become a member",
          currentUser: user,
          errors: [{ msg: "Wrong password" }],
        });
      }

      await db.grantPrivileges(user.id, colNames.IS_MEMBER);
      res.redirect("/user/grant-privileges");
    }

    if (admin_pass) {
      let secret_pass = await db.getSecretPassword(colNames.PASS_ADMIN);
      let match = await bcryptjs.compare(admin_pass, secret_pass);

      if (!match) {
        return res.render("privileges_form", {
          title: "Become an administrator",
          currentUser: user,
          errors: [{ msg: "Wrong password" }],
        });
      }

      await db.grantPrivileges(user.id, colNames.IS_ADMIN);
    }

    return res.redirect("/");
  }),
];

exports.renounce_privileges_get = (req, res, next) => {
  const user = res.locals.currentUser;

  if (!user) return next(Error.notLoggedIn());

  res.render("renounce_privileges_form", {
    title: "Renounce privileges",
    currentUser: user,
  });
};

exports.renounce_privileges_post = asyncHandler(async (req, res, next) => {
  const user = res.locals.currentUser;
  if (!user) return next(Error.notLoggedIn());

  const member_priv = req.body.member;
  const admin_priv = req.body.admin;

  if (!member_priv) {
    // if the user renounces membership privileges, remove admin privileges as well
    await db.removePrivileges(user.id, colNames.IS_MEMBER);
    await db.removePrivileges(user.id, colNames.IS_ADMIN);
  } else if (!admin_priv) {
    await db.removePrivileges(user.id, colNames.IS_ADMIN);
  }

  return res.redirect("/");
});
