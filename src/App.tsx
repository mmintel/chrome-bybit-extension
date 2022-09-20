import { useEffect, useState } from "react";
import { Input } from "./components/Input";
import { Toggle } from "./components/Toggle";
import {
  MessageType,
  TradeType,
  MessageRequest,
  MessageResponse,
} from "./types";

function App() {
  const [tabID, setTabID] = useState<chrome.tabs.Tab["id"]>(0);
  const [equity, setEquity] = useState(0);
  const [unit, setUnit] = useState("USDT");
  const [risk, setRisk] = useState(1.5);
  const [margin, setMargin] = useState(2);
  const [stoplossAbsolute, setStoplossAbsolute] = useState(0);
  const [stoplossRelative, setStoplossRelative] = useState(0);
  const [leverage, setLeverage] = useState(0);
  const [marketPrice, setMarketPrice] = useState(0);
  const [tradeType, setTradeType] = useState<TradeType>(TradeType.LONG);

  useEffect(() => {
    chrome.tabs &&
      chrome.tabs.query(
        {
          active: true,
          currentWindow: true,
        },
        (tabs) => {
          setTabID(tabs[0].id ?? 0);
        }
      );
  }, [setTabID]);

  useEffect(() => {
    if (tabID) {
      chrome.tabs.sendMessage(
        tabID,
        { type: MessageType.GET_DOM } as MessageRequest,
        (response: MessageResponse[MessageType.GET_DOM]) => {
          console.log(response);
          setEquity(response.equity.val);
          setUnit(response.equity.unit);
          setMarketPrice(response.marketPrice.val);
          setStoplossAbsolute(response.stoploss.val);
          setTradeType(response.tradeType ?? TradeType.LONG);
        }
      );
    }
  }, [
    setEquity,
    setUnit,
    setMarketPrice,
    setStoplossAbsolute,
    setTradeType,
    tabID,
  ]);

  useEffect(() => {
    setStoplossRelative((100 * stoplossAbsolute) / marketPrice);
  }, [marketPrice, stoplossAbsolute]);

  useEffect(() => {
    if (tabID && stoplossAbsolute) {
      console.log("send stoploss", stoplossAbsolute);
      chrome.tabs.sendMessage(tabID, {
        type: MessageType.SET_STOPLOSS,
        payload: {
          stoploss: stoplossAbsolute,
        },
      } as MessageRequest);
    }
  }, [tabID, stoplossAbsolute]);

  useEffect(() => {
    if (tabID) {
      chrome.tabs.sendMessage(tabID, {
        type: MessageType.SET_TRADE_TYPE,
        payload: {
          tradeType,
        },
      } as MessageRequest);
    }
  }, [tabID, tradeType]);

  return (
    <div className="flex flex-col h-full p-8">
      <div>
        <h1 className="mb-4 text-lg">Bybit Risk:Reward Calculator</h1>
        <Toggle
          label={
            <span className="uppercase text-lg">
              {tradeType === TradeType.LONG ? "Long" : "Short"}
            </span>
          }
          className="mb-4"
          enabled={tradeType === TradeType.LONG}
          onChange={(val) =>
            setTradeType(val ? TradeType.LONG : TradeType.SHORT)
          }
        />
        <Input
          label="Equity"
          id="requity"
          type="number"
          prepend="$"
          append={unit}
          value={equity}
          disabled
          className="mb-4"
          showLabel
        />
        <Input
          label="Market Price"
          id="market"
          type="number"
          prepend="$"
          append={unit}
          value={marketPrice}
          disabled
          className="mb-4"
          showLabel
        />
        <fieldset>
          <legend>Stoploss</legend>
          <Input
            label="Stoploss Absolute"
            id="stoploss"
            type="number"
            prepend="$"
            append={unit}
            onChange={(e) => setStoplossAbsolute(Number(e.target.value))}
            value={stoplossAbsolute}
            className="mb-4"
          />
          <Input
            label="Stoploss Relative"
            id="stoploss"
            type="number"
            prepend="%"
            append={unit}
            onChange={(e) => setStoplossRelative(Number(e.target.value))}
            value={stoplossRelative.toFixed(2)}
            className="mb-4"
          />
        </fieldset>
        <fieldset>
          <legend>Margin</legend>
          <Input
            label="Margin Size"
            id="risk"
            type="number"
            prepend="%"
            value={margin}
            onChange={(e) => setMargin(Number(e.target.value))}
            step={0.1}
            className="mb-4"
          />
        </fieldset>
        <fieldset>
          <legend>Risk</legend>
          <Input
            label="Risk"
            id="risk"
            type="number"
            value={risk}
            step={0.1}
            onChange={(e) => setRisk(Number(e.target.value))}
            prepend="%"
            className="mb-4"
          />
        </fieldset>
      </div>
      <p className="text-xs text-gray-500 mt-auto py-4 text-center">
        Third party Bybit browser extension to help with your position sizing.
        Inspired by{" "}
        <a
          className="underline"
          href="https://risk-reward-calc.netlify.app/"
          target="_blank"
          rel="noreferrer"
        >
          Kite's Calculator
        </a>
        . Created by{" "}
        <a
          className="underline"
          href="https://twitter.com/marcmintel"
          target="_bank"
        >
          Marc Mintel
        </a>
        .
      </p>
    </div>
  );
}

export default App;
