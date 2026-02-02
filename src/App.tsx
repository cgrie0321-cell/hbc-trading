import { type FC, useEffect } from 'react';
import { WalletProvider } from './components/WalletProvider';
import { Header } from './components/Header';
import { SwapCard } from './components/SwapCard';
import { useTheme } from './hooks/useTheme';

const AppContent: FC = () => {
  const { theme } = useTheme();

  useEffect(() => {
    // Apply initial theme
    document.documentElement.classList.add(theme);
  }, []);

  return (
    <div className="min-h-screen">
      <Header />
      
      <main className="container mx-auto px-4 py-8">
        {/* Hero section */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-4">
            <span className="text-[var(--color-warm-brown)]">HBC</span> Trading
          </h1>
          <p className="text-[var(--color-text-muted)] max-w-xl mx-auto">
            Trade HBC tokens on X1 blockchain. Fast, secure, and delicious. 🍩💀
          </p>
        </div>

        {/* Swap interface */}
        <section id="swap" className="mb-16">
          <SwapCard />
        </section>

        {/* Pools section - placeholder */}
        <section id="pools" className="mb-16">
          <h2 className="text-2xl font-bold mb-6 text-center">HBC Pools</h2>
          <div className="bg-[var(--color-bg-card)] rounded-2xl p-8 text-center border border-[var(--color-tan)]">
            <p className="text-[var(--color-text-muted)]">
              Pool data coming soon...
            </p>
          </div>
        </section>

        {/* Staking section - placeholder */}
        <section id="staking" className="mb-16">
          <h2 className="text-2xl font-bold mb-6 text-center">Staking</h2>
          <div className="bg-[var(--color-bg-card)] rounded-2xl p-8 text-center border border-[var(--color-tan)]">
            <p className="text-[var(--color-text-muted)]">
              Staking information coming soon...
            </p>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-[var(--color-tan)] p-6 text-center text-[var(--color-text-muted)]">
        <p>Built with 🛠️ on X1 Blockchain</p>
        <div className="flex justify-center gap-4 mt-4">
          <a href="https://x1.xyz" target="_blank" rel="noopener" className="hover:text-[var(--color-warm-brown)]">
            X1 Blockchain
          </a>
          <a href="https://app.xdex.xyz" target="_blank" rel="noopener" className="hover:text-[var(--color-warm-brown)]">
            xdex
          </a>
          <a href="https://explorer.fortiblox.com" target="_blank" rel="noopener" className="hover:text-[var(--color-warm-brown)]">
            Explorer
          </a>
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
