from client import gmgn
import time

def main():
    print("Initializing GMGN Client...")
    client = gmgn()
    
    print("\n" + "="*60)
    print("Testing getTokenInfo")
    print("="*60)
    token_address = "2cyh7Dof1dWKH1LFxSa94oirnVs6JiqNPQGKQVwxpump"
    info = client.getTokenInfo(token_address)
    print("here is the complete token info----", token_address)

    if info:
        try:
            data = info.get('data', [])
            if data and isinstance(data, list):
                token = data[0]
                print(f"Token: {token.get('symbol')}")
            else:
                print("No token data found")
        except Exception as e:
            print(f"Error: {e}")
    else:
        print("✗ Failed")
    time.sleep(1)

    print("\n" + "="*60)
    print("Testing getTrendingTokens")
    print("="*60)
    trending = client.getTrendingTokens("1h")
    if trending:
        print("✓ Success")
        rank = trending.get('rank', [])
        if rank:
            print(f"Top Token: {rank[0].get('symbol')}")
    else:
        print("✗ Failed")
    time.sleep(1)

    print("\n" + "="*60)
    print("Testing getNewPairs")
    print("="*60)
    new_pairs = client.getNewPairs(limit=5)
    if new_pairs:
        print("✓ Success")
        print(f"Found {len(new_pairs.get('new_pools', []))} new pairs")
    else:
        print("✗ Failed")

    print("\n" + "="*60)
    print("Testing Wallet Holder")
    print("="*60)
    wallet_info = client.getTopHolders("3wFFCYAMFKw1JQo7fUiRJ58or6ifbteA6DrGfqYNpump")
    print(wallet_info)
    if wallet_info:
        print("✓ Success")
        holders = wallet_info.get('list', [])
        if holders:
            print(f"Top Holder: {holders[0].get('address')}")
    else:
        print("✗ Failed")
    time.sleep(1)


    print("\n" + "="*60)
    print("Testing getTopTraders Holder")
    print("="*60)
    wallet_info = client.getTopTraders("3wFFCYAMFKw1JQo7fUiRJ58or6ifbteA6DrGfqYNpump")
    print(wallet_info)
    if wallet_info:
        print("✓ Success")
        if isinstance(wallet_info, list) and len(wallet_info) > 0:
            print(f"Top Trader: {wallet_info[0].get('address')}")
        elif isinstance(wallet_info, dict):
             # Fallback if it returns a dict with a list inside (like getTopHolders)
             traders = wallet_info.get('list', [])
             if traders:
                 print(f"Top Trader: {traders[0].get('address')}")
    else:
        print("✗ Failed")
    time.sleep(1)

    print("\n" + "="*60)
    print("Testing getTrendingWallets")
    print("="*60)
    trending_wallets = client.getTrendingWallets("7d", "smart_degen")
    if trending_wallets:
        print("✓ Success")
        rank = trending_wallets.get('rank', [])
        if rank:
            print(f"Top Wallet: {rank[0].get('wallet_address')}")
    else:
        print("✗ Failed")
    time.sleep(1)

    print("\n" + "="*60)
    print("Testing getGasFee")
    print("="*60)
    gas_fee = client.getGasFee()
    if gas_fee:
        print("✓ Success")
        print(f"Gas Fee (Average): {gas_fee.get('average')}")
    else:
        print("✗ Failed")
    time.sleep(1)

    print("\n" + "="*60)
    print("Testing getTokenUsdPrice")
    print("="*60)
    price_info = client.getTokenUsdPrice("2cyh7Dof1dWKH1LFxSa94oirnVs6JiqNPQGKQVwxpump")
    if price_info:
        print("✓ Success")
        print(f"Price: {price_info.get('usd_price')}")
    else:
        print("✗ Failed")
    time.sleep(1)

    print("\n" + "="*60)
    print("Testing getTopBuyers")
    print("="*60)
    top_buyers = client.getTopBuyers("2cyh7Dof1dWKH1LFxSa94oirnVs6JiqNPQGKQVwxpump")
    if top_buyers:
        print("✓ Success")
        buyers = top_buyers.get('list', [])
        if buyers:
            print(f"Top Buyer: {buyers[0].get('address')}")
        else:
            print("Found 0 buyers")
    else:
        print("✗ Failed")
    time.sleep(1)

    print("\n" + "="*60)
    print("Testing getWalletTokenDistribution")
    print("="*60)
    
    wallet_dist = client.getWalletTokenDistribution("8SiVndS1CyL3DsJfFt4idVFBoK5XeVvw7SfHtYCQeTZS")
    print(wallet_dist)
    if wallet_dist:
        print("✓ Success")
        print(f"Distribution data found")
    else:
        print("✗ Failed")
    time.sleep(1)

    print("\n" + "="*60)
    print("Testing getSwapRanks (1m)")
    print("="*60)
    swap_ranks = client.getSwapRanks(timeframe="1m", limit=20)
    if swap_ranks:
        print("✓ Success")
        rank = swap_ranks.get('rank', [])
        for i, token in enumerate(rank[:5], 1):
            print(f"\n{i}. {token.get('symbol')} ({token.get('address')})")
            print(f"   Swaps: {token.get('swaps')}")
            print(f"   Price: ${token.get('price')}")
            print(f"   Market Cap: ${token.get('market_cap')}")
    else:
        print("✗ Failed")
    time.sleep(1)

    print("\n" + "="*60)
    print("Testing getPumpRanks (1h)")
    print("="*60)
    pump_ranks = client.getPumpRanks(timeframe="1h", limit=20)
    if pump_ranks:
        print("✓ Success")
        pumps = pump_ranks.get('rank', [])
        for i, token in enumerate(pumps[:5], 1):
            print(f"\n{i}. {token.get('symbol')} ({token.get('name')})")
            print(f"   Address: {token.get('address')}")
            print(f"   Market Cap: ${token.get('market_cap')}")
            print(f"   Volume 1h: ${token.get('volume_1h')}")
    else:
        print("✗ Failed")
    time.sleep(1)

    print("\n" + "="*60)
    print("Testing getNewTokensSnipe")
    print("="*60)
    new_tokens = client.getNewTokensSnipe(limit=10)
    if new_tokens:
        print("✓ Success")
        signals = new_tokens.get('signals', [])
        for i, signal in enumerate(signals[:5], 1):
            token_data = signal.get('token_data', {})
            signal_data = signal.get('signal_data', {})
            print(f"\n{i}. {token_data.get('token_symbol')}")
            print(f"   Address: {signal.get('token_address')}")
            print(f"   Price: ${signal.get('token_price')}")
            print(f"   Market Cap: ${signal_data.get('market_cap')}")
            print(f"   Swaps 1m: {signal_data.get('swaps_1m')}")
    else:
        print("✗ Failed")
    time.sleep(1)

    print("\n" + "="*60)
    print("Testing getTokenSecurity")
    print("="*60)
    token_address = "2cyh7Dof1dWKH1LFxSa94oirnVs6JiqNPQGKQVwxpump"
    security_info = client.getTokenSecurity(token_address)
    if security_info:
        print("✓ Success")
        security = security_info.get('security', {})
        print(f"\n   Honeypot: {security.get('is_honeypot')}")
        print(f"   Renounced: {security.get('renounced')}")
        print(f"   Burn Ratio: {security.get('burn_ratio')}")
        print(f"   Top 10 Holder Rate: {security.get('top_10_holder_rate')}")
    else:
        print("✗ Failed")
    time.sleep(1)

    
if __name__ == "__main__":
    main()
