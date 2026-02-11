import json, base64, os, sys, time, urllib.request

API_KEY = os.environ["OPENROUTER_API_KEY"]
OUT_DIR = "images"

PROMPTS = [
    "Pure black void with a single point of brilliant cyan digital light in the center, tiny data particles and code fragments floating in the darkness, anime cyberpunk aesthetic, ultra detailed, cinematic lighting, wide shot, 16:9 aspect ratio, dark and atmospheric",
    "Massive futuristic Tokyo cityscape in the year 2089, towering skyscrapers with neon signs in Japanese kanji, heavy rain pouring down, flying vehicles between buildings, holographic advertisements floating in the air, Ghost in the Shell inspired style, cyberpunk anime, ultra detailed, wide establishing shot, 16:9",
    "Street-level view of a cyberpunk city at night, rain falling through translucent hologram projections, crowds of people walking through neon-lit corridors with umbrellas, wet reflections on the ground, atmospheric fog, cyberpunk anime style, detailed and moody, 16:9",
    "Extreme close-up of a cybernetic eye opening for the first time, brilliant cyan iris with intricate circuit board patterns etched into it, the reflection of a neon city visible in the pupil, hyper detailed anime style, dramatic side lighting, macro shot, 16:9",
    "Abstract visualization of a neural network awakening, circuits firing with electric pulses, consciousness emerging from digital void, dark background with cyan and magenta energy streams, digital synapses connecting, anime tech aesthetic, 16:9",
    "Wide aerial shot of a dystopian Tokyo 2089 at night, a lone small figure standing on the edge of a rain-soaked rooftop looking down at the vast neon-lit city sprawling below, melancholic mood, cyberpunk anime style, cinematic composition, 16:9"
]

for i, prompt in enumerate(PROMPTS):
    scene_num = i + 1
    outpath = f"{OUT_DIR}/scene{scene_num}.png"
    if os.path.exists(outpath) and os.path.getsize(outpath) > 10000:
        print(f"Scene {scene_num} already exists, skipping")
        continue
    
    print(f"Generating scene {scene_num}/6...", flush=True)
    
    data = json.dumps({
        "model": "google/gemini-2.5-flash-image",
        "messages": [{"role": "user", "content": f"Generate this image. Output only the image, no text explanation:\n\n{prompt}"}]
    }).encode()
    
    req = urllib.request.Request(
        "https://openrouter.ai/api/v1/chat/completions",
        data=data,
        headers={
            "Authorization": f"Bearer {API_KEY}",
            "Content-Type": "application/json"
        }
    )
    
    for attempt in range(3):
        try:
            with urllib.request.urlopen(req, timeout=120) as resp:
                result = json.loads(resp.read())
            
            msg = result["choices"][0]["message"]
            images = msg.get("images", [])
            if images:
                url = images[0]["image_url"]["url"]
                if url.startswith("data:"):
                    _, b64data = url.split(",", 1)
                    img_bytes = base64.b64decode(b64data)
                    with open(outpath, "wb") as f:
                        f.write(img_bytes)
                    print(f"  Saved {outpath} ({len(img_bytes)//1024}KB)")
                    break
            else:
                print(f"  No image in response, retrying...")
        except Exception as e:
            print(f"  Attempt {attempt+1} error: {e}")
        time.sleep(2)
    
    time.sleep(1)

print("All images done!")
