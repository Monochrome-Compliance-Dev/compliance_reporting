// client-test.js
const { io } = require("socket.io-client");

const socket = io("http://localhost:4000");

socket.on("connect", () => {
  console.log("✅ Connected to socket.io server with ID:", socket.id);
  socket.emit("ping-me", { note: "Client says hello!" });
});

socket.on("hello", (data) => {
  console.log("👋 Got hello event:", data);
});

socket.on("pong-back", (data) => {
  console.log("🏓 Got pong-back:", data);
});

socket.on("disconnect", () => {
  console.log("🚨 Disconnected from server");
});
