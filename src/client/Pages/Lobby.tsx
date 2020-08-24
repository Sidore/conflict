import * as React from "react";

import { Link } from "react-router-dom";

const dev = location && location.hostname == "localhost" || false;
const serverUrl = dev ? "http://localhost:3333" : "";

const lobbyUrl = `${serverUrl}/api/lobby`;
const deckUrl = `${serverUrl}/api/deck`;

export default class Lobby extends React.Component<{}, {
    rooms: any[],
    decks: any[],
    currentDeck: any,
    lastCreated: string
}>{

    state = {
        rooms: [],
        decks: [],
        currentDeck: {
            title: "",
            _id: ""
        },
        lastCreated: ""
    }

    componentDidMount() {
        fetch(lobbyUrl)
            .then((res) => res.json())
            .then(rooms => {
                fetch(deckUrl)
                    .then((res) => res.json())
                    .then(decks => {
                        this.setState({
                            ...this.state,
                            rooms,
                            decks,
                            currentDeck: decks[0]
                        })
                    })
            })
    }

    createRoom() {
        fetch(lobbyUrl, {
            method: 'POST',
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                deck: this.state.currentDeck.title
            })
        })
            .then((res) => res.json())
            .then(({ room, deck }) => {
                this.setState({
                    ...this.state,
                    lastCreated: room
                })
                fetch(lobbyUrl)
                    .then((res) => res.json())
                    .then(rooms => this.setState({
                        ...this.state,
                        rooms
                    }))
            })
    }

    render() {
        console.log(this.state)
        return <div className="container col">
            <p className="container headliner">Лобби</p>
            <div className="container row">
                <div className="container block col">
                    {
                        this.state.rooms.reverse().map(room => {
                            return (<>
                                <div className="roomsListItem" key={room}>
                                    <p>Игровая комната <span> {room.room} </span></p> <p>и колода <span>{room.deck}</span> </p><Link className="actionLink" to={`/${room.room}`}>Зайти!</Link>
                                    
                                </div>
                                <hr/>
                                </>
                            )
                        })
                    }
                </div>

                <div className="container block col deckManagement">
                    {this.state.lastCreated && <p className="lastCreatedRoom">Последняя созданная: {this.state.lastCreated}</p>}

                    <Link className="createButton" to="/newDeck">Создать новую колоду</Link>
                    {
                        this.state.currentDeck._id && <Link className="createButton" to={`/deck/${this.state.currentDeck._id}`}>Редактировать выбранную колоду</Link>
                    }

                    <button className="createButton" onClick={() => this.createRoom()}>Создать новую комнату</button>
                    <div className="col">
                        Выбранная колода : {this.state.currentDeck.title}
                        <hr/>

                        <select onChange={(e) => {
                            this.setState({
                                ...this.state,
                                currentDeck: this.state.decks.find(d => d.title === e.target.value)
                            })
                        }}>
                            {this.state.decks.map((d) => {
                                return (
                                    <option key={d.title} value={d.title}>
                                        {d.title}
                                    </option>
                                )
                            })}
                        </select>
                    </div>
                </div>
            </div>


        </div>
    }
}