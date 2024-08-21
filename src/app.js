const express = require("express");
const app = express();
const createError = require("http-errors");
const path = require("path");
const logger = require("morgan");

/**
----------------------SET UP THE VIEW ENGINE------------------------
*/
app.set("views", paths.join(__dirname, "views"));
app.set("view engine", "ejs");

/**
----------------------USE MIDDLEWARE FUNCTIONS------------------------
*/
app.use(express.json()); // sets `Content-type `to `text/plain`it Acept header doesn't contain `applicaiton/json`
app.use(express.static(path.join(__dirname, "public"))); // sets the directory from which static files will be served

// error handler
app.use(function (err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get("env") === "development" ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render("error");
});
