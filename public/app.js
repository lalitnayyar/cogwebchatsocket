// Initialize Cognigy Socket Client
const client = new window.SocketClient(
    // "https://endpoint-trial.cognigy.ai/",
    // "ff9556c0885d40dabdf8c2c0275294f9e9f8441307668e326393cc6a0ee3c603",
    "https://endpoint-amna.cognigy.cloud/",
    "031dcbb4de67aa33726d0fdb8b1e8707e37fc96fb44928327c804684e57ce561",
    {
        forceWebsockets: true,
        reconnection: true
    }
);

// Message container
const messagesContainer = document.getElementById('messages');
const messageInput = document.getElementById('messageInput');
const statusDot = document.querySelector('.status-dot');
const statusText = document.querySelector('.status-text');

// Update connection status
function updateConnectionStatus(isConnected) {
    if (isConnected) {
        statusDot.style.backgroundColor = 'var(--primary-color)';
        statusText.textContent = 'Connected';
    } else {
        statusDot.style.backgroundColor = '#dc3545';
        statusText.textContent = 'Disconnected';
    }
}

// Handle incoming messages
client.on("output", (output) => {
    displayMessage(output.text, 'bot');
    if (output.data) {
        console.log("Data:", output.data);
    }
});

// Handle typing status
client.on("typingStatus", (status) => {
    if (status === "on") {
        const typingDiv = document.createElement('div');
        typingDiv.id = 'typing-indicator';
        typingDiv.classList.add('message', 'bot-message');
        typingDiv.innerHTML = '<i class="fas fa-circle-notch fa-spin"></i> AI is typing...';
        messagesContainer.appendChild(typingDiv);
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
    } else {
        const typingDiv = document.getElementById('typing-indicator');
        if (typingDiv) {
            typingDiv.remove();
        }
    }
});

// Handle errors
client.on("error", (error) => {
    console.error("Error:", error.message);
    displayMessage(`<i class="fas fa-exclamation-circle"></i> Error: ${error.message}`, 'bot');
    updateConnectionStatus(false);
});

// Connect to Cognigy
async function initializeConnection() {
    try {
        await client.connect();
        console.log("Connected to Cognigy successfully!");
        updateConnectionStatus(true);
        displayMessage('<i class="fas fa-plug"></i> Connected to chat. You can start messaging!', 'bot');
    } catch (error) {
        console.error("Connection failed:", error);
        updateConnectionStatus(false);
        displayMessage('<i class="fas fa-exclamation-triangle"></i> Failed to connect to chat. Please refresh the page.', 'bot');
    }
}

// Display message in the chat
function displayMessage(text, sender) {
    const messageDiv = document.createElement('div');
    messageDiv.classList.add('message');
    messageDiv.classList.add(sender === 'user' ? 'user-message' : 'bot-message');
    messageDiv.innerHTML = text;
    
    // Remove typing indicator if it exists
    const typingDiv = document.getElementById('typing-indicator');
    if (typingDiv) {
        typingDiv.remove();
    }
    
    messagesContainer.appendChild(messageDiv);
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
}

// Send message function
function sendMessage() {
    const message = messageInput.value.trim();
    if (message) {
        displayMessage(message, 'user');
        client.sendMessage(message);
        messageInput.value = '';
    }
}

// Handle enter key
messageInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        sendMessage();
    }
});

// Initialize connection when page loads
initializeConnection();
