import { getFile, removeFile, saveFile } from "../utils/files";
import { Player } from "../models/player";
import { Room } from "../models/room";
import { User } from "../models/user";
import { saveSession } from "./session";
import * as _ from 'lodash';
import { identity } from "lodash";

type Create = {
    session: any,
    user: User
}

type Join = {
    session: any,
    user: User,
    roomId: string
}

type GetRoom = {
    session: any
}

type UpdateNumber = {
    session: any,
    number: number
}

type UpdateIsRandom = {
    session: any,
    isRandom: boolean
}

type Leave = {
    session: any
}

type UpdateHost = {
    session: any,
    host: string
}

type StartGame = {
    session: any,
    correct: string,
    wrong: string
}

type ReportPlayer = {
    session: any,
    playerId: string
}

type KickPlayer = {
    session: any,
    playerId: string
}

type EndGame = {
    session: any
}

const getWinner = (players: Player[]) => {
    const filterCount = (identity: string) => {
        return players.filter(player => player.identify === identity && player.status === 'alive').length;
    }
    // check is game ended
    const normal = filterCount('normal');
    const spy = filterCount('spy');
    const blank = filterCount('blank');
    let winner = '';
    if (normal === 0) {
        winner = spy === 0 ? 'blank' : 'spy';
    }
    else if (blank === 0 && spy === 0) {
        winner = 'normal';
    }
    return winner;
}

export const create = async ({ session, user }: Create) => {
    const player = new Player(user);
    const room = new Room({
        players: [player],
        host: player.id
    });

    saveFile(`/../rooms/${room.id}.json`, room.toJson());
    session.roomId = room.id;
    await saveSession(session);

    return room;
}

export const join = async ({ session, user, roomId }: Join) => {
    const player = new Player(user);
    const room = new Room(getFile(`/../rooms/${roomId}.json`));
    room.players.push(player);
    saveFile(`/../rooms/${room.id}.json`, room.toJson());
    session.roomId = roomId;
    await saveSession(session);
    return {
        room, // return to join user
        player // return to all joined users
    };
}

export const leave = async ({ session }: Leave) => {
    const { roomId, user } = session;
    const room = new Room(getFile(`/../rooms/${roomId}.json`));
    room.players = room.players.filter(player => player.id !== user.id);
    let winner = '';

    // delete room if no user
    if (!room.players.length) {
        removeFile(`/../rooms/${roomId}.json`);
    }
    else {
        if (room.status === 'progress') {
            if (!room.setting.isRandom) {
                winner = 'spy'
                room.status = 'end';
            }
            else {
                winner = getWinner(room.players);
                if (winner) {
                    room.status = 'end';
                }
            }
        }

        // assign next host if leave player is host
        if (room.host === user.id) {
            room.host = room.players[0].id;
        }

        saveFile(`/../rooms/${room.id}.json`, room.toJson());
    }

    session.roomId = null;
    await saveSession(session);

    return {
        roomId: room.id,
        host: room.host,
        playerId: user.id,
        winner
    };
}

export const getRoom = ({ session }: GetRoom) => {
    const { roomId } = session;
    if (!roomId) {
        return { room: null };
    }

    const roomDoc = getFile(`/../rooms/${roomId}.json`);
    return { room: roomDoc ? new Room(roomDoc) : null };
}

export const updateSpyNumber = ({ session, number }: UpdateNumber) => {
    const { roomId } = session;
    const room = new Room(getFile(`/../rooms/${roomId}.json`));
    room.setting.spy = number;
    saveFile(`/../rooms/${roomId}.json`, room.toJson());
    return room.setting.toJson()
}

export const updateBlankNumber = ({ session, number }: UpdateNumber) => {
    const { roomId } = session;
    const room = new Room(getFile(`/../rooms/${roomId}.json`));
    room.setting.blank = number;
    saveFile(`/../rooms/${roomId}.json`, room.toJson());
    return room.setting.toJson();
}

export const updateIsRandom = ({ session, isRandom }: UpdateIsRandom) => {
    const { roomId } = session;
    const room = new Room(getFile(`/../rooms/${roomId}.json`));
    room.setting.isRandom = isRandom;
    saveFile(`/../rooms/${roomId}.json`, room.toJson());
    return room.setting.toJson();
}

export const updateHost = ({ session, host }: UpdateHost) => {
    const { roomId } = session;
    const room = new Room(getFile(`/../rooms/${roomId}.json`));
    room.host = host;
    saveFile(`/../rooms/${roomId}.json`, room.toJson());
    return host;
}

const getQuestion = () => {
    return {
        correct: '聖誕樹',
        wrong: '大樹'
    };
}

export const startGame = ({ session, correct, wrong }: StartGame) => {
    const { roomId } = session;
    const room = new Room(getFile(`/../rooms/${roomId}.json`));
    let { spy, blank, isRandom } = room.setting;
    const randomQuestion = getQuestion();
    room.setting = _.assign(room.setting, {
        correct: isRandom ? randomQuestion.correct : correct,
        wrong: isRandom ? randomQuestion.wrong : wrong
    });

    const players = [];
    const temp = _.cloneDeep(room.players);

    // if custom, host not in game
    if (!isRandom) {
        const hostIndex = _.findIndex(temp, player => player.id === room.host);
        const host = temp[hostIndex];
        host.identify = 'host';
        players.push(host);
        temp.splice(hostIndex, 1);
    }

    // assign spy
    for (let i = 0; i < spy; i++) {
        const index = _.random(temp.length);
        const player = temp[index];
        player.identify = 'spy';
        players.push(player);
        temp.splice(index, 1);
    }

    // assign blank
    for (let i = 0; i < blank; i++) {
        const index = _.random(temp.length);
        const player = temp[index];
        player.identify = 'blank';
        players.push(player);
        temp.splice(index, 1);
    }

    temp.forEach(player => player.identify = 'normal');
    room.players = _.concat(players, temp);
    room.players.forEach(player => player.status = 'alive');
    room.status = 'progress';

    saveFile(`/../rooms/${roomId}.json`, room.toJson());
}

export const reportPlayer = ({ session, playerId }: ReportPlayer) => {
    const { roomId } = session;
    const room = new Room(getFile(`/../rooms/${roomId}.json`));
    const player = room.players.find(player => player.id === playerId);
    player.status = 'dead';
    
    const winner = getWinner(room.players);
    if (winner) {
        room.status = 'end';
    }

    saveFile(`/../rooms/${roomId}.json`, room.toJson());
    return {
        playerId,
        end: room.status === 'end',
        winner
    };
}

export const kickPlayer = ({ session, playerId }: KickPlayer) => {
    const { roomId } = session;
    const room = new Room(getFile(`/../rooms/${roomId}.json`));
    const index = room.players.findIndex(player => player.id === playerId);
    room.players.splice(index, 1);

    saveFile(`/../rooms/${roomId}.json`, room.toJson());
}

export const endGame = ({ session }: EndGame) => {
    const { roomId } = session;
    const room = new Room(getFile(`/../rooms/${roomId}.json`));
    room.status = 'end';
    saveFile(`/../rooms/${roomId}.json`, room.toJson());
}