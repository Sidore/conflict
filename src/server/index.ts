import * as express from "express";
import * as path from "path";
import * as socketServer from "socket.io";
import * as Mongoose from "mongoose";
import {ConflictGame, ConflictGameStates, PlayerMessageTypes, PlayerType} from "../Game";
import DeckRouting from "./Api/Deck"
import { Deck } from "../Game/Models/Deck";

// const { ExpressPeerServer } = require('peer');
// import {ExpressPeerServer} from "peer";

const mongoUrl = "mongodb+srv://Sidore:Co8lZkc0mZyj9Ij3@gamebookcluster-iqnhu.mongodb.net/Conflict?retryWrites=true"

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

server.get('/:room', (req, res) => {
    return res.sendFile(path.join(__dirname, `${extraPass}../dist`, 'index.html'));
})

server.get('/api/lobby', (req, res) => {
    res.json(GameArray.map(i => ({room: i.room, deck: i.deck})));
})

server.post('/api/lobby', (req, res) => {
    const path = makeid(5);
    console.log(path, req.body)

    Deck.findOne({title: req.body.deck})
        .then((deck) => {
            const game = new ConflictGame({playersLimit: 4, io, deck});

            game.gameStateChange(ConflictGameStates.WaitingForPlayers)

            GameArray.push({game, room: path, deck: deck.title})

            res.json({room: path})
        })
})

server.use("/api/deck", DeckRouting)

const PORT = process.env.PORT || 3333;
const httpServer = server.listen(PORT, () => {
    console.log("run on port " + PORT)
})

Mongoose.connect(mongoUrl, 
    { useNewUrlParser: true, 
        useCreateIndex: true, 
        useUnifiedTopology: true })
    .then(() => {
        console.log("Mongo is connected");
    });

    Mongoose.set('useFindAndModify', false);
// const peerServer = ExpressPeerServer(httpServer, {
//     // @ts-ignore
//     // debug: true,
//     port: 3001,
//     path: "myapp",
//     // key: "peerjs"
//   });
const io = socketServer(httpServer);

io.on("connection", (socket) => {
    let player: PlayerType, room, game;
    socket.on("Enter", ({name, roomId, reconnectId}) => {
        try {
            socket.join(roomId)
            game = GameArray.find(g => g.room == roomId);
            console.log(" --- step1 --- ", roomId, GameArray.map(m=> m.room));

            if (game) {
                console.log(" --- step2 --- ",roomId, game.game.state)
                game = game && game.game ? game.game : new Error("lol")
                
                if (reconnectId) {
                    console.log(" --- step3 --- ")
                    player = game.updatePlayer({ reconnectId, socket})
                } else {
                    console.log(" --- step4 --- ");
                    player = game.addPlayer({ title: name, socket})
                }

                room = roomId;
                game.userAction(player,{
                    type: PlayerMessageTypes.Enter
                })

                player.socket.emit("reconnectId", player.id)
                
            }
            
        } catch(e) {
            console.log("Exception in Enter block", e)
        }
    })

    socket.on("message", (message) => {
        try {
            console.log("*******",GameArray, game)
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