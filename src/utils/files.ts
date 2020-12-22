import * as fs from 'fs';
import * as path from 'path';

export const saveFile = (location: string, data: any) => {
    fs.writeFileSync(`${path.dirname(__dirname)}${location}`, JSON.stringify(data, null, 2));
}

export const getFile = (location: string) => {
    if (!fs.existsSync(`${path.dirname(__dirname)}${location}`)) {
        return null;
    }
    return JSON.parse(fs.readFileSync(`${path.dirname(__dirname)}${location}`, { encoding: 'utf-8' }));
}

export const removeFile = (location: string) => {
    fs.unlinkSync(`${path.dirname(__dirname)}${location}`);
}