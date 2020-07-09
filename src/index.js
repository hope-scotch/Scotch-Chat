// Refactor the server to support web socket protocol

const path = require('path')
const http = require('http')
const express = require('express')
const socketio = require('socket.io')
const { generateMessage, genLocMessage } = require('./utils/messages')
// const Filter = require('bad-words')
const { addUser, removeUser, getUser, getUsersInRoom } = require('./utils/users')

const app = express()
const server = http.createServer(app)
const io = socketio(server) // socketio takes in a raw http server as its argument -> express does it bts, so we don't get access to it

const port = process.env.PORT || 3000

const publicDirPath = path.join(__dirname, '../public')

app.use(express.static(publicDirPath))

// let count = 0

// Listen to an event -> Whenever a new client connects
// This configures only the server side of socketio in our app
/* io.on('connection', () => {
    console.log('New WebSocket Connection')
}) */

// Data from Server -> Client (each of the connected clients)
// io.on('connection', (socket) => { // socket is an object which has info about the new connection -> for each newly connected client

//     // 'connection' is a built-in event

//     // We are trasnferring data => we are sending and receiving events
//     socket.emit('countUpdated', count) // custom event -> any data passed on emit as an argument is available on the callback function on the client-side

//     // Listen for event from the server -> get data from client
//     socket.on('increment', () => {
//         count ++
//         // We don't want to emit to a particular client, we want to emit to all the clients
//         // socket.emit('countUpdated', count)

//         io.emit('countUpdated', count)
//     })

// })

// server (emit) -> client (receive) --acknowledgement --> countUpdated
// client (emit) -> server (receive) --acknowledgement --> increment

io.on('connection', (socket) => {

    // socket.emit('message', generateMessage('Welcome to RandomChatName-Chat'))
    // socket.broadcast.emit('message', generateMessage('A new user has joined')) // Send to everybody except this particular socket

    socket.on('sendMessage', (message, callback) => { // Matches parameter list on the sendMessage client side event

        // const filter = new Filter()

        /* if (filter.isProfane(message)) {
            return callback('Profanity is not allowed')
        } */

        // Message is not sent if found profane

        const user = getUser(socket.id)

        io.to(user.room).emit('message', generateMessage(user.username, message))
        callback()
    })

    // Built-in event for disconnection
    socket.on('disconnect', () => {
        const user = removeUser(socket.id)

        if (user) {
            io.to(user[0].room).emit('message', generateMessage('Admin', `${user[0].username} has left`))
            io.to(user[0].room).emit('roomData', {
                room: user[0].room,
                users: getUsersInRoom(user[0].room)
            })
        }
    })

    socket.on('sendLocation', (location, callback) => {

        const user = getUser(socket.id)
        io.to(user.room).emit('locationMessage', genLocMessage(user.username, `https://google.com/maps?q=${location.latitude},${location.longitude}`))
        callback('Location shared successfully!')
    })

    socket.on('join', (options, callback) => {

        const { error, user } = addUser({ id: socket.id, ...options })

        if (error)
            return callback(error)

        socket.join(user.room) // Specially made feature for the server
        
        socket.emit('message', generateMessage('Admin', 'Welcome to Hope-Scotch\'s Chat'))
        socket.broadcast.to(user.room).emit('message', generateMessage('Admin', `${user.username} has joined`)) // Send to everybody except this particular socket
        io.to(user.room).emit('roomData', {
            room: user.room,
            users: getUsersInRoom(user.room)
        })
        
        callback()
    })

    // socket.emit, socket.broadcast.emit, io.emit
    // io.to.emit, socket.broadcast.to.emit // For specific chat rooms
})

server.listen(port, () => {
    console.log(`Server is up on port ${port}`)
})