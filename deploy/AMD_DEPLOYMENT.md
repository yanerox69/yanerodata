# Deploying DocuSwarm on AMD Developer Cloud

DocuSwarm's only AMD-specific piece is the model server: vLLM speaks the
same OpenAI-compatible API whether it's running on a laptop CPU or an
MI300X, so the backend and frontend never change — only `LLM_BASE_URL`
does.

## 1. Provision a GPU instance

Sign up / log in at the AMD Developer Program and launch a Developer Cloud
instance with ROCm preinstalled (an MI300X or MI250 instance works).
Confirm the driver with:

```bash
rocm-smi
```

## 2. Serve a model with vLLM (ROCm build)

```bash
docker build -t docuswarm-vllm -f deploy/Dockerfile.vllm-rocm \
  --build-arg MODEL=meta-llama/Llama-3.1-8B-Instruct .

docker run -d --name vllm \
  --device=/dev/kfd --device=/dev/dri --group-add video \
  --security-opt seccomp=unconfined \
  -p 8000:8000 docuswarm-vllm
```

Swap `MODEL` for any model vLLM supports (Llama, Qwen, Mixtral, ...) —
bigger models simply need more VRAM, which is where MI300X's 192GB
shines for serving larger models than commodity GPUs can hold.

## 3. Point the backend at it

```bash
cd backend
cp .env.example .env
# edit .env:
#   LLM_PROVIDER=vllm
#   LLM_BASE_URL=http://<instance-ip>:8000/v1
#   LLM_MODEL=meta-llama/Llama-3.1-8B-Instruct

pip install -r requirements.txt
uvicorn app.main:app --host 0.0.0.0 --port 8080
```

## 4. Serve the frontend

```bash
npm install
npm run build
# serve dist/ with any static host, or:
npm run preview -- --host 0.0.0.0
```

## 5. Or run the whole stack at once

```bash
docker compose -f deploy/docker-compose.yml up --build
```

## Tuning for throughput (the hackathon's "high-performance" ask)

- `--gpu-memory-utilization` and `--max-num-seqs` in
  `deploy/Dockerfile.vllm-rocm` control how many requests vLLM batches
  concurrently — raise `max-num-seqs` to match the swarm's concurrency
  setting in the UI (1x/2x/4x/8x) for best throughput.
- The DocuSwarm dashboard's "Tokens/seg" stat is read from vLLM's real
  `usage` field once `LLM_PROVIDER=vllm` is set, so it reflects actual
  GPU throughput, not the mock estimate used in offline dev mode.
