import { promisify } from 'util';
import * as childProcess from 'child_process';
import { consts } from './consts.js';

const exec = promisify(childProcess.exec);
const COMMANDS = consts.COMMANDS;
const FUNCTIONS = consts.FUNCTIONS;
let me;
let ip_start;

const net = {

  ipconfig: async () => {
    await exec(COMMANDS.IPCONFIG)
      .then((resp) => {
        me = FUNCTIONS.getMeFromIpConfig(resp.stdout);
        if (resp.stderr !== '' || me === 0) throw new Error();
        console.log(`\nYour local IP address: ${me}`);
        ip_start = me.split('.');
        ip_start.pop();
        ip_start = ip_start.join('.');
      });
    return me;
  },

  arpa: async () => {
    let ips = ['They call me The Seeker.'];
    await exec(COMMANDS.ARPA)
      .then((resp) => {
        if (resp.stderr !== '') throw new Error();
        ips = FUNCTIONS.getIpsFromArpa(resp.stdout);
        ips = ips.filter(ip => ip.includes(ip_start) && ip !== me && FUNCTIONS.checkIpsRt(ip));
      });
    return ips;
  },

  ping: async (ip) => {
    await exec(COMMANDS.PING(ip))
      .then((resp) => {
        if (!FUNCTIONS.checkPing(resp.stdout)) throw new Error();
      })
      .catch((err) => {});
    return;
  },

}

export { net };