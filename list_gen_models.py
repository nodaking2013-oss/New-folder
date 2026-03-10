import google.generativeai as genai

API_KEY = "AIzaSyAxrOGszHWnoYxRRbb1eYCMVR6R9VrwiSo"
genai.configure(api_key=API_KEY)

print("Listing models:")
try:
    for m in genai.list_models():
        if 'generateContent' in m.supported_generation_methods:
            print(m.name)
except Exception as e:
    print(f"FAILED: {e}")
