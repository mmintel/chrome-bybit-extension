import { useEffect, useState } from "react";
import { Input } from "./components/Input";
import { Toggle } from "./components/Toggle";
import {
  MessageType,
  TradeType,
  MessageRequest,
  MessageResponse,
} from "./types";

// 5% (stoploss) von margin 20€ sind 1€. 1€ sind 10% vom risk 10€. also brauche ich 10x leverage um auf 10€ risk zu kommen.

function App() {
  const [tabID, setTabID] = useState<chrome.tabs.Tab["id"]>(0);
  const [equity, setEquity] = useState(0);
  const [unit, setUnit] = useState("USDT");
  const [riskRelative, setRiskRelative] = useState(1.5);
  const [riskAbsolute, setRiskAbsolute] = useState(0);
  const [marginRelative, setMarginRelative] = useState(2);
  const [marginAbsolute, setMarginAbsolute] = useState(2);
  const [stoplossAbsolute, setStoplossAbsolute] = useState(0);
  const [stoplossRelative, setStoplossRelative] = useState(5);
  const [leverage, setLeverage] = useState(1);
  const [marketPrice, setMarketPrice] = useState(0);
  const [tradeType, setTradeType] = useState<TradeType>(TradeType.LONG);

  useEffect(() => {
    if (stoplossRelative) {
      setStoplossAbsolute(marketPrice - (marketPrice * stoplossRelative) / 100);
    }
  }, [marketPrice, stoplossRelative, setStoplossAbsolute]);

  useEffect(() => {
    if (marginRelative) {
      setMarginAbsolute((equity * marginRelative) / 100);
    }
  }, [equity, marginRelative, setMarginAbsolute]);

  useEffect(() => {
    if (riskRelative) {
      setRiskAbsolute((equity * riskRelative) / 100);
    }
  }, [equity, riskRelative, setRiskAbsolute]);

  useEffect(() => {
    setLeverage(
      Math.round(riskAbsolute / ((marginAbsolute * stoplossRelative) / 100))
    );
  }, [stoplossRelative, marginAbsolute, riskAbsolute]);

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
            <span className="text-lg uppercase">
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
            onChange={(e) => {
              setStoplossRelative((100 * Number(e.target.value)) / marketPrice);
              setStoplossAbsolute(Number(e.target.value));
            }}
            value={stoplossAbsolute}
            className="mb-4"
          />
          <Input
            label="Stoploss Relative"
            id="stoploss"
            type="number"
            prepend="%"
            onChange={(e) => {
              setStoplossAbsolute(
                marketPrice - (marketPrice * Number(e.target.value)) / 100
              );
              setStoplossRelative(Number(e.target.value));
            }}
            value={stoplossRelative.toFixed(2)}
            className="mb-4"
            step={0.1}
          />
        </fieldset>
        <fieldset>
          <legend>Margin</legend>
          <Input
            label="Margin Absolute"
            id="risk"
            type="number"
            prepend="$"
            append={unit}
            value={marginAbsolute}
            onChange={(e) => {
              setMarginRelative((100 * Number(e.target.value)) / equity);
              setMarginAbsolute(Number(e.target.value));
            }}
            step={0.1}
            className="mb-4"
          />
          <Input
            label="Margin Relative"
            id="risk"
            type="number"
            prepend="%"
            value={marginRelative}
            onChange={(e) => {
              setMarginRelative(Number(e.target.value));
              setMarginAbsolute((equity * Number(e.target.value)) / 100);
            }}
            step={0.1}
            className="mb-4"
          />
        </fieldset>
        <fieldset>
          <legend>Risk</legend>
          <Input
            label="Risk Absolute"
            id="risk"
            type="number"
            value={riskAbsolute}
            step={0.1}
            onChange={(e) => {
              setRiskRelative((100 * Number(e.target.value)) / equity);
              setRiskAbsolute(Number(e.target.value));
            }}
            prepend="$"
            append={unit}
            className="mb-4"
          />
          <Input
            label="Risk Relative"
            id="risk"
            type="number"
            value={riskRelative}
            step={0.1}
            onChange={(e) => {
              setRiskRelative(Number(e.target.value));
              setRiskAbsolute((equity * Number(e.target.value)) / 100);
            }}
            prepend="%"
            className="mb-4"
          />
        </fieldset>
        <Input
          label="Leverage"
          id="leverage"
          type="number"
          prepend="&times;"
          value={leverage}
          disabled
          className="mb-4"
          showLabel
        />
      </div>
      <p className="py-4 mt-auto text-xs text-center text-gray-500">
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
