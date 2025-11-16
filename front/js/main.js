const socket = io();
const chatForm = document.getElementById('chat-form');
const chatMessages = document.querySelector('.chat-messages');

let fromUser = "John";
let toUser = "Maria";

// Parse URL query parameters (optional if you want room/username info)
const { username, room } = Qs.parse(location.search, {
    ignoreQueryPrefix: true
});

// Emit initial user details
socket.emit('userDetails', { fromUser, toUser });

// Functions to update chat participants
function storeDetails() {
    fromUser = document.getElementById('from').value.trim();
    toUser = document.getElementById('to').value.trim();
    socket.emit('userDetails', { fromUser, toUser }); // emit updated details
}

function storeTo() {
    console.log(toUser);
}

// Submit chat message
chatForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const msgInput = e.target.elements.msg;
    const msg = msgInput.value.trim();
    if (!msg) return; // don't send empty messages

    const messageData = {
        fromUser,
        toUser,
        msg
    };

    socket.emit('chatMessage', messageData); // send message to server
    msgInput.value = "";
    msgInput.focus();
});

// Handle receiving full chat history
socket.on('output', (messages) => {
    chatMessages.innerHTML = ''; // clear existing messages
    messages.forEach((message) => outputMessage(message));
    scrollToBottom();
});

// Handle receiving a new message
socket.on('message', (message) => {
    outputMessage(message);
    scrollToBottom();
});

// Display a single message
function outputMessage(message) {
    const div = document.createElement('div');
    div.classList.add('message');
    div.innerHTML = `
        <p class="meta">${message.from} <span>${message.time}, ${message.date}</span></p>
        <p class="text">${message.message}</p>
    `;
    chatMessages.appendChild(div);
}

// Scroll chat to bottom
function scrollToBottom() {
    chatMessages.scrollTop = chatMessages.scrollHeight;
}
