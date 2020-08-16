import { CardContentTypes, Card } from "../../Server/Models/Card"
import React, { SyntheticEvent } from "react"

export default class LeadCard extends React.Component<{card: Card, onClick: any },{ }>{
    render() {
        return (<>
            {this.props.card.contentType === CardContentTypes.Text && <div onClick={this.props.onClick}>
                {this.props.card.content}
            </div>}

            {this.props.card.contentType === CardContentTypes.DoubleText && <div onClick={this.props.onClick}>
                {this.props.card.content.split("-").map(part => {
                    return <span>{part}</span>
                    })}
            </div>}


    
            {this.props.card.contentType === CardContentTypes.Image && <div
            onClick={this.props.onClick}
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

            {this.props.card.contentType === CardContentTypes.ImageText && <div
            className="cardImage"
            onClick={this.props.onClick}
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
                {this.props.card.title}
            </div>}
            </>
        )
    }
    
}
