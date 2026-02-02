import { type FC, useState, useEffect, useCallback } from 'react';
import { useWallet, useConnection } from '@solana/wallet-adapter-react';
import { PublicKey } from '@solana/web3.js';
import { 
  HBC_MINT, HBC_DECIMALS, HBC_SYMBOL, HBC_LOGO,
  USDC_MINT, USDC_DECIMALS, USDC_SYMBOL, USDC_LOGO,
  XNT_MINT, XNT_DECIMALS, XNT_SYMBOL, XNT_LOGO,
  DEFAULT_SLIPPAGE, SLIPPAGE_OPTIONS, EXPLORER_URL 
} from '../lib/constants';
import { getQuote, executeSwap, type SwapPrepareResponse } from '../lib/xdex';

interface Token {
  symbol: string;
  mint: PublicKey;
  logo: string;
  decimals: number;
}

const TOKENS: Token[] = [
  { symbol: USDC_SYMBOL, mint: USDC_MINT, decimals: USDC_DECIMALS, logo: USDC_LOGO },
  { symbol: HBC_SYMBOL, mint: HBC_MINT, decimals: HBC_DECIMALS, logo: HBC_LOGO },
  { symbol: XNT_SYMBOL, mint: XNT_MINT, decimals: XNT_DECIMALS, logo: XNT_LOGO },
];

export const SwapCard: FC = () => {
  const { publicKey, connected, signTransaction } = useWallet();
  const { connection } = useConnection();
  
  const [tokenIn, setTokenIn] = useState<Token>(TOKENS[0]); // USDC.x
  const [tokenOut, setTokenOut] = useState<Token>(TOKENS[1]); // HBC
  const [amountIn, setAmountIn] = useState('');
  const [amountOut, setAmountOut] = useState('');
  const [slippage, setSlippage] = useState(DEFAULT_SLIPPAGE);
  const [showSlippage, setShowSlippage] = useState(false);
  const [loading, setLoading] = useState(false);
  const [swapping, setSwapping] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [quote, setQuote] = useState<SwapPrepareResponse | null>(null);
  const [balanceIn, setBalanceIn] = useState<number | null>(null);
  const [balanceOut, setBalanceOut] = useState<number | null>(null);
  const [showTokenSelect, setShowTokenSelect] = useState<'in' | 'out' | null>(null);

  // Fetch token balance
  const fetchTokenBalance = useCallback(async (mint: PublicKey, decimals: number): Promise<number> => {
    if (!publicKey || !connection) return 0;
    
    try {
      // Native token (XNT)
      if (mint.equals(XNT_MINT)) {
        const balance = await connection.getBalance(publicKey);
        return balance / Math.pow(10, decimals);
      }
      
      // SPL tokens
      const tokenAccounts = await connection.getParsedTokenAccountsByOwner(publicKey, { mint });
      if (tokenAccounts.value.length > 0) {
        return tokenAccounts.value[0].account.data.parsed.info.tokenAmount.uiAmount || 0;
      }
      return 0;
    } catch (err) {
      console.error('Failed to fetch balance:', err);
      return 0;
    }
  }, [publicKey, connection]);

  // Fetch balances
  const fetchBalances = useCallback(async () => {
    const [balIn, balOut] = await Promise.all([
      fetchTokenBalance(tokenIn.mint, tokenIn.decimals),
      fetchTokenBalance(tokenOut.mint, tokenOut.decimals),
    ]);
    setBalanceIn(balIn);
    setBalanceOut(balOut);
  }, [fetchTokenBalance, tokenIn, tokenOut]);

  useEffect(() => {
    if (connected) {
      fetchBalances();
      const interval = setInterval(fetchBalances, 15000);
      return () => clearInterval(interval);
    }
  }, [connected, fetchBalances]);

  // Swap token positions
  const handleSwapTokens = () => {
    setTokenIn(tokenOut);
    setTokenOut(tokenIn);
    setAmountIn(amountOut);
    setAmountOut(amountIn);
    setBalanceIn(balanceOut);
    setBalanceOut(balanceIn);
    setQuote(null);
    setError(null);
  };

  // Select token
  const handleSelectToken = (token: Token) => {
    if (showTokenSelect === 'in') {
      if (token.mint.equals(tokenOut.mint)) {
        handleSwapTokens();
      } else {
        setTokenIn(token);
      }
    } else if (showTokenSelect === 'out') {
      if (token.mint.equals(tokenIn.mint)) {
        handleSwapTokens();
      } else {
        setTokenOut(token);
      }
    }
    setShowTokenSelect(null);
    setQuote(null);
  };

  // Set max amount
  const handleSetMax = () => {
    if (balanceIn !== null) {
      const maxAmount = tokenIn.mint.equals(XNT_MINT) 
        ? Math.max(0, balanceIn - 0.01) 
        : balanceIn;
      setAmountIn(maxAmount.toString());
    }
  };

  // Set percentage
  const handleSetPercentage = (pct: number) => {
    if (balanceIn !== null) {
      const amount = balanceIn * (pct / 100);
      const maxAmount = tokenIn.mint.equals(XNT_MINT) 
        ? Math.max(0, amount - 0.01) 
        : amount;
      setAmountIn(maxAmount.toFixed(tokenIn.decimals));
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
          tokenIn.mint.toString(),
          tokenOut.mint.toString(),
          parseFloat(amountIn),
          publicKey.toString()
        );
        
        setQuote(result);
        
        if (result.estimatedOutput !== undefined) {
          setAmountOut(result.estimatedOutput.toFixed(tokenOut.decimals));
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
    if (!connected || !publicKey || !quote?.transaction || !signTransaction) return;
    
    setSwapping(true);
    setError(null);
    setSuccess(null);
    
    try {
      const signature = await executeSwap(quote.transaction, signTransaction);
      setSuccess(signature);
      setAmountIn('');
      setAmountOut('');
      setQuote(null);
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
  const rate = amountIn && amountOut ? (parseFloat(amountOut) / parseFloat(amountIn)) : null;

  return (
    <div className="max-w-lg mx-auto">
      <div className="bg-[var(--color-bg-card)] rounded-3xl p-5 shadow-xl border border-[var(--color-tan)]/30">
        
        {/* Header */}
        <div className="flex justify-between items-center mb-5">
          <h2 className="text-xl font-bold">Swap</h2>
          <button 
            onClick={() => setShowSlippage(!showSlippage)}
            className="p-2 rounded-xl bg-[var(--color-bg)] hover:bg-[var(--color-tan)]/20 transition-colors"
            title="Settings"
          >
            ⚙️
          </button>
        </div>

        {/* Slippage dropdown */}
        {showSlippage && (
          <div className="mb-4 p-4 bg-[var(--color-bg)] rounded-2xl">
            <div className="text-sm text-[var(--color-text-muted)] mb-2">Slippage Tolerance</div>
            <div className="flex gap-2">
              {SLIPPAGE_OPTIONS.map((opt) => (
                <button
                  key={opt}
                  onClick={() => setSlippage(opt)}
                  className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
                    slippage === opt 
                      ? 'bg-[var(--color-warm-brown)] text-white' 
                      : 'bg-[var(--color-bg-card)] hover:bg-[var(--color-tan)]/20'
                  }`}
                >
                  {opt}%
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Token In */}
        <div className="bg-[var(--color-bg)] rounded-2xl p-4 mb-1">
          <div className="flex justify-between mb-3">
            <span className="text-sm text-[var(--color-text-muted)]">You pay</span>
            <div className="flex items-center gap-2 text-sm">
              <span className="text-[var(--color-text-muted)]">
                Balance: {balanceIn !== null ? balanceIn.toFixed(4) : '0.00'}
              </span>
              {balanceIn !== null && balanceIn > 0 && (
                <div className="flex gap-1">
                  <button onClick={() => handleSetPercentage(25)} className="px-2 py-0.5 rounded bg-[var(--color-bg-card)] hover:bg-[var(--color-tan)]/30 text-xs">25%</button>
                  <button onClick={() => handleSetPercentage(50)} className="px-2 py-0.5 rounded bg-[var(--color-bg-card)] hover:bg-[var(--color-tan)]/30 text-xs">50%</button>
                  <button onClick={handleSetMax} className="px-2 py-0.5 rounded bg-[var(--color-warm-brown)] text-white text-xs">MAX</button>
                </div>
              )}
            </div>
          </div>
          <div className="flex items-center gap-3">
            <input
              type="number"
              value={amountIn}
              onChange={(e) => setAmountIn(e.target.value)}
              placeholder="0.00"
              className={`flex-1 bg-transparent text-3xl font-semibold outline-none min-w-0 ${
                isInsufficientBalance ? 'text-red-500' : ''
              }`}
            />
            <button 
              onClick={() => setShowTokenSelect('in')}
              className="flex items-center gap-2 bg-[var(--color-bg-card)] rounded-2xl px-4 py-3 hover:bg-[var(--color-tan)]/20 transition-colors shrink-0"
            >
              <span className="text-2xl">{tokenIn.logo}</span>
              <span className="font-semibold">{tokenIn.symbol}</span>
              <span className="text-[var(--color-text-muted)]">▼</span>
            </button>
          </div>
        </div>

        {/* Swap direction button */}
        <div className="flex justify-center -my-4 relative z-10">
          <button
            onClick={handleSwapTokens}
            className="bg-[var(--color-warm-brown)] hover:bg-[var(--color-dark-brown)] text-white rounded-2xl p-3 transition-all hover:scale-105 shadow-lg border-4 border-[var(--color-bg-card)]"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M7 10l5-5 5 5M7 14l5 5 5-5"/>
            </svg>
          </button>
        </div>

        {/* Token Out */}
        <div className="bg-[var(--color-bg)] rounded-2xl p-4 mt-1">
          <div className="flex justify-between mb-3">
            <span className="text-sm text-[var(--color-text-muted)]">You receive</span>
            <span className="text-sm text-[var(--color-text-muted)]">
              Balance: {balanceOut !== null ? balanceOut.toFixed(4) : '0.00'}
            </span>
          </div>
          <div className="flex items-center gap-3">
            <input
              type="text"
              value={loading ? '' : amountOut}
              readOnly
              placeholder={loading ? 'Fetching quote...' : '0.00'}
              className="flex-1 bg-transparent text-3xl font-semibold outline-none min-w-0"
            />
            <button 
              onClick={() => setShowTokenSelect('out')}
              className="flex items-center gap-2 bg-[var(--color-bg-card)] rounded-2xl px-4 py-3 hover:bg-[var(--color-tan)]/20 transition-colors shrink-0"
            >
              <span className="text-2xl">{tokenOut.logo}</span>
              <span className="font-semibold">{tokenOut.symbol}</span>
              <span className="text-[var(--color-text-muted)]">▼</span>
            </button>
          </div>
        </div>

        {/* Rate display */}
        {rate && !error && (
          <div className="mt-4 px-2 text-sm text-[var(--color-text-muted)] text-center">
            1 {tokenIn.symbol} = {rate.toFixed(6)} {tokenOut.symbol}
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="mt-4 p-4 bg-red-500/10 border border-red-500/30 rounded-2xl text-red-400 text-sm">
            {error}
          </div>
        )}

        {/* Success */}
        {success && (
          <div className="mt-4 p-4 bg-green-500/10 border border-green-500/30 rounded-2xl text-green-400 text-sm">
            <p className="font-medium">Swap successful! 🎉</p>
            <a 
              href={`${EXPLORER_URL}/tx/${success}`}
              target="_blank"
              rel="noopener noreferrer"
              className="underline hover:no-underline"
            >
              View on Explorer →
            </a>
          </div>
        )}

        {/* Quote details */}
        {quote && !error && amountIn && amountOut && (
          <div className="mt-4 p-4 bg-[var(--color-bg)] rounded-2xl text-sm space-y-2">
            {quote.priceImpact !== undefined && (
              <div className="flex justify-between">
                <span className="text-[var(--color-text-muted)]">Price Impact</span>
                <span className={quote.priceImpact > 3 ? 'text-red-400' : 'text-green-400'}>
                  {quote.priceImpact.toFixed(2)}%
                </span>
              </div>
            )}
            {quote.minimumReceived !== undefined && (
              <div className="flex justify-between">
                <span className="text-[var(--color-text-muted)]">Min. Received</span>
                <span>{quote.minimumReceived.toFixed(4)} {tokenOut.symbol}</span>
              </div>
            )}
            <div className="flex justify-between">
              <span className="text-[var(--color-text-muted)]">Slippage</span>
              <span>{slippage}%</span>
            </div>
          </div>
        )}

        {/* Swap button */}
        <button
          onClick={handleSwap}
          disabled={!canSwap}
          className={`w-full mt-5 py-4 rounded-2xl font-bold text-lg transition-all ${
            canSwap
              ? 'bg-gradient-to-r from-[var(--color-warm-brown)] to-[var(--color-dark-brown)] hover:opacity-90 text-white shadow-lg'
              : 'bg-[var(--color-tan)]/30 text-[var(--color-text-muted)] cursor-not-allowed'
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
            ? 'Enter Amount'
            : 'Swap'}
        </button>
      </div>

      {/* Token Select Modal */}
      {showTokenSelect && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setShowTokenSelect(null)}>
          <div className="bg-[var(--color-bg-card)] rounded-3xl p-5 w-full max-w-sm" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold">Select Token</h3>
              <button onClick={() => setShowTokenSelect(null)} className="p-2 hover:bg-[var(--color-bg)] rounded-xl">✕</button>
            </div>
            <div className="space-y-2">
              {TOKENS.map((token) => (
                <button
                  key={token.symbol}
                  onClick={() => handleSelectToken(token)}
                  className="w-full flex items-center gap-3 p-4 rounded-2xl hover:bg-[var(--color-bg)] transition-colors"
                >
                  <span className="text-3xl">{token.logo}</span>
                  <div className="text-left">
                    <div className="font-semibold">{token.symbol}</div>
                    <div className="text-sm text-[var(--color-text-muted)]">{token.mint.toString().slice(0, 8)}...</div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
