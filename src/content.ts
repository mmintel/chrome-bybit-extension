import $ from 'jquery';
import { MessageType, TradeType, MessageRequest, MessageResponse } from './types';
import { parseVal } from './utils';

const messagesFromReactAppListener = (msg: MessageRequest, sender: chrome.runtime.MessageSender, sendResponse: <T>(response: T) => void) => {
    console.log('[content.js]. Message received', msg);
    
    if (msg.type === MessageType.GET_DOM) {
        const equityContent = $('.trade-assets__body div:contains("Equity")').last().children().last().text();
        const equity = parseVal(equityContent);
        const contractDetail = $('.contract-detail');
        const marketPriceContent = contractDetail.find('div:contains("Mark Price")').last().children().last().text();
        const marketPrice = parseVal(marketPriceContent);
        const stoplossContent = $('.tpsl-modal-item__title:contains("Stop Loss")').closest('.oc__row-bottom--12').find('.profit-input .by-input__inner').val();
        const stoploss = parseVal(String(stoplossContent));
        const long = $('.by-checkbox--long').hasClass('by-checkbox--checked');
        const short = $('.by-checkbox--short').hasClass('by-checkbox--checked');
        
        console.log('long or short', long, short)
    
        const response: MessageResponse[MessageType.GET_DOM] = {
            equity,
            marketPrice,
            stoploss,
            tradeType: long ? TradeType.LONG : short ? TradeType.SHORT : null,
        };
    
        console.log('[content.js]. Message response', response);
    
        sendResponse<MessageResponse[MessageType.GET_DOM]>(response)
    } else if (msg.type === MessageType.SET_TRADE_TYPE) {
        const long = $('.by-checkbox--long');
        const short = $('.by-checkbox--short');
        
        if (msg.payload.tradeType === TradeType.LONG && !long.hasClass('by-checkbox--checked')) {
            long.trigger('click')
        } else if (msg.payload.tradeType === TradeType.SHORT && !short.hasClass('by-checkbox--checked')){
            short.trigger('click')
        }

        sendResponse<MessageResponse[MessageType.SET_TRADE_TYPE]>({ success: true })
    } else if (msg.type === MessageType.SET_STOPLOSS) {
        const stoploss = $('.tpsl-modal-item__title:contains("Stop Loss")').closest('.oc__row-bottom--12').find('.profit-input .by-input__inner');
        console.log(stoploss, msg.payload.stoploss)
        stoploss.val(Number(msg.payload.stoploss))
        // stoploss.trigger($.Event('keypress', { keyCode: 49 }))
    }
}

/**
 * Fired when a message is sent from either an extension process or a content script.
 */
chrome.runtime.onMessage.addListener(messagesFromReactAppListener);