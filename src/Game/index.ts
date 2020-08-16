import { Socket } from "socket.io";
import * as chalk from "chalk";
import { v4 as uuidv4 } from 'uuid';
import { IDeck } from "./../Server/Models/Deck";
import {CardTypes, CardContentTypes, Card } from "./../Server/Models/Card"

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
export interface PlayerType {
    id: string;
    title: string;
    socket: Socket;
    role: PlayerRoleTypes;
    secondCards: number;
    points: number;
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
    private preselectedDeck: IDeck;

    constructor({playersLimit, io, deck}) {
        this.state = ConflictGameStates.Init;
        this.startPlayersLimit = playersLimit;
        this.players = [];
        this.io = io;
        this.cardsForRound = [];
        this.preselectedDeck = deck;
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

    updatePlayer({reconnectId, socket}) {
        const player = this.players.find((player) => {
            return player.id === reconnectId;
        })

        if (player) {
            player.socket = socket
            this.broadcast({
                type: MessageTypes.Message,
                content: `[Реконект] Игрок ${player.title} снова с нами!`
            })

            player.socket.emit("Sync", {
                role: player.role,
                points: player.points,
                title: player.title
            })

            if (this.cardsForRound.length > 0) {
                this.cardsForRound.forEach(obj => {
                    if (obj.player === player) {
                        player.socket.emit(MessageTypes[MessageTypes.Card], obj.card)
                    }
                })
            }
            

            return player;
        }
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
                        this.broadcast({type: MessageTypes.Message, content: `В комнате достаточно народу - можем начинать!`});
                    } else {
                        this.broadcast({type: MessageTypes.Message, content: `Нужно подождать еще игроков, как минимум ${4 - this.players.length}`});
                    }
                } else if(action.type === PlayerMessageTypes.Start){
                    if (this.players.length >= this.startPlayersLimit) {
                        this.broadcast({type: MessageTypes.Action, content: `start`});
                        this.startGame();
                    } else {
                        this.broadcast({type: MessageTypes.Message, content: `Нужно подождать еще игроков, как минимум ${4 - this.players.length}`});
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
                    this.broadcast({ content : this.cardsForRound.map(o => o.card), type: MessageTypes.Message})
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
                this.increasePoints(res);
                this.newRound();

            }
            break;
            case ConflictGameStates.Idle: break;
            default: ;
        }
    }
    
    async startGame() {
        this.gameStateChange(ConflictGameStates.Start);
        console.log("Game started");
        this.players.sort((a,b) => {
            return Math.random() > 0.5 ? 1 : -1;
        });

        await this.loadDeck();

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

    async loadDeck() {
        let deck: Card[] = [...this.preselectedDeck.leadCards.map(c => {
            c.given = false;
            return c;
        }), ...this.preselectedDeck.secondCards.map(c => {
            c.given = false;
            return c;
        })]

        

        // const memLinks = [
        //     "http://risovach.ru/upload/2016/10/generator/mister-dudec_126443897_orig_.jpg",
        //     "http://risovach.ru/upload/2018/09/generator/ilon-mask_188128557_orig_.jpg",
        //     "http://risovach.ru/upload/2017/07/generator/tak-blet_150671298_orig_.jpg",
        //     "http://risovach.ru/upload/2017/04/generator/otchayannyy-agutin_142439306_orig_.jpg",
        //     "http://risovach.ru/upload/2017/02/generator/ne-delay-ne-budet_137790949_orig_.jpg",
        //     "http://risovach.ru/upload/2017/01/generator/zhdun_135846781_orig_.jpg",
        //     "http://risovach.ru/upload/2016/12/generator/test_131710210_orig_.jpg",
        //     "http://risovach.ru/upload/2016/08/generator/bettingmemes_122374635_orig_.jpg",
        //     "http://risovach.ru/upload/2016/08/generator/boloto_121092625_orig_.jpg",
        //     "http://risovach.ru/upload/2016/05/generator/lapsha-na-ushah_115111151_orig_.jpg",
        //     "http://risovach.ru/upload/2016/02/generator/a_106977909_orig_.jpg",
        //     "http://risovach.ru/upload/2016/02/generator/it_105972405_orig_.jpg",
        //     "http://risovach.ru/upload/2015/09/generator/gordyy-volk_92577789_orig_.jpg",
        //     "http://risovach.ru/upload/2015/09/generator/gordyy-kozlenok_93344369_orig_.jpg",
        //     "http://risovach.ru/upload/2015/07/generator/ispanec_87230121_orig_.jpg",
        //     "http://risovach.ru/upload/2015/05/generator/ty-vtiraesh-mne-kakuyu-to-dich_81670077_orig_.png",
        //     "http://risovach.ru/upload/2015/01/generator/pacan-s-krestom_72785715_orig_.jpg",
        //     "http://risovach.ru/upload/2014/12/generator/nedovolnyy-pacan_70086754_orig_.jpg",
        //     "http://risovach.ru/upload/2014/11/generator/babka_67536985_orig_.jpg",
        //     "http://risovach.ru/upload/2014/06/generator/klichno_53903380_orig_.jpeg",
        //     "http://risovach.ru/upload/2014/05/generator/priv-che-delaesh_50224690_orig_.jpeg",
        //     "http://risovach.ru/upload/2014/04/generator/tipichnyy-shkolnik_47290141_orig_.jpeg",
        //     "http://risovach.ru/upload/2014/02/generator/f_43223693_orig_.jpeg",
        //     "http://risovach.ru/upload/2013/11/generator/devochka_34611117_orig_.jpeg",
        //     "http://risovach.ru/upload/2013/08/generator/vava_26332403_orig_.jpeg",
        //     "http://risovach.ru/upload/2013/07/generator/a-teper-predstav_25642532_orig_.jpeg",
        //     "http://risovach.ru/upload/2013/07/generator/argumentnyy-argument_25271036_orig_.jpeg",
        //     "http://risovach.ru/upload/2013/06/generator/griffiny--blyuyut_21655737_orig_.jpeg",
        //     "http://risovach.ru/upload/2013/05/generator/rendi-marsh_19301154_orig_.jpeg",
        //     "http://risovach.ru/upload/2013/05/generator/grustnyy-kot_18951056_orig_.jpeg",
        //     "http://risovach.ru/upload/2013/05/generator/nihuyase_18514232_orig_.jpeg",
        //     "http://risovach.ru/upload/2013/05/generator/begite-glupcy_17854385_orig_.jpeg",
        //     "http://risovach.ru/upload/2013/03/generator/neudachnik-brayan_13472431_orig_.jpeg",
        //     "http://risovach.ru/upload/2013/03/generator/ebat-ty-loh_13428261_orig_.jpeg",
        //     "http://risovach.ru/upload/2013/03/generator/ustanavlivat-igry_13283214_orig_.jpeg",
        //     "http://risovach.ru/upload/2013/03/generator/tvoe-vyrazhenie-lica_12772866_orig_.jpeg",
        //     "http://risovach.ru/upload/2013/02/generator/tom-kruz_10177851_orig_.jpeg",
        //     "http://risovach.ru/upload/2013/01/generator/nu-davay-taya-rasskazhi-kak-ty-men_10074996_orig_.jpeg",
        //     "http://risovach.ru/upload/2013/01/generator/voenkom_9566643_orig_.jpeg",
        //     "http://risovach.ru/upload/2012/12/generator/chyo_7217242_orig_.jpeg",
        //     "http://risovach.ru/upload/2012/12/generator/vot-eto-povorot_6883919_orig_.jpeg",
        //     "http://risovach.ru/upload/2012/12/generator/toni-stark_4945663_orig_.jpeg",
        //     "http://risovach.ru/upload/2012/11/templ_1352053367_orig_A-chto-esli.jpg",
        //     "http://risovach.ru/upload/2012/hand/nelzya-prosto-tak-vzyat-i_orig_.jpg",
        //     "http://risovach.ru/upload/2012/03/templ_1333113067_orig_Fraj.jpg"
        // ]

        // const jokes = [
        //     "Когда ударил волейбольный мяч ногой - физрук",
        //     "Когда, что много мемов ассоциируют с тобой, но все они про лишний вес, алкоголизм и одиночество",
        //     "Когда забыл очистить историю браузера и мама нажимаем П",
        //     "Когда заходишь с нового устройства - гугл",
        //     "Когда решил быкануть на пьяного батю",
        //     "Когда спрашивают почему ты не замужем, а тебе некогда - 5 котов сами себя не покормят",
        //     "Когда набираешь 20кг для роли, а тебе говорят что никакой ты не актер",
        //     "Когда сломал вещь и починил ее так чтобы следующий человек подумал что это он ее сломал",
        //     "Когда твой друг дебил проколол все твои презервативы, но все закончилось что его девушка беременна",
        //     "Твое лицо, когда детский бассейн у соседей - единственное море, которое тебе светит в этом году",
        //     "Когда ждешь 00:01 первого января чтобы начать шутить про прошлогодний хлеб",
        //     "Твое лицо когда тебе уже 30, а на кассе просят паспорт",
        //     "Когда попался таксист, который ехал всю дорогу молча",
        //     "Когда понимаешь, что книги - это мертвые деревья с татуировками",
        //     "Когда хотел вытереть девушке слезы, но случайно стер ее бровь",
        //     "Когда не знаешь слиется ли твой друг или у него приступ астмы",
        //     "Когда стал ногой на Лего",
        //     "Когда на ночь наелся арбуза, и ночью приснилось, что ты капитан корабля который попал в шторм",
        //     "Когда в сериале убили твое любимого персонажа, и тебе больше нет смысла его смотреть",
        //     "Когда открываешь окно чтобы немного проветрить - все остальные на космической станции",
        //     "Когда пытаешься лечь пораньше, но друзья и пивко думают иначе",
        //     "Когда закрыл глаза на 5 минут почле будильника, а проснулся через 30 лет женат, с двумя детьми и собакой"
        // ]

        // for(let i=0; i < memLinks.length; i++) {
        //         deck.push({
        //             type: CardTypes.LeadCard,
        //             content: memLinks[i],
        //             title: `Lead card ${i}`,
        //             given: false,
        //             contentType: CardContentTypes.Image
        //         })
        //     }

        //     for(let i=0; i < jokes.length * 2; i++) {
        //             deck.push({
        //                 type: CardTypes.SecondCard,
        //                 content: jokes[i % jokes.length],
        //                 title: `Second card ${i}`,
        //                 given: false,
        //                 contentType: CardContentTypes.Text
        //             })
        //         }

        deck.sort((a,b) => {
            return Math.random() > 0.5 ? 1 : -1;
        })
        this.deck = deck;
    }

    increasePoints({player, card}) {
        player.points++;

        player.socket.emit("Sync", {
            points: player.points
        })
        this.broadcast({type: MessageTypes.Message, content: `Выиграла карточка игрока ${player.title}! С карточкой ${card.content}`});
    }


}