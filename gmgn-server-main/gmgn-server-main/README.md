# GMGN Proxy Server

A robust FastAPI-based proxy server that interfaces with the GMGN.ai API to provide real-time cryptocurrency market data. This project is designed to fetch token information, trending metrics, and trading signals while handling Cloudflare protection using `cloudscraper`.

## Features

- **Token Analytics**: detailed information including price, security audits, top holders, top traders, and top buyers.
- **Market Trends**: Access trending tokens and wallets across different timeframes.
- **New Listings**: Monitor new pairs and sniping opportunities on Solana.
- **Rankings**: Get swap ranks and Pump.fun market cap rankings.
- **Network Stats**: Real-time gas fee tracking.
- **Cloudflare Bypass**: Integrated `cloudscraper` to ensure reliable API access.
- **Interactive Documentation**: Auto-generated Swagger UI for easy API testing.

## Prerequisites

- Python 3.8 or higher
- pip (Python package installer)

## Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd proxy-server
   ```

2. **Create and activate a virtual environment**
   ```bash
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```

3. **Install dependencies**
   ```bash
   pip install -r requirements.txt
   ```

## Usage

### Running the Server

You can start the server using Python directly or via Uvicorn:

**Using Python:**
```bash
python server.py
```

**Using Uvicorn (Recommended for development):**
```bash
uvicorn server:app --reload --host 0.0.0.0 --port 8000
```

The server will start at `http://0.0.0.0:8000`.

### API Documentation

Once the server is running, you can access the interactive API documentation at:

- **Swagger UI**: [http://localhost:8000/docs](http://localhost:8000/docs)
- **ReDoc**: [http://localhost:8000/redoc](http://localhost:8000/redoc)

## API Endpoints

### General
- `GET /`: Health check endpoint.
- `GET /gas`: Get current gas fees.

### Tokens
- `GET /token/{address}/info`: Get detailed token information.
- `GET /token/{address}/price`: Get real-time USD price.
- `GET /token/{address}/security`: Get security/audit info.
- `GET /token/{address}/holders`: Get top token holders.
- `GET /token/{address}/traders`: Get top traders.
- `GET /token/{address}/buyers`: Get top buyers.

### Market Data & Trends
- `GET /tokens/trending`: Get trending tokens (Timeframes: 1m, 5m, 1h, 6h, 24h).
- `GET /wallets/trending`: Get trending wallets (Timeframes: 1d, 7d, 30d).
- `GET /pairs/new`: Get newly listed pairs.
- `GET /tokens/snipe`: Get new tokens for sniping.

### Rankings
- `GET /ranks/swaps`: Get swap rankings.
- `GET /ranks/pump`: Get Pump.fun rankings.

### Wallet Analysis
- `GET /wallet/{address}/distribution`: Get token distribution for a specific wallet.

## Project Structure

- `server.py`: Main FastAPI application entry point.
- `client.py`: Core logic for interacting with GMGN.ai API using `cloudscraper`.
- `requirements.txt`: Project dependencies.
- `Dockerfile`: Configuration for containerizing the application.

## Docker Support

You can also run this application using Docker:

1. **Build the image**
   ```bash
   docker build -t gmgn-proxy .
   ```

2. **Run the container**
   ```bash
   docker run -p 8000:8000 gmgn-proxy
   ```
