import * as React from "react";
import { BrowserRouter as Router, Route, Link, Redirect, Switch } from "react-router-dom";
import Lobby from "./Pages/Lobby";
import Game from "./Pages/Game";
import Deck from "./Pages/Deck";

export default class App extends React.Component<{},{}> {
    render() {
        return ( 
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

                        <Route path="/deck/:id" render={(props) => (
                            <Deck {...props} />
                            )}
                        />

                        <Route path="/:id" render={(props) => (
                            <Game {...props} />
                            )}
                        />
                    </Switch>
                </Router>
            )
        }
    }

