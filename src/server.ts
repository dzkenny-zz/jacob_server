import * as express from "express";
import * as cors from "cors";
import { Server } from 'http';
import * as SocketIo from 'socket.io';
import * as ExpressSession from 'express-session';
import * as FileStore from 'session-file-store';
import * as cookieParser from 'cookie-parser';
import * as bodyParser from 'body-parser';
import { auth } from "./services/auth";
import * as path from 'path';
import { create, getRoom, join, leave, startGame, updateBlankNumber, updateHost, updateSpyNumber, updateIsRandom, reportPlayer } from "./services/room";

const app = express();
const httpServer = new Server(app);
const io = new SocketIo.Server(httpServer);

// socket middleware
const wrap = (middleware: any) => (socket: any, next: any) => middleware(socket.request, {}, next);

// cors
app.use(cors());

// cookies
app.set('trust proxy', 1);
app.use(cookieParser("my-secret"));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }))


// session
const fileStore = FileStore(ExpressSession);
const session = ExpressSession({
    store: new fileStore({}),
    secret: "my-secret",
    resave: true,
    saveUninitialized: true,
    cookie: {
        maxAge: 1000 * 60 * 60 * 24 * 365 * 5
    }
})
app.use(session);
io.use(wrap(session));

// whenever a user connects on port 3000 via
// a websocket, log that a user has connected
io.on("connection", async (socket: any) => {
    // join chatroom
    const { roomId } = socket.request.session;
    if (roomId) {
        socket.join(roomId);
    }

    socket.on('/game/create', async () => {
        const user = socket.request.session.user
        const room = await create({
            session: socket.request.session,
            user
        });
        socket.join(room.id);
        socket.emit('/game/create', room);
    });

    socket.on('/game/join', async (roomId: string) => {
        const user = socket.request.session.user
        const { player, room } = await join({
            session: socket.request.session,
            user,
            roomId
        });

        // reply to all user who joined the room first
        // avoid join user listened the change
        io.to(roomId).emit('/game/join', player);

        // reply to join user
        socket.join(room.id);
        socket.emit('/game/join/all', room);
    });

    socket.on('/game/setting/blank', async (number: number) => {
        const { roomId } = socket.request.session;
        const setting = await updateBlankNumber({
            session: socket.request.session,
            number
        });
        io.to(roomId).emit('/game/setting', setting);
    });

    socket.on('/game/setting/spy', async (number: number) => {
        const { roomId } = socket.request.session;
        const setting = await updateSpyNumber({
            session: socket.request.session,
            number
        });
        io.to(roomId).emit('/game/setting', setting);
    });

    socket.on('/game/setting/isRandom', async (isRandom: boolean) => {
        const { roomId } = socket.request.session;
        const setting = await updateIsRandom({
            session: socket.request.session,
            isRandom
        });
        io.to(roomId).emit('/game/setting', setting);
    });

    socket.on('/game/quit', async () => {
        const { session } = socket.request;
        const resp = await leave({ session });
        socket.leave(resp.roomId);
        io.to(roomId).emit('/game/quit', resp);
    });

    socket.on('/game/host', async (host: string) => {
        const { session } = socket.request;
        const resp = await updateHost({ session, host });
        io.to(session.roomId).emit('/game/host', host);
    });

    socket.on('/game/start', async (req: any) => {
        try {
            const { correct, wrong } = req;
            const { session } = socket.request;
            const { roomId } = session;
            await startGame({ session, correct, wrong });
            io.to(roomId).emit('/game/start');
        } catch (error) {
            console.log(error.message);
        }
    });

    socket.on('/game/report', async (playerId: string) => {
        const { session } = socket.request;
        const resp = await reportPlayer({ session, playerId });
        io.to(session.roomId).emit('/game/report', resp);
    });
});

// public files
app.use(express.static("public"));
app.get('/', (req: any, res: any) => {
    res.sendFile(path.join(__dirname, '../public', 'index.html'))
})

app.post("/login", async (req: any, res: any) => {
    try {
        const { username } = req.body;
        const resp = await auth(username, req.session);
        res.status(200).json(resp).end();
    } catch (error) {
        res
            .status(500)
            .json({ message: error.message })
            .end();
    }
});

app.get('/room', async (req: any, res: any) => {
    try {
        const resp = await getRoom({ session: req.session });
        res.status(200).json(resp).end();
    } catch (error) {
        res
            .status(500)
            .json({ message: error.message })
            .end();
    }
})

app.set("port", process.env.PORT || 3000);
const server = httpServer.listen(3000, function () {
    console.log("listening on *:3000");
});