import { type FC, useState, useEffect, useCallback } from 'react';
import { useWallet, useConnection } from '@solana/wallet-adapter-react';
import { LAMPORTS_PER_SOL } from '@solana/web3.js';
import { HBC_MINT, XNT_MINT, DEFAULT_SLIPPAGE, SLIPPAGE_OPTIONS, EXPLORER_URL } from '../lib/constants';
import { getQuote, executeSwap, type SwapPrepareResponse } from '../lib/xdex';

interface Token {
  symbol: string;
  mint: string;
  logo?: string;
  decimals: number;
}

const TOKENS: Token[] = [
  { symbol: 'XNT', mint: XNT_MINT.toString(), decimals: 9, logo: '⚡' },
  { symbol: 'HBC', mint: HBC_MINT.toString(), decimals: 9, logo: '💀' },
];

export const SwapCard: FC = () => {
  const { publicKey, connected, signTransaction } = useWallet();
  const { connection } = useConnection();
  
  const [tokenIn, setTokenIn] = useState<Token>(TOKENS[0]);
  const [tokenOut, setTokenOut] = useState<Token>(TOKENS[1]);
  const [amountIn, setAmountIn] = useState('');
  const [amountOut, setAmountOut] = useState('');
  const [slippage, setSlippage] = useState(DEFAULT_SLIPPAGE);
  const [loading, setLoading] = useState(false);
  const [swapping, setSwapping] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [quote, setQuote] = useState<SwapPrepareResponse | null>(null);
  const [balanceIn, setBalanceIn] = useState<number | null>(null);
  const [balanceOut, setBalanceOut] = useState<number | null>(null);

  // Fetch token balances
  const fetchBalances = useCallback(async () => {
    if (!publicKey || !connection) return;
    
    try {
      // XNT (native) balance
      if (tokenIn.symbol === 'XNT' || tokenOut.symbol === 'XNT') {
        const balance = await connection.getBalance(publicKey);
        const xntBalance = balance / LAMPORTS_PER_SOL;
        if (tokenIn.symbol === 'XNT') setBalanceIn(xntBalance);
        if (tokenOut.symbol === 'XNT') setBalanceOut(xntBalance);
      }
      
      // HBC balance
      if (tokenIn.symbol === 'HBC' || tokenOut.symbol === 'HBC') {
        const tokenAccounts = await connection.getParsedTokenAccountsByOwner(publicKey, {
          mint: HBC_MINT,
        });
        
        const hbcBalance = tokenAccounts.value.length > 0
          ? tokenAccounts.value[0].account.data.parsed.info.tokenAmount.uiAmount
          : 0;
          
        if (tokenIn.symbol === 'HBC') setBalanceIn(hbcBalance);
        if (tokenOut.symbol === 'HBC') setBalanceOut(hbcBalance);
      }
    } catch (err) {
      console.error('Failed to fetch balances:', err);
    }
  }, [publicKey, connection, tokenIn, tokenOut]);

  useEffect(() => {
    fetchBalances();
    const interval = setInterval(fetchBalances, 10000); // Refresh every 10s
    return () => clearInterval(interval);
  }, [fetchBalances]);

  // Swap token positions
  const handleSwapTokens = () => {
    setTokenIn(tokenOut);
    setTokenOut(tokenIn);
    setAmountIn(amountOut);
    setAmountOut(amountIn);
    setBalanceIn(balanceOut);
    setBalanceOut(balanceIn);
    setQuote(null);
  };

  // Set max amount
  const handleSetMax = () => {
    if (balanceIn !== null) {
      // Leave a small amount for gas if it's the native token
      const maxAmount = tokenIn.symbol === 'XNT' 
        ? Math.max(0, balanceIn - 0.01) 
        : balanceIn;
      setAmountIn(maxAmount.toString());
    }
  };

  // Get quote when amount changes
  useEffect(() => {
    const fetchQuote = async () => {
      if (!amountIn || parseFloat(amountIn) <= 0 || !publicKey) {
        setAmountOut('');
        setQuote(null);
        return;
      }

      setLoading(true);
      setError(null);

      try {
        const result = await getQuote(
          tokenIn.mint,
          tokenOut.mint,
          parseFloat(amountIn),
          publicKey.toString()
        );
        
        setQuote(result);
        
        if (result.estimatedOutput !== undefined) {
          setAmountOut(result.estimatedOutput.toString());
        } else if (result.error) {
          setError(result.error);
        }
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to get quote';
        setError(message);
        setAmountOut('');
        setQuote(null);
      } finally {
        setLoading(false);
      }
    };

    const debounce = setTimeout(fetchQuote, 500);
    return () => clearTimeout(debounce);
  }, [amountIn, tokenIn, tokenOut, publicKey]);

  // Execute swap
  const handleSwap = async () => {
    if (!connected || !publicKey || !quote?.transaction || !signTransaction) {
      return;
    }
    
    setSwapping(true);
    setError(null);
    setSuccess(null);
    
    try {
      const signature = await executeSwap(quote.transaction, signTransaction);
      
      setSuccess(signature);
      setAmountIn('');
      setAmountOut('');
      setQuote(null);
      
      // Refresh balances after swap
      setTimeout(fetchBalances, 2000);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Swap failed';
      setError(message);
    } finally {
      setSwapping(false);
    }
  };

  const isInsufficientBalance = balanceIn !== null && parseFloat(amountIn || '0') > balanceIn;
  const canSwap = connected && amountIn && quote?.transaction && !loading && !swapping && !isInsufficientBalance;

  return (
    <div className="max-w-md mx-auto">
      <div className="bg-[var(--color-bg-card)] rounded-2xl p-6 shadow-lg border border-[var(--color-tan)]">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold">Swap</h2>
          
          {/* Slippage settings */}
          <div className="flex items-center gap-2">
            <span className="text-sm text-[var(--color-text-muted)]">Slippage:</span>
            <select
              value={slippage}
              onChange={(e) => setSlippage(parseFloat(e.target.value))}
              className="bg-[var(--color-bg)] rounded-lg px-2 py-1 text-sm border border-[var(--color-tan)]"
            >
              {SLIPPAGE_OPTIONS.map((opt) => (
                <option key={opt} value={opt}>{opt}%</option>
              ))}
            </select>
          </div>
        </div>

        {/* Token In */}
        <div className="bg-[var(--color-bg)] rounded-xl p-4 mb-2">
          <div className="flex justify-between mb-2">
            <span className="text-sm text-[var(--color-text-muted)]">You pay</span>
            <span className="text-sm text-[var(--color-text-muted)]">
              Balance: {balanceIn !== null ? balanceIn.toFixed(4) : '--'}
              {balanceIn !== null && (
                <button 
                  onClick={handleSetMax}
                  className="ml-2 text-[var(--color-warm-brown)] hover:underline"
                >
                  MAX
                </button>
              )}
            </span>
          </div>
          <div className="flex items-center gap-3">
            <input
              type="number"
              value={amountIn}
              onChange={(e) => setAmountIn(e.target.value)}
              placeholder="0.00"
              className={`flex-1 bg-transparent text-3xl font-semibold outline-none ${
                isInsufficientBalance ? 'text-red-500' : ''
              }`}
            />
            <button className="flex items-center gap-2 bg-[var(--color-bg-card)] rounded-xl px-4 py-2 hover:bg-[var(--color-tan-light)] transition-colors">
              <span className="text-xl">{tokenIn.logo}</span>
              <span className="font-semibold">{tokenIn.symbol}</span>
              <span>▼</span>
            </button>
          </div>
        </div>

        {/* Swap direction button */}
        <div className="flex justify-center -my-3 relative z-10">
          <button
            onClick={handleSwapTokens}
            className="bg-[var(--color-warm-brown)] hover:bg-[var(--color-dark-brown)] text-white rounded-full p-3 transition-colors shadow-lg"
          >
            ↕️
          </button>
        </div>

        {/* Token Out */}
        <div className="bg-[var(--color-bg)] rounded-xl p-4 mt-2">
          <div className="flex justify-between mb-2">
            <span className="text-sm text-[var(--color-text-muted)]">You receive</span>
            <span className="text-sm text-[var(--color-text-muted)]">
              Balance: {balanceOut !== null ? balanceOut.toFixed(4) : '--'}
            </span>
          </div>
          <div className="flex items-center gap-3">
            <input
              type="text"
              value={loading ? 'Loading...' : amountOut}
              readOnly
              placeholder="0.00"
              className="flex-1 bg-transparent text-3xl font-semibold outline-none"
            />
            <button className="flex items-center gap-2 bg-[var(--color-bg-card)] rounded-xl px-4 py-2 hover:bg-[var(--color-tan-light)] transition-colors">
              <span className="text-xl">{tokenOut.logo}</span>
              <span className="font-semibold">{tokenOut.symbol}</span>
              <span>▼</span>
            </button>
          </div>
        </div>

        {/* Error message */}
        {error && (
          <div className="mt-4 p-3 bg-red-500/10 border border-red-500/50 rounded-lg text-red-500 text-sm">
            {error}
          </div>
        )}

        {/* Success message */}
        {success && (
          <div className="mt-4 p-3 bg-green-500/10 border border-green-500/50 rounded-lg text-green-500 text-sm">
            <p>Swap successful! 🎉</p>
            <a 
              href={`${EXPLORER_URL}/tx/${success}`}
              target="_blank"
              rel="noopener noreferrer"
              className="underline hover:no-underline"
            >
              View transaction →
            </a>
          </div>
        )}

        {/* Quote details */}
        {quote && !error && amountIn && amountOut && (
          <div className="mt-4 p-3 bg-[var(--color-bg)] rounded-lg text-sm space-y-1">
            <div className="flex justify-between">
              <span className="text-[var(--color-text-muted)]">Rate</span>
              <span>1 {tokenIn.symbol} = {(parseFloat(amountOut) / parseFloat(amountIn)).toFixed(6)} {tokenOut.symbol}</span>
            </div>
            {quote.priceImpact !== undefined && (
              <div className="flex justify-between">
                <span className="text-[var(--color-text-muted)]">Price Impact</span>
                <span className={quote.priceImpact > 5 ? 'text-red-500' : ''}>
                  {quote.priceImpact.toFixed(2)}%
                </span>
              </div>
            )}
            {quote.minimumReceived !== undefined && (
              <div className="flex justify-between">
                <span className="text-[var(--color-text-muted)]">Min. Received</span>
                <span>{quote.minimumReceived.toFixed(6)} {tokenOut.symbol}</span>
              </div>
            )}
            {quote.fee !== undefined && (
              <div className="flex justify-between">
                <span className="text-[var(--color-text-muted)]">Fee</span>
                <span>{quote.fee.toFixed(6)} {tokenIn.symbol}</span>
              </div>
            )}
          </div>
        )}

        {/* Swap button */}
        <button
          onClick={handleSwap}
          disabled={!canSwap}
          className={`w-full mt-6 py-4 rounded-xl font-bold text-lg transition-colors ${
            canSwap
              ? 'bg-[var(--color-warm-brown)] hover:bg-[var(--color-dark-brown)] text-white'
              : 'bg-[var(--color-tan)] text-[var(--color-text-muted)] cursor-not-allowed'
          }`}
        >
          {!connected
            ? 'Connect Wallet'
            : swapping
            ? 'Swapping...'
            : loading
            ? 'Getting Quote...'
            : isInsufficientBalance
            ? 'Insufficient Balance'
            : !amountIn
            ? 'Enter Amount'
            : !quote?.transaction
            ? 'Unable to Swap'
            : 'Swap'}
        </button>
      </div>
    </div>
  );
};
