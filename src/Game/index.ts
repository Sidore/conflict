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
export enum PlayerRoleTypes {
    Leader,
    Second
}
interface PlayerType {
    id: string;
    title: string;
    socket: Socket;
    role: PlayerRoleTypes;
    secondCards: number;
    points: number;
}
export enum CardTypes {
    LeadCard,
    SecondCard
}

export enum CardContentTypes {
    Text,
    Image,
    DoubleText,
    ImageText
}
export interface Card {
    type: CardTypes,
    title: string,
    content: string,
    given: boolean,
    contentType: CardContentTypes,

}
export enum MessageTypes {
    Message = "Message",
    Action = "Action",
    Warn = "Action",
    Error = "Error",
    Card = "Card",
    Sync = "Sync"
}
export interface MessageType {
    content: string | any;
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
    private cardsForRound: {player: PlayerType, card: Card}[];

    constructor({playersLimit, io}) {
        this.state = ConflictGameStates.Init;
        this.startPlayersLimit = playersLimit;
        this.players = [];
        this.io = io;
        this.cardsForRound = [];
    }

    broadcast(message: MessageType, role?: PlayerRoleTypes) {
        console.log(`${chalk.black.bgGreen(" Broadcasted message ")} to group ${chalk.green(role)} message '${chalk.green(message.content)}'`);
        this.players.forEach((player) => {
            if ((role !== undefined && player.role === role) || role === undefined){
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
            secondCards: 0,
            points: 0
        }
        console.log(`${chalk.black.bgGreen(" New player ")} title: ${title} - id: ${player.id}`);

        this.players.push(player);

        return player;
    }

    playerChange(player: PlayerType, role) {
        console.log(`Player ${player.title} is changing role ${chalk.black.bgBlue(PlayerRoleTypes[player.role])} --> ${chalk.black.bgBlue(PlayerRoleTypes[role])}`)
        player.role = role;
        player.socket.emit("Sync", {
            role
        })
    }

    playerChangeStatus(player?: PlayerType, id?, role: PlayerRoleTypes = PlayerRoleTypes.Second) {
        console.log({
            name: player.title,
            role: player.role,
            id,
        },role,PlayerRoleTypes[role],  PlayerRoleTypes[player.role], PlayerRoleTypes[role])
        if (player) {
            this.playerChange(player, role);
        } else {
            if (id) {
                let p = this.players.find(p => p.id === id);
                if (p) {
                    this.playerChange(p, role);
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

        this.broadcast({
            type: MessageTypes.Action,
            content: `${state}`
        })
    }

    userAction(player: PlayerType, action: {type: PlayerMessageTypes, content?: string | any}) {
        switch(this.state) {
            case ConflictGameStates.WaitingForPlayers: {
                const limitPassed = this.players.length >= this.startPlayersLimit
                if (action.type === PlayerMessageTypes.Enter) {
                    if (limitPassed) {
                        this.broadcast({type: MessageTypes.Message, content: `Room is packed enough, can start after command`});
                    } else {
                        this.broadcast({type: MessageTypes.Message, content: `Should wait for other player, need at least ${4 - this.players.length}`});
                    }
                } else if(action.type === PlayerMessageTypes.Start){
                    if (this.players.length >= this.startPlayersLimit) {
                        this.broadcast({type: MessageTypes.Action, content: `start`});
                        this.startGame();
                    } else {
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
                console.log("<<<<<<<<<<lol", {name: player.title, role: player.role}, action)
                if (player.role === PlayerRoleTypes.Second) {

                    const vote: Card = action.content as Card;

                    this.cardsForRound.push({
                        card: vote,
                        player
                    })

                    player.secondCards--;
                }

                if (this.cardsForRound.length === this.players.length - 1) {
                    this.broadcast({ content : this.cardsForRound.map(o => o.card), type: MessageTypes.Message}, PlayerRoleTypes.Leader)
                    this.gameStateChange(ConflictGameStates.Desicion);
                }
                break;
            }
            case ConflictGameStates.Desicion: 
            if (player.role === PlayerRoleTypes.Leader) {
                const vote: Card = action.content as Card;
                const res = this.cardsForRound.find((c) => {
                    return c.card.title === vote.title;
                })

                if(!res) {
                    console.log(vote, this.cardsForRound)
                }

                this.gameStateChange(ConflictGameStates.Round);
                this.increasePoints(res.player);
                this.newRound();

            }
            break;
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
        this.cardsForRound = [];
        const indexOfPrevLeader = this.players.findIndex(player => player.role === PlayerRoleTypes.Leader);
        if (indexOfPrevLeader !== -1) {
            this.playerChangeStatus(this.players[indexOfPrevLeader], null, PlayerRoleTypes.Second);
        }
        const indexOfLeader = indexOfPrevLeader === -1 || indexOfPrevLeader === this.players.length - 1 ? 0 : indexOfPrevLeader + 1;
        this.playerChangeStatus(this.players[indexOfLeader], null, PlayerRoleTypes.Leader);
        this.gameStateChange(ConflictGameStates.CardsGive);
        this.cardsUpdate();
        this.cardsGive();
    }

    cardsUpdate() {
        this.players.forEach(player => {
            while (player.secondCards < 5) {
                let card = this.getSecondCard();
                player.socket.emit(MessageTypes[MessageTypes.Card], card);
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

        console.log("cardsGive", ConflictGameStates[this.state])
        const lead = this.players.find(player => player.role === PlayerRoleTypes.Leader);

        if (!lead) {
            console.log("Something went wrong 1")
        }
        const leadCard = this.getLeadCard();
        const leadCardStr = leadCard;

        const messageToLead = {
            content: leadCardStr,
            type: MessageTypes.Message
        }

        const messageToSecond = {
            content: `Choose your card for ${leadCardStr}`,
            type: MessageTypes.Message
        }

        // console.log(this.players.map((p) => ({
        //     name: p.title,
        //     role: p.role
        // })))

        this.broadcast(messageToLead, PlayerRoleTypes.Leader);
        this.broadcast(messageToLead, PlayerRoleTypes.Second);

        this.gameStateChange(ConflictGameStates.CardsWaiting);
    }

    loadDeck() {

        let deck: Card[] = []

        for(let i=0; i < 20; i++) {
            deck.push({
                type: CardTypes.LeadCard,
                content: `Lead card ${i}, could be image`,
                title: `Lead card ${i}`,
                given: false,
                contentType: CardContentTypes.Text
            })
        }

        for(let i=0; i < 100; i++) {
            deck.push({
                type: CardTypes.SecondCard,
                content: `Second card ${i}, could be image`,
                title: `Second card ${i}`,
                given: false,
                contentType: CardContentTypes.Text
            })
        }

        deck.sort((a,b) => {
            return Math.random() > 0.5 ? 1 : -1;
        })

        this.deck = deck;
    }

    increasePoints(player: PlayerType) {
        player.points++;

        player.socket.emit("Sync", {
            points: player.points
        })
        this.broadcast({type: MessageTypes.Message, content: `Won player ${player.title}!`});
    }


}