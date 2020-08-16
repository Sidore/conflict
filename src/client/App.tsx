import * as React from "react";
import io from 'socket.io-client';
// import "./style.scss";
// import Peer from 'peerjs';
import { useRef } from "react";
// import BaseLayout from "./BaseLayout";
// import ApolloClient from "apollo-boost";
// import { ApolloProvider } from "react-apollo";
// import { Provider } from "react-redux";
// import { store } from "../store";
// import "./index.styl";
import { BrowserRouter as Router, Route, Link, Redirect, Switch } from "react-router-dom";
import Lobby from "./Pages/Lobby";
import Game from "./Pages/Game";
import Deck from "./Pages/Deck";

// const client = new ApolloClient({
//   uri: "/graphql"
// })


export default class App extends React.Component<{},{}> {
    render() {
        return ( 
        // <Provider store={store}>
                // <ApolloProvider client={client}>
                    <Router>
                        <Switch>
                            <Route path="/" exact render={() => (
                                    <Lobby />
                                )}
                            />
                            <Route path="/newDeck" render={() => (
                                <Deck/>
                            )}
                            />
                            <Route path="/:id" render={(props) => (
                                <Game {...props} />
                                )}
                            />
                            
                        </Switch>
                    </Router>
                // </ApolloProvider>
            // </Provider>
            )
        }
    }

