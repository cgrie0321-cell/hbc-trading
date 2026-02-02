import { PublicKey } from '@solana/web3.js';

// X1 Blockchain - use env var or default to mainnet
export const X1_RPC_ENDPOINT = import.meta.env.VITE_RPC_ENDPOINT || 'https://rpc.mainnet.x1.xyz';
export const X1_WS_ENDPOINT = X1_RPC_ENDPOINT.replace('https://', 'wss://');
export const X1_NETWORK = 'X1 Mainnet';

// HBC Token
export const HBC_MINT = new PublicKey('GnbZJKXBxS1om9dWqnd6UPMevM1Np4Wx9SBQwNTLyw9T');
export const HBC_DECIMALS = 9;
export const HBC_SYMBOL = 'HBC';
export const HBC_NAME = 'Honey Bun Coin';

// Native token (XNT) - wrapped version for DEX
export const XNT_MINT = new PublicKey('So11111111111111111111111111111111111111112');
export const XNT_DECIMALS = 9;
export const XNT_SYMBOL = 'XNT';

// xdex API
export const XDEX_API_BASE = import.meta.env.VITE_XDEX_API || 'https://api.xdex.xyz/api/xendex';

// Pool addresses
export const HBC_XNT_POOL = '7oCifpKkiCNut7wp21z461uAoiZbsNbnhbPTXkGpedVA';

// UI Constants
export const SLIPPAGE_OPTIONS = [0.5, 1, 2, 5];
export const DEFAULT_SLIPPAGE = 1;

// Links
export const EXPLORER_URL = 'https://explorer.fortiblox.com';
export const XDEX_URL = 'https://app.xdex.xyz';
export const X1_NINJA_URL = 'https://x1.ninja';
