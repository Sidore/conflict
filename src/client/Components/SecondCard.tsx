
import React from "react"

export default function (props) {

    return (
        <div key={props.card.id} className="secondCard" onClick={props.onClick}>
            {props.card.content.split("-")
                .map(part => {
                    return <span>{part}</span>
                })
            }
        </div>
    )
}
