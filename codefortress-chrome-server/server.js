const WebSocket = require('ws');

const wss = new WebSocket.Server({ port: 8080 });
const clients = new Set();
let clientIdCounter = 1; // To give each connection a unique ID

console.log('🚀 WebSocket server started on port 8080');

wss.on('connection', ws => {
    // Assign a unique ID to this connection
    ws.id = clientIdCounter++;
    clients.add(ws);
    console.log(`✅ Client #${ws.id} connected. Total clients: ${clients.size}`);

    ws.on('message', (message, isBinary) => {
        const messageString = message.toString();
        console.log(`\n--- MESSAGE RECEIVED from Client #${ws.id} ---`);

        // Broadcast the message to all OTHER clients
        clients.forEach(client => {
            if (client !== ws && client.readyState === WebSocket.OPEN) {
                console.log(`   -> Broadcasting to Client #${client.id}`);
                client.send(messageString);
            }
        });
        console.log('--- BROADCAST COMPLETE ---\n');
    });

    ws.on('close', () => {
        clients.delete(ws);
        console.log(`🔌 Client #${ws.id} disconnected. Total clients: ${clients.size}`);
    });
});
