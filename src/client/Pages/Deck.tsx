import * as React from "react";

import { Link } from "react-router-dom";
import { Card, CardTypes, CardContentTypes } from "../../Game/Models/Card";
import SecondCard from "../Components/SecondCard";
import LeadCard from "../Components/LeadCard";



const dev = location && location.hostname == "localhost" || false;
const serverUrl = dev ? "http://localhost:3333" : "";

const deckUrl = `${serverUrl}/api/deck`;

export default class Lobby extends React.Component<{}, {
    titleD: string;
    restrictions: string;
    logo: string;
    leadCards: Card[];
    secondCards: Card[];

    type: CardTypes,
    title: string,
    content: string,
    contentType: CardContentTypes,
}>{

    state = {
        titleD: "",
        restrictions: "",
        logo: "",
        leadCards: [],
        secondCards: [],
        type: CardTypes.LeadCard,
        title: "",
        content: "",
        contentType: CardContentTypes.Image,
        deckId: ""
    }

    constructor(props) {
        super(props);

        if (props.match) {
            this.state.deckId = props.match.params.id
        }
    }

    componentDidMount() {
        if (this.state.deckId) {
            fetch(`${deckUrl}/${this.state.deckId}`)
                .then(res => res.json())
                .then(deck => {
                    console.log(deck);
                    const currentDeck = deck[0];
                    this.setState({
                        ...this.state,
                        titleD: currentDeck.title,
                        logo: currentDeck.logo,
                        restrictions: currentDeck.restrictions,
                        leadCards: currentDeck.leadCards,
                        secondCards: currentDeck.secondCards
                    })
                })
        }
    }

    addCard() {
        console.log(this.state.type, CardTypes.LeadCard, {
            title: this.state.title,
            type: this.state.type,
            contentType: this.state.contentType,
            content: this.state.content
        })
        if (this.state.type === CardTypes.LeadCard) {
            this.setState({
                ...this.state,
                leadCards: [...this.state.leadCards, {
                    title: this.state.title,
                    type: this.state.type,
                    contentType: this.state.contentType,
                    content: this.state.content
                }]
            })
        } else {
            this.setState({
                ...this.state,
                secondCards: [...this.state.secondCards, {
                    title: this.state.title,
                    type: this.state.type,
                    contentType: this.state.contentType,
                    content: this.state.content
                }]
            })
        }
    }

    deleteCard(card) {
        if (confirm("Удалить карточку?")) {
            if (card.type === CardTypes.LeadCard) {
                this.setState({
                    ...this.state,
                    leadCards: this.state.leadCards.filter(c => c !== card)
                })
            } else {
                this.setState({
                    ...this.state,
                    secondCards: this.state.secondCards.filter(c => c !== card)
                })
            }
        }
    }

    createDeck() {
        // title: req.body.title,
        //     // url: req.body.url,
        //     logo: req.body.logo,
        //     restrictions: req.body.restrictions,
        //     leadCards: JSON.parse(req.body.leadCards),
        //     secondCards: JSON.parse(req.body.secondCards)

        let method = "POST", url = deckUrl;

        if (this.state.deckId) {
            // method = "PUT";
            url = `${deckUrl}/${this.state.deckId}`
        }
        fetch(url, {
            method,
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                title: this.state.titleD,
                logo: this.state.logo,
                restrictions: this.state.restrictions,
                leadCards: this.state.leadCards,
                secondCards: this.state.secondCards,
            })
        })
            .then((res) => res.json())
            .then(data => {
                if (data && data.success) {
                    console.log("deck is updated")
                } else {
                    let u = `${deckUrl.replace("3333", "1234").replace("api/", "")}/${data._id}`;
                    location.assign(u)
                }
            })
    }

    render() {
        console.log(this.state)
        return <div className="container col">
            <p className=" headliner">Новая колода</p>

            <div className="container block col">
                <label><input type="text" name="" onChange={(e) => {
                    this.setState({
                        ...this.state,
                        titleD: e.target.value
                    })
                }} id="" placeholder="название" />название колоды</label>


            </div>

            <div className="container block col">
                <p>Добавить карточку</p>
                <label><input type="radio" onChange={(e) => {
                    this.setState({
                        ...this.state,
                        type: CardTypes.LeadCard
                    })
                }} name="type" value={CardTypes.LeadCard} defaultChecked />Главная</label>
                <label><input type="radio" onChange={(e) => {
                    this.setState({
                        ...this.state,
                        type: CardTypes.SecondCard
                    })
                }} name="type" value={CardTypes.SecondCard} />Вторая</label>
                <br />
                <label><input type="text" name="" onChange={(e) => {
                    this.setState({
                        ...this.state,
                        title: e.target.value
                    })
                }} id="" placeholder="название" />название</label>
                <br />
                <label><input type="radio" name="typeС" onChange={(e) => {
                    this.setState({
                        ...this.state,
                        contentType: CardContentTypes.Text
                    })
                }} value={CardContentTypes.Text} />Текст</label>
                <label><input type="radio" name="typeС" onChange={(e) => {
                    this.setState({
                        ...this.state,
                        contentType: CardContentTypes.Image
                    })
                }} value={CardContentTypes.Image} defaultChecked />Картинка</label>
                <label><input type="radio" name="typeС" onChange={(e) => {
                    this.setState({
                        ...this.state,
                        contentType: CardContentTypes.DoubleText
                    })
                }} value={CardContentTypes.DoubleText} />Два текста</label>
                <label><input type="radio" name="typeС" onChange={(e) => {
                    this.setState({
                        ...this.state,
                        contentType: CardContentTypes.ImageText
                    })
                }} value={CardContentTypes.ImageText} />Текст и картинка</label>
                <br />
                <textarea placeholder="контент" onChange={(e) => {
                    this.setState({
                        ...this.state,
                        content: e.target.value
                    })
                }}>

                </textarea>
                <button onClick={() => this.addCard()}>
                    Добавить
                </button>
            </div>

            <div className="container col">
                <p>Главные карты (минимум 20)</p>
                <ul className="row">
                    {this.state.leadCards.map(card => {
                        return (
                            <li key={card.content} style={{ display: "flex" }}>
                                <LeadCard onClick={() => this.deleteCard(card)} card={card}></LeadCard>
                            </li>
                        )
                    })}
                </ul>
            </div>
            <div className="container col">
                <p>Вторые карты (минимум 40)</p>
                <ul className="row">
                    {this.state.secondCards.map(card => {
                        return (
                            // <li>
                            //     {l.title} / {l.type} / {l.content} / {l.contentType}
                            // </li>
                            <SecondCard key={card.content} onClick={() => this.deleteCard(card)} card={card}></SecondCard>
                        )
                    })}
                </ul>
            </div>
            <div className="container col">
                <button className="createButton" onClick={() => this.createDeck()}>
                    {this.state.deckId ? "Обновить колоду" : "Создать новую колоду"}</button>
            </div>
        </div>
    }
}