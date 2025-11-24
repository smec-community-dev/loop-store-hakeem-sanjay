const WebSocket = require("ws");

let clients = new Set();

function initSellerWebSocket(server) {
    const wss = new WebSocket.Server({ server });

   wss.on("connection", (ws, req) => {
    console.log("Seller WebSocket connected");

    const url = new URL(req.url, `http://${req.headers.host}`);
    ws.sellerId = url.searchParams.get("sellerId");

    if (!ws.sellerId) {
        console.log("❌ Ignoring connection without sellerId");
        return;
    }

    console.log("Connected seller:", ws.sellerId);

    clients.add(ws);

    ws.on("close", () => {
        clients.delete(ws);
    });
});

}

function notifySellerFor(sellerId, message) {
    console.log("Sending WS to Seller:", sellerId, message);

    clients.forEach(ws => {
        if (ws.readyState === 1 && ws.sellerId === sellerId.toString()) {
            ws.send(JSON.stringify(message));
        }
    });
}

module.exports = { initSellerWebSocket, notifySellerFor };
