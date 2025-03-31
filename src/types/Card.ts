export interface Card {
    name: string;
    color: 'blue' | 'black' | 'red' | 'yellow';
    prognosed: boolean;
}

export interface GameState {
    drawnCards: Card[];
    piles: Card[][];
    burnedCards: Card[]
}

export type ColorValueHex = `#${string}`;
