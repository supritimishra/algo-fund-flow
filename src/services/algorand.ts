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
      
      // Prefer Lute if available, else use the active wallet
      const walletForSign = getPreferredWallet(activeWallet);
      // Sign using the most compatible methods across wallets
      const signedBytes = await signWithActiveWallet(walletForSign, encodedUnsignedTxn, activeWallet.accounts[0].address);

      // Submit the transaction
      const sendResponse = await client.sendRawTransaction(signedBytes).do();
      const txId = (sendResponse as any).txId || (sendResponse as any)['txid'] || (sendResponse as any)['txId'];

      // Wait for confirmation to surface clear failures
      await waitForConfirmation(txId, client);
      return txId;
    } catch (error: any) {
      console.error('Wallet/transaction error:', error);
      throw new Error(mapAlgodOrWalletError(error));
    }
  } catch (error) {
    console.error('Failed to fund campaign:', error);
    throw error;
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
        from: sender,
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
      const signedBytes = await signWithActiveWallet(walletForSign, encodedUnsignedTxn, sender);
      const sendResponse = await client.sendRawTransaction(signedBytes).do();
      const txId = (sendResponse as any).txId || (sendResponse as any)['txid'] || (sendResponse as any)['txId'];
      const pending = await waitForConfirmation(txId, client);
      const appId = pending['application-index'] as number;
      if (!appId) throw new Error('App creation returned no application-index');
      return { appId, txId };
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
      const signedBytes = await signWithActiveWallet(walletForSign, encodedUnsignedTxn, sender);
      const sendResponse = await client.sendRawTransaction(signedBytes).do();
      const txId = (sendResponse as any).txId || (sendResponse as any)['txid'] || (sendResponse as any)['txId'];
      await waitForConfirmation(txId, client);
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
function getReceiverAddress(campaignId: string): string {
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