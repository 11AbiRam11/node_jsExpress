const express = require("express");
const path = require('path');
const axios = require("axios");
const bodyParser = require('body-parser')

const app = express();
const PORT = 3000;

app.set('view engine', "ejs");
app.use(express.static("views"));
app.use(bodyParser.urlencoded({ extended: true }));

// Internal Flag Server (Hidden Service)
const internalApp = express();
internalApp.get('/flag', (req, res) => {
    res.send("CTF{SSRF_Bypass_Challenge_1337}");
});

//binding - this internalApp is only accessible by localhost means our server can only access this endpoint
internalApp.listen(5000, "127.0.0.1", () => console.log("Internal server running on port 5000"));

// 🚫 Catch-All Middleware Return 404 for all other routes
internalApp.use((req, res) => {
    res.status(404).send("404 Not Found");
});


// Vulnerable endpoint that fetches external URLs
app.get("/", (req, res) => {
    res.render('fetchImages');

});

app.get('/result', async(req, res) => {
    const url = req.query.url;

    //basic filter which can be bypassed in many ways
      if (!url || url.includes("localhost") || url.includes("127.0.0.1")) {
        return res.send("Access denied! Nice try.");
    }

    if (!url) {
        return res.status(400).send("No URL provided!");
    }

    try {
        const response = await axios.get(url);
        res.set("Content-Type", "text/plain");
        res.send(response.data);
    } catch (error) {
        res.send("Error fetching website!");
    }
    
});



//fake endpoint with no ssrf vuln
app.get("/redirect", (req, res) => {
    const url = req.query.url;
    if (!url) return res.send("No URL provided!");

    if (!url.startsWith("http")) {
        return res.send("Invalid URL format.");
    }

    res.redirect(url); // Fake vulnerability
});



app.listen(PORT, () => console.log(`CTF Challenge running on port ${PORT}`));

