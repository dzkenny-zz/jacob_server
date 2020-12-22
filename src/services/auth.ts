import * as _ from 'lodash';
import { saveSession } from './session';

const generateId = () => {
    return `${new Date().getTime()}${_.random(99)}`;
}

export const auth = async (username: string = '', session: any) => {
    if (!session.user) {
        session.user = {
            id: generateId(),
            username
        };
    }
    else if (username) {
        session.user.username = username;
    }

    await saveSession(session);
    return (session.user);
}