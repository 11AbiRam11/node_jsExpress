const express = require("express");
const app = express();


app.get("/admin", (req, res) => {
    res.send("Secret Flag: FLAG{SSRF_PWNED}");
});


app.listen(5000, () => console.log("Internal Admin running on port 5000"));