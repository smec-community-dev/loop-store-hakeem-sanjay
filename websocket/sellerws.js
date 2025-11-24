const Notification = require("../Model/sellerNotification");

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

if (url.searchParams.get("userId")) {
    ws.userId = url.searchParams.get("userId");
}


    if (!ws.sellerId  && !ws.userId) {
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


async function notifySellerFor({ sellerId, type, orderId, total }) {
    try {
        // 1️⃣ Save MongoDB Notification
        await Notification.create({
            sellerId,
            message: type === "new_order" 
                ? `New Order Received (₹${total})`
                : "Notification",
            orderId
        });

        console.log("📌 Notification stored in DB for seller:", sellerId);

        // 2️⃣ Send WebSocket to seller
        clients.forEach(ws => {
            if (ws.readyState === 1 && ws.sellerId === sellerId.toString()) {
                ws.send(JSON.stringify({
                    type,
                    orderId,
                    total,
                    sellerId
                }));
            }
        });

        console.log("📡 Notification sent to seller WebSocket");
    } catch (err) {
        console.error("❌ Error storing WS notification:", err);
    }
}

module.exports = { initSellerWebSocket, notifySellerFor ,notifyUserFor};
