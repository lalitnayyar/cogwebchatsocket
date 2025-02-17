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
const messageFlow = document.getElementById('messageFlow');

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

// Log message flow
function logMessageFlow(direction, data) {
    const entry = document.createElement('div');
    entry.classList.add('flow-entry', direction.toLowerCase());
    
    const timestamp = new Date().toLocaleTimeString();
    const icon = direction === 'Request' ? 'fa-arrow-up' : 'fa-arrow-down';
    
    entry.innerHTML = `
        <div class="timestamp">${timestamp}</div>
        <div class="direction">
            <i class="fas ${icon}"></i>
            ${direction}
        </div>
        <pre>${JSON.stringify(data, null, 2)}</pre>
    `;
    
    messageFlow.appendChild(entry);
    messageFlow.scrollTop = messageFlow.scrollHeight;
}

// Clear message flow logs
function clearLogs() {
    messageFlow.innerHTML = '';
}

// Handle incoming messages
client.on("output", (output) => {
    displayMessage(output, 'bot');
    logMessageFlow('Response', output);
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
function displayMessage(content, sender) {
    const messageDiv = document.createElement('div');
    messageDiv.classList.add('message', `${sender}-message`);

    if (typeof content === 'object' && content.data) {
        const cognigyData = content.data._cognigy?._default;
        
        if (cognigyData?._buttons) {
            // Handle buttons
            const buttonData = cognigyData._buttons;
            const textDiv = document.createElement('div');
            textDiv.classList.add('message-text');
            textDiv.textContent = buttonData.text;
            messageDiv.appendChild(textDiv);

            const buttonsDiv = document.createElement('div');
            buttonsDiv.classList.add('button-container');
            
            buttonData.buttons.forEach(button => {
                const buttonElement = document.createElement('button');
                buttonElement.classList.add('cognigy-button');
                buttonElement.textContent = button.title;
                buttonElement.onclick = () => {
                    client.sendMessage(button.payload);
                    // Disable all buttons after selection
                    buttonsDiv.querySelectorAll('button').forEach(btn => {
                        btn.disabled = true;
                        btn.classList.add('disabled');
                    });
                };
                buttonsDiv.appendChild(buttonElement);
            });
            
            messageDiv.appendChild(buttonsDiv);
        } else if (cognigyData?._quickReplies) {
            // Handle quick replies
            const quickReplies = cognigyData._quickReplies;
            const textDiv = document.createElement('div');
            textDiv.classList.add('message-text');
            textDiv.textContent = quickReplies.text;
            messageDiv.appendChild(textDiv);

            const repliesDiv = document.createElement('div');
            repliesDiv.classList.add('quick-replies-container');
            
            quickReplies.quickReplies.forEach(reply => {
                const replyButton = document.createElement('button');
                replyButton.classList.add('quick-reply');
                
                if (reply.imageUrl) {
                    const img = document.createElement('img');
                    img.src = reply.imageUrl;
                    img.alt = reply.imageAltText || reply.title;
                    img.classList.add('quick-reply-image');
                    replyButton.appendChild(img);
                }
                
                const span = document.createElement('span');
                span.textContent = reply.title;
                replyButton.appendChild(span);
                
                replyButton.onclick = () => {
                    client.sendMessage(reply.payload);
                    // Remove quick replies after selection
                    repliesDiv.remove();
                };
                
                repliesDiv.appendChild(replyButton);
            });
            
            messageDiv.appendChild(repliesDiv);
        } else if (cognigyData?._adaptiveCard) {
            // Handle Adaptive Card
            const adaptiveCard = cognigyData._adaptiveCard.adaptiveCard;
            const cardDiv = document.createElement('div');
            cardDiv.classList.add('adaptive-card');

            // Add title/description
            const titleBlock = adaptiveCard.body.find(item => item.type === 'TextBlock');
            if (titleBlock) {
                const title = document.createElement('div');
                title.classList.add('card-title');
                title.textContent = titleBlock.text;
                cardDiv.appendChild(title);
            }

            // Add form inputs
            const form = document.createElement('form');
            form.classList.add('card-form');
            
            adaptiveCard.body.forEach(item => {
                if (item.type.startsWith('Input.')) {
                    const inputGroup = document.createElement('div');
                    inputGroup.classList.add('input-group');

                    const input = document.createElement('input');
                    input.type = item.style === 'Tel' ? 'tel' : 
                                item.style === 'Email' ? 'email' : 'text';
                    input.id = item.id;
                    input.placeholder = item.placeholder;
                    input.required = item.isRequired || false;
                    input.pattern = item.regex?.replace(/\\\\/, '\\');
                    
                    const error = document.createElement('div');
                    error.classList.add('error-message');
                    error.textContent = item.errorMessage;
                    error.style.display = 'none';

                    input.addEventListener('input', () => {
                        const isValid = input.checkValidity();
                        error.style.display = isValid ? 'none' : 'block';
                    });

                    inputGroup.appendChild(input);
                    inputGroup.appendChild(error);
                    form.appendChild(inputGroup);
                }
            });

            // Add submit button
            const submitAction = adaptiveCard.actions.find(action => action.type === 'Action.Submit');
            if (submitAction) {
                const button = document.createElement('button');
                button.type = 'submit';
                button.classList.add('card-submit');
                button.textContent = submitAction.title;
                
                form.addEventListener('submit', (e) => {
                    e.preventDefault();
                    const formData = new FormData(form);
                    const data = Object.fromEntries(formData);
                    client.sendMessage('', { 
                        action: submitAction.data.action,
                        ...data
                    });
                    messageDiv.classList.add('submitted');
                });

                form.appendChild(button);
            }

            cardDiv.appendChild(form);
            messageDiv.appendChild(cardDiv);
        } else {
            // Handle regular text message
            messageDiv.textContent = content.text || content;
        }
    } else {
        // Handle string messages
        messageDiv.textContent = content;
    }

    messagesContainer.appendChild(messageDiv);
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
}

// Send message function
function sendMessage() {
    const message = messageInput.value.trim();
    if (message) {
        displayMessage(message, 'user');
        logMessageFlow('Request', { text: message });
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
