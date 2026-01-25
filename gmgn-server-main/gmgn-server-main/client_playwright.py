"""
Playwright-based GMGN Client for Cloudflare bypass.
Uses a real browser to handle JavaScript challenges.
"""
import json
import time
import asyncio
from typing import Optional, Dict, Any
from playwright.async_api import async_playwright, Browser, BrowserContext, Page


class GMGNPlaywright:
    BASE_URL = "https://gmgn.ai"

    def __init__(self):
        self.browser: Optional[Browser] = None
        self.context: Optional[BrowserContext] = None
        self.page: Optional[Page] = None
        self._initialized = False

    async def _init_browser(self):
        """Initialize the browser if not already done"""
        if self._initialized:
            return

        playwright = await async_playwright().start()
        self.browser = await playwright.chromium.launch(
            headless=True,
            args=[
                '--no-sandbox',
                '--disable-setuid-sandbox',
                '--disable-dev-shm-usage',
                '--disable-accelerated-2d-canvas',
                '--disable-gpu',
                '--window-size=1920,1080',
            ]
        )

        self.context = await self.browser.new_context(
            viewport={'width': 1920, 'height': 1080},
            user_agent='Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36',
            locale='en-US',
        )

        self.page = await self.context.new_page()

        # Visit the main site first to get cookies and pass any challenges
        print("Initializing browser and solving Cloudflare challenge...")
        await self.page.goto(self.BASE_URL, wait_until='networkidle', timeout=60000)
        await asyncio.sleep(5)  # Wait for any JS challenges

        self._initialized = True
        print("Browser initialized successfully")

    async def _make_request(self, url: str, method: str = 'GET',
                            params: dict = None, json_data: dict = None,
                            address: str = "None") -> Optional[Dict[str, Any]]:
        """Make API request using the browser's session"""
        await self._init_browser()

        # Build URL with params
        if params:
            param_str = '&'.join(f"{k}={v}" for k, v in params.items())
            url = f"{url}?{param_str}"

        try:
            if method == 'GET':
                response = await self.page.evaluate(f'''
                    async () => {{
                        const response = await fetch("{url}", {{
                            method: 'GET',
                            headers: {{
                                'Accept': 'application/json',
                                'Referer': 'https://gmgn.ai/'
                            }}
                        }});
                        return await response.json();
                    }}
                ''')
            else:
                response = await self.page.evaluate(f'''
                    async () => {{
                        const response = await fetch("{url}", {{
                            method: '{method}',
                            headers: {{
                                'Accept': 'application/json',
                                'Content-Type': 'application/json',
                                'Referer': 'https://gmgn.ai/'
                            }},
                            body: JSON.stringify({json.dumps(json_data or {})})
                        }});
                        return await response.json();
                    }}
                ''')

            return response

        except Exception as e:
            print(f"Request error: {e}")
            return None

    async def close(self):
        """Close the browser"""
        if self.browser:
            await self.browser.close()
            self._initialized = False

    # Synchronous wrappers for compatibility
    def _run_async(self, coro):
        """Run async function in sync context"""
        try:
            loop = asyncio.get_event_loop()
        except RuntimeError:
            loop = asyncio.new_event_loop()
            asyncio.set_event_loop(loop)
        return loop.run_until_complete(coro)

    def getTrendingTokens(self, timeframe: str = "1h") -> Optional[dict]:
        """Gets trending tokens."""
        valid_timeframes = ["1m", "5m", "1h", "6h", "24h"]
        if timeframe not in valid_timeframes:
            return None

        url = f"{self.BASE_URL}/defi/quotation/v1/rank/sol/swaps/{timeframe}"
        params = {"orderby": "swaps", "direction": "desc"}
        if timeframe == "1m":
            params["limit"] = 20

        response = self._run_async(self._make_request(url, params=params))
        return response.get('data') if response else None

    def getSwapRanks(self, chain: str = "sol", timeframe: str = "1m", limit: int = 20) -> Optional[dict]:
        """Get swap ranks."""
        url = f"{self.BASE_URL}/defi/quotation/v1/rank/{chain}/swaps/{timeframe}"
        params = {
            "orderby": "swaps",
            "direction": "desc",
            "limit": str(limit),
        }
        response = self._run_async(self._make_request(url, params=params))
        return response.get('data') if response else None

    def getTokenInfo(self, contractAddress: str) -> Optional[dict]:
        """Gets info on a token."""
        if not contractAddress:
            return None
        url = f"{self.BASE_URL}/api/v1/mutil_window_token_info"
        payload = {"chain": "sol", "addresses": [contractAddress]}
        return self._run_async(self._make_request(url, method='POST', json_data=payload))

    def getNewPairs(self, limit: int = 50) -> Optional[dict]:
        """Get new pairs."""
        limit = min(limit, 50)
        url = f"{self.BASE_URL}/defi/quotation/v1/pairs/sol/new_pairs"
        params = {
            "limit": str(limit),
            "orderby": "open_timestamp",
            "direction": "desc",
        }
        response = self._run_async(self._make_request(url, params=params))
        return response.get('data') if response else None

    def getGasFee(self) -> Optional[dict]:
        """Get gas fee."""
        url = f"{self.BASE_URL}/api/v1/gas_price/sol"
        response = self._run_async(self._make_request(url))
        return response.get('data') if response else None

    def getTopHolders(self, contractAddress: str) -> Optional[dict]:
        """Get top holders."""
        if not contractAddress:
            return None
        url = f"{self.BASE_URL}/vas/api/v1/token_holders/sol/{contractAddress}"
        response = self._run_async(self._make_request(url, address=contractAddress))
        return response.get('data') if response else None

    def getTopTraders(self, contractAddress: str) -> Optional[dict]:
        """Get top traders."""
        if not contractAddress:
            return None
        url = f"{self.BASE_URL}/vas/api/v1/token_traders/sol/{contractAddress}"
        response = self._run_async(self._make_request(url, address=contractAddress))
        return response.get('data', {}).get('list') if response else None

    def getTokenStats(self, contractAddress: str, chain: str = "sol") -> Optional[dict]:
        """Get token stats."""
        if not contractAddress:
            return None
        url = f"https://gmgn.ai/vas/api/v1/token_holder_stat/{chain}/{contractAddress}"
        return self._run_async(self._make_request(url))

    def getTrendingWallets(self, timeframe: str = "7d", walletTag: str = "smart_degen") -> Optional[dict]:
        """Get trending wallets."""
        url = f"{self.BASE_URL}/defi/quotation/v1/rank/sol/wallets/{timeframe}"
        params = {
            "tag": walletTag,
            "orderby": f"pnl_{timeframe}",
            "direction": "desc"
        }
        response = self._run_async(self._make_request(url, params=params))
        return response.get('data') if response else None

    def getTokenUsdPrice(self, contractAddress: str) -> Optional[dict]:
        """Get token USD price."""
        if not contractAddress:
            return None
        url = f"{self.BASE_URL}/defi/quotation/v1/sol/tokens/realtime_token_price"
        params = {"address": contractAddress}
        response = self._run_async(self._make_request(url, params=params))
        return response.get('data') if response else None

    def getTopBuyers(self, contractAddress: str) -> Optional[dict]:
        """Get top buyers."""
        if not contractAddress:
            return None
        url = f"{self.BASE_URL}/defi/quotation/v1/tokens/top_buyers/sol/{contractAddress}"
        response = self._run_async(self._make_request(url))
        return response.get('data') if response else None

    def getWalletTokenDistribution(self, walletAddress: str, period: str = "7d") -> Optional[dict]:
        """Get wallet token distribution."""
        if not walletAddress:
            return None
        url = f"{self.BASE_URL}/defi/quotation/v1/rank/sol/wallets/{walletAddress}/unique_token_7d"
        params = {"interval": period}
        response = self._run_async(self._make_request(url, params=params))
        return response.get('data') if response else None

    def getPumpRanks(self, chain: str = "sol", timeframe: str = "1h", limit: int = 20) -> Optional[dict]:
        """Get pump ranks."""
        url = f"{self.BASE_URL}/defi/quotation/v1/rank/{chain}/pump/{timeframe}"
        params = {
            "limit": str(limit),
            "orderby": "market_cap",
            "direction": "desc",
        }
        response = self._run_async(self._make_request(url, params=params))
        return response.get('data') if response else None

    def getNewTokensSnipe(self, chain: str = "sol", limit: int = 10) -> Optional[dict]:
        """Get new tokens for sniping."""
        url = f"{self.BASE_URL}/defi/quotation/v1/signals/{chain}/snipe_new"
        params = {
            "size": str(limit),
            "is_show_alert": "false",
            "featured": "false"
        }
        response = self._run_async(self._make_request(url, params=params))
        return response.get('data') if response else None

    def getTokenSecurity(self, token_address: str, chain: str = "sol") -> Optional[dict]:
        """Get token security."""
        url = f"{self.BASE_URL}/api/v1/mutil_window_token_security_launchpad/{chain}/{token_address}"
        response = self._run_async(self._make_request(url))
        return response.get('data') if response else None


# Alias for backward compatibility
gmgn = GMGNPlaywright


if __name__ == "__main__":
    import sys

    print("Testing Playwright-based GMGN client...")
    client = GMGNPlaywright()

    print("\n1. Testing getTrendingTokens...")
    result = client.getTrendingTokens("1h")
    if result:
        rank = result.get('rank', [])
        print(f"   SUCCESS: Got {len(rank)} trending tokens")
        if rank:
            print(f"   Top token: {rank[0].get('symbol', 'N/A')}")
    else:
        print("   FAILED: Could not fetch trending tokens")

    print("\n2. Testing getGasFee...")
    result = client.getGasFee()
    if result:
        print(f"   SUCCESS: Gas fee data received")
    else:
        print("   FAILED: Could not fetch gas fee")

    # Close browser
    client._run_async(client.close())
    print("\nTest complete.")
