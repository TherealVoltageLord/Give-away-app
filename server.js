const express = require('express');
const path = require('path');
const http = require('http');
const socketio = require('socket.io');
const { MongoClient } = require('mongodb');
const formatMessage = require('./utils/chatMessage');

const PORT = 5000;
const DB_URL = 'mongodb://localhost:27017/';
const DB_NAME = 'chatApp';
const CHAT_COLLECTION = 'chats';
const USER_COLLECTION = 'onlineUsers';

const app = express();
const server = http.createServer(app);
const io = socketio(server);

// Middleware to serve static files
app.use(express.static(path.join(__dirname, 'front')));

let dbClient;

// Connect to MongoDB once
async function connectDB() {
    try {
        dbClient = await MongoClient.connect(DB_URL, { useUnifiedTopology: true });
        console.log('Connected to MongoDB...');
    } catch (err) {
        console.error('MongoDB connection error:', err);
    }
}

// Start DB connection
connectDB();

// Socket.io connection
io.on('connection', (socket) => {
    console.log(`New user logged in with ID ${socket.id}`);

    // Handle incoming chat messages
    socket.on('chatMessage', async (data) => {
        try {
            const message = formatMessage(data);
            const db = dbClient.db(DB_NAME);
            const chats = db.collection(CHAT_COLLECTION);
            const onlineUsers = db.collection(USER_COLLECTION);

            // Insert message into database
            await chats.insertOne(message);

            // Emit message back to sender
            socket.emit('message', message);

            // Check if recipient is online and send message
            const recipient = await onlineUsers.findOne({ name: data.toUser });
            if (recipient) {
                socket.to(recipient.ID).emit('message', message);
            }
        } catch (err) {
            console.error('Error handling chatMessage:', err);
        }
    });

    // Handle new user login / details
    socket.on('userDetails', async (data) => {
        try {
            const db = dbClient.db(DB_NAME);
            const chats = db.collection(CHAT_COLLECTION);
            const onlineUsers = db.collection(USER_COLLECTION);

            // Add user to online users collection
            const onlineUser = { ID: socket.id, name: data.fromUser };
            await onlineUsers.insertOne(onlineUser);
            console.log(`${onlineUser.name} is online...`);

            // Fetch chat history between the two users
            const chatHistory = await chats.find({
                from: { $in: [data.fromUser, data.toUser] },
                to: { $in: [data.fromUser, data.toUser] }
            }, { projection: { _id: 0 } }).toArray();

            // Send chat history to client
            socket.emit('output', chatHistory);
        } catch (err) {
            console.error('Error handling userDetails:', err);
        }
    });

    // Handle user disconnect
    socket.on('disconnect', async () => {
        try {
            const db = dbClient.db(DB_NAME);
            const onlineUsers = db.collection(USER_COLLECTION);
            await onlineUsers.deleteOne({ ID: socket.id });
            console.log(`User ${socket.id} went offline...`);
        } catch (err) {
            console.error('Error removing disconnected user:', err);
        }
    });
});

// Start server
server.listen(PORT, () => {
    console.log(`Chat server listening on port ${PORT}...`);
});
