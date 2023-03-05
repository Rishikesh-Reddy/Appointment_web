const express = require('express');
const { Appointment } = require('./models');
const flash = require("connect-flash");
const session = require("express-session");
const csrf = require("tiny-csrf");
const cookieParser = require("cookie-parser");
const { Op } = require("sequelize");



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
app.set('view engine', 'ejs');


app.get('/', async (req, res) => {
    const appointments = await Appointment.findAll({
      where: {
        start_time: {
          [Op.gte]: new Date(new Date().getTime() + (330)*60000)
        }
      },
      order: [['start_time', 'ASC']]
    });
    if (req.accepts("html")){
      res.render('index', { title: 'Appointment | Home', appointments: appointments, csrfToken: req.csrfToken() });
    }
    else{
      res.status(200).json({
        appointments,
        csrfToken: req.csrfToken()
      });
    }
})

app.post('/appointment', async (req, res) => {
    var { title, description, start_time, end_time, appointmentDate } = req.body;
    const today = new Date()
    // console.log(req.body, new Date(appointmentDate), today)
    start_time = new Date(appointmentDate + ' ' + start_time);
    end_time = new Date(appointmentDate + ' ' + end_time);
    if ((start_time > today) && (end_time > today) && (start_time < end_time)) {
     await Appointment.create({ title, description, start_time, end_time });
    }
    else{
        req.flash('error', 'Select an appropriate time that is appropriate!!!')
    }
    res.redirect('/');
})

app.delete('/appointment/:id', async (req, res) => {
    const { id } = req.params;
    await Appointment.destroy({ where: { id } });
    res.status(200).send('success');
})

app.get('/appointment/:id', async (req, res) => {
    const { id } = req.params;
    let appointment = await Appointment.findOne({ where: { id }});
    res.render('edit', { title: 'Appointment | Edit', appointment: appointment, csrfToken: req.csrfToken() })
})

app.put('/appointment/:id', async (req, res) => {
    const { id } = req.params;
    const { title, description } = req.body;
    await Appointment.update({ title, description }, { where: { id } });
    res.status(200).send('success');
})

module.exports = app;