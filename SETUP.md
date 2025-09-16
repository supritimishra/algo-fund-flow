# AlgoFund - Crowdfunding on Algorand Setup Guide

This guide will help you set up and deploy the AlgoFund crowdfunding application on the Algorand blockchain.

## Prerequisites

### 1. Install Lute Wallet
- Install the [Lute Wallet Chrome Extension](https://chromewebstore.google.com/detail/lute/kiaoohollfkjhikdifohdckeidckokjh)
- Create a new wallet or import an existing one
- Make sure you have some ALGO for transaction fees (get testnet ALGO from the [dispenser](https://dispenser.testnet.aws.algodev.network/))

### 2. Development Environment
```bash
# Clone the repository
git clone <your-repo-url>
cd algofund

# Install dependencies
npm install

# Start development server
npm run dev
```

## Smart Contract Development

### 1. Install AlgoKit (Required for contract deployment)
```bash
# Install AlgoKit CLI
pip install algokit

# Or using pipx (recommended)
pipx install algokit

# Verify installation
algokit --version
```

### 2. Create Smart Contract Project
```bash
# Initialize new AlgoKit project
algokit init

# Choose "smart_contracts" template
# Choose "Python" as the language
# Name your project "crowdfunding-contracts"

cd crowdfunding-contracts
```

### 3. Crowdfunding Smart Contract (TEAL)

Create the smart contract in `contracts/crowdfunding.py`:

```python
from algopy import (
    ARC4Contract, 
    GlobalState, 
    LocalState, 
    Txn, 
    Global,
    UInt64,
    Bytes,
    arc4,
    subroutine,
    op
)

class CrowdfundingContract(ARC4Contract):
    def __init__(self) -> None:
        # Global state variables
        self.goal_amount = GlobalState(UInt64)
        self.raised_amount = GlobalState(UInt64)
        self.deadline = GlobalState(UInt64)
        self.creator = GlobalState(Bytes)
        self.is_active = GlobalState(UInt64)
        self.campaign_title = GlobalState(Bytes)
        
        # Local state for contributors
        self.contribution = LocalState(UInt64)

    @arc4.abimethod(create="require")
    def create_campaign(
        self,
        goal: UInt64,
        deadline_timestamp: UInt64,
        title: arc4.String,
    ) -> None:
        """Initialize a new crowdfunding campaign"""
        assert deadline_timestamp > Global.latest_timestamp
        
        self.goal_amount.value = goal
        self.deadline.value = deadline_timestamp
        self.creator.value = Txn.sender.bytes
        self.raised_amount.value = UInt64(0)
        self.is_active.value = UInt64(1)
        self.campaign_title.value = title.bytes

    @arc4.abimethod
    def contribute(self, payment: arc4.gtxn.PaymentTransaction) -> None:
        """Contribute to the campaign"""
        assert self.is_active.value == UInt64(1)
        assert Global.latest_timestamp < self.deadline.value
        assert payment.receiver == Global.current_application_address
        assert payment.amount > UInt64(0)
        
        # Update contribution tracking
        self.contribution[Txn.sender] += payment.amount
        self.raised_amount.value += payment.amount

    @arc4.abimethod
    def withdraw_funds(self) -> None:
        """Withdraw funds if goal is met (creator only)"""
        assert Txn.sender.bytes == self.creator.value
        assert self.raised_amount.value >= self.goal_amount.value
        assert self.is_active.value == UInt64(1)
        
        # Transfer funds to creator
        op.inner_txn_begin()
        op.inner_txn_field("TypeEnum", op.Pay)
        op.inner_txn_field("Receiver", self.creator.value)
        op.inner_txn_field("Amount", self.raised_amount.value)
        op.inner_txn_submit()
        
        # Mark campaign as completed
        self.is_active.value = UInt64(0)

    @arc4.abimethod
    def refund(self) -> None:
        """Refund contribution if campaign failed"""
        assert Global.latest_timestamp >= self.deadline.value
        assert self.raised_amount.value < self.goal_amount.value
        assert self.contribution[Txn.sender] > UInt64(0)
        
        contribution_amount = self.contribution[Txn.sender]
        self.contribution[Txn.sender] = UInt64(0)
        
        # Transfer refund
        op.inner_txn_begin()
        op.inner_txn_field("TypeEnum", op.Pay)
        op.inner_txn_field("Receiver", Txn.sender.bytes)
        op.inner_txn_field("Amount", contribution_amount)
        op.inner_txn_submit()

    @arc4.abimethod(readonly=True)
    def get_campaign_info(self) -> arc4.Tuple[UInt64, UInt64, UInt64, arc4.Address, UInt64]:
        """Get campaign information"""
        return arc4.Tuple((
            self.goal_amount.value,
            self.raised_amount.value,
            self.deadline.value,
            arc4.Address(self.creator.value),
            self.is_active.value
        ))
```

### 4. Deploy Smart Contract

```bash
# Build the contract
algokit project run build

# Deploy to testnet
algokit project deploy testnet

# Copy the deployed application ID for use in frontend
```

## Frontend Configuration

### 1. Update Smart Contract Integration

In `src/services/algorand.ts`, replace the mock functions with real contract calls:

```typescript
// Replace the mock campaign creation with actual contract deployment
export const createCampaignContract = async (
  campaignData: Omit<Campaign, 'id' | 'raisedAmount' | 'isActive'>,
  activeWallet: any
): Promise<{ appId: number; txId: string }> => {
  try {
    const suggestedParams = await algodClient.getTransactionParams().do();
    
    // Create application call transaction
    const createTxn = algosdk.makeApplicationCreateTxnFromObject({
      from: activeWallet.accounts[0].address,
      suggestedParams,
      approvalProgram: compiledApprovalProgram, // Add your compiled program
      clearProgram: compiledClearProgram,       // Add your compiled program
      numGlobalInts: 5,
      numGlobalByteSlices: 2,
      numLocalInts: 1,
      numLocalByteSlices: 0,
      appArgs: [
        algosdk.encodeUint64(campaignData.goalAmount),
        algosdk.encodeUint64(Math.floor(campaignData.deadline.getTime() / 1000)),
        new TextEncoder().encode(campaignData.title)
      ]
    });

    const signedTxn = await activeWallet.signTransactions([createTxn]);
    const response = await algodClient.sendRawTransaction(signedTxn[0]).do();
    
    // Wait for confirmation and get app ID
    const confirmation = await waitForConfirmation(response.txid);
    const appId = confirmation['application-index'];
    
    return { appId, txId: response.txid };
  } catch (error) {
    console.error('Contract deployment failed:', error);
    throw error;
  }
};
```

### 2. Update Explorer URLs (Lora Explorer)

If you prefer a different explorer than AlgoExplorer, update the URLs in `src/services/algorand.ts`:

```typescript
// Update these URLs based on your preferred explorer
export const getTransactionUrl = (txId: string): string => {
  // Replace with your preferred explorer
  return `https://your-preferred-explorer.com/tx/${txId}`;
};

export const getAccountUrl = (address: string): string => {
  return `https://your-preferred-explorer.com/address/${address}`;
};
```

## Deployment Steps

### 1. Local Development
```bash
# Start local development
npm run dev

# The app will be available at http://localhost:8080
```

### 2. Smart Contract Deployment
```bash
cd crowdfunding-contracts

# Deploy to testnet
algokit project deploy testnet

# Note the application ID for frontend configuration
```

### 3. Frontend Deployment
```bash
# Build for production
npm run build

# Deploy to your preferred hosting platform
# (Vercel, Netlify, etc.)
```

## Testing

### 1. Test on Algorand Testnet
- Get testnet ALGO from the [dispenser](https://dispenser.testnet.aws.algodev.network/)
- Create test campaigns
- Test funding functionality
- Verify transactions on the explorer

### 2. Wallet Integration Testing
- Test with Lute Wallet
- Test connection/disconnection
- Test transaction signing
- Test error handling

## Production Considerations

### 1. Security Checklist
- [ ] Smart contract audited
- [ ] Proper access controls
- [ ] Input validation
- [ ] Reentrancy protection
- [ ] Integer overflow/underflow protection

### 2. Mainnet Deployment
- Update network configuration to mainnet
- Use mainnet node endpoints
- Test thoroughly on testnet first
- Have sufficient ALGO for deployment costs

### 3. Monitoring
- Set up transaction monitoring
- Implement proper error logging
- Monitor contract state changes
- Track funding activities

## Troubleshooting

### Common Issues

1. **Wallet Connection Failed**
   - Ensure Lute Wallet is installed and updated
   - Check that you're on the correct network (testnet/mainnet)
   - Clear browser cache and try again

2. **Transaction Failed**
   - Check account balance for fees
   - Verify transaction parameters
   - Check network connectivity

3. **Contract Deployment Failed**
   - Ensure AlgoKit is properly installed
   - Check account has sufficient ALGO
   - Verify contract code compiles correctly

### Getting Help

- [Algorand Developer Portal](https://developer.algorand.org/)
- [AlgoKit Documentation](https://github.com/algorandfoundation/algokit-cli)
- [Lute Wallet Support](https://lute.app/)

## Security Notes

⚠️ **Important Security Considerations:**

1. **Never expose private keys** in your code or configuration files
2. **Always validate user inputs** before processing transactions  
3. **Implement proper access controls** in smart contracts
4. **Test extensively** on testnet before mainnet deployment
5. **Keep dependencies updated** to avoid known vulnerabilities
6. **Use secure random number generation** for any randomness needs
7. **Implement rate limiting** to prevent spam/abuse

---

**Happy Building! 🚀**

For questions or support, please open an issue in the repository or consult the Algorand developer resources.