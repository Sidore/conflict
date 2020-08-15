
import React from "react"

export default function(props) {
    return (
        <li className="secondCard">{props.card.content.split("-").map(part => {
            return <span>{part}</span>
            })}</li>
    )
}

