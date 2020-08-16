
export interface Card {
    type: CardTypes,
    title: string,
    content: string,
    given?: boolean,
    contentType: CardContentTypes,

}

export enum CardTypes {
    LeadCard,
    SecondCard
}

export enum CardContentTypes {
    Text,
    Image,
    DoubleText,
    ImageText
}