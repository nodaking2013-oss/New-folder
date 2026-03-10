import requests

url = "http://127.0.0.1:5001/api/ask"
payload = {"feature": "chat", "input": "hello"}
headers = {"Content-Type": "application/json"}

try:
    response = requests.post(url, json=payload)
    print(response.status_code)
    print(response.json())
except Exception as e:
    print(f"FAILED: {e}")
