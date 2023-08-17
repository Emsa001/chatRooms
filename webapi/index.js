const express = require("express");
const http = require("http");
const socketIo = require("socket.io");
const cors = require("cors");
const fs = require("fs");
const bodyParser = require("body-parser");
const { v4: uuidv4 } = require("uuid");

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

const chatDirectory = "./chats";

if (!fs.existsSync(chatDirectory)) {
  fs.mkdirSync(chatDirectory);
}

// Enable CORS for all origins
app.use(cors());
app.use(bodyParser.json());

app.use((req, res, next) => {
  const referer = req.headers.referer || "";

  if (referer.startsWith("http://localhost:3000")) {
    next();
  } else {
    res.status(403).send("Forbidden");
  }
});

const chatData = {};

io.on("connection", (socket) => {
  socket.on("joinChat", (data) => {
    try {
      const { chatId, username } = data;

      socket.join(chatId);
      io.to(chatId).emit("infoMessage", { message: `${username} has joined the chat`, joined: true });

      if (!chatData[chatId]) {
        chatData[chatId] = {
          users: [],
        };
      }

      chatData[chatId].users.push(username);
      socket.username = username;
      socket.chatId = chatId;
    } catch (err) {
      console.error(err);
    }
  });

  socket.on("newMessage", (data) => {
    try {
      const { chatId, message, username } = data;

      io.to(chatId).emit("incomingMessage", { message, username });

      const filePath = `./chats/${chatId}.txt`;
      const messageToAppend = `[${new Date().toISOString()}] ${username}: ${message}\n`;

      fs.appendFile(filePath, messageToAppend, (err) => {
        if (err) {
          console.error("Error appending message to file:", err);
        }
      });
    } catch (err) {
      console.error(err);
    }
  });

  socket.on("disconnect", () => {
    try {
      chatData[socket.chatId].users = chatData[socket.chatId].users.filter((user) => user !== socket.username);

      if (chatData[socket.chatId].users.length === 0) {
        delete chatData[socket.chatId];

        const newFileName = `./chats/${socket.chatId}_${uuidv4()}.txt`;
        return fs.rename(`./chats/${socket.chatId}.txt`, newFileName, (err) => {
          if (err) {
            console.error("Error renaming file:", err);
          }
        });
      }

      io.to(socket.chatId).emit("infoMessage", { message: `${socket.username} has disconnected`, joined: false });
    } catch (err) {
      console.error(err);
    }
  });
});

app.post("/checkRoom", (req, res) => {
  const { roomId, username } = req.body;
  const format = /[ `@#$%^&*()+\-=\[\]{};':"\\|,.\/?~]/;

  if (format.test(roomId)) {
    return res.json({ error: "RoomId contains illegal characters" });
  }

  if (roomId.length < 5 || roomId.length > 20) {
    return res.json({ error: "RoomId must be at least 5 characters and maximum 20 characters length" });
  }
  if (username.length < 3 || roomId.length > 16) {
    return res.json({ error: "Username must be at least 3 characters and maximum 16 characters length" });
  }

  if (format.test(username)) {
    return res.json({ error: "Username contains illegal characters" });
  }

  if (chatData[roomId] && chatData[roomId].users.includes(username)) {
    return res.json({ error: "Username unavailable" });
  }

  if (chatData[roomId]?.users?.length >= 20) {
    return res.json({ error: "Room is full" });
  }

  if (!chatData[roomId]) {
    chatData[roomId] = {
      users: [],
    };
  }

  return res.json({ success: true });
});

const PORT = 5555;
server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
