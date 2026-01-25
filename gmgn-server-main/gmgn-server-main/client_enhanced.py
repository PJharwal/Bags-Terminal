"""
Enhanced GMGN Client with multiple Cloudflare bypass strategies:
1. cloudscraper with browser rotation
2. Custom headers with cookie persistence
3. Proxy rotation support
4. Request delay/throttling
"""
import cloudscraper
import time
import json
import random
import os
from typing import Optional, Dict, Any, List

# Free proxy list (these are examples - replace with working proxies)
FREE_PROXIES = [
    # Format: "http://ip:port" or "socks5://ip:port"
    # Add your proxies here
]

# Browser profiles to rotate
BROWSER_PROFILES = [
    {'browser': 'chrome', 'platform': 'windows', 'mobile': False},
    {'browser': 'chrome', 'platform': 'darwin', 'mobile': False},
    {'browser': 'firefox', 'platform': 'windows', 'mobile': False},
    {'browser': 'firefox', 'platform': 'linux', 'mobile': False},
]

USER_AGENTS = [
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36',
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36',
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:122.0) Gecko/20100101 Firefox/122.0',
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.2.1 Safari/605.1.15',
    'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36',
]


class GMGNEnhanced:
    BASE_URL = "https://gmgn.ai"

    def __init__(self, use_proxies: bool = False, proxy_list: List[str] = None):
        self.use_proxies = use_proxies
        self.proxy_list = proxy_list or FREE_PROXIES
        self.current_proxy_index = 0
        self.scraper = None
        self.cookies = {}
        self.last_request_time = 0
        self.min_request_delay = 1.0  # Minimum seconds between requests
        self._create_scraper()

    def _create_scraper(self):
        """Create a new scraper with random browser profile"""
        browser_profile = random.choice(BROWSER_PROFILES)

        try:
            self.scraper = cloudscraper.create_scraper(
                browser=browser_profile,
                delay=5,  # Challenge delay
                interpreter='nodejs',  # Use Node.js for JS challenges
            )
        except Exception:
            # Fallback without interpreter
            self.scraper = cloudscraper.create_scraper(
                browser=browser_profile,
                delay=5,
            )

    def _get_proxy(self) -> Optional[Dict[str, str]]:
        """Get next proxy from rotation"""
        if not self.use_proxies or not self.proxy_list:
            return None

        proxy = self.proxy_list[self.current_proxy_index % len(self.proxy_list)]
        self.current_proxy_index += 1
        return {"http": proxy, "https": proxy}

    def _get_headers(self, address: str = "None") -> Dict[str, str]:
        """Generate randomized headers"""
        user_agent = random.choice(USER_AGENTS)

        headers = {
            'User-Agent': user_agent,
            'Accept': 'application/json, text/plain, */*',
            'Accept-Language': 'en-US,en;q=0.9',
            'Accept-Encoding': 'gzip, deflate, br',
            'Origin': 'https://gmgn.ai',
            'Referer': f'https://gmgn.ai/sol/token/{address}' if address != "None" else 'https://gmgn.ai/',
            'Sec-Ch-Ua': '"Not_A Brand";v="8", "Chromium";v="121", "Google Chrome";v="121"',
            'Sec-Ch-Ua-Mobile': '?0',
            'Sec-Ch-Ua-Platform': '"Windows"',
            'Sec-Fetch-Dest': 'empty',
            'Sec-Fetch-Mode': 'cors',
            'Sec-Fetch-Site': 'same-origin',
            'Connection': 'keep-alive',
            'Cache-Control': 'no-cache',
            'Pragma': 'no-cache',
        }
        return headers

    def _throttle(self):
        """Ensure minimum delay between requests"""
        elapsed = time.time() - self.last_request_time
        if elapsed < self.min_request_delay:
            time.sleep(self.min_request_delay - elapsed)
        self.last_request_time = time.time()

    def _make_request(self, url: str, method: str = 'GET',
                      params: dict = None, address: str = "None",
                      retry_count: int = 3, **kwargs) -> Optional[Dict[str, Any]]:
        """Make request with retries and bypass strategies"""

        self._throttle()
        headers = self._get_headers(address)
        proxies = self._get_proxy()

        for attempt in range(retry_count):
            try:
                # Add exponential backoff delay on retries
                if attempt > 0:
                    delay = (2 ** attempt) + random.uniform(0, 1)
                    print(f"Retry {attempt + 1}/{retry_count} after {delay:.1f}s delay...")
                    time.sleep(delay)
                    # Create fresh scraper on retry
                    self._create_scraper()

                response = self.scraper.request(
                    method,
                    url,
                    headers=headers,
                    params=params,
                    proxies=proxies,
                    timeout=30,
                    **kwargs
                )

                # Store cookies for session persistence
                self.cookies.update(response.cookies.get_dict())

                if response.status_code == 200:
                    try:
                        data = response.json()
                        return data
                    except json.JSONDecodeError:
                        print(f"Invalid JSON response: {response.text[:200]}")
                        continue

                elif response.status_code == 403:
                    print(f"Cloudflare block (403) on attempt {attempt + 1}")
                    # Try different proxy on next attempt
                    if self.use_proxies:
                        proxies = self._get_proxy()
                    continue

                elif response.status_code == 429:
                    print(f"Rate limited (429), waiting longer...")
                    time.sleep(10 + random.uniform(0, 5))
                    continue

                else:
                    print(f"Error {response.status_code}: {response.text[:300]}")

            except cloudscraper.exceptions.CloudflareChallengeError as e:
                print(f"Cloudflare challenge failed: {e}")
                continue

            except Exception as e:
                print(f"Request error: {e}")
                continue

        return None

    # === API Methods (same interface as original client) ===

    def getTokenInfo(self, contractAddress: str) -> Optional[dict]:
        """Gets info on a token."""
        if not contractAddress:
            return None
        url = f"{self.BASE_URL}/api/v1/mutil_window_token_info"
        payload = {"chain": "sol", "addresses": [contractAddress]}
        return self._make_request(url, method='POST', json=payload, address=contractAddress)

    def getNewPairs(self, limit: int = 50) -> Optional[dict]:
        """Get new token pairs."""
        limit = min(limit, 50)
        url = f"{self.BASE_URL}/defi/quotation/v1/pairs/sol/new_pairs"
        params = {
            "limit": limit,
            "orderby": "open_timestamp",
            "direction": "desc",
            "filters[]": "not_honeypot"
        }
        response = self._make_request(url, params=params)
        return response.get('data') if response else None

    def getTokenStats(self, contractAddress: str, chain: str = "sol") -> Optional[dict]:
        """Gets token stats."""
        if not contractAddress:
            return None
        url = f"https://gmgn.ai/vas/api/v1/token_holder_stat/{chain}/{contractAddress}"
        return self._make_request(url, address=contractAddress)

    def getTrendingWallets(self, timeframe: str = "7d", walletTag: str = "smart_degen") -> Optional[dict]:
        """Gets trending wallets."""
        url = f"{self.BASE_URL}/defi/quotation/v1/rank/sol/wallets/{timeframe}"
        params = {
            "tag": walletTag,
            "orderby": f"pnl_{timeframe}",
            "direction": "desc"
        }
        response = self._make_request(url, params=params)
        return response.get('data') if response else None

    def getTrendingTokens(self, timeframe: str = "1h") -> Optional[dict]:
        """Gets trending tokens."""
        valid_timeframes = ["1m", "5m", "1h", "6h", "24h"]
        if timeframe not in valid_timeframes:
            return None

        url = f"{self.BASE_URL}/defi/quotation/v1/rank/sol/swaps/{timeframe}"
        params = {
            "orderby": "swaps",
            "direction": "desc"
        }
        if timeframe == "1m":
            params["limit"] = 20

        response = self._make_request(url, params=params)
        return response.get('data') if response else None

    def getGasFee(self) -> Optional[dict]:
        """Get current gas fee."""
        url = f"{self.BASE_URL}/api/v1/gas_price/sol"
        response = self._make_request(url)
        return response.get('data') if response else None

    def getTokenUsdPrice(self, contractAddress: str) -> Optional[dict]:
        """Get realtime USD price."""
        if not contractAddress:
            return None
        url = f"{self.BASE_URL}/defi/quotation/v1/sol/tokens/realtime_token_price"
        params = {"address": contractAddress}
        response = self._make_request(url, params=params, address=contractAddress)
        return response.get('data') if response else None

    def getTopBuyers(self, contractAddress: str) -> Optional[dict]:
        """Get top buyers."""
        if not contractAddress:
            return None
        url = f"{self.BASE_URL}/defi/quotation/v1/tokens/top_buyers/sol/{contractAddress}"
        response = self._make_request(url, address=contractAddress)
        return response.get('data') if response else None

    def getWalletTokenDistribution(self, walletAddress: str, period: str = "7d") -> Optional[dict]:
        """Get wallet token distribution."""
        if not walletAddress:
            return None
        valid_periods = ["1d", "7d", "30d"]
        if period not in valid_periods:
            period = "7d"
        url = f"{self.BASE_URL}/defi/quotation/v1/rank/sol/wallets/{walletAddress}/unique_token_7d"
        params = {"interval": period}
        response = self._make_request(url, params=params)
        return response.get('data') if response else None

    def getTopTraders(self, contractAddress: str) -> Optional[dict]:
        """Get top traders."""
        if not contractAddress:
            return None
        url = f"{self.BASE_URL}/vas/api/v1/token_traders/sol/{contractAddress}"
        response = self._make_request(url, address=contractAddress)
        return response.get('data', {}).get('list') if response else None

    def getTopHolders(self, contractAddress: str) -> Optional[dict]:
        """Get top holders."""
        if not contractAddress:
            return None
        url = f"{self.BASE_URL}/vas/api/v1/token_holders/sol/{contractAddress}"
        response = self._make_request(url, address=contractAddress)
        return response.get('data') if response else None

    def getSwapRanks(self, chain: str = "sol", timeframe: str = "1m", limit: int = 20) -> Optional[dict]:
        """Get swap ranks."""
        url = f"{self.BASE_URL}/defi/quotation/v1/rank/{chain}/swaps/{timeframe}"
        params = {
            "orderby": "swaps",
            "direction": "desc",
            "limit": limit,
            "filters[]": ["renounced", "frozen", "not_wash_trading"]
        }
        response = self._make_request(url, params=params)
        return response.get('data') if response else None

    def getPumpRanks(self, chain: str = "sol", timeframe: str = "1h", limit: int = 20) -> Optional[dict]:
        """Get pump.fun ranks."""
        url = f"{self.BASE_URL}/defi/quotation/v1/rank/{chain}/pump/{timeframe}"
        params = {
            "limit": limit,
            "orderby": "market_cap",
            "direction": "desc",
            "filters[]": "not_wash_trading"
        }
        response = self._make_request(url, params=params)
        return response.get('data') if response else None

    def getNewTokensSnipe(self, chain: str = "sol", limit: int = 10) -> Optional[dict]:
        """Get new tokens for sniping."""
        url = f"{self.BASE_URL}/defi/quotation/v1/signals/{chain}/snipe_new"
        params = {
            "size": limit,
            "is_show_alert": "false",
            "featured": "false"
        }
        response = self._make_request(url, params=params)
        return response.get('data') if response else None

    def getTokenSecurity(self, token_address: str, chain: str = "sol") -> Optional[dict]:
        """Get token security info."""
        url = f"{self.BASE_URL}/api/v1/mutil_window_token_security_launchpad/{chain}/{token_address}"
        response = self._make_request(url, address=token_address)
        return response.get('data') if response else None


# For backward compatibility - alias
gmgn = GMGNEnhanced


if __name__ == "__main__":
    # Test the client
    print("Testing enhanced GMGN client...")
    client = GMGNEnhanced()

    print("\n1. Testing getTrendingTokens...")
    result = client.getTrendingTokens("1h")
    if result:
        print(f"   SUCCESS: Got {len(result.get('rank', []))} trending tokens")
    else:
        print("   FAILED: Could not fetch trending tokens")

    print("\n2. Testing getGasFee...")
    result = client.getGasFee()
    if result:
        print(f"   SUCCESS: Gas fee = {result}")
    else:
        print("   FAILED: Could not fetch gas fee")
