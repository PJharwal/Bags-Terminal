from fastapi import FastAPI, Query, Path, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from typing import Optional, List
import os

# Try curl_cffi client first (best Cloudflare bypass), then enhanced, then original
try:
    from client_curl import GMGNCurl as gmgn
    print("Using curl_cffi GMGN client (TLS fingerprint impersonation)")
except ImportError:
    try:
        from client_enhanced import GMGNEnhanced as gmgn
        print("Using enhanced GMGN client")
    except ImportError:
        from client import gmgn
        print("Using original GMGN client")

app = FastAPI(title="GMGN Proxy Server", description="API for GMGN.ai data with Cloudflare bypass")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Create client
client = gmgn()

@app.get("/")
def read_root():
    return {"message": "GMGN Proxy Server is running"}

@app.get("/token/{address}/info")
def get_token_info(address: str = Path(..., description="Token contract address")):
    result = client.getTokenInfo(address)
    if not result:
        raise HTTPException(status_code=404, detail="Token info not found")
    return result

@app.get("/pairs/new")
def get_new_pairs(limit: int = Query(50, le=50, description="Limit number of pairs")):
    result = client.getNewPairs(limit)
    if result is None:
        raise HTTPException(status_code=500, detail="Failed to fetch new pairs")
    return result

@app.get("/wallets/trending")
def get_trending_wallets(
    timeframe: str = Query("7d", description="Timeframe (e.g., 7d)"),
    tag: str = Query("smart_degen", description="Wallet tag")
):
    result = client.getTrendingWallets(timeframe, tag)
    if result is None:
        raise HTTPException(status_code=500, detail="Failed to fetch trending wallets")
    return result

@app.get("/tokens/trending")
def get_trending_tokens(timeframe: str = Query("1h", description="Timeframe (1m, 5m, 1h, 6h, 24h)")):
    result = client.getTrendingTokens(timeframe)
    if result == "Not a valid timeframe.":
        raise HTTPException(status_code=400, detail="Invalid timeframe")
    if result is None:
        raise HTTPException(status_code=500, detail="Failed to fetch trending tokens")
    return result

@app.get("/gas")
def get_gas_fee():
    result = client.getGasFee()
    if result is None:
        raise HTTPException(status_code=500, detail="Failed to fetch gas fee")
    return result

@app.get("/token/{address}/price")
def get_token_price(address: str = Path(..., description="Token contract address")):
    result = client.getTokenUsdPrice(address)
    if result is None:
        raise HTTPException(status_code=404, detail="Token price not found")
    return result

@app.get("/token/{address}/buyers")
def get_top_buyers(address: str = Path(..., description="Token contract address")):
    result = client.getTopBuyers(address)
    if result is None:
        raise HTTPException(status_code=404, detail="Top buyers not found")
    return result

@app.get("/wallet/{address}/distribution")
def get_wallet_distribution(
    address: str = Path(..., description="Wallet address"),
    period: str = Query("7d", description="Period (1d, 7d, 30d)")
):
    result = client.getWalletTokenDistribution(address, period)
    if result is None:
        raise HTTPException(status_code=404, detail="Wallet distribution not found")
    return result

@app.get("/token/{address}/traders")
def get_top_traders(address: str = Path(..., description="Token contract address")):
    result = client.getTopTraders(address)
    if result is None:
        raise HTTPException(status_code=404, detail="Top traders not found")
    return result

@app.get("/token/{address}/holders")
def get_top_holders(address: str = Path(..., description="Token contract address")):
    result = client.getTopHolders(address)
    if result is None:
        raise HTTPException(status_code=404, detail="Top holders not found")
    return result

@app.get("/ranks/swaps")
def get_swap_ranks(
    chain: str = Query("sol", description="Chain"),
    timeframe: str = Query("1m", description="Timeframe"),
    limit: int = Query(20, description="Limit")
):
    result = client.getSwapRanks(chain, timeframe, limit)
    if result is None:
        raise HTTPException(status_code=500, detail="Failed to fetch swap ranks")
    return result

@app.get("/ranks/pump")
def get_pump_ranks(
    chain: str = Query("sol", description="Chain"),
    timeframe: str = Query("1h", description="Timeframe"),
    limit: int = Query(20, description="Limit")
):
    result = client.getPumpRanks(chain, timeframe, limit)
    if result is None:
        raise HTTPException(status_code=500, detail="Failed to fetch pump ranks")
    return result

@app.get("/tokens/snipe")
def get_new_tokens_snipe(
    chain: str = Query("sol", description="Chain"),
    limit: int = Query(10, description="Limit")
):
    result = client.getNewTokensSnipe(chain, limit)
    if result is None:
        raise HTTPException(status_code=500, detail="Failed to fetch new tokens for snipe")
    return result

@app.get("/token/{address}/security")
def get_token_security(
    address: str = Path(..., description="Token contract address"),
    chain: str = Query("sol", description="Chain")
):
    result = client.getTokenSecurity(address, chain)
    if result is None:
        raise HTTPException(status_code=404, detail="Token security info not found")
    return result

@app.get("/token/{address}/stats")
def get_token_stats(
    address: str = Path(..., description="Token contract address"),
    chain: str = Query("sol", description="Chain")
):
    result = client.getTokenStats(address, chain)
    if result is None:
        raise HTTPException(status_code=404, detail="Token stats not found")
    return result

@app.get("/token/{address}/enriched")
def get_enriched_token_info(
    address: str = Path(..., description="Token contract address"),
    chain: str = Query("sol", description="Chain")
):
    """
    Get enriched token information combining getTokenInfo and getTokenStats data.
    Returns a combined response with both token info and statistics.
    """
    token_info = client.getTokenInfo(address)
    token_stats = client.getTokenStats(address, chain)
    
    if token_info is None and token_stats is None:
        raise HTTPException(status_code=404, detail="Token not found")
    
    enriched_data = {
        "address": address,
        "chain": chain,
        "info": token_info,
        "stats": token_stats
    }
    
    return enriched_data

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
