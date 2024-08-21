require("dotenv").config();
const express = require("express");
const app = express();
const path = require("path");
const expressLayouts = require("express-ejs-layouts");
const indexRouter = require("./routes/indexRouter");
const messagesRouter = require("./routes/messagesRouter");
const debug = require("debug")("mini-:members-only:server");
const http = require("http");
const expressSession = require("express-session");
const pgSession = require("connect-pg-simple")(expressSession);
const pgPool = require("./db/index");

/**
 * Get port from environment and store in Express.
 */

const port = process.env.PORT || "3000";
app.set("port", port);

/**
 * Create HTTP server.
 */

const server = http.createServer(app);

/**
 * Listen on provided port, on all network interfaces.
 */

server.listen(port, () => {
  debug("Listening on " + port);
});

/**
----------------------SET UP THE VIEW ENGINE------------------------
*/
app.set("views", path.join(__dirname, "views"));
app.set("view engine", "ejs");
app.use(expressLayouts);

/**
----------------------USE MIDDLEWARE FUNCTIONS------------------------
*/
app.use(express.json()); // sets `Content-type `to `text/plain`it Acept header doesn't contain `applicaiton/json`
app.use(express.static(path.join(__dirname, "public"))); // sets the directory from which static files will be served

/**
----------------------USE MIDDLEWARE FUNCTIONS------------------------
*/

// Set up the express-session middleware to store user sessions
app.use(
  expressSession({
    store: new pgSession({
      pool: pgPool, // connection pool to PostgreSQL db
      tableName: "user_sessions",
    }),
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: true,
    cookie: { maxAge: 10 * 24 * 60 * 60 * 1000 },
  }),
);

/**
----------------------ROUTES------------------------
*/
app.use("/", indexRouter);
app.use("/messages", messagesRouter);

// error handler
app.use(function (err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get("env") === "development" ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render("error");
});

module.exports = app;
