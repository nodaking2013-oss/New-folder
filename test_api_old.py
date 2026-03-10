import google.generativeai as genai

API_KEY = "AIzaSyAxrOGszHWnoYxRRbb1eYCMVR6R9VrwiSo"
try:
    genai.configure(api_key=API_KEY)
    model = genai.GenerativeModel("gemini-1.5-flash")
    response = model.generate_content("Say hello")
    print(response.text)
except Exception as e:
    print(f"ERROR: {e}")
