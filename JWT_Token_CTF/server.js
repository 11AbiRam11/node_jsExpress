const express = require("express");
const jwt = require("jsonwebtoken");
const cookieParser = require("cookie-parser");
const bodyParser = require('body-parser');
const fs = require("fs");
const crypto = require("crypto");
const path = require('path');
require("dotenv").config();

const users = JSON.parse(process.env.USERS);

const app = express();
const PORT = 3000;

app.use(cookieParser());
app.use(express.json());
app.use(bodyParser.urlencoded({ extended: true })); // Parses form data

// **Secret Key (Weak & Brute-Forceable)**
const SECRET_KEY = process.env.SECRET_KEY; // Weak HMAC key
const PRIVATE_KEY = fs.readFileSync("./private.pem"); // RSA Private Key
const PUBLIC_KEY = fs.readFileSync("./public.pem"); // RSA Public Key



app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname,'/login.html'));
});


// **Login Route - Issues a JWT**
app.post("/login", (req, res) => {
    const username = req.body.username;
    const password = req.body.password;
    if (!users[username] || users[username].password !== password) {
        return res.status(401).send("Invalid credentials");
    }
    
    // **Issue JWT with HS256 (Weak Secret)**
    const token = jwt.sign({ username, role: users[username].role }, SECRET_KEY, { algorithm: "HS256" });
    res.cookie("token", token, { httpOnly: true });
    res.send("Logged in. Try accessing /flag");
});

// **Flag Route - Requires Admin JWT**
app.get("/flag", (req, res) => {
    const token = req.cookies.token;

    if (!token) return res.status(401).send("Unauthorized");

    try {
        let decoded;
        // **Check if token is HS256 or RS256**
        if (token.split(".").length === 3) {
            // Decode the header without verification
            const header = JSON.parse(Buffer.from(token.split(".")[0], "base64").toString());

            if (header.alg === "HS256") {
                decoded = jwt.verify(token, SECRET_KEY, { algorithms: ["HS256"] });
            } else if (header.alg === "RS256") {
                decoded = jwt.verify(token, PUBLIC_KEY, { algorithms: ["RS256"] });
            } else {
                return res.status(400).send("Unsupported algorithm");
            }
        } else {
            return res.status(400).send("Invalid token format");
        }

        if (decoded.role === "admin") {
            return res.send("FLAG{JWT_SUPER_EXPLOIT_9X2Y}");
        }

        return res.status(403).send("You need to be an admin!");
    } catch (err) {
        return res.status(401).send(`Invalid token || ${err.message}`);
    }
});


// **Admin Token Route (Only for Reference)**
app.get("/generate-admin-token", (req, res) => {
    const adminToken = jwt.sign({ username: "admin", role: "admin" }, PRIVATE_KEY, { algorithm: "RS256" });
    res.send({ adminToken });
});

app.listen(PORT, () => {
    console.log(`CTF running on http://localhost:${PORT}`);
});
