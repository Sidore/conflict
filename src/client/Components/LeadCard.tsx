import { CardContentTypes, Card } from "../../Game/Models/Card"
import React, { SyntheticEvent } from "react"

export default class LeadCard extends React.Component<{card: Card, onClick: any },{ }>{


    returnTextCard() {
        return (<div onClick={this.props.onClick}>
                    {this.props.card.content}
                </div>)
    }

    returnDoubleTextCard() {
        return <div onClick={this.props.onClick}>
                    {this.props.card.content
                        .split("-")
                        .map(part => {
                            return <span>{part}</span>
                        })
                    }
                </div>
    }

    returnImageCard() {
        return (<div onClick={this.props.onClick}
                    className="cardImage cardWithImage"
                    style={{
                        backgroundImage: `url(${this.props.card.content})`,
                    }}>
                </div>)
    }

    returnImageWithTextCard() {
        return (<div onClick={this.props.onClick}
                    className="cardImage cardWithImage"
                    style={{
                        backgroundImage: `url(${this.props.card.content})`,
                    }}>
                    {this.props.card.title}
                </div>)
    }

    content() {
        switch (this.props.card.contentType) {
            case CardContentTypes.Text: return this.returnTextCard();
            case CardContentTypes.DoubleText: return this.returnDoubleTextCard();
            case CardContentTypes.Image: return this.returnImageCard();
            case CardContentTypes.ImageText: return this.returnImageWithTextCard();
        }
    }

    render() {
        return (<>
                {this.content()}
            </>
        )
    }
    
}
