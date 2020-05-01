import { Socket } from "socket.io";
import * as chalk from "chalk";
import { v4 as uuidv4 } from 'uuid';


enum ConflictGameStates {
    Init = 0,
    WaitingForPlayers = 1,
    Idle,
    Start = 2,
    CardsGive = 3,
    CardsWaiting = 4,
    Desicion = 5,
    Round = 6
}

enum PlayerRoleTypes {
    Leader,
    Second
}

interface PlayerType {
    id: string;
    title: string;
    socket: Socket;
    role: PlayerRoleTypes;
}

enum MessageTypes {
    Info = "message",
    Action = "action",
    Warn = "warn",
    Error = "error"
}

interface MessageType {
    content: string;
    type: MessageTypes
}

enum PlayerMessageTypes {
    Enter,
    Start,
    SecondCardPropose,
    FirstCardDecision
}

export default class ConflictGame {
    private players: PlayerType[];
    private state: ConflictGameStates;
    private startPlayersLimit: number;
    private io: any;

    constructor({playersLimit, io}) {
        this.state = ConflictGameStates.Init;
        this.startPlayersLimit = playersLimit;
        this.players = [];
        this.io = io;
    }

    broadcast(message: MessageType, role?: PlayerRoleTypes) {
        console.log(`${chalk.black.bgGreen(" Broadcasted message ")} to group ${chalk.green(role)} message '${chalk.green(message.content)}'`);
        this.players.forEach((player) => {
            if ((role && player.role === role) || !role){
                player.socket.emit(MessageTypes[message.type], message.content)
            }
        });
    }

    forEach(callBack) {
        this.players.forEach(callBack);
    }

    map(callBack) {
        return this.players.map(callBack);
    }

    addPlayer({title, socket}): PlayerType {
        const player = {
            id: uuidv4(), 
            title, 
            socket,
            role: PlayerRoleTypes.Second
        }
        console.log(`${chalk.black.bgGreen(" New player ")} title: ${title} - id: ${player.id}`);

        this.players.push(player);

        return player;
    }

    playerChangeStatus(player?: PlayerType, id?, role?: PlayerRoleTypes) {
        const finaleRole = role ? role : PlayerRoleTypes.Second;
        if (player) {
            console.log(`Player ${player.title} is changing role ${chalk.black.bgBlue(PlayerRoleTypes[player.role])} --> ${chalk.black.bgBlue(PlayerRoleTypes[finaleRole])}`)
            player.role = finaleRole;
        } else {
            if (id) {
                let p = this.players.find(p => p.id === id);
                if (p) {
                    player.role = finaleRole;
                } else {
                    console.log(`${chalk.black.bgRed(" 404 ")} cannot find player with id ${id}`, this.players.map((pl => ({
                        id: pl.id,
                        title: pl.title,
                        role: pl.role
                    }))))
                }
            } else {
                console.log(`${chalk.black.bgRed(" 404 ")}  no id, no player was provided`, this.players.map((pl => ({
                    id: pl.id,
                    title: pl.title,
                    role: pl.role
                }))))
            }
        }
    }

    gameStateChange(state?: ConflictGameStates) {
        if (!state) {
            state = ConflictGameStates.Idle;
        }
        console.log(`Game state is changing ${chalk.black.bgBlueBright(ConflictGameStates[this.state])} --> ${chalk.black.bgBlueBright(ConflictGameStates[state])}`)
        this.state = state;
    }

    userAction(player: PlayerType, action : {type: PlayerMessageTypes, content: string}) {
        switch(this.state) {
            case ConflictGameStates.WaitingForPlayers: {
                const limitPassed = this.players.length >= this.startPlayersLimit
                if (PlayerMessageTypes.Enter) {
                    if (limitPassed) {
                        this.broadcast({type: MessageTypes.Info, content: `Room is packed enough, can start after command`});
                    } else {
                        this.broadcast({type: MessageTypes.Info, content: `Should wait for other player, need at least ${4 - this.players.length}`});
                    }
                } else if(limitPassed){
                    if (this.players.length >= this.startPlayersLimit) {
                        this.broadcast({type: MessageTypes.Action, content: `start`});
                        this.startGame();
                    } else {
                        this.broadcast({type: MessageTypes.Info, content: `Cannot start now, should wait for other player, need at least ${4 - this.players.length}`});
                    }
                }
            }
            case ConflictGameStates.Start: {
                    
                    break;
                }
            case ConflictGameStates.Round: break;
            case ConflictGameStates.CardsGive: break;
            case ConflictGameStates.CardsWaiting: break;
            case ConflictGameStates.Desicion: break;
            case ConflictGameStates.Idle: break;
            default: ;
        }
    }
    
    startGame() {
        this.gameStateChange(ConflictGameStates.WaitingForPlayers);
    }



}