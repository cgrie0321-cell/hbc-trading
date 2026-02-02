import { type FC } from 'react';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import { useTheme } from '../hooks/useTheme';

export const Header: FC = () => {
  const { theme, brightness, toggleTheme, setBrightness } = useTheme();

  return (
    <header className="flex items-center justify-between p-4 border-b border-[var(--color-tan)]">
      <div className="flex items-center gap-3">
        <img 
          src="/hbc-logo.png" 
          alt="HBC" 
          className="w-10 h-10 rounded-full"
        />
        <span className="text-xl font-bold text-[var(--color-warm-brown)]">
          HBC Trading
        </span>
      </div>

      <nav className="flex items-center gap-6">
        <a href="#swap" className="hover:text-[var(--color-warm-brown)] transition-colors">
          Swap
        </a>
        <a href="#pools" className="hover:text-[var(--color-warm-brown)] transition-colors">
          Pools
        </a>
        <a href="#staking" className="hover:text-[var(--color-warm-brown)] transition-colors">
          Staking
        </a>
      </nav>

      <div className="flex items-center gap-4">
        {/* Theme toggle */}
        <button
          onClick={toggleTheme}
          className="p-2 rounded-lg bg-[var(--color-bg-card)] hover:bg-[var(--color-tan-light)] transition-colors"
          title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
        >
          {theme === 'dark' ? '☀️' : '🌙'}
        </button>

        {/* Brightness selector */}
        <select
          value={brightness}
          onChange={(e) => setBrightness(e.target.value as 'dim' | 'normal' | 'bright')}
          className="p-2 rounded-lg bg-[var(--color-bg-card)] text-[var(--color-text)] border border-[var(--color-tan)]"
        >
          <option value="dim">Dim</option>
          <option value="normal">Normal</option>
          <option value="bright">Bright</option>
        </select>

        {/* Wallet button */}
        <WalletMultiButton />
      </div>
    </header>
  );
};
