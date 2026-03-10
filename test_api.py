from google import genai
import sys

API_KEY = "AIzaSyAxrOGszHWnoYxRRbb1eYCMVR6R9VrwiSo"
try:
    client = genai.Client(api_key=API_KEY)
    response = client.models.generate_content(
        model="gemini-1.5-flash",
        contents="Say hello"
    )
    print(response.text)
except Exception as e:
    print(f"ERROR: {e}")
