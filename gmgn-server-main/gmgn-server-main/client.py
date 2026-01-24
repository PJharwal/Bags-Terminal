import cloudscraper
import time
import json

class gmgn:
    BASE_URL = "https://gmgn.ai"

    def __init__(self):
        self.scraper = cloudscraper.create_scraper(
            browser={
                'browser': 'chrome',
                'platform': 'windows',
                'mobile': False
            }
        )

    def _get_headers(self, address: str = "None"):
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

    def _make_request(self, url, method='GET', params=None, address="None", **kwargs):
        """Make a request with proper headers"""
        headers = self._get_headers(address)
        
        try:
            response = self.scraper.request(method, url, headers=headers, params=params, timeout=30, **kwargs)
            # print(f"Status Code: {response.status_code}")
            
            if response.status_code == 200:
                data = response.json()
                return data
            else:
                print(f"Error {response.status_code}: {response.text[:500]}")
                return None
                
        except Exception as e:
            print(f"Error: {e}")
            import traceback
            traceback.print_exc()
            return None

    def getTokenInfo(self, contractAddress: str) -> dict:
        """
        Gets info on a token.
        """
        if not contractAddress:
            return "You must input a contract address."
        url = f"{self.BASE_URL}/api/v1/mutil_window_token_info"

        payload ={
            "chain":"sol",
            "addresses":[contractAddress]
        }

        response = self._make_request(url, method='POST', json=payload)
        return response
    
    def getNewPairs(self, limit: int = None) -> dict:
        """
        Limit - Limits how many tokens are in the response.
        """
        if not limit:
            limit = 50
        elif limit > 50:
            return "You cannot have more than check more than 50 pairs."
        
        url = f"{self.BASE_URL}/defi/quotation/v1/pairs/sol/new_pairs"
        params = {
            "limit": limit,
            "orderby": "open_timestamp",
            "direction": "desc",
            "filters[]": "not_honeypot"
        }

        response = self._make_request(url, params=params)
        return response.get('data') if response else None

    def getTokenStats(self, contractAddress: str,chain: str = "sol") -> dict:
        """
        Gets token stats.
        """
        if not contractAddress:
            return "You must input a contract address."

        url = f"https://gmgn.ai/vas/api/v1/token_holder_stat/{chain}/{contractAddress}"

        response = self._make_request(url)
        return response
    
    def getTrendingWallets(self, timeframe: str = None, walletTag: str = None) -> dict:
        """
        Gets a list of trending wallets based on a timeframe and a wallet tag.
        """
        if not timeframe:
            timeframe = "7d"
        if not walletTag:
            walletTag = "smart_degen"
        
        url = f"{self.BASE_URL}/defi/quotation/v1/rank/sol/wallets/{timeframe}"
        params = {
            "tag": walletTag,
            "orderby": f"pnl_{timeframe}",
            "direction": "desc"
        }

        response = self._make_request(url, params=params)
        return response.get('data') if response else None
    
    def getTrendingTokens(self, timeframe: str = None) -> dict:
        """
        Gets a list of trending tokens based on a timeframe.
        """
        timeframes = ["1m", "5m", "1h", "6h", "24h"]
        
        if not timeframe:
            timeframe = "1h"

        if timeframe not in timeframes:
            return "Not a valid timeframe."

        url = f"{self.BASE_URL}/defi/quotation/v1/rank/sol/swaps/{timeframe}"
        params = {
            "orderby": "swaps",
            "direction": "desc"
        }
        if timeframe == "1m":
            params["limit"] = 20
        
        response = self._make_request(url, params=params)
        return response.get('data') if response else None

    def getGasFee(self):
        """
        Get the current gas fee price.
        """
        url = f"{self.BASE_URL}/api/v1/gas_price/sol"
        response = self._make_request(url)
        return response.get('data') if response else None
    
    def getTokenUsdPrice(self, contractAddress: str = None) -> dict:
        """
        Get the realtime USD price of the token.
        """
        if not contractAddress:
            return "You must input a contract address."
        
        url = f"{self.BASE_URL}/defi/quotation/v1/sol/tokens/realtime_token_price"
        params = {"address": contractAddress}

        response = self._make_request(url, params=params)
        return response.get('data') if response else None

    def getTopBuyers(self, contractAddress: str = None) -> dict:
        """
        Get the top buyers of a token.
        """
        if not contractAddress:
            return "You must input a contract address."
        
        url = f"{self.BASE_URL}/defi/quotation/v1/tokens/top_buyers/sol/{contractAddress}"
        response = self._make_request(url)
        return response.get('data') if response else None
    
    def getWalletTokenDistribution(self, walletAddress: str = None, period: str = None) -> dict:
        """
        Get the distribution of ROI on tokens traded by the wallet address
        """
        periods = ["1d", "7d", "30d"]

        if not walletAddress:
            return "You must input a wallet address."
        if not period or period not in periods:
            period = "7d"

        url = f"{self.BASE_URL}/defi/quotation/v1/rank/sol/wallets/{walletAddress}/unique_token_7d"
        params = {"interval": period}

        response = self._make_request(url, params=params)
        return response.get('data') if response else None
    
    def getTopTraders(self, contractAddress: str) -> dict:
        """
        Get the top traders of a token.
        """
        if not contractAddress:
            return "You must input a contract address."
        
        url = f"{self.BASE_URL}/vas/api/v1/token_traders/sol/{contractAddress}"
        response = self._make_request(url)
        return response.get('data', {}).get('list') if response else None
    
    def getTopHolders(self, contractAddress: str) -> dict:
        """
        Get the top holders of a token.
        """
        if not contractAddress:
            return "You must input a contract address."
        
        url = f"{self.BASE_URL}/vas/api/v1/token_holders/sol/{contractAddress}"
        response = self._make_request(url)
        return response.get('data') if response else None

    def getSwapRanks(self, chain="sol", timeframe="1m", limit=20):
        """Get swap ranks (hot tokens)"""
        url = f"{self.BASE_URL}/defi/quotation/v1/rank/{chain}/swaps/{timeframe}"
        params = {
            "orderby": "swaps",
            "direction": "desc",
            "limit": limit,
            "filters[]": ["renounced", "frozen", "not_wash_trading"]
        }
        
        response = self._make_request(url, params=params)
        return response.get('data') if response else None

    def getPumpRanks(self, chain="sol", timeframe="1h", limit=20):
        """Get pump.fun ranks"""
        url = f"{self.BASE_URL}/defi/quotation/v1/rank/{chain}/pump/{timeframe}"
        params = {
            "limit": limit,
            "orderby": "market_cap",
            "direction": "desc",
            "filters[]": "not_wash_trading"
        }
        
        response = self._make_request(url, params=params)
        return response.get('data') if response else None

    def getNewTokensSnipe(self, chain="sol", limit=10):
        """Get new tokens for sniping"""
        url = f"{self.BASE_URL}/defi/quotation/v1/signals/{chain}/snipe_new"
        params = {
            "size": limit,
            "is_show_alert": "false",
            "featured": "false"
        }
        
        response = self._make_request(url, params=params)
        return response.get('data') if response else None

    def getTokenSecurity(self, token_address, chain="sol"):
        """Get token security info"""
        url = f"{self.BASE_URL}/api/v1/mutil_window_token_security_launchpad/{chain}/{token_address}"
        response = self._make_request(url, address=token_address)
        return response.get('data') if response else None