import { Socket } from "socket.io";
import * as chalk from "chalk";
import { v4 as uuidv4 } from 'uuid';


export enum ConflictGameStates {
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
    secondCards: number;
}

export enum CardTypes {
    LeadCard,
    SecondCard
}
export interface Card {
    type: CardTypes,
    title: string,
    content: string,
    given: boolean
}

export enum MessageTypes {
    Message = "Message",
    Action = "Action",
    Warn = "Action",
    Error = "Error",
    Card = "Card"
}

export interface MessageType {
    content: string;
    type: MessageTypes
}

export enum PlayerMessageTypes {
    Enter,
    Start,
    SecondCardPropose,
    FirstCardDecision
}

export class ConflictGame {
    private players: PlayerType[];
    private state: ConflictGameStates;
    private startPlayersLimit: number;
    private io: any;
    private deck: Card[];
    private cardsForRound: Card[];

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
                if(!role) {
                    console.log("message to",player.title, message.type, MessageTypes[message.type])
                }
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
            role: PlayerRoleTypes.Second,
            secondCards: 0
        }
        console.log(`${chalk.black.bgGreen(" New player ")} title: ${title} - id: ${player.id}`);

        this.players.push(player);

        return player;
    }

    playerChangeStatus(player?: PlayerType, id?, role?: PlayerRoleTypes) {
        console.log({
            name: player.title,
            role: player.role
        },id,role)
        const finaleRole = role === undefined ? role : PlayerRoleTypes.Second;
        if (player) {
            console.log(`Player ${player.title} is changing role ${chalk.black.bgBlue(PlayerRoleTypes[player.role])} --> ${chalk.black.bgBlue(PlayerRoleTypes[finaleRole])}`)
            player.role = finaleRole;
        } else {
            if (id) {
                let p = this.players.find(p => p.id === id);
                if (p) {
                    console.log(`Player ${player.title} is changing role ${chalk.black.bgBlue(PlayerRoleTypes[player.role])} --> ${chalk.black.bgBlue(PlayerRoleTypes[finaleRole])}`)
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

    userAction(player: PlayerType, action: {type: PlayerMessageTypes, content?: string}) {
        console.log("*** 1 ***")
        switch(this.state) {
            case ConflictGameStates.WaitingForPlayers: {
                console.log("*** 2 ***", action)
                const limitPassed = this.players.length >= this.startPlayersLimit
                if (action.type === PlayerMessageTypes.Enter) {
                    console.log("*** 3 ***")
                    if (limitPassed) {
                        console.log("*** 4 ***")
                        this.broadcast({type: MessageTypes.Message, content: `Room is packed enough, can start after command`});
                    } else {
                        console.log("*** 5 ***")
                        this.broadcast({type: MessageTypes.Message, content: `Should wait for other player, need at least ${4 - this.players.length}`});
                    }
                } else if(action.type === PlayerMessageTypes.Start){
                    console.log("*** 6 ***")
                    if (this.players.length >= this.startPlayersLimit) {
                        this.broadcast({type: MessageTypes.Action, content: `start`});
                        this.startGame();
                    } else {
                        console.log("*** 7 ***")
                        this.broadcast({type: MessageTypes.Message, content: `Cannot start now, should wait for other player, need at least ${4 - this.players.length}`});
                    }
                }
            }
            case ConflictGameStates.Start: {
                    
                    break;
                }
            case ConflictGameStates.Round: break;
            case ConflictGameStates.CardsGive: break;
            case ConflictGameStates.CardsWaiting: {
                if (player.role === PlayerRoleTypes.Second) {
                    player.secondCards--;
                }
                break;
            }
            case ConflictGameStates.Desicion: break;
            case ConflictGameStates.Idle: break;
            default: ;
        }
    }
    
    startGame() {
        this.gameStateChange(ConflictGameStates.Start);
        console.log("Game started");
        this.players.sort((a,b) => {
            return Math.random() > 0.5 ? 1 : -1;
        });

        this.loadDeck();

        this.gameStateChange(ConflictGameStates.Round);
        this.newRound();
    }

    newRound() {
        console.log("&& 1 &&")
        const indexOfPrevLeader = this.players.findIndex(player => player.role === PlayerRoleTypes.Leader);
        console.log("&& 2 &&", indexOfPrevLeader)
        if (indexOfPrevLeader !== -1) {
            this.playerChangeStatus(this.players[indexOfPrevLeader], null, PlayerRoleTypes.Second);
        }

        const indexOfLeader = indexOfPrevLeader === -1 || indexOfPrevLeader === this.players.length - 1 ? 0 : indexOfPrevLeader + 1;
        this.playerChangeStatus(this.players[indexOfLeader], null, PlayerRoleTypes.Leader);
        console.log("&& 3 &&", this.players.map((p) => ({
            name: p.title,
            role: p.role
        })) )
        this.gameStateChange(ConflictGameStates.CardsGive);
        this.cardsUpdate();
        this.cardsGive();
    }

    cardsUpdate() {
        this.players.forEach(player => {
            while (player.secondCards < 5) {
                let card = this.getSecondCard();
                player.socket.emit(MessageTypes[MessageTypes.Card], JSON.stringify(card));
                player.secondCards++;
            }
        })
    }

    getSecondCard(): Card {
        return this.getCard(CardTypes.SecondCard)
    }

    getLeadCard(): Card {
        return this.getCard(CardTypes.LeadCard)
    }

    getCard(type): Card {
        let card = this.deck.find(card => {
            return !card.given && card.type === type
        })

        if (!card) {
            console.log("Something went wrong 2")
        }

        card.given = true;
        return card;
    }

    cardsGive() {
        const lead = this.players.find(player => player.role === PlayerRoleTypes.Leader);

        if (!lead) {
            console.log("Something went wrong 1")
        }
        const leadCard = this.getLeadCard();
        const leadCardStr = JSON.stringify(leadCard)

        const messageToLead = {
            content: leadCardStr,
            type: MessageTypes.Action
        }

        const messageToSecond = {
            content: `Choose your card for ${leadCardStr}`,
            type: MessageTypes.Action
        }

        console.log(this.players.map((p) => ({
            name: p.title,
            role: p.role
        })))

        this.broadcast(messageToLead, PlayerRoleTypes.Leader);
        this.broadcast(messageToSecond, PlayerRoleTypes.Second);

        this.gameStateChange(ConflictGameStates.CardsWaiting);
    }

    loadDeck() {

        let deck: Card[] = []

        for(let i=0; i < 20; i++) {
            deck.push({
                type: CardTypes.LeadCard,
                content: `Lead card ${i}, could be image`,
                title: `Lead card ${i}`,
                given: false
            })
        }

        for(let i=0; i < 100; i++) {
            deck.push({
                type: CardTypes.SecondCard,
                content: `Second card ${i}, could be image`,
                title: `Second card ${i}`,
                given: false
            })
        }

        deck.sort((a,b) => {
            return Math.random() > 0.5 ? 1 : -1;
        })

        this.deck = deck;
    }


}