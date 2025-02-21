const http = require('http');
const express = require('express');
const path = require('path');
const { Server } = require('socket.io')

const app = express();
const server = http.createServer(app);
const io = new Server(server)
const port = process.env.PORT;

io.on('connection', (socket) => {
    console.log('new user joined socket Id =',socket.id);

   socket.emit('server_hello',`hey new user!`)

    
    socket.on('disconnect', () => {
        console.log(`User disconnected socket Id =`,socket.id);
    })

    socket.on('client_status', (msg) => {
        console.log(msg)
    })
});

app.get('/testing', (req, res) => {
    res.sendFile(path.join(__dirname, "public", 'testing.html'));
})

app.get('/client_res', (req, res) => {
    res.sendFile(path.join(__dirname,'public','index.html'))
    // server.emit('client_status','Server is online')
})


server.listen(port, () => console.log(`server is running on port ${port}`)) 