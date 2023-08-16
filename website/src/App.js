import React, { useEffect, useState } from "react";
import io from "socket.io-client";
import MessageList from "./components/MessageList";
import MessageInput from "./components/MessageInput";
import axios from "axios";

import Swal from "sweetalert2";
import "@sweetalert2/theme-dark/dark.scss";

const api = "http://localhost:5555";

const App = () => {
  const [socket, setSocket] = useState(null);
  const [chatId, setChatId] = useState(null);
  const [messages, setMessages] = useState([]);

  const [username, setUsername] = useState("");

  const search = window.location.search;
  const params = new URLSearchParams(search);

  function showLogin() {
    return Swal.fire({
      title: "Join or create new chat",
      html: '<input id="username" class="swal2-input" placeholder="Username">' + '<input id="roomId" class="swal2-input" placeholder="Room Id">',
      showCancelButton: false,
      confirmButtonText: "Join",
      allowOutsideClick: false,
      preConfirm: async () => {
        const user = document.getElementById("username").value;
        const roomId = document.getElementById("roomId").value;

        const rawData = await axios.get(`${api}/checkRoom/${roomId}/${user}`);
        console.log(api);
        if (rawData.data.error) {
          return Swal.showValidationMessage(rawData.data.error);
        }

        setUsername(user);
        setChatId(roomId);

        return [roomId, user];
      },
    }).then((result) => {
      if (result.isConfirmed) {
        handleJoinChat(result.value[0], result.value[1]);
      }
    });
  }

  useEffect(() => {
    showLogin();
  }, []);

  const sendMessage = (message) => {
    try {
      if (socket) {
        socket.emit("newMessage", { chatId, message, username });
      }
    } catch (error) {
      console.error("Error sending message:", error);
    }
  };

  useEffect(() => {
    if (socket) {
      socket.on("incomingMessage", (data) => {
        setMessages((prevMessages) => [...prevMessages, { message: data.message, username: data.username }]);
      });

      socket.on("infoMessage", (data) => {
        setMessages((prevMessages) => [...prevMessages, { message: data.message, info: true, joined: data.joined }]);
      });
    }
  }, [socket]);

  const handleJoinChat = (roomId, user) => {
    if (roomId.trim() !== "") {
      if (socket) {
        socket.disconnect();
      }

      const newSocket = io(api, {
        transports: ["websocket"],
      });
      setSocket(newSocket);

      console.log(user);
      newSocket.emit("joinChat", { chatId: roomId, username: user });
      setMessages([]);
    }
  };

  return (
    <div className="bg-gray-900 min-h-screen flex flex-col items-center text-white pt-10">
      <h1 className="text-3xl mb-4">Room ID: {chatId}</h1>

      <MessageList messages={messages} username={username} />
      <MessageInput sendMessage={sendMessage} />
    </div>
  );
};

export default App;
