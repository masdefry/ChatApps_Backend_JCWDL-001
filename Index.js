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

// Create Connection
const mysql = require('mysql')
const db = mysql.createConnection({
    user: 'root',
    password: '20121995',
    database: 'livechat_system',
    port: 3306
})

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
        let checkTotalUserInRoom = userConnected.filter((value) => {
            return value.room === room
        })

        if(checkTotalUserInRoom.length <= 4){ 
            console.log('Available')
            userConnected.push({
                id: socket.id,
                username: username, 
                room: room
            })
            socket.join(room)
            socket.emit('total-user', checkTotalUserInRoom.length)
            socket.to(room).emit('message-from-server', {message: username + 'Join to The Room', is_join: true})
        }else{
            console.log('Full')
             socket.emit('total-user', checkTotalUserInRoom.length)
        }
    })

    socket.on('users-online', (room) => {
        let usersInRoom = userConnected.filter(value => value.room === room)

        db.query('SELECT * FROM messages WHERE room = ?', room, (err, result) => {
            try {
                if(err) throw err 

                io.in(room).emit('users-online', usersInRoom)
                socket.emit('send-history-message', result)
            } catch (error) {
                console.log(error)
            }
        })
    })

    socket.on('send-message', (data) => {
        let index = null 
        userConnected.forEach((value, idx) => {
            if(value.id === socket.id){
                index = idx
            }
        })

        let room = userConnected[index].room 
        let username = userConnected[index].username 

        let dataToInsert = {
            username: username,
            room: room, 
            socket_id: socket.id,
            message: data.message
        }

        db.query('INSERT INTO messages SET ?', dataToInsert, (err, result) => {
            try {
                if(err) throw err 

                io.in(room).emit('send-message-back', { from: username, message: data.message })
            } catch (error) {
                console.log(error)
            }
        })
    })

    socket.on('typing-message', (data) => {
        let index = null 
        userConnected.forEach((value, idx) => {
            if(value.id === socket.id){
                index = idx
            }
        })

        let room = userConnected[index].room 
        let username = userConnected[index].username 

        socket.to(room).emit('typing-message-back', { from: username, message: data.message })
    })

    socket.on('disconnect', () => {
        let index = null 
        userConnected.forEach((value, idx) => {
            if(value.id === socket.id){
                index = idx
            }
        })
        var room = userConnected[index].room 
        var username = userConnected[index].username 

        if(index !== null){
            userConnected.splice(index, 1)
        }

        socket.to(room).emit('message-from-server', {message: username + 'Left from The Room', is_join: false})
    })
})

// Create Server 
httpApp.listen(PORT, () => {
    console.log('Server Running on Port ' + PORT)
})
