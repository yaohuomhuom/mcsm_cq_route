const axios = require('axios');
var isBrowser = typeof window !== "undefined";
var Axios = {};
Axios.getMojangUUID = axios.create({
  baseURL: "https://api.mojang.com/users/profiles/minecraft",
  timeout: 3000,
  headers: {
    "Content-Type": "application/json",
  }
});
module.exports = Axios;
