import React, { useEffect, useState } from "react";
import io from "socket.io-client";
import MessageList from "./components/MessageList";
import MessageInput from "./components/MessageInput";
import axios from "axios";

import Swal from "sweetalert2";
import "@sweetalert2/theme-dark/dark.scss";
import ConnectedUsers from "./components/ConnectedUsers";

const api = "http://localhost:5555";

const App = () => {
  const [socket, setSocket] = useState(null);
  const [roomId, setroomId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [users, setUsers] = useState([]);

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

        const rawData = await axios.post(`${api}/checkRoom`, { roomId, username: user });
        if (rawData.data.error) {
          return Swal.showValidationMessage(rawData.data.error);
        }

        setUsername(user);
        setroomId(roomId);

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
        socket.emit("newMessage", { roomId, message, username });
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

      socket.on("userList", (data) => {
        setUsers(data.users);
        console.log(data);
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

      newSocket.emit("joinChat", { roomId: roomId, username: user });
      setMessages([]);
    }
  };

  return (
    <div className="bg-gray-900 min-h-screen text-white pt-10">
      <div className="flex flex-col md:flex-row px-5">
        <div className="w-0 xl:w-1/3"></div>
        <div className="w-full">
          <h1 className="text-3xl text-center mb-4">Room ID: {roomId}</h1>
          <MessageList messages={messages} username={username} />
          <MessageInput sendMessage={sendMessage} />
        </div>
        <div className="w-full md:w-1/3">
          <ConnectedUsers users={users} />
        </div>
      </div>
    </div>
  );
};

export default App;
