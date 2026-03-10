from google import genai

API_KEY = "AIzaSyAxrOGszHWnoYxRRbb1eYCMVR6R9VrwiSo"
try:
    client = genai.Client(api_key=API_KEY)
    for model in client.models.list():
        print(f"- {model.name}")
except Exception as e:
    print(f"ERROR: {e}")
