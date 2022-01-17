import { io } from 'socket.io-client';
import { net } from './network.js';
import { rdln } from './readline.js';
import { consts } from './consts.js';
import { filesys } from './filesystem.js';

const SERVER = consts.SERVER;
const FUNCTIONS = consts.FUNCTIONS;
const COMMANDS = consts.COMMANDS;
const REGEX = consts.REGEX;

let me;
let availableServers = [];

function connection(ip, conn_status) {
    return new Promise((resolve, reject) => {
        let socket = io(SERVER.FUNCTIONS.getURL(ip));
        const timeOut = setTimeout(() => {
            socket.close();
            reject();
        }, SERVER.TIMEOUT);
        socket.on(SERVER.EVENTS.CONN_STATUS, (callback) => {
            clearTimeout(timeOut);
            callback(conn_status);
            if (conn_status === SERVER.CONN_STATUS.CONN) { resolve(socket); }
            else if (conn_status === SERVER.CONN_STATUS.TEST) { resolve(); }
        });
    });
}

async function tryConnect(ips) {
    let server_ips = [];
    for (let ip of ips) {
        await connection(ip, SERVER.CONN_STATUS.TEST)
            .then(() => { server_ips.push(ip); })
            .catch(() => { });
    }
    if (server_ips.length === 0) throw new Error();
    return server_ips;
}

async function connect(ip) {

    let socket;
    let defaultPath = filesys.getAbsolutePath('.');
    let isInRoom = false;

    const setDefaultPath = (path) => { defaultPath = path };
    const getDefaultPath = () => defaultPath;

    await connection(ip, SERVER.CONN_STATUS.CONN)
        .then(($socket) => { socket = $socket; })
        .catch((err) => { throw new Error(); });

    socket.on(SERVER.EVENTS.AVAILABLE_ROOMS, (rooms) => {
        let keys = Object.keys(rooms);
        if (keys.length > 0) {
            console.log('Available rooms:');
            for (let i in keys) console.log(FUNCTIONS.makeList(keys[i], '(' + rooms[keys[i]].join(', ') + ')'));
        } else {
            console.log('No rooms created yet.');
        }
        callChat();
    });

    socket.on(SERVER.EVENTS.NOTIFY_JOIN_ROOM, ($room) => {
        isInRoom = true;
        console.log(`You have joined ${$room} room.`);
        callChat();
    });

    socket.on(SERVER.EVENTS.EMIT_CHAT, (chat) => {
        cleanLastLine();
        console.log(`${chat.join('\n')}\nYou have joined`);
        callChat();
    });

    socket.on(SERVER.EVENTS.EMIT_MESSAGE, (obj) => {
        cleanLastLine();
        console.log(`${obj.ip}: ${obj.message}`);
        callChat();
    });

    socket.on(SERVER.EVENTS.EMIT_FILE, (obj) => {
        cleanLastLine();
        console.log(`Downloading file ${obj.fileName} sent by ${obj.ip} to ${getDefaultPath()}\\${obj.fileName}`);
        filesys.decodeFile(obj.data, `${getDefaultPath()}\\${obj.fileName}`);
        callChat();
    });

    socket.on(SERVER.EVENTS.EMIT_NOTIFICATION, (notif) => {
        cleanLastLine();
        console.log(notif);
        callChat();
    });

    socket.on(SERVER.EVENTS.EMIT_EXPORT_CHAT, (obj) => {
        cleanLastLine();
        filesys.writeFile(`${getDefaultPath()}\\${obj.fileName}`, obj.chat);
        console.log(`Chat has been exported to: ${getDefaultPath()}\\${obj.fileName}`);
        callChat();
    })

    socket.on(SERVER.EVENTS.NOTIFY_LEAVE_ROOM, ($room) => {
        isInRoom = false;
        console.log(`You have left ${$room} room.`);
        callChat();
    });

    socket.on(SERVER.EVENTS.ERROR, (err) => {
        if (err === SERVER.ERROR_CODES.DUPLICATED_SOCKET) {
            console.log('You are already in that room.');
            callChat();
        } else if (err === SERVER.ERROR_CODES.EMPTY_VALUE) {
            console.log('Room name cannot be empty.');
            callChat();
        } else if (err === SERVER.ERROR_CODES.JOINED_ALREADY) {
            console.log('You are already in a room.');
            callChat();
        } else if (err === SERVER.ERROR_CODES.SEND_ERROR) {
            console.log(`You are not in that room.`);
            callChat();
        } else if (err === SERVER.ERROR_CODES.JOIN_ERROR) {
            console.log(`Couldn't join the room.`);
            callChat();
        } else if (err === SERVER.ERROR_CODES.EXPORT_CHAT_ERROR) {
            console.log(`Couldn't export the chat.`)
        } else if (err === SERVER.ERROR_CODES.LEAVE_ERROR) {
            console.log(`Couldn't leave the room.`);
            callChat();
        }
    });

    socket.on(SERVER.EVENTS.DISCONNECT, () => {
        closeSocket();
        rdln.removeListeners();
        console.log('You are disconnected.');
        callInCmd();
    });

    callChat();

    function joinRoom($room) {
        socket.emit(SERVER.EVENTS.JOIN_ROOM, $room);
    }

    function callChat() {
        rdln.chat()
            .then((answer) => {
                if (COMMANDS.PATH.test(answer)) {
                    setDefaultPath(answer.replace(/\/path\s/, ''));
                    filesys.existsOrCreate(getDefaultPath());
                    setDefaultPath(filesys.getAbsolutePath(getDefaultPath()));
                    callChat();
                } else {
                    if (isInRoom) {
                        if (REGEX.file.test(answer)) {
                            answer = filesys.getAbsolutePath(answer);
                            filesys.encodeFile(answer)
                                .then((obj) => {
                                    socket.emit(SERVER.EVENTS.SEND_FILE, obj);
                                    console.log(`You sent ${answer}`);
                                    callChat();
                                }).catch((err) => {
                                    console.log(`File not found at ${answer}`);
                                    callChat();
                                });
                        } else if (answer === COMMANDS.LEAVE) {
                            socket.emit(SERVER.EVENTS.LEAVE_ROOM);
                        } else if (answer === COMMANDS.EXPORT) {
                            socket.emit(SERVER.EVENTS.EXPORT_CHAT);
                        } else {
                            socket.emit(SERVER.EVENTS.SEND_MESSAGE, answer);
                            callChat();
                        }
                    } else {
                        if (answer === COMMANDS.ROOMS) {
                            socket.emit(SERVER.EVENTS.GET_ROOMS);
                        } else if (COMMANDS.JOIN.test(answer)) {
                            joinRoom(answer.split(' ')[1]);
                        } else if (answer === COMMANDS.DISCONNECT) {
                            closeSocket();
                        } else {
                            cleanLastLine();
                            console.log('Invalid command.');
                            callChat();
                        }
                    }
                }

            })
            .catch((err) => {
                rdln.removeListeners();
                callChat();
            });
    }

    function closeSocket() {
        socket.close();
    }

}

function callIPConfig() {
    net.ipconfig()
        .then(($me) => {
            me = $me;
            callInCmd();
        })
        .catch((err) => {
            console.log('You are not connected to internet.');
            rdln.callRLYesNo('Do you want to try again? [y/N] (Default: yes) ')
                .then((resp) => { callIPConfig(); })
                .catch((err) => { rdln.callRLClose(); });
        });
}

function callArpa() {
    net.arpa()
        .then((ips) => {
            callPing(ips);
        })
        .catch((err) => {
            console.log(`Couldn't get local ip addresses. Check your internet connection.`);
            callInCmd();
        });
}

async function callPing(ips) {
    let avIps = [];
    for (let ip of ips) {
        await net.ping(ip)
            .then(() => { avIps.push(ip); })
            .catch((err) => { });
    }
    callTryConnect(avIps);
}

function callTryConnect(ips) {
    if (me) ips.push(me);
    tryConnect(ips)
        .then((servers) => {
            console.log('Available servers in your local network:');
            for (let i in servers) console.log(`${FUNCTIONS.makeList(+i + 1, servers[i])}${servers[i] === me ? ' (you)' : ''}`);
            availableServers = servers;
            callInCmd();
        })
        .catch((err) => {
            availableServers = [];
            console.log(`Couldn't connect to any server.`);
            callInCmd();
        });
}

function callRLConnServer(noServer) {
    noServer = +noServer - 1;
    if (availableServers[noServer]) {
        connect(availableServers[noServer])
            .then(() => {
                cleanLastLine();
                console.log(`Connected to ${availableServers[noServer]}`);
                availableServers = [];
            })
            .catch((err) => {
                console.log(`Failed connecting to ${availableServers[noServer]}`);
                callInCmd();
            });
    } else {
        console.log('Server not found in the list.');
        callInCmd();
    }
}

function callInCmd() {
    rdln.chat()
        .then((answer) => {
            if (answer === COMMANDS.SERVERS) {
                callArpa();
            } else if (COMMANDS.CONNECT.test(answer)) {
                callRLConnServer(REGEX.number.exec(answer)[0]);
            } else if (answer === COMMANDS.EXIT) {
                rdln.callRLClose();
            } else {
                console.log('Invalid command.');
                callInCmd();
            }
        })
        .catch((err) => {
            rdln.removeListeners();
            callInCmd();
        });
}

function cleanLastLine() {
    process.stdout.clearLine();
    process.stdout.cursorTo(0);
    rdln.pause();
    rdln.removeListeners();
}

callIPConfig();