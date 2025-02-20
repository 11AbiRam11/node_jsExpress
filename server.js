const http = require('http');
const express = require('express');
const path = require('path');
const { Server } = require('socket.io')

const app = express();
const server = http.createServer(app);
const io = new Server(server)

const filePath = path.join(__dirname,'public','index.html')

const port = process.env.PORT;
app.use(express.static(path.resolve("./public")));

app.get('/', (req, res) => {
    return res.sendFile('/public/index.html');
})
// used for io operations and io.on makes a new connection name 'connection' 
io.on('connection', (socket) => {
    // console.log('new user joined', socket.id);

    //this is used to grab the msg from user (frontend side) and used to emit to other users, later in frontend side socket.on will grab this msg
    // and it will be displayed
    socket.on('user-msg', msg => {
        io.emit('message', msg);
    });
});

server.listen(port, () => console.log(`server is running on port ${port}`)) 