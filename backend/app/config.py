import os
from dataclasses import dataclass


@dataclass(frozen=True)
class Settings:
    # LLM_PROVIDER: "vllm" talks to any OpenAI-compatible /v1/chat/completions
    # endpoint (this is how vLLM serves models on AMD Instinct GPUs via ROCm).
    # "mock" runs a deterministic offline agent so the app is demoable without
    # any GPU attached.
    llm_provider: str = os.environ.get("LLM_PROVIDER", "mock")
    llm_base_url: str = os.environ.get("LLM_BASE_URL", "http://localhost:8000/v1")
    llm_model: str = os.environ.get("LLM_MODEL", "meta-llama/Llama-3.1-8B-Instruct")
    llm_api_key: str = os.environ.get("LLM_API_KEY", "not-needed")

    tavily_api_key: str = os.environ.get("TAVILY_API_KEY", "")

    max_agent_steps: int = int(os.environ.get("MAX_AGENT_STEPS", "6"))
    request_timeout_s: float = float(os.environ.get("LLM_TIMEOUT_S", "60"))

    cors_origins: str = os.environ.get("CORS_ORIGINS", "*")


settings = Settings()
