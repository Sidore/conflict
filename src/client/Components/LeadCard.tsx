import { CardContentTypes, Card } from "../../Game"
import React from "react"

export default class LeadCard extends React.Component<{card: Card },{ }>{
    render() {
        return (<>
            {this.props.card.contentType === CardContentTypes.Text && <div>
                {this.props.card.content}
            </div>}
    
            {this.props.card.contentType === CardContentTypes.Image && <div
            className="cardImage"
            style={{
                backgroundImage: `url(${this.props.card.content})`,
                backgroundSize: "contain",
                backgroundPosition: "center",
                minHeight: "200px",
                minWidth: "200px",
                width: "100%",
                height: "100%",
                backgroundRepeat: "no-repeat"
            }}
            >
               {/* <img className="cardImage" src={this.state.leadCard.content}/> */}
            </div>}
            </>
        )
    }
    
}
