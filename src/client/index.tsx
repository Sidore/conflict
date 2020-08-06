import * as React from "react";
import { render } from "react-dom";

import App from "./App";

console.log(location.hostname, location.pathname)
if(location.hostname.includes("localhost") && location.pathname.length < 5) {
    console.log("url should be changed")
            fetch("http://localhost:3333").then((o) => {
                console.log("request handle", o)
                if (o.redirected) {
                    let path = o.url.split("/").pop();
                    console.log("request handle", path)
                    location.href = `http://localhost:1234/${path}`;
                }
                console.log(o)
            })
        } else {
            render(<App/>, document.getElementById("app-container"));
        }
 