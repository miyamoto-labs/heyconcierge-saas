#!/usr/bin/env python3
"""
Miyamoto Studio — Automated Video Production Pipeline
Anime-style cyberpunk storytelling. Dostoyevsky meets Ghost in the Shell.
"""

import base64
import json
import os
import secrets
import subprocess
import sys
import time
import requests
from pathlib import Path

# ─── Configuration ───────────────────────────────────────────────────────────

X402_BASE = "https://stablestudio.io/api/x402"
IMAGE_MODEL = "nano-banana-pro"
VIDEO_MODEL = "wan-2.5"
ELEVENLABS_VOICE_ID = "pfEQtCBfnTOWT1ht9iS7"
ELEVENLABS_MODEL = "eleven_multilingual_v2"
POLL_INTERVAL = 5
POLL_TIMEOUT = 300
LETTERBOX_HEIGHT = 60
MUSIC_VOLUME_DB = -15

# x402 wallet
WALLET_PATH = os.path.expanduser("~/.x402scan-mcp/wallet.json")


# ─── x402 Payment Protocol ──────────────────────────────────────────────────

class X402Client:
    """Handles x402 payment protocol for API calls."""

    def __init__(self):
        with open(WALLET_PATH) as f:
            wallet = json.load(f)
        self.private_key = wallet["privateKey"]
        self.address = wallet["address"]
        # Lazy import
        from eth_account import Account
        self.account = Account.from_key(self.private_key)
        print(f"  Wallet: {self.address}")

    def _decode_payment_required(self, header_value):
        """Decode base64 PAYMENT-REQUIRED header."""
        return json.loads(base64.b64decode(header_value).decode("utf-8"))

    def _sign_eip3009(self, payment_req):
        """Sign EIP-3009 TransferWithAuthorization."""
        from eth_account.messages import encode_typed_data

        accepts = payment_req["accepts"][0]
        chain_id = int(accepts["network"].split(":")[1])
        nonce = "0x" + secrets.token_bytes(32).hex()
        now = int(time.time())
        valid_after = str(now - 600)
        valid_before = str(now + accepts.get("maxTimeoutSeconds", 300))

        name = accepts.get("extra", {}).get("name", "USD Coin")
        version = accepts.get("extra", {}).get("version", "2")

        domain = {
            "name": name,
            "version": version,
            "chainId": chain_id,
            "verifyingContract": accepts["asset"],
        }
        message = {
            "from": self.account.address,
            "to": accepts["payTo"],
            "value": int(accepts["amount"]),
            "validAfter": int(valid_after),
            "validBefore": int(valid_before),
            "nonce": bytes.fromhex(nonce[2:]),
        }
        types = {
            "TransferWithAuthorization": [
                {"name": "from", "type": "address"},
                {"name": "to", "type": "address"},
                {"name": "value", "type": "uint256"},
                {"name": "validAfter", "type": "uint256"},
                {"name": "validBefore", "type": "uint256"},
                {"name": "nonce", "type": "bytes32"},
            ]
        }

        signable = encode_typed_data(
            domain_data=domain,
            message_types=types,
            message_data=message,
        )
        signed = self.account.sign_message(signable)

        authorization = {
            "from": self.account.address,
            "to": accepts["payTo"],
            "value": accepts["amount"],
            "validAfter": valid_after,
            "validBefore": valid_before,
            "nonce": nonce,
        }
        payload = {
            "x402Version": payment_req.get("x402Version", 2),
            "scheme": accepts["scheme"],
            "network": accepts["network"],
            "payload": {
                "authorization": authorization,
                "signature": "0x" + signed.signature.hex() if isinstance(signed.signature, bytes) else signed.signature,
            },
            "resource": payment_req.get("resource", {}),
            "accepted": accepts,
        }
        if "extensions" in payment_req:
            payload["extensions"] = payment_req["extensions"]

        return payload

    def _encode_payment_header(self, payload):
        """Base64 encode payment payload for header."""
        return base64.b64encode(json.dumps(payload).encode("utf-8")).decode("utf-8")

    def fetch(self, url, method="POST", body=None):
        """Make an x402-authenticated request."""
        headers = {"Content-Type": "application/json"}

        # First request (will get 402)
        if method == "POST":
            r = requests.post(url, json=body, headers=headers, timeout=30)
        else:
            r = requests.get(url, headers=headers, timeout=30)

        if r.status_code != 402:
            r.raise_for_status()
            return r.json()

        # Parse payment requirements
        pr_header = r.headers.get("PAYMENT-REQUIRED") or r.headers.get("payment-required")
        if not pr_header:
            raise RuntimeError(f"402 but no PAYMENT-REQUIRED header. Headers: {dict(r.headers)}")

        payment_req = self._decode_payment_required(pr_header)
        x402_version = payment_req.get("x402Version", 1)

        # Sign payment
        payment_payload = self._sign_eip3009(payment_req)
        encoded = self._encode_payment_header(payment_payload)

        # Retry with payment
        if x402_version >= 2:
            headers["PAYMENT-SIGNATURE"] = encoded
        else:
            headers["X-PAYMENT"] = encoded

        if method == "POST":
            r2 = requests.post(url, json=body, headers=headers, timeout=60)
        else:
            r2 = requests.get(url, headers=headers, timeout=60)

        r2.raise_for_status()
        return r2.json()

    def fetch_poll(self, job_id):
        """Poll a job until complete. Jobs endpoint may not need payment."""
        url = f"{X402_BASE}/jobs/{job_id}"
        start = time.time()
        while time.time() - start < POLL_TIMEOUT:
            try:
                r = requests.get(url, timeout=15)
                if r.status_code == 402:
                    # Need payment for polling too
                    data = self.fetch(url, method="GET")
                else:
                    r.raise_for_status()
                    data = r.json()
            except Exception as e:
                print(f"    Poll error: {e}")
                time.sleep(POLL_INTERVAL)
                continue

            status = data.get("status", "").lower()
            if status in ("completed", "complete", "done", "succeeded"):
                print(f"    ✓ Job complete")
                return data
            if status in ("failed", "error"):
                raise RuntimeError(f"Job failed: {data}")
            print(f"    … status: {status}")
            time.sleep(POLL_INTERVAL)
        raise TimeoutError(f"Job {job_id} timed out after {POLL_TIMEOUT}s")


# ─── Pipeline ────────────────────────────────────────────────────────────────

class MiyamotoStudioPipeline:
    def __init__(self, episode_dir: str):
        self.episode_dir = Path(episode_dir)
        self.assets_dir = self.episode_dir / "assets"
        self.images_dir = self.assets_dir / "images"
        self.videos_dir = self.assets_dir / "videos"
        self.audio_dir = self.assets_dir / "audio"
        self.temp_dir = self.assets_dir / "temp"
        self.output_path = self.episode_dir / "final.mp4"

        for d in [self.images_dir, self.videos_dir, self.audio_dir, self.temp_dir]:
            d.mkdir(parents=True, exist_ok=True)

        self.scene_assets = {}
        self.x402 = X402Client()

    # ─── Asset Generation ────────────────────────────────────────────

    def generate_images(self, scenes: list):
        still_scenes = [s for s in scenes if s.get("type", "still") == "still"]
        print(f"\n🎨 Generating {len(still_scenes)} images...")

        for scene in still_scenes:
            sid = scene["id"]
            dest = self.images_dir / f"scene_{sid}.png"

            if dest.exists():
                print(f"  [Scene {sid}] Already exists, skipping")
                self.scene_assets.setdefault(sid, {}).update(visual=str(dest), visual_type="image")
                continue

            print(f"  [Scene {sid}] Generating image...")
            try:
                data = self.x402.fetch(
                    f"{X402_BASE}/{IMAGE_MODEL}/generate",
                    body={
                        "prompt": scene["visual_prompt"],
                        "aspectRatio": "16:9",
                        "imageSize": "2K",
                    }
                )

                job_id = data.get("jobId") or data.get("id")
                if job_id:
                    data = self.x402.fetch_poll(job_id)

                # Extract image
                img_url = (data.get("result", {}).get("url")
                           or data.get("url")
                           or data.get("imageUrl")
                           or data.get("output", {}).get("url"))

                if img_url:
                    r = requests.get(img_url, timeout=120)
                    r.raise_for_status()
                    dest.write_bytes(r.content)
                    print(f"    ✓ Saved")
                else:
                    b64 = (data.get("result", {}).get("base64")
                           or data.get("base64"))
                    if b64:
                        dest.write_bytes(base64.b64decode(b64))
                        print(f"    ✓ Saved (base64)")
                    else:
                        print(f"    ⚠ Could not extract image: {json.dumps(data)[:200]}")
                        continue

                self.scene_assets.setdefault(sid, {}).update(visual=str(dest), visual_type="image")
            except Exception as e:
                print(f"    ✗ Failed: {e}")

    def generate_video_clips(self, scenes: list):
        video_scenes = [s for s in scenes if s.get("type") == "video"]
        if not video_scenes:
            return
        print(f"\n🎬 Generating {len(video_scenes)} video clips...")

        for scene in video_scenes:
            sid = scene["id"]
            dest = self.videos_dir / f"scene_{sid}.mp4"

            if dest.exists():
                print(f"  [Scene {sid}] Already exists, skipping")
                self.scene_assets.setdefault(sid, {}).update(visual=str(dest), visual_type="video")
                continue

            duration = min(scene.get("duration", 4), 5)
            print(f"  [Scene {sid}] Generating video clip ({duration}s)...")
            try:
                data = self.x402.fetch(
                    f"{X402_BASE}/{VIDEO_MODEL}/t2v",
                    body={
                        "prompt": scene["visual_prompt"],
                        "durationSeconds": str(duration),
                        "aspectRatio": "16:9",
                    }
                )

                job_id = data.get("jobId") or data.get("id")
                if job_id:
                    data = self.x402.fetch_poll(job_id)

                vid_url = (data.get("result", {}).get("url")
                           or data.get("url")
                           or data.get("videoUrl")
                           or data.get("output", {}).get("url"))
                if vid_url:
                    r = requests.get(vid_url, timeout=120)
                    r.raise_for_status()
                    dest.write_bytes(r.content)
                    print(f"    ✓ Saved")
                    self.scene_assets.setdefault(sid, {}).update(visual=str(dest), visual_type="video")
                else:
                    print(f"    ⚠ No video URL: {json.dumps(data)[:200]}")
            except Exception as e:
                print(f"    ✗ Failed: {e}")

    def generate_narration(self, scenes: list):
        print(f"\n🎙️ Generating narration for {len(scenes)} scenes...")
        from elevenlabs.client import ElevenLabs
        client = ElevenLabs()

        for scene in scenes:
            sid = scene["id"]
            dest = self.audio_dir / f"narration_{sid}.mp3"

            if dest.exists():
                print(f"  [Scene {sid}] Already exists, skipping")
                self.scene_assets.setdefault(sid, {})["narration"] = str(dest)
                continue

            print(f"  [Scene {sid}] \"{scene['narration'][:60]}\"")
            try:
                audio = client.text_to_speech.convert(
                    text=scene["narration"],
                    voice_id=ELEVENLABS_VOICE_ID,
                    model_id=ELEVENLABS_MODEL,
                )
                with open(dest, "wb") as f:
                    for chunk in audio:
                        f.write(chunk)
                print(f"    ✓ Saved")
                self.scene_assets.setdefault(sid, {})["narration"] = str(dest)
            except Exception as e:
                print(f"    ✗ Failed: {e}")

    def generate_music(self, mood: str, duration_seconds: int):
        dest = self.audio_dir / "background_music.mp3"
        if dest.exists():
            print(f"\n🎵 Background music already exists, skipping")
            return str(dest)

        print(f"\n🎵 Generating background music ({duration_seconds}s)...")
        from elevenlabs.client import ElevenLabs
        client = ElevenLabs()

        try:
            audio = client.text_to_sound_effects.convert(
                text=f"dark ambient cyberpunk background music, {mood}, atmospheric, slow, cinematic, dystopian",
                duration_seconds=min(duration_seconds, 22),
            )
            with open(dest, "wb") as f:
                for chunk in audio:
                    f.write(chunk)
            print(f"  ✓ Saved")
            return str(dest)
        except Exception as e:
            print(f"  ✗ Failed: {e}")
            return None

    # ─── Video Assembly ──────────────────────────────────────────────

    def _get_duration(self, path: str) -> float:
        result = subprocess.run(
            ["ffprobe", "-v", "quiet", "-show_entries", "format=duration",
             "-of", "csv=p=0", path],
            capture_output=True, text=True
        )
        return float(result.stdout.strip()) if result.stdout.strip() else 5.0

    def _make_scene_clip(self, scene: dict) -> str:
        sid = scene["id"]
        assets = self.scene_assets.get(sid, {})
        visual = assets.get("visual")
        visual_type = assets.get("visual_type", "image")
        narration = assets.get("narration")
        duration = scene.get("duration", 5)
        output = str(self.temp_dir / f"scene_{sid}_clip.mp4")

        if narration and os.path.exists(narration):
            duration = max(duration, self._get_duration(narration) + 0.5)

        if not visual or not os.path.exists(visual):
            # Black frame fallback
            cmd = ["ffmpeg", "-y", "-f", "lavfi",
                   "-i", f"color=c=black:s=1920x1080:d={duration}:r=25"]
            if narration and os.path.exists(narration):
                cmd += ["-i", narration, "-c:v", "libx264", "-c:a", "aac", "-shortest"]
            else:
                cmd += ["-c:v", "libx264", "-t", str(duration)]
            cmd += ["-pix_fmt", "yuv420p", output]
            subprocess.run(cmd, capture_output=True)
            return output

        if visual_type == "image":
            # Ken Burns: slow zoom + slight pan
            zoom = (
                f"scale=8000:-1,"
                f"zoompan=z='min(zoom+0.0005,1.1)':"
                f"x='iw/2-(iw/zoom/2)+sin(on/100)*20':"
                f"y='ih/2-(ih/zoom/2)':"
                f"d={int(duration * 25)}:s=1920x1080:fps=25"
            )
            if narration and os.path.exists(narration):
                cmd = ["ffmpeg", "-y",
                       "-loop", "1", "-i", visual,
                       "-i", narration,
                       "-filter_complex", f"[0:v]{zoom}[v]",
                       "-map", "[v]", "-map", "1:a",
                       "-c:v", "libx264", "-c:a", "aac",
                       "-pix_fmt", "yuv420p", "-t", str(duration),
                       output]
            else:
                cmd = ["ffmpeg", "-y",
                       "-loop", "1", "-i", visual,
                       "-vf", zoom,
                       "-c:v", "libx264", "-pix_fmt", "yuv420p",
                       "-t", str(duration), output]
        else:
            # Video clip
            cmd = ["ffmpeg", "-y", "-i", visual]
            if narration and os.path.exists(narration):
                cmd += ["-i", narration,
                        "-c:v", "libx264", "-c:a", "aac", "-pix_fmt", "yuv420p",
                        "-vf", "scale=1920:1080:force_original_aspect_ratio=decrease,pad=1920:1080:(ow-iw)/2:(oh-ih)/2",
                        "-shortest"]
            else:
                cmd += ["-c:v", "libx264", "-pix_fmt", "yuv420p",
                        "-vf", "scale=1920:1080:force_original_aspect_ratio=decrease,pad=1920:1080:(ow-iw)/2:(oh-ih)/2",
                        "-t", str(duration)]
            cmd.append(output)

        print(f"  [Scene {sid}] Assembling clip ({duration:.1f}s)...")
        result = subprocess.run(cmd, capture_output=True, text=True)
        if result.returncode != 0:
            print(f"    ⚠ ffmpeg: {result.stderr[-200:]}")
        return output

    def _make_title_card(self, title: str, duration: float = 4.0) -> str:
        output = str(self.temp_dir / "title_card.mp4")
        safe = title.replace(":", "\\:").replace("'", "\\'")
        cmd = [
            "ffmpeg", "-y", "-f", "lavfi",
            "-i", f"color=c=black:s=1920x1080:d={duration}:r=25",
            "-vf", (
                f"drawtext=text='{safe}':"
                f"fontcolor=white:fontsize=64:x=(w-text_w)/2:y=(h-text_h)/2:font=Helvetica,"
                f"drawtext=text='MIYAMOTO STUDIO':"
                f"fontcolor=0x00CCCC:fontsize=28:x=(w-text_w)/2:y=(h-text_h)/2+80:font=Helvetica"
            ),
            "-c:v", "libx264", "-pix_fmt", "yuv420p", "-t", str(duration), output
        ]
        subprocess.run(cmd, capture_output=True)
        return output

    def _make_credits(self, duration: float = 3.0) -> str:
        output = str(self.temp_dir / "credits.mp4")
        cmd = [
            "ffmpeg", "-y", "-f", "lavfi",
            "-i", f"color=c=black:s=1920x1080:d={duration}:r=25",
            "-vf", (
                "drawtext=text='MIYAMOTO STUDIO':"
                "fontcolor=0x00CCCC:fontsize=48:x=(w-text_w)/2:y=(h-text_h)/2-30:font=Helvetica,"
                "drawtext=text='Created by an autonomous mind':"
                "fontcolor=0x888888:fontsize=24:x=(w-text_w)/2:y=(h-text_h)/2+40:font=Helvetica"
            ),
            "-c:v", "libx264", "-pix_fmt", "yuv420p", "-t", str(duration), output
        ]
        subprocess.run(cmd, capture_output=True)
        return output

    def assemble_video(self, script: dict, music_path: str = None):
        print(f"\n🎬 Assembling final video...")
        scenes = script["scenes"]
        clips = []

        title_clip = self._make_title_card(script["title"])
        if os.path.exists(title_clip):
            clips.append(title_clip)

        for scene in scenes:
            clip = self._make_scene_clip(scene)
            if os.path.exists(clip):
                clips.append(clip)

        credits_clip = self._make_credits()
        if os.path.exists(credits_clip):
            clips.append(credits_clip)

        if not clips:
            print("  ✗ No clips!")
            return

        # Concatenate
        concat_list = self.temp_dir / "concat.txt"
        with open(concat_list, "w") as f:
            for clip in clips:
                f.write(f"file '{clip}'\n")

        concat_raw = str(self.temp_dir / "concat_raw.mp4")
        subprocess.run([
            "ffmpeg", "-y", "-f", "concat", "-safe", "0",
            "-i", str(concat_list),
            "-c:v", "libx264", "-c:a", "aac", "-pix_fmt", "yuv420p",
            concat_raw
        ], capture_output=True)

        # Add letterbox + music
        vf = (f"drawbox=x=0:y=0:w=iw:h={LETTERBOX_HEIGHT}:color=black:t=fill,"
              f"drawbox=x=0:y=ih-{LETTERBOX_HEIGHT}:w=iw:h={LETTERBOX_HEIGHT}:color=black:t=fill")

        if music_path and os.path.exists(music_path):
            cmd = [
                "ffmpeg", "-y", "-i", concat_raw, "-i", music_path,
                "-filter_complex",
                f"[0:v]{vf}[v];"
                f"[1:a]aloop=loop=-1:size=2e+09,volume={MUSIC_VOLUME_DB}dB[music];"
                f"[0:a][music]amix=inputs=2:duration=first:dropout_transition=2[a]",
                "-map", "[v]", "-map", "[a]",
                "-c:v", "libx264", "-c:a", "aac", "-pix_fmt", "yuv420p",
                "-shortest", str(self.output_path)
            ]
        else:
            cmd = [
                "ffmpeg", "-y", "-i", concat_raw,
                "-vf", vf,
                "-c:v", "libx264", "-c:a", "aac", "-pix_fmt", "yuv420p",
                str(self.output_path)
            ]

        result = subprocess.run(cmd, capture_output=True, text=True)
        if result.returncode != 0:
            print(f"  ⚠ Assembly: {result.stderr[-300:]}")

        if self.output_path.exists():
            mb = self.output_path.stat().st_size / (1024 * 1024)
            print(f"\n✅ Final video: {self.output_path} ({mb:.1f} MB)")
        else:
            print(f"\n✗ Failed to create final video")

    # ─── Main ────────────────────────────────────────────────────────

    def run(self, script: dict):
        title = script.get("title", "Untitled")
        scenes = script.get("scenes", [])
        print(f"{'='*60}")
        print(f"  MIYAMOTO STUDIO — Production Pipeline")
        print(f"  {title} | {len(scenes)} scenes")
        print(f"{'='*60}")

        self.generate_images(scenes)
        self.generate_video_clips(scenes)
        self.generate_narration(scenes)

        total_dur = sum(s.get("duration", 5) for s in scenes) + 10
        music_path = self.generate_music("mysterious dark cyberpunk", min(total_dur, 60))

        self.assemble_video(script, music_path)

        print(f"\n{'='*60}")
        print(f"  Production complete!")
        print(f"{'='*60}")


def main():
    script_path = Path(sys.argv[1]) if len(sys.argv) > 1 else Path(__file__).parent / "test_episode.json"
    if not script_path.exists():
        print(f"Script not found: {script_path}")
        sys.exit(1)

    with open(script_path) as f:
        script = json.load(f)

    slug = script["title"].lower().replace(" ", "_").replace(":", "")
    episode_dir = Path(__file__).parent / "episodes" / slug
    episode_dir.mkdir(parents=True, exist_ok=True)

    with open(episode_dir / "script.json", "w") as f:
        json.dump(script, f, indent=2)

    pipeline = MiyamotoStudioPipeline(str(episode_dir))
    pipeline.run(script)


if __name__ == "__main__":
    main()
