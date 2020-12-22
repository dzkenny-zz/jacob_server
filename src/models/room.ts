import { Setting } from "./setting";
import { Player } from "./player";
import * as _ from 'lodash';
import * as fs from 'fs';

export class Room {
    id: string;
    status: 'waiting' | 'progress' | 'end';
    players: Player[];
    setting: Setting;
    host: string;

    constructor(data: Partial<Room>) {
        this.parse(data);
    }

    parse = (data: Partial<Room>) => {
        this.id = data.id || this.generateId();
        this.status = data.status || 'waiting';
        this.players = data.players.map(player => new Player(player));
        this.setting = new Setting(data.setting);
        this.host = data.host || '';
    }

    generateId = (): string => {
        let pass = false;
        let roomId;
        while (!pass) {
            roomId = _.random(9999);
            pass = !fs.existsSync(`../../rooms/${roomId}.json`);
        }
        return roomId.toString();
    }

    toJson = () => {
        return {
            id: this.id,
            status: this.status,
            host: this.host,
            players: this.players.map(player => new Player(player).toJson()),
            setting: this.setting.toJson()
        };
    }
}