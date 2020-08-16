import { Schema, Model, model, Document } from "mongoose";
import { Card } from "./Card"

export interface IDeck {
    title: string;
    restrictions: string;
    logo: string;
    beenUsed: number;
    rating: number;
    leadCards: Card[];
    secondCards: Card[];
}

export interface DeckType extends Document, IDeck { };
const DeckSchema = new Schema({
    title: {
        type: String,
        required: true
    },
    restrictions: {
        type: String
    },
    logo: {
        type: String
    },
    beenUsed: {
        type: Number,
        default: 0,
    },
    rating: {
        type: Number,
        default: 0
    },
    leadCards: {
        type: Array,
        default: []
    },
    secondCards: {
        type: Array,
        default: []
    }
});


export let Deck = model<DeckType>("Deck", DeckSchema);