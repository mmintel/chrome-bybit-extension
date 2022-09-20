import './App.css';
import { Input } from './components/Input';

function App() {
  return (
    <div className='flex flex-col h-full p-8'>
      <div>
        <h1 className='mb-4 text-lg'>Bybit Risk:Reward Calculator</h1>
        <Input label="Risk" id="risk" type="number" helptext='Enter your risk to reward ratio' defaultValue={1.5} step={0.1} />
      </div>
      <p className='text-xs text-gray-500 mt-auto py-4 text-center'>Third party Bybit browser extension to help with your position sizing. Inspired by <a className='underline' href="https://risk-reward-calc.netlify.app/" target="_blank" rel="noreferrer">Kite's Calculator</a>. Created by <a className='underline' href="https://twitter.com/marcmintel" target="_bank">Marc Mintel</a>.</p>
    </div>
  );
}

export default App;
