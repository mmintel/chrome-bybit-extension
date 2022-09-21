import { useEffect, useState } from "react";
import { SaveIcon } from "./components/SaveIcon";
import { Input } from "./components/Input";
import { Toggle } from "./components/Toggle";
import {
  MessageType,
  TradeType,
  MessageRequest,
  MessageResponse,
} from "./types";

enum PersistableSetting {
  MARGIN,
  STOPLOSS,
  RISK,
}

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
  const [marginStored, setMarginStored] = useState(true);
  const [stoplossStored, setStoplossStored] = useState(true);
  const [riskStored, setRiskStored] = useState(true);

  useEffect(() => {
    if (stoplossRelative) {
      console.log("OVERWRITE STOPLOSS");
      setStoplossAbsolute(marketPrice - (marketPrice * stoplossRelative) / 100);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [marketPrice]);

  useEffect(() => {
    if (marginRelative) {
      setMarginAbsolute((equity * marginRelative) / 100);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [equity]);

  useEffect(() => {
    if (riskRelative) {
      setRiskAbsolute((equity * riskRelative) / 100);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [equity]);

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
          setTradeType(response.tradeType ?? TradeType.LONG);

          // market price is changed and useEffect then overwrites stoploss and margin
          setTimeout(() => {
            if (response.stoploss.val) {
              console.log("INITIAL SET STOPLOSS");
              setStoplossAbsolute(response.stoploss.val);
              // TODO relative stoploss
            }

            if (response.margin.val) {
              setMarginAbsolute(response.margin.val);
              // TODO relative margin
            }
          }, 0);
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

  const storeSetting = (setting: PersistableSetting, value: any) => {
    chrome.storage.sync.set({ [String(setting)]: value }, function () {
      console.log("Value is set to " + value);
      chrome.storage.sync.get(String(setting), function (result) {
        console.log("result", result);
        value = result[String(setting)];
      });
    });
  };

  const getSetting = (setting: PersistableSetting): Promise<any> => {
    return new Promise((resolve) => {
      chrome.storage.sync.get(String(setting), function (result) {
        resolve(result[String(setting)]);
      });
    });
  };

  useEffect(() => {
    (async () => {
      const margin = await getSetting(PersistableSetting.MARGIN);
      if (margin) {
        setMarginRelative(margin);
      }

      const stoploss = await getSetting(PersistableSetting.STOPLOSS);
      if (stoploss) {
        setStoplossRelative(stoploss);
      }

      const risk = await getSetting(PersistableSetting.RISK);
      if (risk) {
        setRiskRelative(risk);
      }
    })();
  }, []);

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
        <fieldset className="my-4">
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
              setStoplossStored(false);
            }}
            value={stoplossAbsolute}
            className="mb-2"
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
              setStoplossStored(false);
            }}
            append={
              !stoplossStored && (
                <SaveIcon
                  className="w-6 h-6 cursor-pointer"
                  onClick={() => {
                    storeSetting(PersistableSetting.STOPLOSS, stoplossRelative);
                    setStoplossStored(true);
                  }}
                />
              )
            }
            value={stoplossRelative.toFixed(2)}
            className="mb-2"
            step={0.1}
          />
        </fieldset>
        <fieldset className="my-4">
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
              setMarginStored(false);
            }}
            step={0.1}
            className="mb-2"
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
              setMarginStored(false);
            }}
            step={0.1}
            append={
              !marginStored && (
                <SaveIcon
                  className="w-6 h-6 cursor-pointer"
                  onClick={() => {
                    storeSetting(PersistableSetting.MARGIN, marginRelative);
                    setMarginStored(true);
                  }}
                />
              )
            }
            className="mb-2"
          />
        </fieldset>
        <fieldset className="my-4">
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
              setRiskStored(false);
            }}
            prepend="$"
            append={unit}
            className="mb-2"
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
              setRiskStored(false);
            }}
            prepend="%"
            append={
              !riskStored && (
                <SaveIcon
                  className="w-6 h-6 cursor-pointer"
                  onClick={() => {
                    storeSetting(PersistableSetting.RISK, riskRelative);
                    setRiskStored(true);
                  }}
                />
              )
            }
            className="mb-2"
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
        . Available open source on{" "}
        <a
          href="https://github.com/mmintel/chrome-bybit-extension"
          target="_blank"
          rel="noreferrer"
          className="underline"
        >
          Github
        </a>
        .
      </p>
      <p className="py-4 mt-auto text-xs text-center text-gray-500">
        <a className="underline" href="#">
          Buy me a coffe if you like this.
        </a>
      </p>
    </div>
  );
}

export default App;
