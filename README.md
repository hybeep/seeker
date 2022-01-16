# Seeker

A server (server.js) must be running on a computer. When a client (client.js) is launched, you can run the next commands:

/servers: lists the active servers, even when the server is running on the same computer.
/connect [noServer]: noServer is the number of server in the list created by /servers command.

After connecting to a server, you can run the next commands:

/path [relative_path]: to define the default path where received files are saved.
/rooms: lists the rooms on the server.
/join [nameRoom]: if there is no active room named nameRoom, it will be created.
/leave: to leave the room.
/disconnect: to disconnect from the server.

While in a room, you can send a file by simply typing its relative path in the chat. 

To exit the program run:

/exit.
