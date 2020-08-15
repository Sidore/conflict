import * as React from "react";
import { PlayerRoleTypes, ConflictGameStates, CardTypes, CardContentTypes } from "./../../Game"
import io from 'socket.io-client';
import "./style.scss";
// import Peer from 'peerjs';
import { useRef } from "react";
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
// const myPeer = new Peer(undefined, 
//     {
//     host: location.hostname,
//       port: 3000,
//       path: 'myapp',
//     //   key: ""
//   }
//   )

export default class Game extends React.Component<{},
{messages: string[], 
    player: any, 
    message: string, 
    type: string, 
    cards: any[], 
    action: number
    leadCard: any,
    options: any[],
    cameras: any[],
    blockCards: boolean
}> {

state = {
    messages: [],
    player: { name: "", points: 0, role: 1},
    message: "",
    type: "",
    cards: [],
    leadCard: { title: "", content: "", contentType: CardContentTypes.Text},
    action: 0,
    options: [],
    cameras: [],
    blockCards : false
}

    constructor(props) {
        super(props);
    }

    componentDidMount() {

        let user = prompt("Введи имя") || `player-${Math.round(Math.random() * 1000)}`;
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
            } else if (this.state.action === ConflictGameStates.CardsWaiting) {
                if (this.state.player.role === PlayerRoleTypes.Leader) {
                    output = "Выбери самую подходящею карточку"
                } else {
                    output = "Теперь видно все варианты"
                }
                additionData.options = data;
            }

            let today = new Date();
            let time = today.getHours() + ":" + today.getMinutes() + ":" + today.getSeconds();

            output = `[${time}] ${output}`

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
                options: [],
                blockCards: false
            })


        })
        socket.emit("Enter", {name : user, roomId: location.pathname.split("/")[1]});

        const peers = {}
//         navigator.mediaDevices.getUserMedia({
//             video: true,
//             audio: true
//         }).then(stream => {
//             addVideoStream(stream, this.state.player.name)
        
//             myPeer.on('call', call => {
//                 call.answer(stream)
//                 call.on('stream', userVideoStream => {

//                     const peersObject: any = Object.values(peers).find((v:any, index) => {
//                         console.log(index,v.call.peer, call.peer, v.call.peer === call.peer);
//                         return v.call.peer === call.peer;
//                     }) 

                    
//                     addVideoStream(userVideoStream, peersObject && peersObject.user)
//                 })
//             })
  
//     socket.on('user-connected', user => {
//       connectToNewUser(user, stream)
//     })
//   })
  
//   socket.on('user-disconnected', userId => {
//     if (peers[userId]) {
//         peers[userId].call.close();
//         console.log(`User ${peers[userId].user} diconnected`)

//         this.setState({
//             ...this.state,
//             cameras: this.state.cameras.filter(c => c.name !== peers[userId].user)
//         })
//     }

//   })
  
//   myPeer.on('open', id => {
//     socket.emit('join-room', {id, user})
//   })
  
//   const connectToNewUser = ({id: userId, user}, stream) => {
//     // const call = myPeer.call(userId, stream)
//     let video = null;
//     call.on('stream', userVideoStream => {
//         // console.log("lol kek", name)
//         video = addVideoStream(userVideoStream, user);
//     })
//     call.on('close', () => {
//     //   video || video.ref.current.remove();
//       this.setState({
//           ...this.state,
//           ...this.state.cameras.filter(c => c !== video)
//       })
//     })
  
//     peers[userId] = {call, user}
//   }
  
  const addVideoStream = (stream, name) => {
    // const video = document.createElement("video");

    let buff;


    if (buff = this.state.cameras.find(c => {
        return c.srcObject.id === stream.id;
    })) {
        // console.log('attepmt to add camera again');
        buff.name = name;
        return;
    }

    // console.log(peers, stream)
    const video:any = {};
    video.ref = React.createRef();
    video.srcObject = stream;
    video.name = name;
    // video.addEventListener('loadedmetadata', () => {
    //   video.play()
    // })

    this.setState({
        ...this.state,
        cameras: [...this.state.cameras, video]
    })

    return video;
    // videoGrid.append(video)
  }

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
            let addData:any = {};

            if(this.state.player.role === PlayerRoleTypes.Leader) {
                addData.options = []
            }

            output = `[${time}] ${output}`

            this.setState({
                ...this.state,
                messages : [...this.state.messages, output],
                cards: this.state.cards.filter(c => c.title !== card.title),
                blockCards: true,
                ...addData
            })
        }
    }

        //   <Provider store={store}>
    //     <ApolloProvider client={client}>
    //       <Router>
    //         <BaseLayout />
    //       </Router>
    //     </ApolloProvider>
    //   </Provider>
    
  render() {

    console.log(this.state)
    return ( 

    <div className="col root">
        <div className="container row flex-025 info">
            <div className="block col ">
                <p>Player info:</p>
                <hr/>
                <div className="row">
                Name: <b>{this.state.player.name}</b> /
                Role:<b>{PlayerRoleTypes[this.state.player.role]}</b> /
                points: <b>{this.state.player.points}</b> /
                Game state: <b>{ConflictGameStates[this.state.action]}</b> /
                </div>
                
            </div>

            
            {/* <div className="block col hide" >
                <p>Player's cameras</p>
                <hr/>
                <div id="video-grid" className="container row">
                    {
                        this.state.cameras.map((c) => {
                            return <div>
                                <p>{c.name}</p>
                                <video ref={(v) => {v ? v.srcObject = c.srcObject : null;}} autoPlay muted></video>
                            </div>
                        })
                    }
                </div>
            </div> */}
            {/* <div >
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
            </div> */}
        </div>

    
        {ConflictGameStates.Init === this.state.action && 
        <div className="container row block flex-025">
            <button className="startButton" onClick={() => {
                    this.send("start");
                }}>
                    Начать игру
            </button>
        </div>}
    
        <div className="container row">
        {this.state.leadCard.title && <div id="leadCard" className="block col">
                
                {/* <p>Title: {this.state.leadCard.title}</p> */}

                {this.state.leadCard.contentType === CardContentTypes.Text && <div>
                        {this.state.leadCard.content}
                    </div>}

                    {this.state.leadCard.contentType === CardContentTypes.Image && <div
                    className="cardImage"
                    style={{
                        backgroundImage: `url(${this.state.leadCard.content})`,
                        backgroundSize: "contain",
                        backgroundPosition: "center",
                        minHeight: "200px",
                        width: "100%",
                        height: "100%",
                        backgroundRepeat: "no-repeat"
                    }}
                    >
                       {/* <img className="cardImage" src={this.state.leadCard.content}/> */}
                    </div>}    
                
                </div>}

                {this.state.player.role === PlayerRoleTypes.Leader && <div className="block col" id="options">
                    
                    <p>Выбери карточку:</p>
                    <hr/>
                    <ul>
                        {this.state.options.map((card) => {
                        return (<li className="secondCard" onClick={() => this.sendCard(card)}>{card.content.split("-").map(part => {
                            return <span>{part}</span>
                            })}</li>)
                        })}
                    </ul>
                    {
                        this.state.options.length === 0 && <p>Ждем пока остальные игроки предложат карточки...</p>
                    }
                </div>}

                {this.state.player.role === PlayerRoleTypes.Second && this.state.options.length > 0 && <div className="block col" id="options">
                    
                    <p>Варианты от всех игроков:</p>
                    <hr/>
                    <ul>
                        {this.state.options.map((card) => {
                        return (<li className="secondCard">{card.content.split("-").map(part => {
                            return <span>{part}</span>
                            })}</li>)
                        })}
                    </ul>
                    {
                        this.state.options.length === 0 && <p>Ждем пока остальные игроки предложат карточки...</p>
                    }
                </div>}

                {this.state.player.role !== PlayerRoleTypes.Leader && <div id="cards" className="block col">
                    <p>Твои карты:</p>
                    <hr/>
                    <ul className="row">
                        {this.state.cards.map((m,i) => {
                            return (<li className="secondCard" key={i} onClick={() => this.sendCard(m)}>
                                
                                        {m.content.split("-").map(part => {
                                        return <span>{part}</span>
                                        })} 
                                        
                                    </li>)
                        })}
                    </ul>
                </div>}

        </div>

        <div className="container row">
                <div id="messages" className="block col">
                    <p>Чат:</p>
                    <hr/>
                    <ul className="row">
                        {this.state.messages.map((m,i) => {
                        return (<li key={i}>{m}</li>)
                        })}
                    </ul>
                </div>
        </div>
    </div>
    );
  }
}