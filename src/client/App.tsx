import * as React from "react";
import { PlayerRoleTypes, ConflictGameStates, CardTypes, CardContentTypes } from "./../Game"
import io from 'socket.io-client';

// import BaseLayout from "./BaseLayout";
// import ApolloClient from "apollo-boost";
// import { ApolloProvider } from "react-apollo";
// import { Provider } from "react-redux";
// import { store } from "../store";
// import "./index.styl";
// import { BrowserRouter as Router } from "react-router-dom";

// const client = new ApolloClient({
//   uri: "/graphql"
// })

const dev = location && location.hostname == "localhost" || false;
const serverUrl = dev ? "http://localhost:3333" : "";
const socket = io(serverUrl);

export default class App extends React.Component<{},
{messages: string[], 
    player: any, 
    message: string, 
    type: string, 
    cards: any[], 
    action: number
    leadCard: any,
    options: any[]}> {

state = {
    messages: [],
    player: { name: "", points: 0, role: 1},
    message: "",
    type: "",
    cards: [],
    leadCard: { title: "", content: "", contentType: CardContentTypes.Text},
    action: 0,
    options: []
}

    constructor(props) {
        super(props);
    }

    componentDidMount() {

        let user = `player-${Math.round(Math.random() * 1000)}`;
        // alert(user)

        this.setState({
            ...this.state,
            player: {
                ...this.state.player,
                name: user
            }
        })
        
        socket.on("Message", (data) => {

            let output = data;
            let additionData:any = {}

            console.log(ConflictGameStates[this.state.action], this.state.action, data)

            if (this.state.action === ConflictGameStates.CardsGive) {
                let card = data;
                additionData.leadCard = card;
                if (this.state.player.role === PlayerRoleTypes.Leader) {
                    if (card.contentType === CardContentTypes.Image) {
                        output = `You got lead card - ${card.title}`;
                    } else {
                        output = `You got lead card - ${card.title} -> ${card.content}`;
                    }
                } else {
                    if (card.contentType === CardContentTypes.Image) {
                        output = `You should propose to - ${card.title}`;
                    } else {
                        output = `You should propose to - ${card.title} -> ${card.content}`
                    }
                }
            } else if (this.state.action === ConflictGameStates.CardsWaiting && this.state.player.role === PlayerRoleTypes.Leader) {
                let options = data;
                additionData.options = options;
                output = "Chose card for answer"
            }

            this.setState({
                ...this.state,
                messages : [...this.state.messages, output],
                ...additionData
            })
        })

        socket.on("Action", (data) => {
            this.setState({
                ...this.state,
                action : +data,
            })
        })

        socket.on("Sync", (data) => {
            console.log("sync", data,this.state.player, {
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
                cards : [...this.state.cards, data],

            })
        })

        socket.emit("Enter", {name : user});

    }

    send(t?) {
        if (t) {
            socket.emit("message",{
                type: 1
            })
        }else{
            socket.emit("message", {
                type: this.state.type || 1,
                content: this.state.message
            });

        }
    }

    sendCard(card) {
        socket.emit("message", {
            type: 1,
            content: card
        });
        
        if (card.type === CardTypes.LeadCard) {


        } else if (card.type === CardTypes.SecondCard) {
            this.setState({
                ...this.state,
                messages : [...this.state.messages, `You propose ${card.title} -> ${card.content}`],
                cards: this.state.cards.filter(c => c.title !== card.title)
            })
        }
    }

    
  render() {

    console.log(this.state)
    return (
    //   <Provider store={store}>
    //     <ApolloProvider client={client}>
    //       <Router>
    //         <BaseLayout />
    //       </Router>
    //     </ApolloProvider>
    //   </Provider>
    <div>
  Name:{this.state.player.name} - Role:{PlayerRoleTypes[this.state.player.role]} - points: {this.state.player.points}/ Game state: {ConflictGameStates[this.state.action]}

        

        <div>
            message <input type="text" name="" id="" onChange={(e) => this.setState({
                ...this.state,
                message: e.target.value
            })}/> <br/>
            type <input type="text" name="" id="" onChange={(e) => this.setState({
                ...this.state,
                type: e.target.value
            })}/>
            <br/>
            <button onClick={() => {
                this.send();
            }}>
                send
            </button>
        </div>

        <hr/>

        {ConflictGameStates.Init === this.state.action && <button className="startButton" onClick={() => {
                this.send("start");
            }}>
                start game
            </button>}
        <ul id="messages" className="block">
            {this.state.messages.map((m,i) => {
            return (<li key={i}>{m}</li>)
            })}
        </ul>

        <ul id="cards" className="block">
            {this.state.player.role !== PlayerRoleTypes.Leader && this.state.cards.map((m,i) => {
                return (<li key={i}>{m.title} 
                <button onClick={() => this.sendCard(m)}>send</button></li>)
            })}
        </ul>


            {this.state.leadCard.title && <div id="leadCard" className="block">
                
                <h3>Title: {this.state.leadCard.title}</h3>

                {this.state.leadCard.contentType === CardContentTypes.Text && <div>
                        {this.state.leadCard.content}
                    </div>}

                    {this.state.leadCard.contentType === CardContentTypes.Image && <div>
                       <img src={this.state.leadCard.content}/>
                    </div>}    
                
                </div>}

        {this.state.player.role === PlayerRoleTypes.Leader && <div className="block" id="options">
            {/* <hr/> */}
            <h3>Options to chose</h3>
            
            chose your option:
            <ul>
                {this.state.options.map((card) => {
                return (<li>{card.title} -> {card.content} <button onClick={() => this.sendCard(card)}>send</button></li>)
                })}
            </ul>
        </div>}
    </div>
    );
  }
}