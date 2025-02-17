const { SocketClient } = require("@cognigy/socket-client");
const readline = require('readline');

// Create readline interface for command line input
const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

// Initialize the client with your credentials
const client = new SocketClient(
   // "https://endpoint-trial.cognigy.ai/",
   // "ff9556c0885d40dabdf8c2c0275294f9e9f8441307668e326393cc6a0ee3c603",
   "https://endpoint-amna.cognigy.cloud/",
   "031dcbb4de67aa33726d0fdb8b1e8707e37fc96fb44928327c804684e57ce561",
    {
        forceWebsockets: true,
        reconnection: true
    }
);

// Handle incoming messages
client.on("output", (output) => {
    console.log("\nBot:", output.text);
    if (output.data) {
        console.log("Data:", JSON.stringify(output.data, null, 2));
    }
    rl.prompt();
});

// Handle typing status
client.on("typingStatus", (status) => {
    if (status === "on") {
        process.stdout.write("\nBot is typing...");
    }
});

// Handle errors
client.on("error", (error) => {
    console.error("\nError:", error.message);
    rl.prompt();
});

// Connect to Cognigy
async function startChat() {
    try {
        await client.connect();
        console.log("Connected to Cognigy successfully!");
        console.log("Type your messages (press Ctrl+C to exit)");
        rl.prompt();

        rl.on('line', (input) => {
            if (input.trim()) {
                client.sendMessage(input);
            }
            rl.prompt();
        });

        rl.on('close', () => {
            console.log('\nDisconnecting from Cognigy...');
            client.disconnect();
            process.exit(0);
        });

    } catch (error) {
        console.error("Connection failed:", error);
        process.exit(1);
    }
}

// Start the chat
startChat();
