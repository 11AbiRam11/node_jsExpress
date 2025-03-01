const express = require("express");
const cookieParser = require("cookie-parser");
const bodyParser = require("body-parser");
const path = require('path');
const axios = require("axios");
const puppeteer = require('puppeteer');
const flag = process.env.FLAG;
const app = express();
app.use(cookieParser());
app.use(bodyParser.urlencoded({ extended: true }));

function sanitizeInput(input) {
   if (typeof input !== "string") return input;
    return input
        // .replace(/&/g, "&amp;")
        // .replace(/</g, "&lt;")
        //  .replace(/>/g, "&gt;")
        // .replace(/'/g, "&#x27;")
        // .replace(/\//g, "&#x2F;")
        // .replace(/\\/g, '\\\\')
        
        .replace(/=/g, '\\=') // Escape equal sign
        .replace(/!/g, "=")
        .replace(/"/g, '\\"')   // Escape double quotes
        .replace(/'/g, "\\'");  // Escape single quotes
}



app.set("view engine", "ejs");

app.use(express.static("views"));

app.use((req, res, next) => {
    res.setHeader('Content-Security-Policy', "script-src 'self' 'unsafe-inline' 'unsafe-eval'");
    next();
});

// user database
// Simulated user database
const userData = {
  name: "",
  email: "",
  message: ''
};


let userdata = "";

app.get('/', (req, res) => {
  res.render("index")
});
// app.get("/dashboard", (req, res) => {
//   if ( req.cookies.sessionID == process.env.user) {
//     return res.send(`<h2>Congrats ${userData.name} <br> Flag = ${flag}`);
//   }
//   res.status(401).json({ message: "Unauthorized access!" });
// });

app.post("/submit", (req, res) => {

  // create a session id for client
   res.cookie("sessionID", req.body.name, {
        secure: false,  // Change to true if using HTTPS
        path: "/" // Available on all routes
    });
  
  //manually assigning the post data to local var
  userData.name = req.body.name;
  userData.email = req.body.email;
  userData.message = req.body.message;
  let data = "";
  
  // going throug each character for < and > if it is there we route the user to caughtxss and we send the post data to adminDashboard
  const properties = Object.keys(userData);
  properties.forEach(element => {
    data += userData[element];
  });
  let flag = 0;
  for (let i = 0; i < data.length; i++) {
    if (data[i] == '<' || data[i] == '>') {
      flag = 1;
    }
  }
  
  //This wiil send the user's data to the adminDashboard (front-end) without sanitization
  app.get('/api/data', (req, res) => {
    res.header("Content-Type", "application/html");// Set response type to HTML
    let sanitizedData = {
      name: "",
      email: "",
      message:""
    }
    sanitizedData.name = sanitizeInput(userData.name);
    sanitizedData.email = sanitizeInput(userData.email);
    sanitizedData.message = sanitizeInput(userData.message);
    res.send(sanitizedData);
  })
  
  if (flag == 1) {
    res.render("Caughtxss");
    const username = process.env.user_name ;
    const password = process.env.admin;
    
    // this will open the admin's dashboard headless inorder to run the xss payload sent by user in admin's console
    
    (async () => {
          const browser = await puppeteer.launch({ headless: true });
          const page = await browser.newPage();
      
          // Navigate to the website
          await page.goto('http://192.168.32.21:5000/admin',{ waitUntil: 'load' });
      
          // Wait for username field and check if it exists
          const usernameSelector = '#username'; // Change this to the actual selector
          const passwordSelector = '#password'; // Change this to the actual selector
          const loginButtonSelector = '#button'; // Change this to the actual selector
      
          const usernameField = await page.waitForSelector(usernameSelector, { visible: true }).catch(() => null);
          const passwordField = await page.waitForSelector(passwordSelector, { visible: true }).catch(() => null);
          const loginButton = await page.waitForSelector(loginButtonSelector, { visible: true }).catch(() => null);
      
          if (!usernameField || !passwordField) {
                console.error("Error: Username or password field not found. Check your selector!");
                await browser.close();
                return;
            }
        
            if (!loginButton) {
                  console.error("Error: Login button not found. Check your selector!");
                  await browser.close();
                  return;
              }
              await page.setDefaultTimeout(120000); // set timeout for 120 seconds
              // Type in username and password
              await page.type(usernameSelector, username);
              await page.type(passwordSelector, password);
          
              // Click login button
              await page.click(loginButtonSelector);
          
              // Wait for navigation after login
              await page.waitForNavigation();
          
              console.log('Login attempt completed');
            // await page.waitForTimeout(10000); 
            await new Promise(resolve => setTimeout(resolve, 50000));
              await browser.close();
          })();
          
        } else {
          res.send(`<h2>Thankyou ${req.body.name}</h2>`,)
        } 
});


//admin's endpoint
app.get('/admin', (req, res) => { 
  if (req.cookies.sessionID == process.env.user)
  {
    res.render("adminDashboard");
  }
  else {
    res.render("login_to_dashboard")
  }
});



// data is captured sent form admin's login page
app.post('/adminDashboard', (req, res) => {
  const { username, password } = req.body;
  if ((username === "admin" && password === process.env.admin)) {
    // creating a admin's cookie to sessionID
    res.cookie("sessionID", process.env.user, { 
      sameSite: "Strict",
      path: "/adminDashboard" // Cookie is only sent to "/adminDashboard"
    });
    return res.render("adminDashboard")
    }
    res.send("Invalid credentials! <a href='/'>Try again</a>");
  })

  app.listen(5000, () => console.log("CTF challenge running on port 5000"));
  