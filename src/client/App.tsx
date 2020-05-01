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

export default class App extends React.Component<{},{messages: string[]}> {

state = {
    messages: []
}

    constructor(props) {
        super(props);
        
        
    }

    componentDidMount() {
        
        socket.on("message", (data) => {
            this.setState({
                messages : [...this.state.messages, data]
            })
        })

        socket.emit("join", {name : `player-${Math.round(Math.random() * 1000)}`});

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
        <ul>
            {this.state.messages.map((m,i) => {
            return (<li key={i}>{m}</li>)
            })}
        </ul>
    </div>
    );
  }
}