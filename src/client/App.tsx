import * as React from "react";
import { PlayerRoleTypes, ConflictGameStates, CardTypes, CardContentTypes } from "./../Game"
import io from 'socket.io-client';
import "./style.scss";
import Peer from 'peerjs';
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
const myPeer = new Peer(undefined, 
//     {
//     host: location.hostname,
//       port: 3000,
//       path: 'myapp',
//     //   key: ""
//   }
  )


  console.log(myPeer)

  myPeer.on('connection', (conn) => {
    conn.on('data', (data) => {
      // Will print 'hi!'
      console.log(data);
    });
    conn.on('open', () => {
      conn.send('hello!');
    });
  });

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

        const myVideo = document.createElement('video')
myVideo.muted = true
const peers = {}
const videoGrid = document.getElementById('video-grid')
navigator.mediaDevices.getUserMedia({
    video: true,
    audio: true
  }).then(stream => {
    addVideoStream(myVideo, stream)
  
    myPeer.on('call', call => {
      call.answer(stream)
      const video = document.createElement('video')
      call.on('stream', userVideoStream => {
        addVideoStream(video, userVideoStream)
      })
    })
  
    socket.on('user-connected', userId => {
      connectToNewUser(userId, stream)
    })
  })
  
  socket.on('user-disconnected', userId => {
    if (peers[userId]) peers[userId].close()
  })
  
  myPeer.on('open', id => {
    socket.emit('join-room', id)
  })
  
  function connectToNewUser(userId, stream) {
    const call = myPeer.call(userId, stream)
    const video = document.createElement('video')
    call.on('stream', userVideoStream => {
      addVideoStream(video, userVideoStream)
    })
    call.on('close', () => {
      video.remove()
    })
  
    peers[userId] = call
  }
  
  function addVideoStream(video, stream) {
    video.srcObject = stream
    video.addEventListener('loadedmetadata', () => {
      video.play()
    })
    videoGrid.append(video)
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
        <div className="container row block">
            Name: <b>{this.state.player.name}</b> / Role:<b>{PlayerRoleTypes[this.state.player.role]}</b> / points: <b>{this.state.player.points}</b> / Game state: <b>{ConflictGameStates[this.state.action]}</b>
            <br/>
            <div id="video-grid"></div>
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
        <div className="container row block">
            <button className="startButton" onClick={() => {
                    this.send("start");
                }}>
                    start game
            </button>
        </div>}
    
    <div className="container row">
        <div id="messages" className="block col">
            <p>Messages:</p>
            <hr/>
            <ul className="col">
                {this.state.messages.map((m,i) => {
                return (<li key={i}>{m}</li>)
                })}
            </ul>
        </div>
        

        {this.state.player.role !== PlayerRoleTypes.Leader && <div id="cards" className="block col">
            <p>Your cards:</p>
            <hr/>
            <ul className="col">
                {this.state.cards.map((m,i) => {
                    return (<li key={i}>{m.content} 
                                <button onClick={() => this.sendCard(m)}>send</button>
                            </li>)
                })}
            </ul>
        </div>}
         
        </div>

        <div className="container row">
        {this.state.leadCard.title && <div id="leadCard" className="block col">
                
                <p>Title: {this.state.leadCard.title}</p>

                {this.state.leadCard.contentType === CardContentTypes.Text && <div>
                        {this.state.leadCard.content}
                    </div>}

                    {this.state.leadCard.contentType === CardContentTypes.Image && <div>
                       <img className="cardImage" src={this.state.leadCard.content}/>
                    </div>}    
                
                </div>}

                {this.state.player.role === PlayerRoleTypes.Leader && <div className="block col" id="options">
                    
                    <p>Options to chose:</p>
                    <hr/>
                    <ul>
                        {this.state.options.map((card) => {
                        return (<li>{card.title} -> {card.content} <button onClick={() => this.sendCard(card)}>send</button></li>)
                        })}
                    </ul>
                    {
                        this.state.options.length === 0 && <p>Waiting for options from other players</p>
                    }
                </div>}

        </div>
    </div>
    );
  }
}