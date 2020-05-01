import * as express from "express";
import * as path from "path";
import * as socketServer from "socket.io";

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

const players = []

io.on("connection", (socket) => {
    let player;
    socket.on("join", ({name}) => {
        player = {
            name,
            
        }

        players.push(player)

        
    })

    socket.on("start game", () => {
        if (players.length < 4) { 
            socket.emit("messege", `cant start, have to wait for other player, need at least ${4 - players.length}`)
        } else {
            io.emit("messege", `game is started by ${player.name}`)
        }
    })

    socket.on('disconnect', (data) => {
        let index = players.findIndex(p => p.id === player.id);
        if(index !== -1) {
            players.splice(index,1);
        }   
    });
});