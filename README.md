#Seeker

A server (server.js) must be running on a computer. When a client (client.js) is launched, you can run the next commands:

/get_servers: it will list the active servers, even when the server is running on the same computer.
/connect_to_server [noServer]: noServer is the number of server in the list created by /get_servers command.

After connecting to a server, you can run the next commands:

/get_rooms: lists all the rooms in the server.
/join_to_room [nameRoom]: if there is not an active room called nameRoom it will be created.
/leave_room
/leave_server

To exit the program run:

/exit
