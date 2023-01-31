const createError = require("http-errors");
const express = require("express");
const path = require("path");
const cookieParser = require("cookie-parser");
const logger = require("morgan");
const expressLayouts = require("express-ejs-layouts");

// File Upload
const fileUpload = require("express-fileupload");

const db = require("./models/connection");

//initiating app
const app = express();

app.use(
  fileUpload({
    limits: { fileSize: 50 * 1024 * 1024 },
  })
);

//mongodb
db.connect((err) => {
  if (err) console.log("Database error");
  else console.log("Database Connected");
});

//cache control
app.use((req, res, next) => {
  res.set("Cache-Control", "no-store");
  next();
});

//require routes
const adminRouter = require("./routes/admin");
const usersRouter = require("./routes/users");

// view engine setup
app.use(expressLayouts);
app.set("views", path.join(__dirname, "views"));
app.set("view engine", "ejs");

app.use(logger("dev"));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, "public")));

//routes
// app.use("/" , (req,res)=>{
//   res.redirect("/homepage")
// })
app.use("/homepage", usersRouter);
app.use("/admin_panel", adminRouter);

// catch 404 and forward to error handler
app.use(function (req, res, next) {
  next(createError(404));
});

// error handler
app.use(function (err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get("env") === "development" ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.redirect("/homepage")
  // res.render("error", { user: false, issue: true });
});

module.exports = app;
