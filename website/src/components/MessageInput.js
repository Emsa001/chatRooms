import React, { useState } from "react";

const MessageInput = ({ sendMessage }) => {
  const [message, setMessage] = useState("");

  const handleSendMessage = (e) => {
    e.preventDefault();

    if (message.trim() !== "") {
      sendMessage(message);
      setMessage("");
    }
  };

  const handleInputChange = (e) => {
    const inputMessage = e.target.value;

    if (inputMessage.length <= 2000) {
      setMessage(inputMessage);
    }
  };

  return (
    <div className="w-full max-w-3xl mt-4 mt-auto mb-5">
      <form onSubmit={handleSendMessage} className="flex gap-3">
        <input type="text" value={message} onChange={handleInputChange} className="w-full bg-gray-800 text-white p-2 rounded-lg" placeholder="Type your message..." />
        <button type="submit" className="bg-blue-500 text-white px-4 py-3 rounded-lg">
          Send
        </button>
      </form>
    </div>
  );
};

export default MessageInput;
