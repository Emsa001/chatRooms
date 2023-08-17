import React, { useEffect, useRef } from "react";

const MessageList = ({ messages, username }) => {
  const messagesEndRef = useRef(null);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <div className="flex h-[80vh] flex-col bg-gray-800 rounded-3xl">
      <div className="flex-grow overflow-y-auto">
        <div className="flex flex-col space-y-2 p-4">
          {messages.map((msg, index) => {
            if (msg.info === true) {
              return (
                <div key={`info_${index}`} className={`flex items-center self-center rounded-xl ${msg.joined ? "bg-teal-700" : "bg-red-700"} py-2 px-3 text-white w-auto`}>
                  <p className="w-full break-words whitespace-pre-wrap">{msg.message}</p>
                </div>
              );
            }

            if (msg.username === username) {
              return (
                <div key={`${username}_${index}`} className="flex items-center self-end rounded-xl rounded-tr bg-blue-500 py-2 px-3 text-white max-w-[500px]">
                  <p className="w-full break-words whitespace-pre-wrap">{msg.message}</p>
                </div>
              );
            }

            return (
              <div key={`${username}_${index}`} className="flex flex-col self-start">
                <div>{msg.username}</div>
                <div className=" rounded-xl rounded-tl bg-gray-600 py-2 px-3 text-white max-w-[500px]">
                  <p className="w-full break-words whitespace-pre-wrap">{msg.message}</p>
                </div>
              </div>
            );
          })}
          <div ref={messagesEndRef} />
        </div>
      </div>
    </div>
  );
};

export default MessageList;
