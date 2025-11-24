const WebSocket = require("ws");

module.exports = function initWebSocket(server) {
    const wss = new WebSocket.Server({ server });

    global.wss = wss;  // ⭐ Make WebSocket GLOBAL

    console.log("🔌 WebSocket server started");

    wss.on("connection", (ws) => {
        console.log("🟢 New WebSocket client connected");

        ws.on("close", () => {
            console.log("🔴 WebSocket client disconnected");
        });
    });
};
