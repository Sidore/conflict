import * as express from "express";
import * as path from "path";
import * as socketServer from "socket.io";
import {ConflictGame, ConflictGameStates, PlayerMessageTypes} from "../Game";

const extraPass = __dirname.indexOf("distServer") === -1 ? "../" : "";

const server = express();
server.use(express.json());

server.use(function (req, res, next) {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Methods", "POST, GET, OPTIONS, DELETE")
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept, Authorization");
    next();
});
server.use("/dist", express.static(path.join(__dirname, `${extraPass}../dist`)));
server.use("/public", express.static(path.join(__dirname, `${extraPass}../public`)));

server.get("/", (req: express.Request, res: express.Response) => {
    return res.sendFile(path.join(__dirname, `${extraPass}../dist`, 'index.html'));
})

const PORT = process.env.PORT || 3333;
const httpServer = server.listen(PORT, () => {
    console.log("run on port " + PORT)
})
const io = socketServer(httpServer);

const game = new ConflictGame({playersLimit: 4, io});

game.gameStateChange(ConflictGameStates.WaitingForPlayers)
// const players = []

io.on("connection", (socket) => {
    let player;
    socket.on("Enter", ({name}) => {
        player = game.addPlayer({ title: name, socket})
        game.userAction(player,{
            type: PlayerMessageTypes.Enter
        })
    })

    socket.on("message", (message) => {
        game.userAction(player,{
            type: message.type,
            content: message.content
        })
    })

    socket.on('disconnect', (data) => {
        // let index = players.findIndex(p => p.id === player.id);
        // if(index !== -1) {
        //     players.splice(index,1);
        // }   
    });
});