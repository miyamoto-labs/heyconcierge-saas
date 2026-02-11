#!/usr/bin/env python3
"""
Polymarket Account Funding Script - MIYAMOTO LABS
==================================================
This script performs the necessary steps to fund a Polymarket trading account:

1. SWAP: Convert native USDC → USDC.e (bridged) via 1inch/Uniswap
2. APPROVE: Set allowances for Polymarket exchange contracts
3. VERIFY: Check balance is visible to the CLOB

IMPORTANT: Polymarket uses USDC.e (bridged USDC), NOT native USDC!
- USDC.e (Polymarket): 0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174
- USDC (Native):       0x3c499c542cEF5E3811e1192ce70d8cC03d5c3359

Author: Miyamoto Labs
Date: 2026-02-06
"""

import os
import sys
import json
import time
from web3 import Web3
from web3.middleware import geth_poa_middleware
from decimal import Decimal

# ============================================================================
# CONFIGURATION
# ============================================================================

# Polygon RPC
RPC_URL = "https://rpc.ankr.com/polygon"

# Wallet
PRIVATE_KEY = "0x4badb53d27e3a1142c4bb509e4d00a64645401359a69afc928246666a2edac36"
WALLET_ADDRESS = "0x114B7A51A4cF04897434408bd9003626705a2208"

# Token Addresses (Polygon Mainnet)
USDC_NATIVE = "0x3c499c542cEF5E3811e1192ce70d8cC03d5c3359"  # Native USDC (what you have)
USDC_BRIDGED = "0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174"  # USDC.e - Polymarket uses this!

# Polymarket Contract Addresses (from official gist)
CTF_EXCHANGE = "0x4bFb41d5B3570DeFd03C39a9A4D8dE6Bd8B8982E"  # Main exchange
NEG_RISK_CTF_EXCHANGE = "0xC5d563A36AE78145C45a50134d48A1215220f80a"  # Neg risk exchange
NEG_RISK_ADAPTER = "0xd91E80cF2E7be2e162c6513ceD06f1dD0dA35296"  # Neg risk adapter
CTF_CONTRACT = "0x4D97DCd97eC945f40cF65F87097ACe5EA0476045"  # Conditional Token Framework

# ABIs
ERC20_ABI = json.loads('''[
    {"constant":true,"inputs":[{"name":"_owner","type":"address"}],"name":"balanceOf","outputs":[{"name":"balance","type":"uint256"}],"type":"function"},
    {"constant":false,"inputs":[{"name":"_spender","type":"address"},{"name":"_value","type":"uint256"}],"name":"approve","outputs":[{"name":"","type":"bool"}],"type":"function"},
    {"constant":true,"inputs":[{"name":"_owner","type":"address"},{"name":"_spender","type":"address"}],"name":"allowance","outputs":[{"name":"","type":"uint256"}],"type":"function"},
    {"constant":true,"inputs":[],"name":"decimals","outputs":[{"name":"","type":"uint8"}],"type":"function"}
]''')

ERC1155_APPROVAL_ABI = json.loads('''[
    {"inputs":[{"name":"operator","type":"address"},{"name":"approved","type":"bool"}],"name":"setApprovalForAll","outputs":[],"stateMutability":"nonpayable","type":"function"},
    {"inputs":[{"name":"account","type":"address"},{"name":"operator","type":"address"}],"name":"isApprovedForAll","outputs":[{"name":"","type":"bool"}],"stateMutability":"view","type":"function"}
]''')

# Max approval
MAX_UINT256 = 2**256 - 1

# ============================================================================
# HELPER FUNCTIONS
# ============================================================================

def get_web3():
    """Initialize Web3 connection"""
    web3 = Web3(Web3.HTTPProvider(RPC_URL))
    web3.middleware_onion.inject(geth_poa_middleware, layer=0)
    
    if not web3.is_connected():
        raise Exception("Failed to connect to Polygon RPC")
    
    return web3

def check_balances(web3):
    """Check all relevant balances"""
    wallet = Web3.to_checksum_address(WALLET_ADDRESS)
    
    # MATIC balance (for gas)
    matic_balance = web3.eth.get_balance(wallet)
    matic_formatted = web3.from_wei(matic_balance, 'ether')
    
    # USDC Native
    usdc_native = web3.eth.contract(address=Web3.to_checksum_address(USDC_NATIVE), abi=ERC20_ABI)
    native_balance = usdc_native.functions.balanceOf(wallet).call()
    
    # USDC.e (Bridged)
    usdc_bridged = web3.eth.contract(address=Web3.to_checksum_address(USDC_BRIDGED), abi=ERC20_ABI)
    bridged_balance = usdc_bridged.functions.balanceOf(wallet).call()
    
    print("\n" + "="*60)
    print("💰 WALLET BALANCES")
    print("="*60)
    print(f"Wallet: {WALLET_ADDRESS}")
    print(f"")
    print(f"MATIC (gas):     {matic_formatted:.4f} MATIC")
    print(f"USDC (native):   ${native_balance / 1e6:.2f}")
    print(f"USDC.e (bridged): ${bridged_balance / 1e6:.2f}  ← Polymarket uses this!")
    print("="*60)
    
    return {
        'matic': float(matic_formatted),
        'usdc_native': native_balance / 1e6,
        'usdc_bridged': bridged_balance / 1e6
    }

def check_allowances(web3):
    """Check current allowances for Polymarket contracts"""
    wallet = Web3.to_checksum_address(WALLET_ADDRESS)
    usdc = web3.eth.contract(address=Web3.to_checksum_address(USDC_BRIDGED), abi=ERC20_ABI)
    ctf = web3.eth.contract(address=Web3.to_checksum_address(CTF_CONTRACT), abi=ERC1155_APPROVAL_ABI)
    
    print("\n" + "="*60)
    print("🔐 ALLOWANCES (USDC.e → Exchange Contracts)")
    print("="*60)
    
    exchanges = [
        ("CTF Exchange", CTF_EXCHANGE),
        ("Neg Risk Exchange", NEG_RISK_CTF_EXCHANGE),
        ("Neg Risk Adapter", NEG_RISK_ADAPTER),
    ]
    
    all_approved = True
    
    for name, address in exchanges:
        allowance = usdc.functions.allowance(wallet, Web3.to_checksum_address(address)).call()
        ctf_approved = ctf.functions.isApprovedForAll(wallet, Web3.to_checksum_address(address)).call()
        
        usdc_ok = allowance > 0
        ctf_ok = ctf_approved
        
        status = "✅" if (usdc_ok and ctf_ok) else "❌"
        print(f"{status} {name}:")
        print(f"   USDC allowance: {'Approved' if usdc_ok else 'NOT APPROVED'}")
        print(f"   CTF approval:   {'Approved' if ctf_ok else 'NOT APPROVED'}")
        
        if not (usdc_ok and ctf_ok):
            all_approved = False
    
    print("="*60)
    return all_approved

def set_allowances(web3, dry_run=True):
    """Set all necessary allowances for Polymarket trading"""
    wallet = Web3.to_checksum_address(WALLET_ADDRESS)
    account = web3.eth.account.from_key(PRIVATE_KEY)
    
    usdc = web3.eth.contract(address=Web3.to_checksum_address(USDC_BRIDGED), abi=ERC20_ABI)
    ctf = web3.eth.contract(address=Web3.to_checksum_address(CTF_CONTRACT), abi=ERC1155_APPROVAL_ABI)
    
    exchanges = [
        ("CTF Exchange", CTF_EXCHANGE),
        ("Neg Risk Exchange", NEG_RISK_CTF_EXCHANGE),
        ("Neg Risk Adapter", NEG_RISK_ADAPTER),
    ]
    
    print("\n" + "="*60)
    print("🔧 SETTING ALLOWANCES")
    print("="*60)
    
    if dry_run:
        print("⚠️  DRY RUN MODE - No transactions will be sent")
        print("")
    
    nonce = web3.eth.get_transaction_count(wallet)
    gas_price = web3.eth.gas_price
    
    for name, address in exchanges:
        exchange_addr = Web3.to_checksum_address(address)
        
        # Check if already approved
        current_allowance = usdc.functions.allowance(wallet, exchange_addr).call()
        ctf_approved = ctf.functions.isApprovedForAll(wallet, exchange_addr).call()
        
        # 1. Approve USDC.e
        if current_allowance == 0:
            print(f"📝 Approving USDC.e for {name}...")
            
            if not dry_run:
                tx = usdc.functions.approve(exchange_addr, MAX_UINT256).build_transaction({
                    'chainId': 137,
                    'from': wallet,
                    'nonce': nonce,
                    'gas': 100000,
                    'gasPrice': gas_price
                })
                
                signed = account.sign_transaction(tx)
                tx_hash = web3.eth.send_raw_transaction(signed.raw_transaction)
                receipt = web3.eth.wait_for_transaction_receipt(tx_hash, timeout=120)
                
                print(f"   ✅ TX: {tx_hash.hex()}")
                nonce += 1
            else:
                print(f"   Would approve USDC.e for {exchange_addr}")
        else:
            print(f"✅ USDC.e already approved for {name}")
        
        # 2. Approve CTF (ERC1155)
        if not ctf_approved:
            print(f"📝 Setting CTF approval for {name}...")
            
            if not dry_run:
                tx = ctf.functions.setApprovalForAll(exchange_addr, True).build_transaction({
                    'chainId': 137,
                    'from': wallet,
                    'nonce': nonce,
                    'gas': 100000,
                    'gasPrice': gas_price
                })
                
                signed = account.sign_transaction(tx)
                tx_hash = web3.eth.send_raw_transaction(signed.raw_transaction)
                receipt = web3.eth.wait_for_transaction_receipt(tx_hash, timeout=120)
                
                print(f"   ✅ TX: {tx_hash.hex()}")
                nonce += 1
            else:
                print(f"   Would set CTF approval for {exchange_addr}")
        else:
            print(f"✅ CTF already approved for {name}")
    
    print("="*60)

def print_swap_instructions(balances):
    """Print instructions for swapping USDC → USDC.e"""
    if balances['usdc_native'] > 0 and balances['usdc_bridged'] < 1:
        print("\n" + "="*60)
        print("🔄 SWAP REQUIRED: Native USDC → USDC.e")
        print("="*60)
        print(f"""
You have ${balances['usdc_native']:.2f} native USDC but Polymarket needs USDC.e.

OPTION 1: Use 1inch (Recommended)
---------------------------------
1. Go to: https://app.1inch.io/#/137/simple/swap/USDC/USDC.e
2. Connect wallet: {WALLET_ADDRESS}
3. Swap {balances['usdc_native']:.2f} USDC → USDC.e
4. Confirm transaction

OPTION 2: Use Uniswap
---------------------
1. Go to: https://app.uniswap.org/swap
2. Select Polygon network
3. From: USDC (0x3c499c542cEF5E3811e1192ce70d8cC03d5c3359)
4. To: USDC.e (0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174)
5. Swap full amount

OPTION 3: Use a DEX aggregator programmatically
-----------------------------------------------
Use the 1inch API or Paraswap to execute the swap automatically.

After swapping, run this script again to set allowances.
""")
        print("="*60)

def verify_clob_balance():
    """Verify balance is visible to the CLOB API"""
    print("\n" + "="*60)
    print("🔍 VERIFYING CLOB BALANCE")
    print("="*60)
    
    try:
        sys.path.insert(0, '/Users/erik/.openclaw/workspace/py-clob-client')
        from py_clob_client.client import ClobClient
        from py_clob_client.clob_types import BalanceAllowanceParams, AssetType
        
        client = ClobClient(
            host="https://clob.polymarket.com",
            key=PRIVATE_KEY,
            chain_id=137,
            signature_type=0,  # EOA
        )
        
        # Create API credentials
        creds = client.create_or_derive_api_creds()
        client.set_api_creds(creds)
        
        # Get balance
        result = client.get_balance_allowance(
            params=BalanceAllowanceParams(asset_type=AssetType.COLLATERAL)
        )
        
        balance = int(result.get('balance', 0)) / 1e6
        allowance = int(result.get('allowance', 0)) / 1e6
        
        print(f"CLOB sees:")
        print(f"  Balance: ${balance:.2f}")
        print(f"  Allowance: ${allowance:.2f}")
        
        if balance > 0 and allowance > 0:
            print(f"\n✅ ACCOUNT FUNDED AND READY TO TRADE!")
        elif balance > 0 and allowance == 0:
            print(f"\n⚠️ Balance found but allowance not set. Run with --approve")
        else:
            print(f"\n❌ No balance visible. Need to swap USDC → USDC.e first.")
        
    except Exception as e:
        print(f"❌ Error checking CLOB balance: {e}")
    
    print("="*60)

# ============================================================================
# MAIN
# ============================================================================

def main():
    import argparse
    
    parser = argparse.ArgumentParser(description='Fund Polymarket trading account')
    parser.add_argument('--check', action='store_true', help='Check balances and allowances')
    parser.add_argument('--approve', action='store_true', help='Set allowances (requires USDC.e)')
    parser.add_argument('--verify', action='store_true', help='Verify CLOB sees your balance')
    parser.add_argument('--dry-run', action='store_true', help='Simulate without sending transactions')
    args = parser.parse_args()
    
    print("\n" + "="*60)
    print("🚀 POLYMARKET ACCOUNT FUNDING TOOL")
    print("   by Miyamoto Labs")
    print("="*60)
    
    web3 = get_web3()
    print(f"✅ Connected to Polygon (Block: {web3.eth.block_number})")
    
    # Always check balances
    balances = check_balances(web3)
    
    if args.check or not any([args.approve, args.verify]):
        check_allowances(web3)
        print_swap_instructions(balances)
    
    if args.approve:
        if balances['usdc_bridged'] < 1:
            print("\n❌ Cannot set allowances: No USDC.e balance!")
            print("   First swap your native USDC → USDC.e (see instructions above)")
            return
        
        set_allowances(web3, dry_run=args.dry_run)
        
        if not args.dry_run:
            print("\n⏳ Waiting for transactions to confirm...")
            time.sleep(5)
            check_allowances(web3)
    
    if args.verify:
        verify_clob_balance()
    
    print("\n📋 SUMMARY")
    print("-" * 40)
    if balances['usdc_bridged'] > 0:
        print(f"✅ USDC.e balance: ${balances['usdc_bridged']:.2f}")
    else:
        print(f"❌ USDC.e balance: $0 - SWAP NEEDED")
    
    if balances['matic'] < 0.01:
        print(f"⚠️ Low MATIC for gas: {balances['matic']:.4f}")
    else:
        print(f"✅ MATIC for gas: {balances['matic']:.4f}")
    
    print("")

if __name__ == "__main__":
    main()
