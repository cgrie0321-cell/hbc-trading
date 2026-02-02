import { type FC, useEffect } from 'react';
import { WalletProvider } from './components/WalletProvider';
import { Header } from './components/Header';
import { SwapCard } from './components/SwapCard';
import { useTheme } from './hooks/useTheme';
import { POOL_URL, STAKING_URL, EXPLORER_URL, HBC_MINT, HBC_USDC_POOL } from './lib/constants';

const AppContent: FC = () => {
  const { theme } = useTheme();

  useEffect(() => {
    document.documentElement.classList.add(theme);
  }, []);

  return (
    <div className="min-h-screen">
      <Header />
      
      <main className="container mx-auto px-4 py-8 max-w-6xl">
        {/* Hero */}
        <div className="text-center mb-10">
          <h1 className="text-4xl md:text-5xl font-bold mb-3">
            <span className="text-[var(--color-warm-brown)]">HBC</span> Trading
          </h1>
          <p className="text-[var(--color-text-muted)] max-w-lg mx-auto">
            Swap, stake, and track HBC on X1 blockchain 🍩💀
          </p>
        </div>

        {/* Main Grid */}
        <div className="grid lg:grid-cols-3 gap-6">
          
          {/* Swap - Takes 2 columns on large screens */}
          <div className="lg:col-span-2">
            <SwapCard />
          </div>

          {/* Side Panel */}
          <div className="space-y-6">
            
            {/* Pool Card */}
            <div className="bg-[var(--color-bg-card)] rounded-3xl p-5 border border-[var(--color-tan)]/30">
              <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                💧 Liquidity Pool
              </h3>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-[var(--color-text-muted)]">Pair</span>
                  <span className="font-medium">HBC / USDC.x</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[var(--color-text-muted)]">Pool ID</span>
                  <span className="font-mono text-xs">{HBC_USDC_POOL.slice(0, 8)}...</span>
                </div>
              </div>
              <a
                href={POOL_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-4 w-full py-3 rounded-2xl font-semibold text-center block bg-[var(--color-bg)] hover:bg-[var(--color-tan)]/20 transition-colors"
              >
                View Charts →
              </a>
            </div>

            {/* Staking Card */}
            <div className="bg-[var(--color-bg-card)] rounded-3xl p-5 border border-[var(--color-tan)]/30">
              <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                🥩 Staking
              </h3>
              <p className="text-sm text-[var(--color-text-muted)] mb-4">
                Provide liquidity and earn fees from trades.
              </p>
              <a
                href={STAKING_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full py-3 rounded-2xl font-semibold text-center block bg-[var(--color-bg)] hover:bg-[var(--color-tan)]/20 transition-colors"
              >
                Manage Positions →
              </a>
            </div>

            {/* Token Info Card */}
            <div className="bg-[var(--color-bg-card)] rounded-3xl p-5 border border-[var(--color-tan)]/30">
              <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                💀 HBC Token
              </h3>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-[var(--color-text-muted)]">Contract</span>
                  <a 
                    href={`${EXPLORER_URL}/tokens/${HBC_MINT.toString()}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-mono text-xs text-[var(--color-warm-brown)] hover:underline"
                  >
                    {HBC_MINT.toString().slice(0, 8)}...
                  </a>
                </div>
                <div className="flex justify-between">
                  <span className="text-[var(--color-text-muted)]">Total Supply</span>
                  <span>1,000,000,000</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[var(--color-text-muted)]">Locked</span>
                  <span className="text-green-400">476,000,000</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[var(--color-text-muted)]">Burned</span>
                  <span className="text-orange-400">1,000,000</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-[var(--color-tan)]/30 p-6 mt-12">
        <div className="container mx-auto max-w-6xl">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-[var(--color-text-muted)] text-sm">
              Built with 🛠️ on X1 Blockchain
            </p>
            <div className="flex gap-6 text-sm">
              <a href="https://x1.xyz" target="_blank" rel="noopener" className="text-[var(--color-text-muted)] hover:text-[var(--color-warm-brown)] transition-colors">
                X1
              </a>
              <a href="https://app.xdex.xyz" target="_blank" rel="noopener" className="text-[var(--color-text-muted)] hover:text-[var(--color-warm-brown)] transition-colors">
                xdex
              </a>
              <a href="https://explorer.fortiblox.com" target="_blank" rel="noopener" className="text-[var(--color-text-muted)] hover:text-[var(--color-warm-brown)] transition-colors">
                Explorer
              </a>
              <a href="https://x1.ninja" target="_blank" rel="noopener" className="text-[var(--color-text-muted)] hover:text-[var(--color-warm-brown)] transition-colors">
                Charts
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

const App: FC = () => {
  return (
    <WalletProvider>
      <AppContent />
    </WalletProvider>
  );
};

export default App;
