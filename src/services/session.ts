import { Room } from "../models/room";
import { getFile } from "../utils/files";

export const saveSession = (session: any) => {
    return new Promise((resolve, reject) => {
        session.save((err: any) => {
            if (err) {
                console.error(err);
                return reject(err);
            }
            resolve(session);
        })
    })
}

export const checkSession = async (session: any) => {
    if (session.roomId) {
        const roomDoc = getFile(`/../rooms/${session.roomId}.json`);
        // room is removed already
        if (!roomDoc) {
            session.roomId = null;
        }

        const room = new Room(roomDoc);
        const player = room.players.find(p => p.id === session.user.id);

        // player was kicked by host
        if (!player) {
            session.roomId = null;
        }
    }
}