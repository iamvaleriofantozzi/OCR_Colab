"""
MLX-VLM Direct Inference Microservice
Runs in the mlx venv. Loads model once, serves inference via HTTP.
"""
import json
import sys
from pathlib import Path
from http.server import HTTPServer, BaseHTTPRequestHandler

from mlx_vlm import load, generate
from mlx_vlm.prompt_utils import apply_chat_template

# Load model once at startup
MODEL_ID = "mlx-community/GLM-OCR-bf16"
print(f"[mlx-vlm-direct] Loading model {MODEL_ID}...", file=sys.stderr)
MODEL, PROCESSOR = load(MODEL_ID)
print("[mlx-vlm-direct] Model loaded.", file=sys.stderr)


class Handler(BaseHTTPRequestHandler):
    def log_message(self, format, *args):
        # Suppress default logging
        pass

    def do_POST(self):
        if self.path != "/infer":
            self.send_error(404)
            return

        content_length = int(self.headers.get("Content-Length", 0))
        body = self.rfile.read(content_length)
        try:
            data = json.loads(body)
        except json.JSONDecodeError:
            self.send_error(400, "Invalid JSON")
            return

        file_path = data.get("file_path")
        prompt = data.get("prompt", "Text Recognition:")
        max_tokens = data.get("max_tokens", 4096)

        if not file_path or not Path(file_path).exists():
            self.send_error(400, "Missing or invalid file_path")
            return

        try:
            print(f"[mlx-vlm-direct] Processing: {file_path}", file=sys.stderr)
            print(f"[mlx-vlm-direct] Raw prompt: {prompt}", file=sys.stderr)

            # Apply chat template — REQUIRED for GLM-OCR
            formatted_prompt = apply_chat_template(
                PROCESSOR, MODEL.config, prompt, num_images=1
            )
            print(f"[mlx-vlm-direct] Formatted prompt: {formatted_prompt[:200]}", file=sys.stderr)

            result = generate(
                MODEL,
                PROCESSOR,
                formatted_prompt,
                image=[file_path],
                max_tokens=max_tokens,
                verbose=False,
            )
            print(f"[mlx-vlm-direct] Result type: {type(result)}", file=sys.stderr)
            text = result.text if hasattr(result, "text") else str(result)
            print(f"[mlx-vlm-direct] Text ({len(text)} chars): {text[:300]}", file=sys.stderr)
            response = {
                "text": text,
                "prompt_tokens": getattr(result, "prompt_tokens", 0),
                "generation_tokens": getattr(result, "generation_tokens", 0),
            }
        except Exception as e:
            import traceback
            traceback.print_exc()
            self.send_error(500, str(e))
            return

        self.send_response(200)
        self.send_header("Content-Type", "application/json")
        self.end_headers()
        self.wfile.write(json.dumps(response).encode())


if __name__ == "__main__":
    port = int(sys.argv[1]) if len(sys.argv) > 1 else 8081
    server = HTTPServer(("0.0.0.0", port), Handler)
    print(f"[mlx-vlm-direct] Serving on http://0.0.0.0:{port}", file=sys.stderr)
    server.serve_forever()
