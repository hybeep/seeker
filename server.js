import { createServer } from "http";
import { Server } from "socket.io";
import { consts } from './consts.js';

const SERVER = consts.SERVER;
const REGEX = consts.REGEX;
const fiftyMillionFables = consts.SYSTEM.MAX_FILE_SIZE;
const httpServer = createServer();
const io = new Server(httpServer, { maxHttpBufferSize: fiftyMillionFables });
let chats = {};
let files = {};

io.on(SERVER.EVENTS.CONNECTION, (socket) => {

  let ip = substractIP(socket.request.connection.remoteAddress);
  let room;
  const setRoom = ($room) => { room = $room };
  const getRoom = () => room;

  socket.emit(SERVER.EVENTS.CONN_STATUS, (status) => {
    if (status === SERVER.CONN_STATUS.TEST) {
      console.log(`${ip} completed a test connection.`);
      socket.disconnect();
    } else if (status === SERVER.CONN_STATUS.CONN) {
      console.log(`${ip} is connected`);
    } else {
      socket.disconnect();
    }
  });

  socket.on(SERVER.EVENTS.GET_ROOMS, () => {
    if (getRoom()) { emitError(SERVER.ERROR_CODES.JOINED_ALREADY); }
    else { socket.emit(SERVER.EVENTS.AVAILABLE_ROOMS, getRooms()); }
  });

  socket.on(SERVER.EVENTS.JOIN_ROOM, ($room) => {
    if (getRoom()) {
      emitError(SERVER.ERROR_CODES.JOINED_ALREADY);
    } else {
      if ($room === '') {
        emitError(SERVER.ERROR_CODES.EMPTY_VALUE);
      } else if (getNameRooms().includes($room) && checkDuplicateSocket($room)) {
        emitError(SERVER.ERROR_CODES.DUPLICATED_SOCKET);
      } else {
        if (!getNameRooms().includes($room)) {
          chats[$room] = [`${ip} created the room.`];
          files[$room] = [];
        }
        try {
          socket.join(SERVER.FUNCTIONS.setRoomName($room));
          console.log(`${ip} joined to ${$room}`);
          socket.emit(SERVER.EVENTS.NOTIFY_JOIN_ROOM, $room);
          if (chats[$room] !== []) socket.emit(SERVER.EVENTS.EMIT_CHAT, chats[$room]);
          files[$room].forEach((obj) => {
            socket.emit(SERVER.EVENTS.EMIT_FILE, obj);
          });
          chats[$room].push(`${ip} has joined.`);
          socket.broadcast.to(SERVER.FUNCTIONS.setRoomName($room)).emit(SERVER.EVENTS.EMIT_NOTIFICATION, `${ip} has joined.`);
          setRoom($room);
        } catch (err) {
          emitError(SERVER.ERROR_CODES.JOIN_ERROR);
        }
      }
    }
  });

  socket.on(SERVER.EVENTS.SEND_MESSAGE, (msg) => {
    if (getRoom()) {
      chats[getRoom()].push(`${ip}: ${msg}`);
      socket.broadcast.to(SERVER.FUNCTIONS.setRoomName(getRoom())).emit(SERVER.EVENTS.EMIT_MESSAGE, { ip: ip, message: msg });
    } else {
      emitError(SERVER.ERROR_CODES.SEND_ERROR);
    }
  });

  socket.on(SERVER.EVENTS.SEND_FILE, (obj) => {
    if (getRoom()) {
      chats[getRoom()].push(`${ip} sent ${obj.fileName}`);
      obj.ip = ip;
      files[getRoom()].push(obj);
      socket.broadcast.to(SERVER.FUNCTIONS.setRoomName(getRoom())).emit(SERVER.EVENTS.EMIT_FILE, obj);
    } else {
      emitError(SERVER.ERROR_CODES.SEND_ERROR);
    }
  });

  socket.on(SERVER.EVENTS.EXPORT_CHAT, () => {
    if (getRoom()) {
      socket.emit(SERVER.EVENTS.EMIT_EXPORT_CHAT, {fileName: `${getRoom()}.txt`, chat: chats[getRoom()].join('\n')});
    } else {
      emitError(SERVER.ERROR_CODES.EXPORT_CHAT_ERROR);
    }
  });

  socket.on(SERVER.EVENTS.LEAVE_ROOM, () => {
    if (getRoom()) {
      leaveRoom();
    } else {
      emitError(SERVER.ERROR_CODES.LEAVE_ERROR);
    }
  });

  socket.on(SERVER.EVENTS.DISCONNECT, () => {
    if (getRoom()) leaveRoom();
    console.log(`${ip} left`);
  });

  function substractIP(ip) {
    if (REGEX.IP.test(ip)) return ip;
    return substractIP(ip.slice(1));
  }

  function getNameRooms() {
    let nameRooms = [];
    io.sockets.adapter.rooms.forEach((value, key) => {
      if (key.startsWith(SERVER.ROOM_INIT)) {
        nameRooms.push(key.replace(SERVER.ROOM_INIT, ''));
      }
    });
    return nameRooms;
  }

  function getRooms() {
    let availableRooms = {};
    io.sockets.adapter.rooms.forEach((value, key) => {
      if (key.startsWith(SERVER.ROOM_INIT) && !checkDuplicateSocket(key.replace(SERVER.ROOM_INIT, ''))) {
        let sockets = [];
        value.forEach((id) => {
          let socket = io.sockets.sockets.get(id);
          sockets.push(substractIP(socket.request.connection.remoteAddress));
        });
        availableRooms[key.replace(SERVER.ROOM_INIT, '')] = sockets;
      }
    });
    return availableRooms;
  }

  function leaveRoom() {
    try {
      socket.leave(SERVER.FUNCTIONS.setRoomName(getRoom()));
      console.log(`${ip} left ${getRoom()} room.`);
      socket.emit(SERVER.EVENTS.NOTIFY_LEAVE_ROOM, getRoom());
      chats[getRoom()].push(`${ip} has left.`);
      socket.broadcast.to(SERVER.FUNCTIONS.setRoomName(getRoom())).emit(SERVER.EVENTS.EMIT_NOTIFICATION, `${ip} has left.`);
      if (!getNameRooms().includes(getRoom())) {
        delete chats[getRoom()];
        delete files[getRooms()];
      }
      setRoom(undefined);
    } catch (err) {
      emitError(SERVER.ERROR_CODES.LEAVE_ERROR);
    }
  }

  function emitError(error) {
    socket.emit(SERVER.EVENTS.ERROR, error);
  }

  function getRoomSockets(room) {
    let sockets = [];
    io.sockets.adapter.rooms.forEach((value, key) => {
      if (key.startsWith(SERVER.ROOM_INIT)) {
        key = key.replace(SERVER.ROOM_INIT, '');
        if (key == room) {
          value.forEach((id) => {
            let socket = io.sockets.sockets.get(id);
            sockets.push(substractIP(socket.request.connection.remoteAddress));
          });
        }
      }
    });
    return sockets;
  }

  function checkDuplicateSocket(room) {
    if (getRoomSockets(room).includes(ip)) return true;
    return false;
  }

});

httpServer.listen(SERVER.PORT, () => {
  console.log(`Server running on port ${SERVER.PORT}`);
}).on('error', (err) => {
  if (err.code == 'EADDRINUSE') {
    console.log(`Port ${SERVER.PORT} occupied.`);
  } else {
    console.log(err);
  }
});