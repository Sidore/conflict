import * as express from "express";
import * as path from "path";
import * as socketServer from "socket.io";
import {ConflictGame, ConflictGameStates, PlayerMessageTypes} from "../Game";
// const { ExpressPeerServer } = require('peer');
// import {ExpressPeerServer} from "peer";

const extraPass = __dirname.indexOf("distServer") === -1 ? "../" : "../";

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

// server.get("/", (req: express.Request, res: express.Response) => {
    
// })

function makeid(length) {
    var result           = '';
    var characters       = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    var charactersLength = characters.length;
    for ( var i = 0; i < length; i++ ) {
       result += characters.charAt(Math.floor(Math.random() * charactersLength));
    }
    return result;
 }
 
//  console.log(makeid(5));

const GameArray = [];
server.get('/', (req, res) => {
    return res.sendFile(path.join(__dirname, `${extraPass}../dist`, 'index.html'));
})

// server.get('/:room', (req, res) => {
//     return res.sendFile(path.join(__dirname, `${extraPass}../dist`, 'index.html'));
// })

server.get('/api/lobby', (req, res) => {
    res.json(GameArray.map(i => i.room));
})

server.post('/api/lobby', (req, res) => {
    const path = makeid(5);
    console.log(path)

    const game = new ConflictGame({playersLimit: 4, io});

    game.gameStateChange(ConflictGameStates.WaitingForPlayers)

    GameArray.push({game, room: path})

    res.json({room: path})
})



const PORT = process.env.PORT || 3333;
const httpServer = server.listen(PORT, () => {
    console.log("run on port " + PORT)
})


// const peerServer = ExpressPeerServer(httpServer, {
//     // @ts-ignore
//     // debug: true,
//     port: 3001,
//     path: "myapp",
//     // key: "peerjs"
//   });
  const io = socketServer(httpServer);

  
// @ts-ignore
// server.use('/peerjs', peerServer);

// console.log(peerServer);



// const players = []

io.on("connection", (socket) => {
    let player, room, game;
    socket.on("Enter", ({name, roomId}) => {
        try {
            socket.join(roomId)
            game = GameArray.find(g => g.room == roomId);
            game = game ? game.game : new Error("lol")
            console.log(roomId,GameArray)
            player = game.addPlayer({ title: name, socket})
            room = roomId;
            game.userAction(player,{
                type: PlayerMessageTypes.Enter
            })
        } catch(e) {
            console.log("Exception in Enter block", e)
        }
    })

    socket.on("message", (message) => {
        try {
            game.userAction(player,{
                type: message.type,
                content: message.content
            })
        } catch(e) {
            console.log("Exception in message block", e)
        }
    })

    socket.on('disconnect', (data) => {
        // let index = players.findIndex(p => p.id === player.id);
        // if(index !== -1) {
        //     players.splice(index,1);
        // }   
    });

    socket.on('join-room', (userObj) => {
        socket.to(room).broadcast.emit('user-connected', userObj)
    
        socket.on('disconnect', () => {
            socket.to(room).broadcast.emit('user-disconnected', userObj)
        })
      })
});