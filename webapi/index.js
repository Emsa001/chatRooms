const express = require("express");
const http = require("http");
const socketIo = require("socket.io");
const cors = require("cors");
const fs = require("fs");
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

app.use((req, res, next) => {
  const referer = req.headers.referer || "";

  if (referer.startsWith("https://www.yourwebsite.com")) {
    next();
  } else {
    res.status(403).send("Forbidden");
  }
});

const chatData = {}; // This object will hold both connected users and chat rooms

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
      //chatData[chatId].messages.push(`${username} has joined the chat`);
    } catch (err) {
      console.error(err);
    }
  });

  socket.on("newMessage", (data) => {
    try {
      const { chatId, message, username } = data;

      //chatData[chatId].messages.push(`[${new Date().toISOString()}] ${username}: ${message}`);
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

app.get("/checkRoom/:roomId/:username", (req, res) => {
  const { roomId, username } = req.params;
  if (roomId.length < 5 || roomId.length > 20) {
    return res.json({ error: "RoomId must be at least 5 characters and maximum 20 characters length" });
  }
  if (username.length < 3 || roomId.length > 16) {
    return res.json({ error: "Username must be at least 3 characters and maximum 16 characters length" });
  }

  if (chatData[roomId] && chatData[roomId].users.includes(username)) {
    return res.json({ error: "Username unavailable" });
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
