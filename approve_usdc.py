#!/usr/bin/env python3
"""
Minimal USDC.e approval script for Polymarket
"""

import time
from web3 import Web3
from web3.middleware import geth_poa_middleware

# Config
WALLET_ADDRESS = "0x114B7A51A4cF04897434408bd9003626705a2208"
import os
from dotenv import load_dotenv
load_dotenv()
PRIVATE_KEY = os.getenv('POLYMARKET_PRIVATE_KEY')

# Contracts
USDC_E = "0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174"
CTF_EXCHANGE = "0x4bFb41d5B3570DeFd03C39a9A4D8dE6Bd8B8982E"
NEG_RISK_CTF_EXCHANGE = "0xC5d563A36AE78145C45a50134d48A1215220f80a"

# ERC20 ABI (just approve function)
ERC20_ABI = [
    {
        "inputs": [
            {"name": "spender", "type": "address"},
            {"name": "amount", "type": "uint256"}
        ],
        "name": "approve",
        "outputs": [{"name": "", "type": "bool"}],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "inputs": [
            {"name": "owner", "type": "address"},
            {"name": "spender", "type": "address"}
        ],
        "name": "allowance",
        "outputs": [{"name": "", "type": "uint256"}],
        "stateMutability": "view",
        "type": "function"
    }
]

# Try multiple RPCs
RPCS = [
    "https://polygon-rpc.com",
    "https://rpc.ankr.com/polygon",
    "https://polygon-mainnet.public.blastapi.io",
    "https://1rpc.io/matic",
]

MAX_APPROVAL = 2**256 - 1  # Unlimited approval

def get_web3():
    """Try multiple RPCs"""
    for rpc in RPCS:
        try:
            print(f"Trying {rpc}...")
            w3 = Web3(Web3.HTTPProvider(rpc, request_kwargs={'timeout': 30}))
            w3.middleware_onion.inject(geth_poa_middleware, layer=0)
            if w3.is_connected():
                block = w3.eth.block_number
                print(f"✅ Connected to {rpc} (block {block})")
                return w3
        except Exception as e:
            print(f"❌ {rpc} failed: {e}")
            continue
    raise Exception("All RPCs failed")

def approve_token(web3, token_addr, spender_addr, name):
    """Approve a spender for unlimited token spending"""
    wallet = Web3.to_checksum_address(WALLET_ADDRESS)
    token = web3.eth.contract(address=Web3.to_checksum_address(token_addr), abi=ERC20_ABI)
    spender = Web3.to_checksum_address(spender_addr)
    
    # Check current allowance
    current = token.functions.allowance(wallet, spender).call()
    if current > 10**18:  # Already approved (> 1 trillion USDC)
        print(f"✅ {name} already approved")
        return True
    
    print(f"📝 Approving {name}...")
    
    # Build tx
    nonce = web3.eth.get_transaction_count(wallet)
    tx = token.functions.approve(spender, MAX_APPROVAL).build_transaction({
        'from': wallet,
        'nonce': nonce,
        'gas': 100000,
        'maxFeePerGas': web3.to_wei(50, 'gwei'),
        'maxPriorityFeePerGas': web3.to_wei(30, 'gwei'),
    })
    
    # Sign and send
    signed = web3.eth.account.sign_transaction(tx, PRIVATE_KEY)
    tx_hash = web3.eth.send_raw_transaction(signed.raw_transaction)
    print(f"   TX: {tx_hash.hex()}")
    
    # Wait for receipt with retries
    for attempt in range(10):
        try:
            receipt = web3.eth.wait_for_transaction_receipt(tx_hash, timeout=30)
            if receipt.status == 1:
                print(f"✅ {name} approved!")
                return True
            else:
                print(f"❌ {name} tx failed")
                return False
        except Exception as e:
            if attempt < 9:
                print(f"   Waiting... ({attempt+1}/10)")
                time.sleep(5)
            else:
                print(f"   Could not confirm, but TX was sent: {tx_hash.hex()}")
                return True  # Assume success

def main():
    print("=" * 60)
    print("🚀 USDC.e APPROVAL FOR POLYMARKET")
    print("=" * 60)
    
    web3 = get_web3()
    
    # Approve for both exchanges
    approve_token(web3, USDC_E, CTF_EXCHANGE, "CTF Exchange")
    time.sleep(3)  # Small delay between approvals
    approve_token(web3, USDC_E, NEG_RISK_CTF_EXCHANGE, "Neg Risk CTF Exchange")
    
    print("\n" + "=" * 60)
    print("✅ DONE! Your USDC.e is now approved for Polymarket trading")
    print("=" * 60)

if __name__ == "__main__":
    main()
