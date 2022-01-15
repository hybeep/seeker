import * as readline from 'node:readline';
import { stdin as input, stdout as output } from 'process';

let rl = readline.createInterface({ input, output });

const yesResps = ['y', 'Y', ''];

const rdln = {

    readLine: (question) => {
        return new Promise((resolve, reject) => {
            rl.question(question, (answer) => { resolve(answer) });
        });
    },

    callReadLine: (question) => {
        return new Promise((resolve, reject) => {
            rdln.readLine(question).then((answer) => { resolve(answer); });
        });
    },

    callRLYesNo: (question) => {
        return new Promise((resolve, reject) => {
            rdln.readLine(question).then((answer) => {
                if (yesResps.includes(answer)) {
                    resolve(yesResps[0]);
                }
                reject(0);
            });
        });
    },

    chat: () => {
        return new Promise((resolve, reject) => {
            rl.prompt('> ');
            rl.on('pause', () => { reject(); });
            rl.on('line', (answer) => { resolve(answer); });
        });
    },

    pause: () => {
        rl.pause();
    },

    removeListeners: () => {
        rl.removeAllListeners()
    },

    callRLClose: () => {
        rl.close();
    },
}

export { rdln };