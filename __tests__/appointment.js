/* eslint-disable no-undef */
const request = require("supertest");
const cheerio = require("cheerio");
const db = require("../models/index");
const app = require("../app");

let server, agent;

function extractCSRFToken(res) {
  var $ = cheerio.load(res.text);
  return $("[name=_csrf]").val();
}

describe("Testing Functionalities of Appointment", () => {
  beforeAll(async () => {
    await db.sequelize.sync({ force: true });
    server = app.listen(3001, () => {});
    agent = request.agent(server);
  });

  afterAll(async () => {
    await server.close();
    await db.sequelize.close();
  });

  test("Testing adding the appointment", async () => {
    let res = await agent.get("/");
    const csrfToken = extractCSRFToken(res);
    res = await agent.post("/appointment").send({
      checkOverlap: false,
      _csrf: csrfToken,
      title: "Testing Appointment",
      description: "Testing Description",
      appointmentDate: new Date().toLocaleDateString(),
      start_time: new Date(
        new Date().setMinutes(new Date().getMinutes() + 30)
      ).toTimeString(),
      end_time: new Date(
        new Date().setMinutes(new Date().getMinutes() + 90)
      ).toTimeString(),
    });
    expect(res.statusCode).toEqual(302);
  });

  test("Testing deleting the appointment", async () => {
    let res = await agent.get("/");
    let csrfToken = extractCSRFToken(res);
    res = await agent.post("/appointment").send({
      checkOverlap: false,
      _csrf: csrfToken,
      title: "Testing Appointment 1",
      description: "Testing Description 1",
      appointmentDate: new Date().toLocaleDateString(),
      start_time: new Date(
        new Date().setMinutes(new Date().getMinutes() + 30)
      ).toTimeString(),
      end_time: new Date(
        new Date().setMinutes(new Date().getMinutes() + 90)
      ).toTimeString(),
    });
    expect(res.statusCode).toEqual(302);
    res = await agent.get("/").set("Accept", "application/json");
    firstAppointment = res.body.appointments[0];
    res = await agent.get("/");
    csrfToken = extractCSRFToken(res);
    res = await agent.delete(`/appointment/${firstAppointment.id}`).send({
      _csrf: csrfToken,
    });
    expect(res.statusCode).toEqual(200);
  });

  test("Testing Editing the appointment", async () => {
    let res = await agent.get("/");
    let csrfToken = extractCSRFToken(res);
    res = await agent.post("/appointment").send({
      checkOverlap: false,
      _csrf: csrfToken,
      title: "Testing Appointment 2",
      description: "Testing Description 2",
      appointmentDate: new Date().toLocaleDateString(),
      start_time: new Date(
        new Date().setMinutes(new Date().getMinutes() + 30)
      ).toTimeString(),
      end_time: new Date(
        new Date().setMinutes(new Date().getMinutes() + 90)
      ).toTimeString(),
    });
    expect(res.statusCode).toEqual(302);
    res = await agent.get("/").set("Accept", "application/json");
    firstAppointment = res.body.appointments[0];
    res = await agent.get("/");
    csrfToken = extractCSRFToken(res);
    res = await agent.put(`/appointment/${firstAppointment.id}`).send({
      _csrf: csrfToken,
      title: "Testing Appointment Changed 1",
      description: "Testing Description Changed 1",
    });
    expect(res.statusCode).toEqual(200);
  });

  test("Testing adding appointment with invalid date", async () => {
    let res = await agent.get("/");
    const csrfToken = extractCSRFToken(res);
    res = await agent.post("/appointment").send({
      checkOverlap: false,
      _csrf: csrfToken,
      title: "Testing Appointment",
      description: "Testing Description",
      appointmentDate: new Date(
        new Date().setDate(new Date().getDate() - 1)
      ).toLocaleDateString(),
      start_time: new Date(
        new Date().setMinutes(new Date().getMinutes() + 30)
      ).toTimeString(),
      end_time: new Date(
        new Date().setMinutes(new Date().getMinutes() + 90)
      ).toTimeString(),
    });
    expect(res.statusCode).toEqual(302);
  });
});
