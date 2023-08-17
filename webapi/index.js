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
      const { roomId, username } = data;

      socket.join(roomId);
      io.to(roomId).emit("infoMessage", { message: `${username} has joined the chat`, joined: true });

      chatData[roomId]?.users?.push(username);

      io.to(roomId).emit("userList", { users: chatData[roomId]?.users });
      socket.username = username;
      socket.roomId = roomId;
    } catch (err) {
      console.error(err);
    }
  });

  socket.on("newMessage", (data) => {
    try {
      const { roomId, message, username } = data;

      io.to(roomId).emit("incomingMessage", { message, username });

      const filePath = `./chats/${roomId}.txt`;
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
      chatData[socket.roomId].users = chatData[socket.roomId].users.filter((user) => user !== socket.username);

      if (chatData[socket.roomId].users.length === 0) {
        delete chatData[socket.roomId];

        const newFileName = `./chats/${socket.roomId}_${uuidv4()}.txt`;
        return fs.rename(`./chats/${socket.roomId}.txt`, newFileName, (err) => {
          if (err) {
            console.error("Error renaming file:", err);
          }
        });
      }

      io.to(socket.roomId).emit("infoMessage", { message: `${socket.username} has disconnected`, joined: false });
      io.to(socket.roomId).emit("userList", { users: chatData[socket.roomId].users });
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

  if (!chatData[roomId]) {
    chatData[roomId] = {
      users: [],
    };
  }

  if (chatData[roomId] && chatData[roomId]?.users?.includes(username)) {
    return res.json({ error: "Username unavailable" });
  }

  if (chatData[roomId]?.users?.length >= 20) {
    return res.json({ error: "Room is full" });
  }

  return res.json({ success: true });
});

const PORT = 5555;
server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
