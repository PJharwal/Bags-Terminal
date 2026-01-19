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



def make_request(url, method='GET', params=None, address="None", **kwargs):
    """Make a request with proper headers"""
    headers = get_headers(address)
    
    try:
        response = scraper.request(method, url, headers=headers, params=params, timeout=30, **kwargs)
        # print(response.text)
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


 # === WORKING ENDPOINTS FROM DOCUMENTATION ===


def getTokenHolderStats(contractAddress: str, chain: str = "sol"):
    """
    Gets token holder statistics using the token_holder_stat API endpoint.
    """
    if not contractAddress:
        return "You must input a contract address."
    
    url = f"https://gmgn.ai/vas/api/v1/token_holder_stat/{chain}/{contractAddress}"

    response_data = make_request(url, method='GET', address=contractAddress)

    return response_data

if __name__ == "__main__":
    print("\n" + "="*60)
    print("GMGN Token Holder Stats API Testing")
    print("="*60)

    stats = getTokenHolderStats("2cyh7Dof1dWKH1LFxSa94oirnVs6JiqNPQGKQVwxpump")
    print(json.dumps(stats, indent=2))
    time.sleep(1)

    
    print("\n" + "="*60)
    print("Testing Complete!")
    print("="*60)