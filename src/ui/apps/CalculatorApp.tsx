// ============================================================================
// NOVA OS — CALCULATOR ACCESSORY APPLICATION
// Simple arithmetic calculator accessory
// ============================================================================

import React, { useState } from 'react';

export const CalculatorApp: React.FC = () => {
  const [display, setDisplay] = useState('0');
  const [prevValue, setPrevValue] = useState<number | null>(null);
  const [operator, setOperator] = useState<string | null>(null);
  const [waitingForOperand, setWaitingForOperand] = useState(false);

  const inputDigit = (digit: string) => {
    if (waitingForOperand) {
      setDisplay(digit);
      setWaitingForOperand(false);
    } else {
      setDisplay(display === '0' ? digit : display + digit);
    }
  };

  const performOperation = (nextOperator: string) => {
    const inputValue = parseFloat(display);

    if (prevValue === null) {
      setPrevValue(inputValue);
    } else if (operator) {
      const currentValue = prevValue || 0;
      let newValue = currentValue;

      if (operator === '+') newValue = currentValue + inputValue;
      else if (operator === '-') newValue = currentValue - inputValue;
      else if (operator === '×') newValue = currentValue * inputValue;
      else if (operator === '÷') newValue = inputValue !== 0 ? currentValue / inputValue : 0;

      setPrevValue(newValue);
      setDisplay(String(newValue));
    }

    setWaitingForOperand(true);
    setOperator(nextOperator);
  };

  const handleClear = () => {
    setDisplay('0');
    setPrevValue(null);
    setOperator(null);
    setWaitingForOperand(false);
  };

  return (
    <div className="h-full w-full p-3 bg-[#080C14] flex flex-col justify-between text-xs select-none">
      {/* Calculator Display */}
      <div className="p-3 bg-[#0D1424] rounded-lg border border-white/5 text-right font-mono text-xl font-bold text-cyan-400 truncate">
        {display}
      </div>

      {/* Calculator Buttons Grid */}
      <div className="grid grid-cols-4 gap-2 pt-2">
        <button onClick={handleClear} className="p-2.5 rounded bg-slate-800 hover:bg-slate-700 text-amber-400 font-bold col-span-2">
          AC
        </button>
        <button onClick={() => performOperation('÷')} className="p-2.5 rounded bg-slate-800 hover:bg-slate-700 text-cyan-400 font-bold">
          ÷
        </button>
        <button onClick={() => performOperation('×')} className="p-2.5 rounded bg-slate-800 hover:bg-slate-700 text-cyan-400 font-bold">
          ×
        </button>

        {['7', '8', '9'].map((d) => (
          <button key={d} onClick={() => inputDigit(d)} className="p-2.5 rounded bg-slate-900 hover:bg-slate-800 text-slate-100 font-bold">
            {d}
          </button>
        ))}
        <button onClick={() => performOperation('-')} className="p-2.5 rounded bg-slate-800 hover:bg-slate-700 text-cyan-400 font-bold">
          -
        </button>

        {['4', '5', '6'].map((d) => (
          <button key={d} onClick={() => inputDigit(d)} className="p-2.5 rounded bg-slate-900 hover:bg-slate-800 text-slate-100 font-bold">
            {d}
          </button>
        ))}
        <button onClick={() => performOperation('+')} className="p-2.5 rounded bg-slate-800 hover:bg-slate-700 text-cyan-400 font-bold">
          +
        </button>

        {['1', '2', '3'].map((d) => (
          <button key={d} onClick={() => inputDigit(d)} className="p-2.5 rounded bg-slate-900 hover:bg-slate-800 text-slate-100 font-bold">
            {d}
          </button>
        ))}
        <button onClick={() => performOperation('=')} className="p-2.5 rounded bg-cyan-600 hover:bg-cyan-500 text-white font-bold row-span-2">
          =
        </button>

        <button onClick={() => inputDigit('0')} className="p-2.5 rounded bg-slate-900 hover:bg-slate-800 text-slate-100 font-bold col-span-2">
          0
        </button>
        <button onClick={() => !display.includes('.') && setDisplay(display + '.')} className="p-2.5 rounded bg-slate-900 hover:bg-slate-800 text-slate-100 font-bold">
          .
        </button>
      </div>
    </div>
  );
};
