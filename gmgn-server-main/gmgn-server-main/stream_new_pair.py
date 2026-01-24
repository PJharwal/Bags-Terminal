import cloudscraper
import time
import database



scraper = cloudscraper.create_scraper(
    browser={
        'browser': 'chrome',
        'platform': 'windows',
        'mobile': False
    }
)


def get_headers(address: str = "None"):
    """Generate headers with proper referer for GMGN API"""
    headers = {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'application/json, text/plain, */*',
        'Accept-Language': 'en-US,en;q=0.9',
        'Origin': 'https://gmgn.ai',
        'Referer': f'https://gmgn.ai/sol/token/{address}',
        'Sec-Ch-Ua': '"Not_A Brand";v="8", "Chromium";v="120", "Google Chrome";v="120"',
        'Sec-Ch-Ua-Mobile': '?0',
        'Sec-Ch-Ua-Platform': '"Windows"',
        'Sec-Fetch-Dest': 'empty',
        'Sec-Fetch-Mode': 'cors',
        'Sec-Fetch-Site': 'same-origin',
        'Connection': 'keep-alive'
    }
    if address == "None":
        headers['Referer'] = "https://gmgn.ai"
    return headers


def make_request(url, params=None, address="None", silent=False):
    """Make a request with proper headers"""
    headers = get_headers(address)
    
    try:
        response = scraper.get(url, headers=headers, params=params, timeout=30)
        # print(response.text)
        if not silent:
            print(f"Status Code: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            return data
        else:
            print(f"Error: {response.text[:500]}")
            return None
            
    except Exception as e:
        print(f"Error: {e}")
        import traceback
        traceback.print_exc()
        return None


def stream_new_pairs(chain="sol", interval=5):
    """Stream new pairs in real-time"""
    
    # Initialize database
    database.init_db()
    
    print(f"\n{'='*60}")
    print(f"Streaming New Pairs (Polling every {interval}s)")
    print('='*60)
    
    seen_pairs = set()
    
    try:
        while True:
            url = f"https://gmgn.ai/defi/quotation/v1/pairs/{chain}/new_pair_ranks/1m"
            params = {
                "limit": 50, # Fetch more to ensure we catch new ones
                "orderby": "liquidity",
                "direction": "desc"
            }
            
            data = make_request(url, params=params, silent=True)
            
            if data and data.get('code') == 0:
                pools = data.get('data', {}).get('new_pools', [])
                new_items_found = False
                
               
                for pool in pools:    
                    
                    token_info = pool.get('base_token_info', {})
                    token_address = token_info.get('address')
                    
                    if token_address and token_address not in seen_pairs:
                        seen_pairs.add(token_address)
                        new_items_found = True
                        
                        print(f"\n[NEW] {token_info.get('symbol')} ({token_info.get('name')})")
                        for key, value in pool.items():
                            print(f"   {key}: {value}")
                        print(f"   Time: {time.strftime('%H:%M:%S')}")
                        
                        # Save to database
                        database.save_token_data(pool)
                        print(f"   [DB] Saved {token_info.get('symbol')} to database")
                
                if not new_items_found:
                    print(".", end="", flush=True)
            else:
                print("x", end="", flush=True)
            
            time.sleep(interval)
            
    except KeyboardInterrupt:
        print("\n\nStopping stream...")

if __name__ == "__main__":
    stream_new_pairs(interval=1)