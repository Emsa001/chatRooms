import React from "react";

const ConnectedUsers = ({ users }) => {
  return (
    <div className="ml-10">
      <h2 className="font-bold mb-2">Connected Users ({users.length}/20):</h2>
      <ul>
        {users.map((user, index) => {
          return (
            <div key={`info_${index}`} className={`flex items-center self-center rounded-xl bg-teal-800 py-2 px-3 text-white`}>
              <p>{user}</p>
            </div>
          );
        })}
      </ul>
    </div>
  );
};

export default ConnectedUsers;
