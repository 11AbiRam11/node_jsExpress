const express = require("express");
const session = require("express-session");
const cookieParser = require("cookie-parser");
const bodyParser = require("body-parser");
const http = require("http");
const app = express();
const socketio = require("socket.io");

const server = http.createServer(app);
const io = socketio(server);

app.use(bodyParser.urlencoded({ extended: true }));

// Middleware for cookies and sessions
app.use(cookieParser());

const sessionStore = new session.MemoryStore();


// Middleware to accept user-defined sessionID if present
app.use((req, res, next) => {
  if (req.cookies.sessionID) {
    res.sessionID = req.cookies.sessionID; // Use user-provided session ID
  }
  next();
});

app.use(
  session({
    secret: "lasjdflksdjfkldjfkljwp9eir2903i30i4290ujd23ur0832u403292jd0932j0",
    resave: false,
    saveUninitialized: false,
    store: sessionStore,
    name: "sessionID", // Keep predictable session cookie name
    genid: (req) => {
      return req.cookies.sessionID || require("crypto").randomBytes(16).toString("hex");
    },
    cookie: {
      httpOnly: false, // Allow JavaScript access (to facilitate CTF attacks)
      secure: false,   // Allow session hijacking over HTTP
      maxAge: 1000 * 60 * 30, // 30 minutes
    },
  })
);




app.set("view engine", "ejs");
app.use(express.static("views"));



// Simulated database
const userData = {
  John: "John@123",
  Jade: "Jade@123",
  Player: "Player@123",
  admin: "admin@321",
};


// Root route (Login Page)
app.get("/", (req, res) => {
  res.render("login");
});


//Chat Route - Requires Authentication
app.get("/chat", (req, res) => {
  if (!req.session.username || !req.session) {
    return res.redirect("/"); // Redirect to login if no session
  }
  res.render("chat", { username: req.session.username }); // Send response
  //server side message to notify about new users
  console.log(req.session.username,"connected");
});


// Login Route - Uses existing session ID or creates a new one
app.post("/chat", (req, res) => {
  const { username, password } = req.body;

  if (userData[username] && userData[username] === password) {
    req.session.username = username; // Store username in session

    if (!req.cookies.sessionID) {
      // Set new sessionID cookie only if it doesn't exist
      const newSessionID = req.sessionID || require("crypto").randomBytes(16).toString("hex");
      res.cookie("sessionID", newSessionID, {
        httpOnly: false,
        secure: false,
        maxAge: 1000 * 60 * 30, // 30 minutes
      });
      console.log(`New sessionID created: ${newSessionID}`);
    }

    res.redirect("/chat");
  } else {
    res.send("Invalid credentials! <a href='/'>Try again</a>");
  }
});



// Logout Route
app.get("/logout", (req, res) => {
  req.session.destroy(() => {
    res.clearCookie("sender"); // Clear sender cookie
    res.redirect("/");
  });
});


// Socket.io - Handle real-time messages
io.on("connection", (socket) => {

  console.log(`A socket connection made`);

  // Receiving messages
  socket.on("message", (data) => {
    io.emit("messageToAll", data);
  });

  // Handle user disconnect
  socket.on("disconnect", () => {
    console.log(`A socket disconnected`);
  });
});

// Start server
server.listen(3000, () => {
  console.log("Server is running on port 3000");
});