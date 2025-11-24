const WebSocket = require("ws");

let clients = new Set();

function initSellerWebSocket(server) {
    const wss = new WebSocket.Server({ server });

   wss.on("connection", (ws, req) => {
    console.log("Seller WebSocket connected");

    const url = new URL(req.url, `http://${req.headers.host}`);
   

    if( url.searchParams.get("sellerId")){
         ws.sellerId = url.searchParams.get("sellerId");

    }

    if( ws.userId = url.searchParams.get("userId")){
         ws.userId = url.searchParams.get("userId");
    }


    if (!ws.sellerId  || !ws.userId) {
        console.log("❌ Ignoring connection without sellerId or userID");
        return;
    }

    clients.add(ws);

    ws.on("close", () => {
        clients.delete(ws);
    });
});

}

function notifyUserFor(userId, message) {
    console.log("Sending WS to User:", userId, message);

    clients.forEach(ws => {
        if (ws.readyState === 1 && ws.userId === userId.toString()) {
            ws.send(JSON.stringify(message));
        }
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

module.exports = { initSellerWebSocket, notifySellerFor ,notifyUserFor};
