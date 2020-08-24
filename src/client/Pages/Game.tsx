import * as React from "react";
import { CSSTransition, TransitionGroup } from "react-transition-group";
import { PlayerRoleTypes, ConflictGameStates } from "./../../Game"
import { CardTypes, CardContentTypes, Card } from "../../Game/Models/Card"
import io from 'socket.io-client';
import "./style.scss";
import LeadCard from "../Components/LeadCard";
import SecondCard from "../Components/SecondCard";

const dev = location && location.hostname == "localhost" || false;
const serverUrl = dev ? "http://localhost:3333" : "";
const socket = io(serverUrl);

export default class Game extends React.Component<{},
    {
        messages: string[],
        player: any,
        message: string,
        type: string,
        cards: Card[],
        action: number
        leadCard: Card,
        options: Card[],
        cameras: any[],
        blockCards: boolean
    }> {

    state = {
        messages: [],
        player: { name: "", points: 0, role: 1 },
        message: "",
        type: "",
        cards: [],
        leadCard: { id: "", title: "", content: "", contentType: CardContentTypes.Text, type: CardTypes.LeadCard },
        action: 0,
        options: [],
        cameras: [],
        blockCards: false
    }

    constructor(props) {
        super(props);
    }

    componentDidMount() {
        const room = location.pathname.split("/")[1];
        const user = prompt("Введи имя") || `player-${Math.round(Math.random() * 1000)}`;

        socket.on("Message", (data) => {

            let output = data;
            let additionData: any = {}

            console.log(ConflictGameStates[this.state.action], this.state.action, data)

            if (typeof output === "string" && output.includes("[Реконект]")) {

            } else {
                if (this.state.action === ConflictGameStates.CardsGive) {
                    let card = data;
                    additionData.leadCard = card;
                    additionData.blockCards = false;
                    if (this.state.player.role === PlayerRoleTypes.Leader) {
                        if (card.contentType === CardContentTypes.Image) {
                            output = `У тебя главная карточка - ${card.title}, жди варианты`;
                        } else {
                            output = `У тебя главная карточка - ${card.content}, жди варианты`;
                        }
                    } else {
                        if (card.contentType === CardContentTypes.Image) {
                            output = `Тебе нужно подкинуть шутку к ${card.title}`;
                        } else {
                            output = `Тебе нужно подкинуть шутку к "${card.content}"`
                        }
                    }
                } else if (this.state.action === ConflictGameStates.CardsWaiting || this.state.action === ConflictGameStates.Desicion) {
                    if (this.state.player.role === PlayerRoleTypes.Leader) {
                        output = "Выбери самую подходящею карточку"
                    } else {
                        output = "Теперь видно все варианты"
                    }
                    additionData.options = data;
                }
            }

            let today = new Date();
            let time = today.getHours() + ":" + today.getMinutes() + ":" + today.getSeconds();

            output = `[${time}] ${output}`

            this.setState({
                ...this.state,
                messages: [...this.state.messages, output],
                ...additionData
            })
        })
        socket.on("Action", (data) => {
            this.setState({
                ...this.state,
                action: +data,
            })
        })
        socket.on("Sync", (data) => {
            console.log("sync", data, this.state.player, {
                ...this.state.player,
                ...data
            })
            this.setState({
                ...this.state,
                player: {
                    ...this.state.player,
                    ...data
                }
            })
        })

        socket.on("Card", (data) => {
            this.setState({
                ...this.state,
                cards: [...this.state.cards, data],
                options: [],
                blockCards: false
            })
        })

        socket.on("reconnectId", (reconnectId) => {
            console.log("reconnectId", reconnectId);
            localStorage.setItem(room, reconnectId);
        })

        if (localStorage.getItem(room)) {
            socket.emit("Enter", { name: user, roomId: room, reconnectId: localStorage.getItem(room) });

        } else {
            socket.emit("Enter", { name: user, roomId: room });
        }

        this.setState({
            ...this.state,
            player: {
                ...this.state.player,
                name: user
            }
        })
    }

    send(t?) {
        if (t) {
            socket.emit("message", {
                type: 1
            })
        } else {
            socket.emit("message", {
                type: this.state.type || 1,
                content: this.state.message
            });

        }
    }

    sendCard(card) {

        if (this.state.blockCards) return;

        socket.emit("message", {
            type: 1,
            content: card
        });

        if (card.type === CardTypes.LeadCard) {


        } else if (card.type === CardTypes.SecondCard) {
            let today = new Date();
            let time = today.getHours() + ":" + today.getMinutes() + ":" + today.getSeconds();
            let output = `Ты выбрал карточку: ${card.content}`;
            let addData: any = {};

            if (this.state.player.role === PlayerRoleTypes.Leader) {
                addData.options = []
            }

            output = `[${time}] ${output}`

            this.setState({
                ...this.state,
                messages: [...this.state.messages, output],
                cards: this.state.cards.filter(c => c.title !== card.title),
                blockCards: true,
                ...addData
            })
        }
    }

    render() {
        console.log(this.state)
        return (
            <div className="col root">
                <div className="container row info">
                    <div className="block col ">
                        <p>Player info:</p>
                        <hr />
                        <div className="row">
                            Name: <b>{this.state.player.name}</b> /
                Role:<b>{PlayerRoleTypes[this.state.player.role]}</b> /
                points: <b>{this.state.player.points}</b> /
                Game state: <b>{ConflictGameStates[this.state.action]}</b> /
                </div>
                    </div>
                </div>

                <CSSTransition
                    in={ConflictGameStates.Init === this.state.action}
                    timeout={300}
                    classNames="alert"
                    unmountOnExit
                >
                    <div className="container row block">
                        <button className="startButton" onClick={() => {
                            this.send("start");
                        }}>
                            Начать игру
                        </button>
                    </div>
                </CSSTransition>
                {/* {ConflictGameStates.Init === this.state.action &&
                    } */}

                <div className="container row">
                    <CSSTransition
                        in={!!this.state.leadCard.title}
                        timeout={300}
                        classNames="alert"
                        unmountOnExit
                    >
                        <div id="leadCard" className="block col">
                            <CSSTransition
                                key={this.state.leadCard.id}
                                timeout={1000}
                                classNames="messageout"
                            >
                                <LeadCard onClick={() => { }} card={this.state.leadCard}></LeadCard>
                            </CSSTransition>
                        </div>
                    </CSSTransition>

                    <CSSTransition
                        in={this.state.player.role === PlayerRoleTypes.Leader}
                        timeout={300}
                        classNames="alert"
                        unmountOnExit
                    >
                        <div className="block col" id="options">
                            <p>Выбери карточку:</p>
                            <hr />
                            <TransitionGroup className="row">
                                {this.state.options.map((card) => {
                                    return (
                                        <CSSTransition
                                            key={card.id}
                                            timeout={1000}
                                            classNames="messageout"
                                        >
                                            <SecondCard card={card} onClick={() => this.sendCard(card)}></SecondCard>
                                        </CSSTransition>)
                                })}
                            </TransitionGroup>
                            {
                                this.state.options.length === 0 && <p>Ждем пока остальные игроки предложат карточки...</p>
                            }
                        </div>
                    </CSSTransition>

                    <CSSTransition
                        in={this.state.player.role === PlayerRoleTypes.Second && this.state.options.length > 0}
                        timeout={300}
                        classNames="alert"
                        unmountOnExit
                    >
                        <div className="block col" id="options">
                            <p>Варианты от всех игроков:</p>
                            <hr />
                            <TransitionGroup className="row">
                                {this.state.options.map((card) => {
                                    return (<CSSTransition
                                        key={card.id}
                                        timeout={1000}
                                        classNames="messageout"
                                    >
                                        <SecondCard card={card} />
                                    </CSSTransition>)
                                })}
                            </TransitionGroup>
                            {
                                this.state.options.length === 0 && <p>Ждем пока остальные игроки предложат карточки...</p>
                            }
                        </div>
                    </CSSTransition>

                    <CSSTransition
                        in={this.state.player.role !== PlayerRoleTypes.Leader}
                        timeout={300}
                        classNames="alert"
                        unmountOnExit
                    >
                        <div id="cards" className="block col">
                            <p>Твои карты:</p>
                            <hr />
                            <TransitionGroup className="row">
                                {this.state.cards.map((card) => {
                                    return (<CSSTransition
                                        key={card.id}
                                        timeout={1000}
                                        classNames="messageout"
                                    >
                                        <SecondCard card={card} onClick={() => this.sendCard(card)}></SecondCard>
                                    </CSSTransition>)
                                })}
                            </TransitionGroup>
                        </div>
                    </CSSTransition>

                </div>

                <div className="container row">
                    <div id="messages" className="block col">
                        <p>Чат:</p>
                        <hr />
                        <ul className="row">
                            {this.state.messages.map((m, i) => {
                                return (<li key={i}>{m}</li>)
                            })}
                        </ul>
                    </div>
                </div>
            </div>
        );
    }
}