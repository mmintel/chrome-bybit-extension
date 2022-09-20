export enum MessageType {
    GET_DOM = 'GET_DOM',
    SET_TRADE_TYPE = 'SET_TRADE_TYPE',
    SET_STOPLOSS = 'SET_STOPLOSS'
}

type GetDOMMessageRequest = {
    type: MessageType.GET_DOM,
}

type SetTradeTypeRequest = {
    type: MessageType.SET_TRADE_TYPE,
    payload: {
        tradeType: TradeType
    }
}

type SetStoplossRequest = {
    type: MessageType.SET_STOPLOSS,
    payload: {
        stoploss: number
    }
}

export type MessageRequest = GetDOMMessageRequest | SetTradeTypeRequest | SetStoplossRequest;

export interface MessagePayload extends Record<MessageType, Record<string, any>> {
    [MessageType.GET_DOM]: {
        type: MessageType.GET_DOM
    };
    [MessageType.SET_TRADE_TYPE]: {
        type: MessageType.SET_TRADE_TYPE,
        payload : {
            tradeType: TradeType
        }
    }
}

export interface MessageResponse extends Record<MessageType, Record<string, any>> {
    [MessageType.GET_DOM]: {
        equity: {
            val: number,
            unit: string,
        };
        marketPrice: {
            val: number,
            unit: string,
        }
        stoploss: {
            val: number,
            unit: string,
        },
        tradeType: TradeType | null
    },
    [MessageType.SET_TRADE_TYPE]: {
        success: boolean
    }
}

export enum TradeType {
    LONG,
    SHORT,
}