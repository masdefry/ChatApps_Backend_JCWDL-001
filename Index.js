// Import Libraries 
const express = require('express')
const http = require('http')
const socket = require('socket.io')
const cors = require('cors')

// Initialize Variable
const app = express()
app.use(cors())
const httpApp = http.createServer(app)
const io = socket(httpApp, { cors: { origin: '*' } })
const PORT = 2000

// Routes 
app.get('/', (req, res) => {
    res.send('Welcome to API Chat')
})

// Socket.io -> 2 logic -> On, Emit
let userConnected = []
io.on('connection' , (socket) => {
    console.log('User Connect')
    console.log(socket.id)

    socket.on('send-data', (name) => {
        socket.broadcast.emit('broadcast', name)
    })

    socket.on('user-join', ({username, room}) => {
        userConnected.push({
            id: socket.id,
            username: username, 
            room: room
        })

        console.log(userConnected)

        let checkTotalUserInRoom = userConnected.filter((value) => {
            return value.room === room
        })

        socket.join(room)
        socket.emit('total-user', checkTotalUserInRoom.length)
    })

    socket.on('disconnect', () => {
        console.log('User Disconnect')
    })
})

// Create Server 
httpApp.listen(PORT, () => {
    console.log('Server Running on Port ' + PORT)
})
