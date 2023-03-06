/* eslint-disable no-undef */
const btoa = (text) => {
  console.log("Encoding to base64");
  return Buffer.from(text, "binary").toString("base64");
};

const atob = (base64) => {
  console.log("Decoding from base64");
  return Buffer.from(base64, "base64").toString("binary");
};

module.exports = {
  atob,
  btoa,
};
