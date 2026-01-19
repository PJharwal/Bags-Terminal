import cloudscraper
import json
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



def make_request(url, params=None, address="None"):
    """Make a request with proper headers"""
    headers = get_headers(address)
    
    try:
        response = scraper.get(url, headers=headers, params=params, timeout=30)
        # print(response.text)
        print("here is response",response.text)
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


def get_trending_tokens(chain="sol", timeframe="1m", limit=10):
    """Get trending tokens (swap ranks)"""
    print(f"\n{'='*60}")
    print(f"Trending Tokens (Swaps {timeframe})")
    print('='*60)
    
    url = f"https://gmgn.ai/defi/quotation/v1/rank/{chain}/swaps/{timeframe}"
    params = {
        "orderby": "swaps",
        "direction": "desc",
        "limit": limit,
        "filters[]": ["renounced", "frozen", "not_wash_trading"]
    }
    
    data = make_request(url, params=params)
    
    if data and data.get('code') == 0:
        print(f"✓ Success!")
        
        with open('trending_tokens.json', 'w') as f:
            json.dump(data, f, indent=4)
        print(f"Saved data to trending_tokens.json")

        rank = data.get('data', {}).get('rank', [])
        for i, token in enumerate(rank[:limit], 1):
            print(f"\n{i}. {token.get('symbol')} ({token.get('address')})")
            for key, value in token.items():
                print(f"   {key}: {value}")

    else:
        print(f"✗ Failed: {data}")
    
    return data


if __name__ == "__main__":
    print("\n" + "="*60)
    print("GMGN Trending API Testing Suite")
    print("="*60)

    get_trending_tokens(limit=2)
    time.sleep(1)

    
    print("\n" + "="*60)
    print("Testing Complete!")
    print("="*60)