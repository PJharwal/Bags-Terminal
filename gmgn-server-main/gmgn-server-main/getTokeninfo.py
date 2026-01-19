from client import gmgn
import json


def main():
    client = gmgn()
    token_address = "HYSkfbzeY3ENsyysqhGVj4vSNBHobvEaTnL1fyPmpump"
    info = client.getTokenInfo(token_address)
    print(json.dumps(info, indent=2))


if __name__ == "__main__":
    main()