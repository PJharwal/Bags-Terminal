import requests
import time

BASE_URL = "http://localhost:8000"

def test_endpoint(name, url):
    print(f"\nTesting {name}...")
    print(f"URL: {url}")
    try:
        response = requests.get(url)
        if response.status_code == 200:
            print("✓ Success")
            data = response.json()
            # Print a snippet of the data
            print(f"Response snippet: {str(data)[:200]}...")
        else:
            print(f"✗ Failed (Status: {response.status_code})")
            print(f"Error: {response.text}")
    except requests.exceptions.ConnectionError:
        print("✗ Failed (Connection Error)")
        print("Make sure the server is running: uvicorn server:app --reload")

def main():
    print("Starting Server Tests...")
    print("Ensure server is running on http://localhost:8000")
    
    # 1. Root
    test_endpoint("Root", f"{BASE_URL}/")
    
    # 2. Trending Tokens
    test_endpoint("Trending Tokens", f"{BASE_URL}/tokens/trending?timeframe=1h")
    
    # 3. New Pairs
    test_endpoint("New Pairs", f"{BASE_URL}/pairs/new?limit=5")
    
    # 4. Token Info (using a known address from check.py)
    token_addr = "2cyh7Dof1dWKH1LFxSa94oirnVs6JiqNPQGKQVwxpump"
    test_endpoint("Token Info", f"{BASE_URL}/token/{token_addr}/info")
    
    # 5. Swap Ranks
    test_endpoint("Swap Ranks", f"{BASE_URL}/ranks/swaps?timeframe=1m&limit=5")
    
    # 6. Pump Ranks
    test_endpoint("Pump Ranks", f"{BASE_URL}/ranks/pump?timeframe=1h&limit=5")

if __name__ == "__main__":
    main()
