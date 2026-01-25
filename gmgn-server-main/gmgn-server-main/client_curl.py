"""
curl_cffi-based GMGN Client for Cloudflare bypass.
curl_cffi impersonates real browsers at the TLS/HTTP2 level.
"""
import json
import time
import random
from typing import Optional, Dict, Any, List
from curl_cffi import requests as curl_requests


class GMGNCurl:
    BASE_URL = "https://gmgn.ai"

    # Browser impersonation options (curl_cffi feature)
    IMPERSONATE_OPTIONS = [
        "chrome120",
        "chrome119",
        "chrome116",
        "edge120",
        "safari17_0",
    ]

    def __init__(self):
        self.session = curl_requests.Session(impersonate=random.choice(self.IMPERSONATE_OPTIONS))
        self.last_request_time = 0
        self.min_delay = 0.5

    def _get_headers(self, address: str = "None") -> Dict[str, str]:
        """Generate headers"""
        return {
            'Accept': 'application/json, text/plain, */*',
            'Accept-Language': 'en-US,en;q=0.9',
            'Origin': 'https://gmgn.ai',
            'Referer': f'https://gmgn.ai/sol/token/{address}' if address != "None" else 'https://gmgn.ai/',
            'Sec-Fetch-Dest': 'empty',
            'Sec-Fetch-Mode': 'cors',
            'Sec-Fetch-Site': 'same-origin',
        }

    def _throttle(self):
        """Rate limiting"""
        elapsed = time.time() - self.last_request_time
        if elapsed < self.min_delay:
            time.sleep(self.min_delay - elapsed)
        self.last_request_time = time.time()

    def _make_request(self, url: str, method: str = 'GET',
                      params: dict = None, json_data: dict = None,
                      address: str = "None", retries: int = 3) -> Optional[Dict[str, Any]]:
        """Make request with retries and different browser impersonations"""

        self._throttle()
        headers = self._get_headers(address)

        for attempt in range(retries):
            try:
                # Switch impersonation on retry
                if attempt > 0:
                    delay = (2 ** attempt) + random.uniform(0, 1)
                    print(f"Retry {attempt + 1}/{retries} after {delay:.1f}s...")
                    time.sleep(delay)
                    self.session = curl_requests.Session(
                        impersonate=random.choice(self.IMPERSONATE_OPTIONS)
                    )

                if method == 'GET':
                    response = self.session.get(
                        url,
                        params=params,
                        headers=headers,
                        timeout=30
                    )
                else:
                    response = self.session.request(
                        method,
                        url,
                        params=params,
                        json=json_data,
                        headers=headers,
                        timeout=30
                    )

                if response.status_code == 200:
                    try:
                        return response.json()
                    except json.JSONDecodeError:
                        print(f"Invalid JSON: {response.text[:200]}")
                        continue

                elif response.status_code == 403:
                    print(f"Cloudflare block (403) attempt {attempt + 1}")
                    continue

                elif response.status_code == 429:
                    print(f"Rate limited (429)")
                    time.sleep(10)
                    continue

                else:
                    print(f"Error {response.status_code}: {response.text[:200]}")

            except Exception as e:
                print(f"Request error: {e}")
                continue

        return None

    # === API Methods ===

    def getTrendingTokens(self, timeframe: str = "1h") -> Optional[dict]:
        """Gets trending tokens."""
        valid = ["1m", "5m", "1h", "6h", "24h"]
        if timeframe not in valid:
            return None

        url = f"{self.BASE_URL}/defi/quotation/v1/rank/sol/swaps/{timeframe}"
        params = {"orderby": "swaps", "direction": "desc"}
        if timeframe == "1m":
            params["limit"] = 20

        response = self._make_request(url, params=params)
        return response.get('data') if response else None

    def getSwapRanks(self, chain: str = "sol", timeframe: str = "1m", limit: int = 20) -> Optional[dict]:
        url = f"{self.BASE_URL}/defi/quotation/v1/rank/{chain}/swaps/{timeframe}"
        params = {"orderby": "swaps", "direction": "desc", "limit": limit}
        response = self._make_request(url, params=params)
        return response.get('data') if response else None

    def getTokenInfo(self, contractAddress: str) -> Optional[dict]:
        if not contractAddress:
            return None
        url = f"{self.BASE_URL}/api/v1/mutil_window_token_info"
        payload = {"chain": "sol", "addresses": [contractAddress]}
        return self._make_request(url, method='POST', json_data=payload, address=contractAddress)

    def getNewPairs(self, limit: int = 50) -> Optional[dict]:
        limit = min(limit, 50)
        url = f"{self.BASE_URL}/defi/quotation/v1/pairs/sol/new_pairs"
        params = {"limit": limit, "orderby": "open_timestamp", "direction": "desc"}
        response = self._make_request(url, params=params)
        return response.get('data') if response else None

    def getGasFee(self) -> Optional[dict]:
        url = f"{self.BASE_URL}/api/v1/gas_price/sol"
        response = self._make_request(url)
        return response.get('data') if response else None

    def getTopHolders(self, contractAddress: str) -> Optional[dict]:
        if not contractAddress:
            return None
        url = f"{self.BASE_URL}/vas/api/v1/token_holders/sol/{contractAddress}"
        response = self._make_request(url, address=contractAddress)
        return response.get('data') if response else None

    def getTopTraders(self, contractAddress: str) -> Optional[dict]:
        if not contractAddress:
            return None
        url = f"{self.BASE_URL}/vas/api/v1/token_traders/sol/{contractAddress}"
        response = self._make_request(url, address=contractAddress)
        return response.get('data', {}).get('list') if response else None

    def getTokenStats(self, contractAddress: str, chain: str = "sol") -> Optional[dict]:
        if not contractAddress:
            return None
        url = f"https://gmgn.ai/vas/api/v1/token_holder_stat/{chain}/{contractAddress}"
        return self._make_request(url, address=contractAddress)

    def getTrendingWallets(self, timeframe: str = "7d", walletTag: str = "smart_degen") -> Optional[dict]:
        url = f"{self.BASE_URL}/defi/quotation/v1/rank/sol/wallets/{timeframe}"
        params = {"tag": walletTag, "orderby": f"pnl_{timeframe}", "direction": "desc"}
        response = self._make_request(url, params=params)
        return response.get('data') if response else None

    def getTokenUsdPrice(self, contractAddress: str) -> Optional[dict]:
        if not contractAddress:
            return None
        url = f"{self.BASE_URL}/defi/quotation/v1/sol/tokens/realtime_token_price"
        params = {"address": contractAddress}
        response = self._make_request(url, params=params, address=contractAddress)
        return response.get('data') if response else None

    def getTopBuyers(self, contractAddress: str) -> Optional[dict]:
        if not contractAddress:
            return None
        url = f"{self.BASE_URL}/defi/quotation/v1/tokens/top_buyers/sol/{contractAddress}"
        response = self._make_request(url, address=contractAddress)
        return response.get('data') if response else None

    def getWalletTokenDistribution(self, walletAddress: str, period: str = "7d") -> Optional[dict]:
        if not walletAddress:
            return None
        url = f"{self.BASE_URL}/defi/quotation/v1/rank/sol/wallets/{walletAddress}/unique_token_7d"
        params = {"interval": period}
        response = self._make_request(url, params=params)
        return response.get('data') if response else None

    def getPumpRanks(self, chain: str = "sol", timeframe: str = "1h", limit: int = 20) -> Optional[dict]:
        url = f"{self.BASE_URL}/defi/quotation/v1/rank/{chain}/pump/{timeframe}"
        params = {"limit": limit, "orderby": "market_cap", "direction": "desc"}
        response = self._make_request(url, params=params)
        return response.get('data') if response else None

    def getNewTokensSnipe(self, chain: str = "sol", limit: int = 10) -> Optional[dict]:
        url = f"{self.BASE_URL}/defi/quotation/v1/signals/{chain}/snipe_new"
        params = {"size": limit, "is_show_alert": "false", "featured": "false"}
        response = self._make_request(url, params=params)
        return response.get('data') if response else None

    def getTokenSecurity(self, token_address: str, chain: str = "sol") -> Optional[dict]:
        url = f"{self.BASE_URL}/api/v1/mutil_window_token_security_launchpad/{chain}/{token_address}"
        response = self._make_request(url, address=token_address)
        return response.get('data') if response else None


# Backward compatibility alias
gmgn = GMGNCurl


if __name__ == "__main__":
    print("Testing curl_cffi-based GMGN client...")
    client = GMGNCurl()

    print("\n1. Testing getTrendingTokens...")
    result = client.getTrendingTokens("1h")
    if result:
        rank = result.get('rank', [])
        print(f"   SUCCESS: Got {len(rank)} trending tokens")
        if rank:
            print(f"   Top token: {rank[0].get('symbol', 'N/A')} - MC: ${rank[0].get('market_cap', 0):,.0f}")
    else:
        print("   FAILED: Could not fetch trending tokens")

    print("\n2. Testing getGasFee...")
    result = client.getGasFee()
    if result:
        print(f"   SUCCESS: Gas fee = {result}")
    else:
        print("   FAILED: Could not fetch gas fee")

    print("\nTest complete.")
