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

function App() {
  const [tabID, setTabID] = useState<chrome.tabs.Tab["id"]>(0);
  const [equity, setEquity] = useState(0);
  const [unit, setUnit] = useState("USDT");
  const [riskRelative, setRiskRelative] = useState(1.5);
  const [riskAbsolute, setRiskAbsolute] = useState(0);
  const [marginRelative, setMarginRelative] = useState(2);
  const [marginAbsolute, setMarginAbsolute] = useState(0);
  const [stoplossAbsolute, setStoplossAbsolute] = useState(0);
  const [stoplossRelative, setStoplossRelative] = useState(5);
  const [leverage, setLeverage] = useState(1);
  const [price, setPrice] = useState(0);
  const [tradeType, setTradeType] = useState<TradeType | null>(null);
  const [marginStored, setMarginStored] = useState(true);
  const [stoplossStored, setStoplossStored] = useState(true);
  const [riskStored, setRiskStored] = useState(true);

  useEffect(() => {
    setLeverage(
      Math.round(riskAbsolute / ((marginAbsolute * stoplossRelative) / 100)) ||
        1
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
          const _price = response.triggerPrice.val || response.marketPrice.val;
          setEquity(response.equity.val);
          setUnit(response.equity.unit);
          setPrice(_price);
          setTradeType(
            response.tradeType !== null ? response.tradeType : TradeType.LONG
          );

          // market price is changed and useEffect then overwrites stoploss and margin
          setTimeout(async () => {
            const risk = await getSetting(PersistableSetting.RISK);
            if (risk && riskAbsolute === 0) {
              setRiskRelative(risk);
              setRiskAbsolute((equity * risk) / 100);
            } else {
              setRiskAbsolute((equity * riskRelative) / 100);
            }

            if (response.stoploss.val) {
              setStoplossAbsolute(response.stoploss.val);
              setStoplossRelative(
                Math.abs(100 - (100 * response.stoploss.val) / _price)
              );
            } else {
              const stoploss = await getSetting(PersistableSetting.STOPLOSS);
              if (stoploss && stoplossAbsolute === 0) {
                setStoplossRelative(stoploss);
                setStoplossAbsolute(
                  _price +
                    ((_price * stoploss) / 100) *
                      (tradeType === TradeType.LONG ? -1 : 1)
                );
              } else {
                setStoplossAbsolute(
                  _price +
                    ((_price * stoplossRelative) / 100) *
                      (tradeType === TradeType.LONG ? -1 : 1)
                );
              }
            }

            if (response.margin.val) {
              setMarginAbsolute(response.margin.val);
              setMarginRelative(
                (100 * response.margin.val) / response.equity.val
              );
            } else {
              const margin = await getSetting(PersistableSetting.MARGIN);
              if (margin && marginAbsolute === 0) {
                setMarginRelative(margin);
                setMarginAbsolute((response.equity.val * margin) / 100);
              } else {
                setMarginAbsolute((response.equity.val * marginRelative) / 100);
              }
            }
          }, 0);
        }
      );
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    setEquity,
    setUnit,
    setPrice,
    setStoplossAbsolute,
    setTradeType,
    tabID,
    price,
    equity,
    tradeType,
  ]);

  useEffect(() => {
    if (tabID && stoplossAbsolute) {
      chrome.tabs.sendMessage(tabID, {
        type: MessageType.SET_STOPLOSS,
        payload: {
          stoploss: stoplossAbsolute,
        },
      } as MessageRequest);
    }
  }, [tabID, stoplossAbsolute]);

  useEffect(() => {
    if (tabID && tradeType !== null) {
      chrome.tabs.sendMessage(tabID, {
        type: MessageType.SET_TRADE_TYPE,
        payload: {
          tradeType,
        },
      } as MessageRequest);
    }
  }, [tabID, tradeType]);

  const storeSetting = (setting: PersistableSetting, value: any) => {
    chrome.storage.sync.set({ [String(setting)]: value });
  };

  const getSetting = (setting: PersistableSetting): Promise<any> => {
    return new Promise((resolve) => {
      chrome.storage.sync.get(String(setting), function (result) {
        resolve(result[String(setting)]);
      });
    });
  };

  return (
    <div className="flex flex-col h-full p-8">
      <div>
        <div className="grid grid-cols-2 gap-4 mb-4">
          <Toggle
            label={
              <span className="text-lg uppercase">
                {tradeType === TradeType.LONG ? "Long" : "Short"}
              </span>
            }
            enabled={tradeType === TradeType.LONG}
            onChange={(val) =>
              setTradeType(val ? TradeType.LONG : TradeType.SHORT)
            }
          />
        </div>
        <fieldset className="my-4">
          <legend>Stoploss</legend>
          <Input
            label="Stoploss Absolute"
            id="stoploss"
            type="number"
            prepend="$"
            append={unit}
            onChange={(e) => {
              setStoplossAbsolute(Number(e.target.value));
            }}
            onBlur={(e) => {
              setStoplossRelative(
                Math.abs(100 - (100 * Number(e.target.value)) / price)
              );
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
              setStoplossRelative(Number(e.target.value));
            }}
            onBlur={(e) => {
              setStoplossAbsolute(
                price +
                  ((price * Number(e.target.value)) / 100) *
                    (tradeType === TradeType.LONG ? -1 : 1)
              );
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
            value={stoplossRelative}
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
              setMarginAbsolute(Number(e.target.value));
            }}
            onBlur={(e) => {
              setMarginRelative((100 * Number(e.target.value)) / equity);
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
            }}
            onBlur={(e) => {
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
              setRiskAbsolute(Number(e.target.value));
            }}
            onBlur={(e) => {
              setRiskRelative((100 * Number(e.target.value)) / equity);
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
            }}
            onBlur={(e) => {
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
        <a className="underline" href="https://www.paypal.me/marcmintel">
          Buy me a coffee ☕
        </a>
      </p>
    </div>
  );
}

export default App;
