require("dotenv").config();
const express = require("express");
const app = express();
const path = require("path");
const userRouter = require("./routes/userRouter");
const http = require("http");
const createError = require("http-errors");

const expressLayouts = require("express-ejs-layouts");
const indexRouter = require("./routes/indexRouter");
const messagesRouter = require("./routes/messagesRouter");

const expressSession = require("express-session");
const pgSession = require("connect-pg-simple")(expressSession);
const pgPool = require("./db/index");
const passport = require("passport");
const LocalStrategy = require("passport-local");
const bcryptjs = require("bcryptjs");
const db = require("./db/queries");
const colNames = require("./util/colNames");

/**
----------------------SET UP EXPRESS-SESSION MIDDLEWARE------------------------
*/

// Set up the express-session middleware to store user sessions
app.use(
  expressSession({
    store: new pgSession({
      pool: pgPool,
      tableName: "user_sessions",
    }),
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: { maxAge: 30 * 24 * 60 * 60 * 1000 }, // 30 days
  }),
);

/**
----------------------SET UP THE VIEW ENGINE------------------------
*/
app.set("views", path.join(__dirname, "views"));
app.set("view engine", "ejs");
app.use(expressLayouts);
app.set("layout", "layout");

/**
----------------------USE MIDDLEWARE FUNCTIONS------------------------
*/
app.use(express.json()); // sets `Content-type `to `text/plain`it Acept header doesn't contain `applicaiton/json`
app.use(express.static(path.join(__dirname, "../public"))); // sets the directory from which static files will be served

app.use(passport.session());
app.use(express.urlencoded({ extended: false }));

passport.use(
  new LocalStrategy(async (username, password, done) => {
    try {
      const user = await db.getUserBy(colNames.USERNAME, username);

      if (!user) return done(null, false, { message: "Incorrect username" });

      const match = await bcryptjs.compare(password, user.password);

      if (!match) return done(null, false, { message: "Incorrect password" });

      return done(null, user);
    } catch (e) {
      return done(e);
    }
  }),
);

passport.serializeUser((user, done) => {
  done(null, user.id);
});

passport.deserializeUser(async (id, done) => {
  try {
    const user = await db.getUserBy(colNames.ID, id);
    done(null, user);
  } catch (e) {
    done(err);
  }
});

app.use((req, res, next) => {
  res.locals.currentUser = req.user;
  next();
});

/**
----------------------ROUTES------------------------
*/
app.use("/", indexRouter);
app.use("/messages", messagesRouter);
app.use("/user", userRouter);

// app.use((req, res, next) => {
//   next(createError(404));
// });

// error handler
app.use(function (err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get("env") === "development" ? err : {};

  // render the error page
  res.status(err.status || 500);
  console.log(err);
  res.render("error", { title: "Something went wrong", error: err });
});

/**
 * Create HTTP server.
 */

const server = http.createServer(app);

/**
 * Get port from environment and store in Express.
 */

const port = process.env.PORT || "3000";
app.set("port", port);

/**
 * Listen on provided port, on all network interfaces.
 */

server.listen(port);
