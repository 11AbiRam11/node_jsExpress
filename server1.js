const express = require('express')
const http = require('http')
const path = require('path')
const { Server } = require('socket.io')

const port = process.env.PORT
const app = express()
const server = http.createServer(app)
const io = new Server(server)

io.on('client_res', (msg,res) => {
    res.send('Hey new users')
    console.log(`got msg form new user: ${msg}`)
})

io.on('connection', (socket) => {
    console.log('new user connected')
})

//response from server 
app.get('/testing', (req,res) => {
    res.end("<h1>Welcome to the testing page</h1>")
    i
})

app.get('/client_res', (req,res) => {
    res.send('Hey client');
    io.emit("client_res", 'hey')
 })



server.listen(port, () => {
    console.log(`Server is running on port ${port}`)
})