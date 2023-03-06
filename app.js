const express = require("express");
const { Appointment } = require("./models");
const flash = require("connect-flash");
const session = require("express-session");
const csrf = require("tiny-csrf");
const cookieParser = require("cookie-parser");
const { Op } = require("sequelize");
const { btoa, atob } = require("./utils/index.js");

const app = express();
app.use(express.urlencoded({ extended: false }));
app.use(express.json());
app.use(
  session({
    secret: "SuperSecrectInformation",
    cookie: {
      maxAge: 24 * 60 * 60 * 1000,
    },
    resave: false,
    saveUninitialized: true,
  })
);
app.use(flash());
app.use(cookieParser("Some secret info"));
app.use(csrf("UicgFjabMtvsSJEHUSfK3Dz0NR6K0pIm", ["DELETE", "PUT", "POST"]));
app.use(function (request, response, next) {
  response.locals.messages = request.flash();
  next();
});
app.set("view engine", "ejs");

app.get("/", async (req, res) => {
  const appointments = await Appointment.findAll({
    where: {
      start_time: {
        [Op.gte]: new Date(),
      },
    },
    order: [["start_time", "ASC"]],
  });
  if (req.accepts("html")) {
    res.render("index", {
      pageTitle: "Appointment | Home",
      appointments: appointments,
      csrfToken: req.csrfToken(),
      start_time: null,
      end_time: null,
      appointmentDate: null,
      title: null,
      description: null,
      checkOverlap: true,
    });
  } else {
    res.status(200).json({
      appointments,
      csrfToken: req.csrfToken(),
    });
  }
});

app.post("/appointment", async (req, res) => {
  var {
    title,
    description,
    start_time,
    end_time,
    appointmentDate,
    checkOverlap,
  } = req.body;
  const today = new Date();
  start_time = new Date(appointmentDate + " " + start_time);
  end_time = new Date(appointmentDate + " " + end_time);
  if (start_time == "Invalid Date" || end_time == "Invalid Date") {
    req.flash("error", "Please enter valid date and time");
    return res.redirect("/");
  }
  const overlappingAppointments = await Appointment.findAll({
    where: {
      [Op.and]: [
        {
          [Op.or]: [
            {
              start_time: {
                [Op.between]: [start_time, end_time],
              },
            },
            {
              end_time: {
                [Op.between]: [start_time, end_time],
              },
            },
            {
              start_time: {
                [Op.lte]: start_time,
              },
              end_time: {
                [Op.gte]: end_time,
              },
            },
          ],
        },
        {
          start_time: {
            [Op.gte]: new Date(),
          },
        },
      ],
    },
  });
  if (overlappingAppointments.length > 0 && checkOverlap == "true") {
    req.flash(
      "error",
      "👇 Overlapping Assingnments. Sure you want to delete these?"
    );
    var ids = {};
    ids["ids"] = overlappingAppointments.map((appointment) => appointment.id);
    ids["title"] = req.body.title;
    ids["description"] = req.body.description;
    ids["start_time"] = req.body.start_time;
    ids["end_time"] = req.body.end_time;
    ids["appointmentDate"] = req.body.appointmentDate;
    ids["checkOverlap"] = false;
    const encodedids = btoa(JSON.stringify(ids));
    res.redirect(`/overlap?ids=${encodedids}`);
  } else if (start_time > today && end_time > today && start_time < end_time) {
    // First delete all overlapping appointments
    console.log("Deleting overlapping appointments");
    if (overlappingAppointments.length > 0) {
      overlappingAppointments.forEach(async (appointment) => {
        await Appointment.destroy({ where: { id: appointment.id } });
      });
    }
    console.log("Creating appointment");
    await Appointment.create({ title, description, start_time, end_time });
    res.redirect("/");
  } else {
    console.log("Invalid start and end time");
    req.flash("error", "💡 Please enter valid start and end time");
    res.redirect("/");
  }
});

app.delete("/appointment/:id", async (req, res) => {
  const { id } = req.params;
  await Appointment.destroy({ where: { id } });
  res.status(200).send("success");
});

app.get("/appointment/:id", async (req, res) => {
  const { id } = req.params;
  let appointment = await Appointment.findOne({ where: { id } });
  res.render("edit", {
    pageTitle: "Appointment | Edit",
    appointment: appointment,
    csrfToken: req.csrfToken(),
  });
});

app.put("/appointment/:id", async (req, res) => {
  const { id } = req.params;
  const { title, description } = req.body;
  await Appointment.update({ title, description }, { where: { id } });
  res.status(200).send("success");
});

app.get("/overlap", async (req, res) => {
  var ids = req.query.ids;
  var decodedids = JSON.parse(atob(ids));
  const appointments = await Appointment.findAll({
    where: {
      id: {
        [Op.in]: decodedids["ids"],
      },
    },
    order: [["start_time", "ASC"]],
  });
  res.render("index", {
    pageTitle: "Appointment | Home",
    appointments: appointments,
    csrfToken: req.csrfToken(),
    start_time: decodedids.start_time,
    end_time: decodedids.end_time,
    appointmentDate: decodedids.appointmentDate,
    title: decodedids.title,
    description: decodedids.description,
    checkOverlap: decodedids.checkOverlap,
  });
});

module.exports = app;
