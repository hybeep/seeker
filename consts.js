import { platform } from 'process';

const isWin = platform === 'win32';
const isMac = platform === 'darwin';
const isLinux = platform === 'linux';

const consts = {
    COMMANDS: {
        IPCONFIG: (isWin) ? 'ipconfig' : (isMac || isLinux) ? 'ifconfig' : 0,
        ARPA: 'arp -a',
        PING: (ip) => {
            return (isWin) ? `ping ${ip}` : (isMac || isLinux) ? `ping ${ip} -c 4 ` : 0;
        },
        PATH: /^\/path\s(.+)\/([^\/]+)$/,
        SERVERS: '/servers',
        CONNECT: /^\/connect\s\d+$/,
        ROOMS: '/rooms',
        JOIN: /^\/join\s\w+$/,
        LEAVE: '/leave',
        DISCONNECT: '/disconnect',
        EXIT: '/exit',
    },
    FUNCTIONS: {
        makeList: (index, value) => {
            return `   ${index}      ${value}`;
        },
        getMeFromIpConfig: (resp) => {
            let me = 0;
            resp = resp.replace(/\n/g, ' ').replace(/\r/g,' ');
            resp = resp.split(' ').filter(element => consts.REGEX.IP.test(element));
            if (resp.length >= 1) me = (isWin) ? resp[0] : (isMac || isLinux) ? resp[1] : 0;
            return me;
        },
        getIpsFromArpa: (resp) => {
            let ips = [];
            if (isWin) ips = resp.split(' ').filter(element => consts.REGEX.IP.test(element));
            if (isMac || isLinux) resp.split(' ').filter(element => element[0]==='(' && element[element.length-1]===')').forEach((i) => {let ip = i.slice(1, i.length - 1); if (consts.REGEX.IP.test(ip)) ips.push(ip);});
            return ips;
        },
        checkIpsRt: (ip) => {
            return (ip.split('.')[3] != '255' && ip.split('.')[3] != '1');
        },
        checkPing: (resp) => {
            let status = 0;
            if (isWin) status = resp.includes('(0%') ? 1 : 0;
            if (isMac || isLinux) status = resp.includes(' 0.0% ') ? 1 : 0;
            return status;
        },
    },
    REGEX: {
        IP: /^(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/,
        number: /\d+/,
        file: /^(.+)\/([^\/]+)$/,
    },
    SERVER: {
        CONN_STATUS: {
            CONN: 'connection',
            TEST: 'test',
        },
        ERROR_CODES: {
            EMPTY_VALUE: 'emp_val',
            DUPLICATED_SOCKET: 'dup_sock',
            JOINED_ALREADY: 'joined_already',
            JOIN_ERROR: 'join_error',
            SEND_ERROR: 'send_error',
            LEAVE_ERROR: 'leave_error',
        },
        EVENTS: {
            CONNECTION: 'connection',
            CONN_STATUS: 'connStatus',
            GET_ROOMS: 'getRooms',
            AVAILABLE_ROOMS: 'availableRooms',
            JOIN_ROOM: 'joinRoom',
            NOTIFY_JOIN_ROOM: 'notifyJoinRoom',
            SEND_MESSAGE: 'sendMessage',
            SEND_FILE: 'sendFile',
            EMIT_CHAT: 'emitChat',
            EMIT_MESSAGE: 'emitMessage',
            EMIT_FILE: 'emitFile',
            EMIT_NOTIFICATION: 'emitNotification',
            LEAVE_ROOM: 'leaveRoom',
            NOTIFY_LEAVE_ROOM: 'notifyLeaveRoom',
            ERROR: 'error',
            DISCONNECT: 'disconnect',
        },
        FUNCTIONS: {
            getURL: (ip) => {
                return `http://${ip}:${consts.SERVER.PORT}`;
            },
            setRoomName: (roomName) => {
                return consts.SERVER.ROOM_INIT + roomName;
            },
        },
        PORT: 3000,
        ROOM_INIT: '<<<ShareRoom>>>',
        TIMEOUT: 1000,
    },
    SYSTEM: {
        TIMEOUT: 5000,
        MAX_FILE_SIZE: 50e6,
    },
}

export { consts };