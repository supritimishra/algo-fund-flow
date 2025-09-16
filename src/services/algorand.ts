import algosdk from 'algosdk';
import { WalletManager, WalletId } from '@txnlab/use-wallet-react';

// Algorand TestNet configuration
const algodToken = '';
const algodServer = 'https://testnet-api.algonode.cloud';
const algodPort = 443;

// Initialize Algorand client
export const algodClient = new algosdk.Algodv2(algodToken, algodServer, algodPort);

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

    // Get suggested params
    const suggestedParams = await algodClient.getTransactionParams().do();
    
    // Create payment transaction to fund campaign
    // In a real app, this would interact with a smart contract
    const txn = algosdk.makePaymentTxnWithSuggestedParamsFromObject({
      sender: activeWallet.accounts[0].address,
      receiver: 'CAMPAIGN_ESCROW_ADDRESS', // Replace with actual escrow/contract address
      amount: algosdk.algosToMicroalgos(amount),
      suggestedParams,
      note: new Uint8Array(Buffer.from(`Fund campaign: ${campaignId}`)),
    });

    // Sign transaction with connected wallet
    const signedTxns = await activeWallet.signTransactions([txn]);
    
    // Submit transaction
    const response = await algodClient.sendRawTransaction(signedTxns[0]).do();
    const txId = response.txid;
    
    return txId;
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

    // This is a placeholder - in a real implementation you would:
    // 1. Compile the smart contract TEAL code
    // 2. Deploy the application
    // 3. Initialize it with campaign parameters
    
    console.log('Creating campaign contract with data:', campaignData);
    
    // Mock response for demo
    const mockAppId = Math.floor(Math.random() * 1000000);
    const mockTxId = 'MOCK_TX_' + Date.now();
    
    return {
      appId: mockAppId,
      txId: mockTxId
    };
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
  // Replace with Lora Explorer URL when available  
  return `https://testnet.algoexplorer.io/address/${address}`;
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
export const compileProgram = async (programSource: string): Promise<Uint8Array> => {
  const compileResponse = await algodClient.compile(programSource).do();
  return new Uint8Array(Buffer.from(compileResponse.result, 'base64'));
};

export const waitForConfirmation = async (txId: string): Promise<any> => {
  let response = await algodClient.status().do();
  let lastround = response['last-round'];
  
  while (true) {
    const pendingInfo = await algodClient.pendingTransactionInformation(txId).do();
    if (pendingInfo['confirmed-round'] !== null && pendingInfo['confirmed-round'] > 0) {
      return pendingInfo;
    }
    lastround++;
    await algodClient.statusAfterBlock(lastround).do();
  }
};