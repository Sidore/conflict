
import React from "react"

export default function(props) {
    
    return (
        <li className="secondCard" onClick={props.onClick}>{props.card.content.split("-").map(part => {
            return <span>{part}</span>
            })}</li>
    )
}

