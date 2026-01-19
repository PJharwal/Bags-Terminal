import cloudscraper
import time



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


def stream_new_pairs(chain="sol"):
    """new pairs"""
    print(f"\n{'='*60}")
    print('='*60)
    
    url = f"https://gmgn.ai/defi/quotation/v1/pairs/{chain}/new_pair_ranks/1m"
    params = {
                "limit": 50,
                "orderby": "liquidity",
                "direction": "desc"
            }
            
    data = make_request(url, params=params, silent=True)
            
    if data and data.get('code') == 0:
        print(f"✓ Success!")
        pools = data.get('data', {}).get('new_pools', [])
        for i, pool in enumerate(pools[:5], 1):
            token_info = pool.get('base_token_info', {})
            print(f"\n{i}. {token_info.get('symbol')} ({token_info.get('name')})")
            print(f"   Address: {token_info.get('address')}")
            print(f"   Launchpad: {pool.get('launchpad')}")
            print(f"   Liquidity: ${pool.get('liquidity')}")
    else:
        print(f"✗ Failed: {data}")
    
    return data
            
            

if __name__ == "__main__":
    stream_new_pairs()