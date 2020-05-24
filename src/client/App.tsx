import * as React from "react";

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

export default class App extends React.Component<{},{messages: string[], userName: string, message: string, type: string}> {

state = {
    messages: [],
    userName: "",
    message: "",
    type: ""
}

    constructor(props) {
        super(props);
        
        
    }

    componentDidMount() {

        let user = `player-${Math.round(Math.random() * 1000)}`;
        // alert(user)

        this.setState({
            ...this.state,
            userName: user
        })
        
        socket.on("Message", (data) => {
            this.setState({
                messages : [...this.state.messages, data],
            })
        })

        socket.on("Action", (data) => {
            this.setState({
                messages : [...this.state.messages, data],
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
            socket.emit(this.state.type, this.state.message);

        }
    }

    
  render() {
    return (
    //   <Provider store={store}>
    //     <ApolloProvider client={client}>
    //       <Router>
    //         <BaseLayout />
    //       </Router>
    //     </ApolloProvider>
    //   </Provider>
    <div>
        {this.state.userName}

        <div>
            message <input type="text" name="" id="" onChange={(e) => this.setState({
                ...this.state,
                message: e.target.value
            })}/> <br/>
            type <input type="text" name="" id="" onChange={(e) => this.setState({
                ...this.state,
                type: e.target.value
            })}/> <br/>
            <button onClick={() => {
                this.send();
            }}>
                send
            </button>

            <button onClick={() => {
                this.send("start");
            }}>
                start game
            </button>
        </div>

        <ul>
            {this.state.messages.map((m,i) => {
            return (<li key={i}>{m}</li>)
            })}
        </ul>
    </div>
    );
  }
}