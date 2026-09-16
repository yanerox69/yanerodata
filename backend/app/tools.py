"""Tools the agent can call: web search, page fetch, calculator.

web_search uses Tavily when TAVILY_API_KEY is set, otherwise falls back to
DuckDuckGo's HTML endpoint (no API key required) so the agent works out of
the box.
"""
import ast
import operator
import re

import httpx

from .config import settings

_USER_AGENT = "ScoutAgent/1.0 (+https://github.com)"


def web_search(query: str, max_results: int = 5) -> str:
    if settings.tavily_api_key:
        return _tavily_search(query, max_results)
    return _duckduckgo_search(query, max_results)


def _tavily_search(query: str, max_results: int) -> str:
    try:
        resp = httpx.post(
            "https://api.tavily.com/search",
            json={"api_key": settings.tavily_api_key, "query": query, "max_results": max_results},
            timeout=15,
        )
        resp.raise_for_status()
        data = resp.json()
        lines = [f"- {r['title']}: {r['url']}" for r in data.get("results", [])]
        return "\n".join(lines) or "No results found."
    except httpx.HTTPError as exc:
        return f"Search failed: {exc}"


def _duckduckgo_search(query: str, max_results: int) -> str:
    try:
        resp = httpx.get(
            "https://html.duckduckgo.com/html/",
            params={"q": query},
            headers={"User-Agent": _USER_AGENT},
            timeout=15,
            follow_redirects=True,
        )
        resp.raise_for_status()
    except httpx.HTTPError as exc:
        return f"Search failed: {exc}"

    links = re.findall(r'result__a[^>]*href="([^"]+)"[^>]*>(.*?)</a>', resp.text, re.S)
    lines = []
    for url, title in links[:max_results]:
        clean_title = re.sub(r"<[^>]+>", "", title).strip()
        lines.append(f"- {clean_title}: {url}")
    return "\n".join(lines) or "No results found."


def fetch_url(url: str, max_chars: int = 2000) -> str:
    try:
        resp = httpx.get(url, headers={"User-Agent": _USER_AGENT}, timeout=15, follow_redirects=True)
        resp.raise_for_status()
    except httpx.HTTPError as exc:
        return f"Fetch failed: {exc}"

    text = re.sub(r"<script.*?</script>|<style.*?</style>", "", resp.text, flags=re.S | re.I)
    text = re.sub(r"<[^>]+>", " ", text)
    text = re.sub(r"\s+", " ", text).strip()
    return text[:max_chars]


_ALLOWED_OPS = {
    ast.Add: operator.add,
    ast.Sub: operator.sub,
    ast.Mult: operator.mul,
    ast.Div: operator.truediv,
    ast.Pow: operator.pow,
    ast.USub: operator.neg,
}


def calculator(expression: str) -> str:
    try:
        tree = ast.parse(expression, mode="eval")
        return str(_eval_node(tree.body))
    except Exception as exc:  # noqa: BLE001 - surfaced to the agent, not raised
        return f"Invalid expression: {exc}"


def _eval_node(node):
    if isinstance(node, ast.Constant) and isinstance(node.value, (int, float)):
        return node.value
    if isinstance(node, ast.BinOp) and type(node.op) in _ALLOWED_OPS:
        return _ALLOWED_OPS[type(node.op)](_eval_node(node.left), _eval_node(node.right))
    if isinstance(node, ast.UnaryOp) and type(node.op) in _ALLOWED_OPS:
        return _ALLOWED_OPS[type(node.op)](_eval_node(node.operand))
    raise ValueError("unsupported expression")


TOOLS = {
    "web_search": web_search,
    "fetch_url": fetch_url,
    "calculator": calculator,
}
