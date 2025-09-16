import algosdk from 'algosdk';
import { PeraWalletConnect } from '@perawallet/connect';

// Algorand TestNet configuration
const algodToken = '';
const algodServer = 'https://testnet-api.algonode.cloud';
const algodPort = 443;

// Initialize Algorand client
export const algodClient = new algosdk.Algodv2(algodToken, algodServer, algodPort);

// Initialize Pera Wallet
export const peraWallet = new PeraWalletConnect();

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

// Wallet connection functions
export const connectWallet = async (): Promise<string[]> => {
  try {
    const accounts = await peraWallet.connect();
    return accounts;
  } catch (error) {
    console.error('Failed to connect wallet:', error);
    throw error;
  }
};

export const disconnectWallet = () => {
  peraWallet.disconnect();
};

// Transaction functions
export const fundCampaign = async (
  campaignId: string,
  amount: number,
  senderAddress: string
): Promise<string> => {
  try {
    // Get suggested params
    const suggestedParams = await algodClient.getTransactionParams().do();
    
    // For now, create a simple payment transaction
    // In a real app, this would interact with a smart contract
    const txn = algosdk.makePaymentTxnWithSuggestedParamsFromObject({
      sender: senderAddress,
      receiver: 'CAMPAIGN_ESCROW_ADDRESS', // Replace with actual escrow
      amount: algosdk.algosToMicroalgos(amount),
      suggestedParams,
      note: new Uint8Array(Buffer.from(`Fund campaign: ${campaignId}`)),
    });

    // Sign transaction with Pera Wallet
    const signedTxns = await peraWallet.signTransaction([[{ txn, signers: [senderAddress] }]]);
    
    // Submit transaction
    const response = await algodClient.sendRawTransaction(signedTxns[0]).do();
    const txId = response.txid;
    
    return txId;
  } catch (error) {
    console.error('Failed to fund campaign:', error);
    throw error;
  }
};

// Get transaction details for Lora explorer
export const getTransactionUrl = (txId: string): string => {
  return `https://testnet.algoexplorer.io/tx/${txId}`;
};

export const getAccountUrl = (address: string): string => {
  return `https://testnet.algoexplorer.io/address/${address}`;
};

// Format Algo amounts
export const formatAlgo = (microAlgos: number): string => {
  return (microAlgos / 1000000).toFixed(2);
};

export const algoToMicroAlgos = (algo: number): number => {
  return Math.round(algo * 1000000);
};