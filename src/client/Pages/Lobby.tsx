import * as React from "react";

import { Link } from "react-router-dom";

const dev = location && location.hostname == "localhost" || false;
const serverUrl = dev ? "http://localhost:3333" : "";

const lobbyUrl = `${serverUrl}/api/lobby`;
const deckUrl = `${serverUrl}/api/deck`;

export default class Lobby extends React.Component<{},{
    rooms: any[],
    decks: any[],
    currentDeck: any,
    lastCreated: string
}>{

    state = {
        rooms: [],
        decks: [],
        currentDeck: {
            title: ""
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
            .then(({room, deck}) => {
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
        return <div className="container">
            <p className="container block headliner">Лобби</p>
            <ul className="container block col">
                {
                    this.state.rooms.reverse().map(room => {
                        return (
                            <li key={room} style={{
                                marginBottom: "40px",
                                marginTop: "10px"
                            }}>
                    Игровая комната <b>{room.room}</b> и колода <i>{room.deck}</i> - <Link className="actionLink" to={`/${room.room}`}>Зайти!</Link>
                                
                            </li>
                        )
                    })
                }
            </ul>
            <div className="container block col">
                {this.state.lastCreated && <p style={{ display : "flex", marginBottom: "20px"}}> {this.state.lastCreated}</p>}

                <Link to="/newDeck">Создать новую колоду</Link>

                <button className="createButton" onClick={() => this.createRoom()}>Создать новую комнату</button>
                <div>
                    Выбранная колода : {this.state.currentDeck.title}
                
                <select>
                    {this.state.decks.map((d) => {
                        return (
                            <option value="" onClick={() => {
                                this.setState({
                                    ...this.state,
                                    currentDeck: d
                                })
                            }}>
                                {d.title}
                            </option>
                        )
                    })}
                </select>
                </div>
            </div>
        </div>
    }
}