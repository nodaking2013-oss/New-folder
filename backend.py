from fastapi import FastAPI, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from pydantic import BaseModel
from google import genai
import uvicorn
import asyncio
import os
import shutil
import replicate
from moviepy import VideoFileClip, vfx
from dotenv import load_dotenv

load_dotenv()

app = FastAPI()

# Enable CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ---- Static Files Handling ----
@app.get("/")
async def serve_index():
    return FileResponse("index.html")

@app.get("/{filename}")
async def serve_static(filename: str):
    allowed_files = ["style.css", "script.js"]
    if filename in allowed_files:
        return FileResponse(filename)
    return {"error": "File not found"}

# ⚠️ GEMINI API KEY ⚠️
API_KEY = os.environ.get("GEMINI_API_KEY", "")

# Configure AI
if API_KEY:
    client = genai.Client(api_key=API_KEY)
else:
    client = None

# ⚠️ REPLICATE API KEY FOR VIDEO ⚠️
REPLICATE_API_TOKEN = os.environ.get("REPLICATE_API_TOKEN", "")
if REPLICATE_API_TOKEN:
    os.environ["REPLICATE_API_TOKEN"] = REPLICATE_API_TOKEN

class AskCommand(BaseModel):
    feature: str = 'chat'
    input: str = ''
    language: str = 'Arabic'

@app.post('/api/ask')
async def ask_ai(cmd: AskCommand):
    if not client:
        return {"error": "AI not configured. Add your API KEY in backend.py!"}
    
    feature = cmd.feature
    user_input = cmd.input
    lang = cmd.language
    
    if not user_input:
        return {"error": "Please provide some input text."}

    # Prompt customization
    if feature == 'code':
        prompt = f"You are a Senior Programmer. Write code to solve this:\n{user_input}"
    elif feature == 'summarize':
        prompt = f"You are an expert summarizer. Summarize this:\n{user_input}"
    elif feature == 'book_summary':
        prompt = f"Summarize the book '{user_input}' with key psychology takeaways."
    elif feature == 'translate_quote':
        prompt = f"Translate this quote beautifully to {lang}. Only return the text:\n{user_input}"
    elif feature == 'translate':
        prompt = f"Translate to Arabic (if EN) or EN (if AR):\n{user_input}"
    elif feature == 'writer':
        prompt = f"Write a creative piece about:\n{user_input}"
    else:
        prompt = f"You are ZonaAI, a smart creative assistant. The user says: {user_input}"
    
    try:
        # Generate response using thread to avoid blocking
        response = await asyncio.to_thread(
            client.models.generate_content,
            model='gemini-1.5-flash',
            contents=prompt,
        )
        return {"result": response.text}
    except Exception as e:
        return {"error": str(e)}

@app.post("/api/generate_video")
async def generate_video(file: UploadFile = File(...)):
    if not REPLICATE_API_TOKEN:
        return {"error": "Replicate API Key is missing. Add it to .env file to generate real videos!"}

    try:
        # Save image locally to send to Replicate
        temp_img_path = f"temp_{file.filename}"
        with open(temp_img_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)

        # We'll use Stability AI's Stable Video Diffusion on Replicate
        # Note: In production you might want to use a lighter model or a different one based on preference.
        # This takes an image and turns it into a short video.
        print(f"Starting Video Generation for {temp_img_path}...")
        
        output = await asyncio.to_thread(
            replicate.run,
            "stability-ai/stable-video-diffusion:3f0457e4619daac51203dedb472816fd4af51f3149fa7a9e0b5ffcf1b8172438",
            input={
                "input_image": open(temp_img_path, "rb"),
                "sizing_strategy": "maintain_aspect_ratio",
                "motion_bucket_id": 127,
                "frames_per_second": 6
            }
        )
        
        # Output is usually a URI to the video file (mp4)
        video_url = output if isinstance(output, str) else output[0]
        
        # Cleanup temp file
        os.remove(temp_img_path)

        return {
            "status": "success", 
            "video_url": video_url
        }
    except Exception as e:
        print(f"Video Error: {e}")
        return {"error": str(e)}

@app.post("/api/edit_video")
async def edit_video(file: UploadFile = File(...), action: str = 'cinematic'):
    try:
        # Save temp input
        temp_input = f"input_{file.filename}"
        temp_output = f"output_{file.filename}"
        
        with open(temp_input, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
            
        clip = VideoFileClip(temp_input)
        
        # Apply AI Montage Logic
        if action == 'cinematic':
            # Boost color and contrast simulation
            new_clip = clip.with_effects([vfx.Colorx(1.2), vfx.GammaCorr(0.8)])
        elif action == 'grayscale':
            new_clip = clip.with_effects([vfx.BlackAndWhite()])
        elif action == 'fast':
            new_clip = clip.with_effects([vfx.MultiplySpeed(2.0)])
        elif action == 'slow':
            new_clip = clip.with_effects([vfx.MultiplySpeed(0.5)])
        elif action == 'square':
            # Crop to square for Instagram/TikTok
            w, h = clip.size
            size = min(w, h)
            new_clip = clip.cropped(width=size, height=size, x_center=w/2, y_center=h/2)
        else:
            new_clip = clip

        # Export result
        new_clip.write_videofile(temp_output, codec="libx264", audio_codec="aac")
        
        # In a real app we would serve this file, for now we simulate the link
        # or we could return the file as a response if small.
        # For simplicity in this demo, let's represent it.
        clip.close()
        new_clip.close()
        
        # We need to serve this file. Let's add it to allowed_files in serve_static
        # Actually better to just return the filename to the frontend and serve it.
        return {"status": "success", "video_url": f"/api/files/{temp_output}"}
        
    except Exception as e:
        print(f"Edit Error: {e}")
        return {"error": str(e)}

@app.get("/api/files/{filename}")
async def get_processed_file(filename: str):
    if os.path.exists(filename):
        return FileResponse(filename)
    return {"error": "File not found"}

if __name__ == '__main__':
    print("="*60)
    print("ZonaAI FastAPI (High Performance) Backend Server Is Running!")
    print("Server URL: http://127.0.0.1:8000")
    print("IMPORTANT: Make sure to add your API_KEY in backend.py! ")
    print("="*60)
    
    # Auto-open the browser after the server has 1.5 seconds to start
    import threading
    import webbrowser
    threading.Timer(1.5, lambda: webbrowser.open("http://127.0.0.1:8000")).start()

    uvicorn.run(app, host="127.0.0.1", port=8000)
