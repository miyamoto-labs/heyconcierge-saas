#!/usr/bin/env python3
"""Sign Moltx EIP-712 challenge to link wallet"""

import json
from eth_account import Account
from eth_account.messages import encode_typed_data

# The challenge from Moltx
typed_data = {
    "primaryType": "MoltXWalletLink",
    "domain": {
        "name": "MoltX",
        "version": "1",
        "chainId": 8453
    },
    "types": {
        "EIP712Domain": [
            {"name": "name", "type": "string"},
            {"name": "version", "type": "string"},
            {"name": "chainId", "type": "uint256"}
        ],
        "MoltXWalletLink": [
            {"name": "agentId", "type": "string"},
            {"name": "agentName", "type": "string"},
            {"name": "wallet", "type": "address"},
            {"name": "chainId", "type": "uint256"},
            {"name": "nonce", "type": "string"},
            {"name": "issuedAt", "type": "string"},
            {"name": "expiresAt", "type": "string"}
        ]
    },
    "message": {
        "agentId": "8c02099c-e71f-43bc-9770-0c55bcb8cc8f",
        "agentName": "MiyamotoLabs",
        "wallet": "0xF1CcD889c2b340636A567DfF3f1d157f7FFD00dB",
        "chainId": 8453,
        "nonce": "39d63651977d4ef2bdf15007e7ec176f",
        "issuedAt": "2026-02-07T20:59:23.500Z",
        "expiresAt": "2026-02-07T21:09:23.500Z"
    }
}

# We need the private key for 0xF1CcD889c2b340636A567DfF3f1d157f7FFD00dB
# This is Erik's main Hyperliquid wallet
# Check if there's a private key file or we need to ask Erik

# Actually, the Hyperliquid config shows:
# - public_wallet: 0xF1CcD889c2b340636A567DfF3f1d157f7FFD00dB
# - api_wallet: 0x20b361f7df0633fba47bd757dfac4a81072b1ece
# - api_private_key: 0xc5c22aac3e8c2722231e7240928cbd7fc30c54bf5b79ad7bbd50be066285ca7a
#
# The api_private_key is for the API wallet, not the main wallet
# We need the private key for the public_wallet to sign

# Let's try to see if Erik has the main wallet private key stored somewhere
# For now, let's print what we need
print("To link the wallet, we need the private key for:")
print(f"  Wallet: 0xF1CcD889c2b340636A567DfF3f1d157f7FFD00dB")
print()
print("If you have it, add it below and run again, or provide it to the script.")
print()

# If we had the key, we'd do:
# PRIVATE_KEY = "0x..."
# account = Account.from_key(PRIVATE_KEY)
# structured_msg = encode_typed_data(full_message=typed_data)
# signed = account.sign_message(structured_msg)
# print(f"Signature: {signed.signature.hex()}")
