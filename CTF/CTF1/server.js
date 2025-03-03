const express = require("express");
const cookieParser = require("cookie-parser");
const bodyParser = require("body-parser");
const path = require('path');
const puppeteer = require('puppeteer');
const app = express();
app.use(express.json());
const SFlag = process.env.FLAG;

app.use(cookieParser());
app.use(bodyParser.urlencoded({ extended: true }));

function sanitizeInput(input) {
   if (typeof input !== "string") return input;
    return input      
        .replace(/=/g, '\\=') // Escape equal sign
        .replace(/!/g, "=")   // player should use ! inorder to use = sign
        .replace(/"/g, '\\"')   // Escape double quotes
        .replace(/'/g, "\\'");  // Escape single quotes
}



app.set("view engine", "ejs");

app.use(express.static("views"));

app.use((req, res, next) => {
    res.setHeader('Content-Security-Policy', "script-src 'self' 'unsafe-inline' 'unsafe-eval'");
    next();
});


// Simulated user database
const userData = {
  name: "",
  email: "",
  message: '',
  // Flag: SFlag
};


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
      message: "",
      Flag: SFlag
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
      path: "/adminDashboard" // Cookie is only set to "/adminDashboard"
    });
    return res.render("adminDashboard")
    }
    res.send("Invalid credentials! <a href='/'>Try again</a>");
})


app.get("/submission", async (req, res) => {
    try {
        res.render("submission");
    } catch (error) {
        console.error("Error rendering page:", error);
        res.status(500).send("Server error");
    }
});


app.post("/api/result", (req, res) => {
    console.log("Received request:", req.body); // Debugging line

  const { flag } = req.body; // Extract flag from request

    if (!flag) {
        return res.json({ message: "Please enter a flag!", success: false });
    }

    if (flag == SFlag) {
        console.log("✅ Correct flag!");
        return res.json({ message: "Congrats! The Flag is right", success: true });
    } else {
        console.log("❌ Wrong flag!");
        return res.json({ message: "❌ Wrong flag, try again!", success: false });
    }
});

  

  app.listen(5000, () => console.log("CTF challenge running on port 5000"));
  