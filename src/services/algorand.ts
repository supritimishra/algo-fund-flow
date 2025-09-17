import algosdk from 'algosdk';
import { WalletManager, WalletId } from '@txnlab/use-wallet-react';

// Algorand TestNet configuration
const algodToken = '';
const algodServer = 'https://testnet-api.algonode.cloud';
const algodPort = 443;

// Initialize Algorand client
export const algodClient = new algosdk.Algodv2(algodToken, algodServer, algodPort);

const TESTNET_ENDPOINTS = [
  // Put AlgoExplorer first; in some networks algonode DNS is blocked
  'https://node.testnet.algoexplorerapi.io',
  'https://testnet-api.algonode.cloud',
  'https://testnet-api.algonode.network',
];

async function getAlgodClientWithFallback(): Promise<algosdk.Algodv2> {
  for (const endpoint of TESTNET_ENDPOINTS) {
    try {
      const client = new algosdk.Algodv2('', endpoint, 443);
      // Quick probe
      await client.status().do();
      return client;
    } catch (_) {
      // try next
    }
  }
  // As a last resort, return the default client (will throw upstream)
  return algodClient;
}

// Wallet Manager configuration with Lute support
export const walletManager = new WalletManager({
  wallets: [
    WalletId.LUTE,
    WalletId.PERA,
    WalletId.DEFLY,
    WalletId.EXODUS,
  ],
});

// Campaign interface
export interface Campaign {
  id: string;
  title: string;
  description: string;
  goalAmount: number;
  raisedAmount: number;
  deadline: Date;
  creator: string;
  isActive: boolean;
  appId?: number;
  txId?: string;
  imageUrl?: string;
  donors?: { address: string; amount: number }[];
}

// Mock data for testing (replace with smart contract later)
export const mockCampaigns: Campaign[] = [
  {
    id: '1',
    title: 'Green Energy Solar Farm',
    description: 'Building sustainable solar infrastructure for rural communities',
    goalAmount: 50000,
    raisedAmount: 32500,
    deadline: new Date('2024-12-31'),
    creator: 'ABCD...EFGH',
    donors: [
      { address: '6SICZRQ4MXG2CCJKFNICBU73S7EKX3M55NINLH75LQFYMZZM4XK7EZLVYQ', amount: 2500 },
      { address: '3N6XQY4ZQJ5F6V7W2K4Z7P6Y3J4K8M2N5L1A2B3C4D5E6F7G8H9I0J1K', amount: 1000 },
      { address: 'A2R8D3F6G9H1J2K3L4M5N6O7P8Q9R0S1T2U3V4W5X6Y7Z8A9B0C1D2E', amount: 500 }
    ],
    isActive: true,
  },
  {
    id: '2', 
    title: 'Ocean Cleanup Initiative',
    description: 'Revolutionary technology to remove plastic waste from oceans',
    goalAmount: 75000,
    raisedAmount: 18750,
    deadline: new Date('2024-11-15'),
    creator: 'IJKL...MNOP',
    donors: [
      { address: 'Z9Y8X7W6V5U4T3S2R1Q0P9O8N7M6L5K4J3I2H1G0F9E8D7C6B5A4', amount: 250 },
      { address: 'B2N7M4L1K9J8H7G6F5E4D3C2B1A0Z9Y8X7W6V5U4T3S2R1Q0', amount: 750 }
    ],
    isActive: true,
  },
  {
    id: '3',
    title: 'Educational Tech Platform',
    description: 'Bringing digital education to underserved communities worldwide',
    goalAmount: 30000,
    raisedAmount: 28500,
    deadline: new Date('2024-10-30'),
    creator: 'QRST...UVWX',
    isActive: true,
  },
];

// Transaction functions using use-wallet
export const fundCampaign = async (
  campaignId: string,
  amount: number,
  activeWallet: any
): Promise<string> => {
  try {
    if (!activeWallet) {
      throw new Error('No wallet connected');
    }

    // Ensure we have an account to use
    if (!activeWallet.accounts || activeWallet.accounts.length === 0) {
      throw new Error('No accounts available in the connected wallet');
    }

    // Get suggested params with endpoint fallback
    const client = await getAlgodClientWithFallback();
    const suggestedParams = await client.getTransactionParams().do();

    // Resolve receiver address from env or localStorage
    const receiver = getReceiverAddress(campaignId);
    
    // Create payment transaction to fund campaign
    const txn = algosdk.makePaymentTxnWithSuggestedParamsFromObject({
      sender: activeWallet.accounts[0].address,
      receiver,
      amount: algoToMicroAlgos(amount),
      suggestedParams,
      note: new TextEncoder().encode(`Fund campaign: ${campaignId}`),
    });

    try {
      // Encode unsigned txn
      const encodedUnsignedTxn = algosdk.encodeUnsignedTransaction(txn);

      // Sign using the most compatible methods across wallets
      const walletForSign = getPreferredWallet(activeWallet);
      let signedBytes: Uint8Array;
      try {
        signedBytes = await signWithActiveWallet(walletForSign, encodedUnsignedTxn, activeWallet.accounts[0].address);
      } catch (signErr: any) {
        // If the active wallet cannot sign, surface the unsigned transaction for manual signing in the UI.
        const unsignedB64 = bytesToBase64(encodedUnsignedTxn);
        const err: any = new Error('Manual signing required');
        err.manualSign = true;
        err.unsignedTxn = unsignedB64;
        err.note = `Fund campaign ${campaignId}`;
        throw err;
      }

      // Submit the transaction
      const sendResponse = await client.sendRawTransaction(signedBytes).do();
      const txId = (sendResponse as any).txId || (sendResponse as any)['txid'] || (sendResponse as any)['txId'];

      // Wait for confirmation to surface clear failures
      await waitForConfirmation(txId, client);
      return txId;
    } catch (error: any) {
      if (error && error.manualSign) throw error;
      console.error('Wallet/transaction error:', error);
      throw new Error(mapAlgodOrWalletError(error));
    }
  } catch (error) {
    console.error('Failed to fund campaign:', error);
    throw error;
  }
};

// Allow submitting a signed transaction provided as base64 (useful for manual-sign flows)
export const submitSignedTransactionBase64 = async (signedB64: string): Promise<string> => {
  try {
    const client = await getAlgodClientWithFallback();
    const signedBytes = base64ToBytes(signedB64);
    const sendResponse = await client.sendRawTransaction(signedBytes).do();
    const txId = (sendResponse as any).txId || (sendResponse as any)['txid'] || (sendResponse as any)['txId'];
    // Wait for confirmation (with timeout). Only return after confirmed so
    // callers can safely update UI/state knowing the tx reached the ledger.
    const pending = await waitForConfirmationWithTimeout(txId, client, 60000);
    if (!pending) {
      throw new Error('Transaction submitted but not confirmed within timeout');
    }
    return txId;
  } catch (e) {
    console.error('Failed to submit signed transaction:', e);
    throw e;
  }
};

// Create campaign smart contract (placeholder for actual deployment)
export const createCampaignContract = async (
  campaignData: Omit<Campaign, 'id' | 'raisedAmount' | 'isActive'>,
  activeWallet: any
): Promise<{ appId: number; txId: string }> => {
  try {
    if (!activeWallet) {
      throw new Error('No wallet connected');
    }

    // Ensure we have an account to use
    if (!activeWallet.accounts || activeWallet.accounts.length === 0) {
      throw new Error('No accounts available in the connected wallet');
    }

    const client = await getAlgodClientWithFallback();
    const sender = activeWallet.accounts[0].address;
    try {
      // Try real app create via TEAL compile
      const approvalTeal = `#pragma version 8\nint 1`;
      const clearTeal = `#pragma version 8\nint 1`;
      const approvalProgram = await compileProgram(approvalTeal, client);
      const clearProgram = await compileProgram(clearTeal, client);

      const suggestedParams = await client.getTransactionParams().do();
      const appCreateTxn = algosdk.makeApplicationCreateTxnFromObject({
        sender: sender,
        approvalProgram,
        clearProgram,
        numGlobalByteSlices: 0,
        numGlobalInts: 0,
        numLocalByteSlices: 0,
        numLocalInts: 0,
        suggestedParams,
        onComplete: algosdk.OnApplicationComplete.NoOpOC,
        note: new TextEncoder().encode(`Create campaign app: ${campaignData.title}`),
      });

      const encodedUnsignedTxn = algosdk.encodeUnsignedTransaction(appCreateTxn);
      const walletForSign = getPreferredWallet(activeWallet);
      let signedBytes: Uint8Array;
      try {
        signedBytes = await signWithActiveWallet(walletForSign, encodedUnsignedTxn, sender);
      } catch (signErr: any) {
        const unsignedB64 = bytesToBase64(encodedUnsignedTxn);
        const err: any = new Error('Manual signing required for app creation');
        err.manualSign = true;
        err.unsignedTxn = unsignedB64;
        err.note = `Create campaign app: ${campaignData.title}`;
        throw err;
      }
      const sendResponse = await client.sendRawTransaction(signedBytes).do();
      const txId = (sendResponse as any).txId || (sendResponse as any)['txid'] || (sendResponse as any)['txId'];
      // Try to get the app id quickly, but don't block the UI indefinitely.
      // If the create hasn't confirmed within the timeout we return the txId
      // so the app can continue (navigate, show explorer) while confirmation
      // finishes in the background.
      const pending = await waitForConfirmationWithTimeout(txId, client, 15000);
      const appId = pending ? (pending['application-index'] as number) : 0;
      return { appId: appId || 0, txId };
    } catch (e) {
      console.warn('App create failed, falling back to minimal payment:', e);
      // Fallback: perform minimal payment to still trigger wallet popup
      const suggestedParams = await client.getTransactionParams().do();
      const receiver = getReceiverAddress('create');
      const txn = algosdk.makePaymentTxnWithSuggestedParamsFromObject({
        sender,
        receiver,
        amount: 1000,
        suggestedParams,
        note: new TextEncoder().encode(`Create campaign: ${campaignData.title}`),
      });
      const encodedUnsignedTxn = algosdk.encodeUnsignedTransaction(txn);
      const walletForSign = getPreferredWallet(activeWallet);
      let signedBytes2: Uint8Array;
      try {
        signedBytes2 = await signWithActiveWallet(walletForSign, encodedUnsignedTxn, sender);
      } catch (signErr: any) {
        const unsignedB64 = bytesToBase64(encodedUnsignedTxn);
        const err: any = new Error('Manual signing required for fallback payment');
        err.manualSign = true;
        err.unsignedTxn = unsignedB64;
        err.note = `Create campaign fallback payment: ${campaignData.title}`;
        throw err;
      }
      const sendResponse = await client.sendRawTransaction(signedBytes2).do();
      const txId = (sendResponse as any).txId || (sendResponse as any)['txid'] || (sendResponse as any)['txId'];
      // Don't block create flow waiting for confirmation in the fallback payment.
      // Wait briefly to give a chance for quick confirmations, otherwise return.
      await waitForConfirmationWithTimeout(txId, client, 8000).catch(() => null);
      // No appId available in fallback
      return { appId: 0, txId };
    }
  } catch (error) {
    console.error('Failed to create campaign contract:', error);
    throw error;
  }
};

// Get transaction details for Lora explorer
// Note: Using AlgoExplorer as placeholder - update URL based on preferred explorer
export const getTransactionUrl = (txId: string): string => {
  // Replace with Lora Explorer URL when available
  return `https://testnet.algoexplorer.io/tx/${txId}`;
};

export const getAccountUrl = (address: string): string => {
  // Using Lora Explorer URL
  return `https://lora.algokit.io/testnet/account/${address}`;
};

export const getApplicationUrl = (appId: number): string => {
  // Replace with Lora Explorer URL when available
  return `https://testnet.algoexplorer.io/application/${appId}`;
};

// Format Algo amounts
export const formatAlgo = (microAlgos: number): string => {
  return (microAlgos / 1000000).toFixed(2);
};

export const algoToMicroAlgos = (algo: number): number => {
  return Math.round(algo * 1000000);
};

// Build an unsigned payment transaction object and return its encoded unsigned bytes (Uint8Array)
export const buildUnsignedPaymentTxn = async (
  sender: string,
  receiver: string,
  amountAlgo: number,
  note?: string
): Promise<Uint8Array> => {
  const client = await getAlgodClientWithFallback();
  const suggestedParams = await client.getTransactionParams().do();
  const txn = algosdk.makePaymentTxnWithSuggestedParamsFromObject({
    sender,
    receiver,
    amount: algoToMicroAlgos(amountAlgo),
    suggestedParams,
    note: note ? new TextEncoder().encode(note) : undefined,
  });
  return algosdk.encodeUnsignedTransaction(txn);
};

// Try to sign and send a payment using the connected/preferred wallet (Lute preferred).
// If the wallet cannot sign, throws an error with `.manualSign = true` and `.unsignedTxn` (base64).
export const sendPaymentWithWallet = async (
  activeWallet: any,
  sender: string,
  receiver: string,
  amountAlgo: number,
  note?: string
): Promise<string> => {
  if (!activeWallet) throw new Error('No wallet connected');
  const client = await getAlgodClientWithFallback();
  const suggestedParams = await client.getTransactionParams().do();
  const txn = algosdk.makePaymentTxnWithSuggestedParamsFromObject({
    sender,
    receiver,
    amount: algoToMicroAlgos(amountAlgo),
    suggestedParams,
    note: note ? new TextEncoder().encode(note) : undefined,
  });
  const encodedUnsignedTxn = algosdk.encodeUnsignedTransaction(txn);
  const walletForSign = getPreferredWallet(activeWallet);
  try {
    const signed = await signWithActiveWallet(walletForSign, encodedUnsignedTxn, sender);
    const sendResponse = await client.sendRawTransaction(signed).do();
    const txId = (sendResponse as any).txId || (sendResponse as any)['txid'] || (sendResponse as any)['txId'];
    await waitForConfirmation(txId, client);
    return txId;
  } catch (e: any) {
    // If signing isn't supported, prepare manual-sign payload
    const unsignedB64 = bytesToBase64(encodedUnsignedTxn);
    const err: any = new Error('Manual signing required');
    err.manualSign = true;
    err.unsignedTxn = unsignedB64;
    throw err;
  }
};

// Create a small proof transaction (0 ALGO) with a note and sign+send via wallet.
// Useful for 'claim reward' patterns where on-chain proof is used to claim off-chain tokens.
export const signProofWithWallet = async (
  activeWallet: any,
  sender: string,
  note: string
): Promise<string> => {
  if (!activeWallet) throw new Error('No wallet connected');
  const client = await getAlgodClientWithFallback();
  const suggestedParams = await client.getTransactionParams().do();
  // Use a self-payment of 0 ALGO with a note as proof
  const txn = algosdk.makePaymentTxnWithSuggestedParamsFromObject({
    sender,
    receiver: sender,
    amount: 0,
    suggestedParams,
    note: new TextEncoder().encode(note),
  });
  const encoded = algosdk.encodeUnsignedTransaction(txn);
  const walletForSign = getPreferredWallet(activeWallet);
  try {
    const signed = await signWithActiveWallet(walletForSign, encoded, sender);
    const sendResponse = await client.sendRawTransaction(signed).do();
    const txId = (sendResponse as any).txId || (sendResponse as any)['txid'] || (sendResponse as any)['txId'];
    await waitForConfirmation(txId, client);
    return txId;
  } catch (e: any) {
    const unsignedB64 = bytesToBase64(encoded);
    const err: any = new Error('Manual signing required');
    err.manualSign = true;
    err.unsignedTxn = unsignedB64;
    throw err;
  }
};

// Smart Contract utilities
export const compileProgram = async (programSource: string, client?: algosdk.Algodv2): Promise<Uint8Array> => {
  const algod = client || algodClient;
  const compileResponse = await algod.compile(programSource).do();
  const base64 = compileResponse.result as string;
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
};

export const waitForConfirmation = async (txId: string, client?: algosdk.Algodv2): Promise<any> => {
  const algod = client || algodClient;
  let response = await algod.status().do();
  let lastround = response['last-round'];
  
  while (true) {
    const pendingInfo = await algod.pendingTransactionInformation(txId).do();
    if (pendingInfo['confirmed-round'] !== null && pendingInfo['confirmed-round'] > 0) {
      return pendingInfo;
    }
    lastround++;
    await algod.statusAfterBlock(lastround).do();
  }
};

// Wait for confirmation but resolve null if it doesn't confirm within timeoutMs
export const waitForConfirmationWithTimeout = async (
  txId: string,
  client?: algosdk.Algodv2,
  timeoutMs = 10000
): Promise<any | null> => {
  const algod = client || algodClient;
  const start = Date.now();
  try {
    let response = await algod.status().do();
    let lastround = response['last-round'];
    while (Date.now() - start < timeoutMs) {
      const pendingInfo = await algod.pendingTransactionInformation(txId).do();
      if (pendingInfo['confirmed-round'] !== null && pendingInfo['confirmed-round'] > 0) {
        return pendingInfo;
      }
      lastround++;
      // Wait a single block (statusAfterBlock will resolve when the block is produced)
      await algod.statusAfterBlock(lastround).do();
    }
  } catch (e) {
    // Ignore and return null so callers can continue
    console.warn('Confirmation check failed or timed out:', e);
  }
  return null;
};

// Helpers
function getPreferredWallet(activeWallet: any): any {
  try {
    const wallets = (walletManager as any)?.wallets || [];
    const lute = wallets.find((w: any) => w?.id === 'lute' && w?.isConnected);
    if (lute) return lute;
  } catch (_) {
    // ignore
  }
  return activeWallet;
}
export function getReceiverAddress(campaignId: string): string {
  // Priority: explicit per-campaign mapping in localStorage, then env, then generic localStorage
  const perCampaign = localStorage.getItem(`FUND_RECEIVER_ADDRESS:${campaignId}`);
  const fromEnv = (import.meta as any).env?.VITE_FUND_RECEIVER_ADDRESS as string | undefined;
  const generic = localStorage.getItem('FUND_RECEIVER_ADDRESS');
  // Fallback default for demo/testing so user can proceed without config
  const defaultAddr = 'EJXBAMX3EEKPJ6VX4XQURMETX6MOWAQLKCFZFP7NLL2FMFCSQUKB354VFE';
  const addr = perCampaign || fromEnv || generic || defaultAddr;
  if (!algosdk.isValidAddress(addr)) {
    throw new Error('Configured receiver address is invalid.');
  }
  return addr;
}

function mapAlgodOrWalletError(error: any): string {
  const message = String(error?.message || error?.toString?.() || 'Transaction failed');
  const dataMessage = String(error?.data?.message || error?.response?.message || '');
  const combined = `${message} ${dataMessage}`.toLowerCase();

  if (combined.includes('overspend') || combined.includes('underflow')) return 'Insufficient balance to cover amount + fee.';
  if (combined.includes('min balance')) return 'Account would go below minimum balance.';
  if (combined.includes('rejected') || combined.includes('user rejected')) return 'User rejected the transaction in wallet.';
  if (combined.includes('network') || combined.includes('fetch')) return 'Network error talking to algod. Check internet or node.';
  if (combined.includes('invalid addr') || combined.includes('invalid address')) return 'Receiver address is invalid.';
  if (combined.includes('connection') || combined.includes('connect')) return 'Wallet not connected. Please reconnect and try again.';
  if (combined.includes('overspend') || combined.includes('insufficient')) return 'Insufficient balance to send this amount.';
  if (combined.includes('bad authentication') || combined.includes('unauthorized')) return 'Wallet authorization failed. Please reconnect your wallet.';
  return 'Transaction failed. Please try again.';
}

async function signWithActiveWallet(activeWallet: any, encodedUnsignedTxn: Uint8Array, senderAddress?: string): Promise<Uint8Array> {
  const candidates = [activeWallet, activeWallet?.wallet, activeWallet?.provider, activeWallet?.connector].filter(Boolean);

  for (const c of candidates) {
    // Preferred multi-txn API
    if (typeof c.signTransactions === 'function') {
      try {
        const signed = await c.signTransactions([{ txn: encodedUnsignedTxn, signers: senderAddress ? [senderAddress] : undefined }]);
        if (signed && signed[0]) return signed[0];
      } catch (_) {
        // Try bytes array shape
        try {
          const signedAlt = await c.signTransactions([encodedUnsignedTxn]);
          if (signedAlt && signedAlt[0]) return signedAlt[0];
        } catch (_) {
          // continue searching other candidates
        }
      }
    }
    // Single-txn API
    if (typeof c.signTransaction === 'function') {
      try {
        const single = await c.signTransaction(encodedUnsignedTxn);
        if (single) return single;
      } catch (_) {
        // continue
      }
    }
  }

  // ARC-0001 provider fallback (e.g., window.algorand)
  const globalProvider: any = (globalThis as any).algorand;
  if (globalProvider && typeof globalProvider.signTxns === 'function') {
    try {
      // Ensure provider is enabled/connected to expose accounts
      if (typeof globalProvider.enable === 'function') {
        try { await globalProvider.enable(); } catch (_) { /* ignore */ }
      }
      // ARC-0001 expects base64 strings; returns base64 signed txns
      const b64Unsigned = bytesToBase64(encodedUnsignedTxn);
      // Try string array shape first
      let signed = await globalProvider.signTxns([b64Unsigned]);
      if (signed && signed[0]) {
        const signedBytes = base64ToBytes(signed[0]);
        return signedBytes;
      }
      // Try object array shape with signers hint
      signed = await globalProvider.signTxns([{ txn: b64Unsigned, signers: senderAddress ? [senderAddress] : undefined }]);
      if (signed && signed[0]) {
        const signedBytes = base64ToBytes(signed[0]);
        return signedBytes;
      }
    } catch (_) {
      // ignore and throw below
    }
  }

  throw new Error('Active wallet does not support signing transactions');
}

// Base64 helpers for browser environment
function bytesToBase64(bytes: Uint8Array): string {
  let binary = '';
  const chunkSize = 0x8000;
  for (let i = 0; i < bytes.length; i += chunkSize) {
    binary += String.fromCharCode.apply(null, Array.from(bytes.subarray(i, i + chunkSize)) as unknown as number[]);
  }
  return btoa(binary);
}

function base64ToBytes(b64: string): Uint8Array {
  const binary = atob(b64);
  const len = binary.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}