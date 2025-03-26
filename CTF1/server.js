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
      const browser = await puppeteer.launch({
        executablePath: '/usr/bin/chromium',
        headless: 'new',
        args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-gpu', '--disable-dev-shm-usage']
      });
      console.log("browser launched");
      const page = await browser.newPage();
      console.log("new tab is opened");
      
          // Navigate to the website
          await page.goto(process.env.localhost,{ waitUntil: 'networkidle2', timeout: 60000 });

      console.log("opened the admin's web page");
      
          // Wait for username field and check if it exists
          const usernameSelector = '#username'; // Change this to the actual selector
          const passwordSelector = '#password'; // Change this to the actual selector
          const loginButtonSelector = '#button'; // Change this to the actual sele
          console.log('selected the input fields')
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
            await page.setDefaultTimeout(30000); // set timeout for 30 seconds
      
              // Type in username and password
              await page.type(usernameSelector, username);
              await page.type(passwordSelector, password);
              console.log("inputed all credentials")
              // Click login button
              await page.click(loginButtonSelector);
              console.log("login attempt successfull")
              // Wait for navigation after login
              await page.waitForNavigation({ waitUntil: 'domcontentloaded' });
              // Wait for 5 seconds before closing
              await new Promise(resolve => setTimeout(resolve, 5000));
              const content = await page.content();
              console.log(content);
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

  
const port = process.env.PORT
  app.listen(5000, () => console.log("CTF challenge running on port 5000"));
  
