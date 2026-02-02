import { Connection, Transaction, VersionedTransaction } from '@solana/web3.js';
import { XDEX_API_BASE, X1_NETWORK, X1_RPC_ENDPOINT } from './constants';

export interface SwapPrepareRequest {
  network: string;
  wallet: string;
  token_in: string;
  token_out: string;
  token_in_amount: number;
  is_exact_amount_in: boolean;
}

export interface SwapPrepareResponse {
  success: boolean;
  transaction?: string; // Base64 encoded transaction
  estimatedOutput?: number;
  priceImpact?: number;
  route?: string[];
  minimumReceived?: number;
  fee?: number;
  error?: string;
  message?: string;
}

export async function prepareSwap(request: SwapPrepareRequest): Promise<SwapPrepareResponse> {
  try {
    const response = await fetch(`${XDEX_API_BASE}/swap/prepare`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        ...request,
        network: X1_NETWORK,
      }),
    });

    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.message || data.error || `API error: ${response.status}`);
    }

    return data;
  } catch (error) {
    console.error('Swap prepare error:', error);
    throw error;
  }
}

export async function getQuote(
  tokenIn: string,
  tokenOut: string,
  amountIn: number,
  wallet: string
): Promise<SwapPrepareResponse> {
  return prepareSwap({
    network: X1_NETWORK,
    wallet,
    token_in: tokenIn,
    token_out: tokenOut,
    token_in_amount: amountIn,
    is_exact_amount_in: true,
  });
}

export async function executeSwap(
  transactionBase64: string,
  signTransaction: <T extends Transaction | VersionedTransaction>(tx: T) => Promise<T>,
): Promise<string> {
  const connection = new Connection(X1_RPC_ENDPOINT, 'confirmed');
  
  // Decode the transaction
  const transactionBuffer = Buffer.from(transactionBase64, 'base64');
  
  // Try to deserialize as VersionedTransaction first, then legacy
  let transaction: Transaction | VersionedTransaction;
  
  try {
    transaction = VersionedTransaction.deserialize(transactionBuffer);
  } catch {
    transaction = Transaction.from(transactionBuffer);
  }
  
  // Sign the transaction
  const signedTransaction = await signTransaction(transaction);
  
  // Send the transaction
  let signature: string;
  
  if (signedTransaction instanceof VersionedTransaction) {
    signature = await connection.sendTransaction(signedTransaction, {
      skipPreflight: false,
      preflightCommitment: 'confirmed',
    });
  } else {
    signature = await connection.sendRawTransaction(signedTransaction.serialize(), {
      skipPreflight: false,
      preflightCommitment: 'confirmed',
    });
  }
  
  // Wait for confirmation
  const confirmation = await connection.confirmTransaction(signature, 'confirmed');
  
  if (confirmation.value.err) {
    throw new Error(`Transaction failed: ${JSON.stringify(confirmation.value.err)}`);
  }
  
  return signature;
}

// Helper to format token amounts
export function formatTokenAmount(amount: number, decimals: number): string {
  return (amount / Math.pow(10, decimals)).toFixed(decimals);
}

export function parseTokenAmount(amount: string, decimals: number): number {
  return Math.floor(parseFloat(amount) * Math.pow(10, decimals));
}
