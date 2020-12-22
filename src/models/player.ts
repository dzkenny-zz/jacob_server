export class Player {
    id: string;
    username: string;
    avatar: string;
    status?: string;
    identify?: string;

    constructor(data: Partial<Player>) {
        this.parse(data);
    }

    parse = (data: Partial<Player>) => {
        this.id = data.id || '';
        this.username = data.username || '';
        this.avatar = data.avatar || '';
        this.status = data.status || '';
        this.identify = data.identify || '';
    }

    toJson = () => {
        return {
            id: this.id,
            username: this.username,
            avatar: this.avatar,
            status: this.status,
            identify: this.identify
        }
    }
}