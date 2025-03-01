import requests
import json

def fetch_binance_spot_tickers():
    url = "https://api.binance.com/api/v3/exchangeInfo"
    response = requests.get(url)
    
    if response.status_code == 200:
        data = response.json()
        
        # Extract only spot market tickers
        spot_tickers = [
            symbol['symbol'] for symbol in data['symbols'] 
            if symbol['isSpotTradingAllowed'] and symbol['status'] == "TRADING"
        ]
        
        # Save as JSON for frontend use
        with open("tickers.json", "w") as file:
            json.dump(spot_tickers, file, indent=4)
        
        print(f"✅ Successfully saved {len(spot_tickers)} spot tickers to 'tickers.json'")
        return spot_tickers
    else:
        print(f"❌ Failed to fetch tickers. HTTP {response.status_code}")
        return []

# Run script
fetch_binance_spot_tickers()
