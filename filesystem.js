import * as fs from 'fs/promises';
import { consts } from './consts.js';

const REGEX = consts.REGEX;
const maxSize = consts.SYSTEM.MAX_FILE_SIZE;

const filesys = {

    encodeFile: async (url) => {
        const stat = await fs.stat(url);
        if (stat.size > maxSize) throw new Error();
        const data = await fs.readFile(url, { encoding: 'base64' });
        let res = REGEX.file.exec(url);
        let lastNumIndex = 0;
        res.forEach((value, index) => { if (typeof index === 'number') lastNumIndex = index; });
        return { data: data, fileName: res[lastNumIndex] };
    },

    decodeFile: (data, fileName) => {
        fs.writeFile(fileName, data, { encoding: 'base64' })
            .catch((err) => {
                console.log(err);
            });
    },

    existsOrCreate: (url) => {
        fs.readdir(url)
            .then((files) => { })
            .catch((err) => { fs.mkdir(url); });
    }

}

export { filesys };