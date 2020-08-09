import * as React from "react";

import { Link } from "react-router-dom";

const dev = location && location.hostname == "localhost" || false;
const serverUrl = dev ? "http://localhost:3333" : "";

const lobbyUrl = `${serverUrl}/api/lobby`;

export default class Lobby extends React.Component<{},{
    rooms: string[],
    lastCreated: string
}>{

    state = {
        rooms: [],
        lastCreated: ""
    }

    componentDidMount() {
        fetch(lobbyUrl)
            .then((res) => res.json())
            .then(rooms => this.setState({
                ...this.state,
                rooms
            })) 
    }


    createRoom() {
        fetch(lobbyUrl, {
            method: 'POST'
        })
            .then((res) => res.json())
            .then(data => {
                this.setState({
                ...this.state,
                lastCreated: data.room
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
        return <div>
            <p className="container block headliner">Лобби</p>
            <ul className="container block">
                {
                    this.state.rooms.reverse().map(room => {
                        return (
                            <li key={room} style={{
                                marginBottom: "40px",
                                marginTop: "10px"
                            }}>
                                Игровая комната <b>{room}</b> - <Link className="actionLink" to={`/${room}`}>Зайти!</Link>
                                
                            </li>
                        )
                    })
                }
            </ul>
            <div className="container block col">
                {this.state.lastCreated && <p style={{ display : "flex", marginBottom: "20px"}}> {this.state.lastCreated}</p>}

                <button className="createButton" onClick={() => this.createRoom()}>Создать новую комнату</button>
            </div>
        </div>
    }
}