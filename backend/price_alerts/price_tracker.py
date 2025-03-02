# def send_to_fastapi():
#     session = requests.Session()
#     retry_strategy = Retry(total=3, backoff_factor=1, status_forcelist=[500, 502, 503, 504])
#     adapter = HTTPAdapter(max_retries=retry_strategy)
#     session.mount("http://", adapter)
#     while True:
#         trade_data = fetch_trade_data()
#         try:
#             response = session.post(FASTAPI_URL, json=trade_data, timeout=5)
#             print(f"Sent to FastAPI: {trade_data}, Status: {response.status_code}")
#         except requests.RequestException as e:
#             print(f"Error sending to FastAPI: {e}")
#         time.sleep(5)