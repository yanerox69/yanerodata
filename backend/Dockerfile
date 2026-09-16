FROM python:3.11-slim

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY app ./app

ENV LLM_PROVIDER=vllm \
    LLM_BASE_URL=http://vllm:8000/v1 \
    LLM_MODEL=meta-llama/Llama-3.1-8B-Instruct

EXPOSE 8080
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8080"]
