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
        GET_SERVERS: '/get_servers',
        CONNECT_TO_SERVER: /^\/connect_to_server\s\d+$/,
        GET_ROOMS: '/get_rooms',
        JOIN_TO_ROOM: /^\/join_to_room\s\w+$/,
        LEAVE_ROOM: '/leave_room',
        LEAVE_SERVER: '/leave_server',
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
    },
    SERVER: {
        CONN_STATUS: {
            CONN: 'connection',
            TEST: 'test',
        },
        ERROR_CODES: {
            EMPTY_VALUE: 'emp_val',
            DUPLICATED_SOCKET: 'dup_sock',
            JOIN_ERROR: 'join_error',
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
            EMIT_MESSAGE: 'emitMessage',
            EMIT_CHAT: 'emitChat',
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
    },
}

export { consts };