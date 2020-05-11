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
    secondCards: number;
}

enum CardTypes {
    LeadCard,
    SecondCard
}
interface Card {
    type: CardTypes,
    title: string,
    content: string,
    given: boolean
}

enum MessageTypes {
    Info = "message",
    Action = "action",
    Warn = "warn",
    Error = "error",
    Card = "card"
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
        const indexOfPrevLeader = this.players.findIndex(player => player.role === PlayerRoleTypes.Leader);
        if (indexOfPrevLeader !== -1) {
            this.playerChangeStatus(this.players[indexOfPrevLeader], null, PlayerRoleTypes.Leader);
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