import * as _ from 'lodash';
import { Room } from '../models/room';
import { getFile, saveFile } from '../utils/files';
import { checkSession, saveSession } from './session';

const generateId = () => {
    return `${new Date().getTime()}${_.random(99)}`;
}

export const auth = async (session: any) => {
    if (!session.user) {
        session.user = {
            id: generateId()
        };
    }

    checkSession(session);

    await saveSession(session);
    return (session.user);
}

export const updateUsername = async (username: string = '', session: any) => {
    const { roomId, user } = session;
    user.username = username;
    if (roomId) {
        const room = new Room(getFile(`/../rooms/${roomId}.json`));
        const player = room.players.find(player => player.id === user.id);
        player.username = username;
        saveFile(`/../rooms/${roomId}.json`, room.toJson());
    }
    await saveSession(session);
}

export const updateAvatar = async (avatar: string = '', session: any) => {
    const { roomId, user } = session;
    user.avatar = avatar;
    if (roomId) {
        const room = new Room(getFile(`/../rooms/${roomId}.json`));
        const player = room.players.find(player => player.id === user.id);
        player.avatar = avatar;
        saveFile(`/../rooms/${roomId}.json`, room.toJson());
    }
    await saveSession(session);
}