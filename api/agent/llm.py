# Cell 7: Model routing + LiteLLM wrapper with structured output
from __future__ import annotations

import json
import math
import os
from typing import Callable, Type, TypeVar

from pydantic import BaseModel

from agent.prompts import system_prompt, spotlight  # type: ignore
from agent.schemas import DecomposerState  # type: ignore

try:
    import litellm
except Exception:
    litellm = None  # type: ignore

MOCK_MODE = os.environ.get("NUDG_DECOMPOSER_MOCK", "").lower() in {"1", "true", "yes"} or not bool(os.environ.get("OPENAI_API_KEY"))

MODEL_ROUTING = {
    "intake_clarify": {"model": "gpt-4o-mini"},
    "multi_path_plan": {"model": "gpt-4o"},
    "path_select": {"model": "gpt-4o-mini"},
    "decompose_deliverables": {"model": "gpt-4o"},
    "generate_microtasks": {"model": "gpt-4o"},
    "scout_resources": {"model": "gpt-4o-mini"},
    "architect_schedule": {"model": "gpt-4o"},
    "design_verification": {"model": "gpt-4o-mini"},
    "critic": {"model": "gpt-4o"},
    "refine": {"model": "gpt-4o"},
    "judge": {"model": "gpt-4o"},
}

TOKEN_PRICE_PER_MILLION = {
    "gpt-4o": {"input": 2.50, "output": 10.00},
    "gpt-4o-mini": {"input": 0.15, "output": 0.60},
}

T = TypeVar("T", bound=BaseModel)


def estimate_tokens(text: str) -> int:
    return max(1, math.ceil(len(text) / 4))


def estimate_cost_usd(model: str, prompt_tokens: int, completion_tokens: int) -> float:
    prices = TOKEN_PRICE_PER_MILLION.get(model, {"input": 0.50, "output": 2.00})
    return (prompt_tokens * prices["input"] + completion_tokens * prices["output"]) / 1_000_000


def structured_response_format(model_cls: type) -> dict:
    return {
        "type": "json_schema",
        "json_schema": {
            "name": model_cls.__name__,
            "strict": True,
            "schema": model_cls.model_json_schema(),
        },
    }


def call_structured_llm(
    node_name: str,
    payload: dict,
    output_model: Type[T],
    state: DecomposerState,
    fallback_fn: Callable[[], T],
) -> T:
    route = MODEL_ROUTING[node_name]
    model = route["model"]
    token = state["spotlight_token"]
    user_payload = dict(payload)
    if "raw_goal" in user_payload:
        user_payload["raw_goal"] = spotlight(str(user_payload["raw_goal"]), token)
    messages = [
        {"role": "system", "content": system_prompt(node_name, token)},
        {"role": "user", "content": json.dumps(user_payload, default=str)},
    ]
    prompt_tokens = estimate_tokens(json.dumps(messages, default=str))
    if MOCK_MODE or litellm is None:
        result = fallback_fn()
        completion_tokens = estimate_tokens(result.model_dump_json())
    else:
        try:
            response = litellm.completion(
                model=model,
                messages=messages,
                response_format=structured_response_format(output_model),
                temperature=0.2,
            )
            content = response.choices[0].message.content
            result = output_model.model_validate_json(content)
            usage = getattr(response, "usage", None)
            if usage:
                prompt_tokens = int(getattr(usage, "prompt_tokens", prompt_tokens) or prompt_tokens)
                completion_tokens = int(getattr(usage, "completion_tokens", estimate_tokens(content)) or estimate_tokens(content))
            else:
                completion_tokens = estimate_tokens(content)
        except Exception as exc:
            state.setdefault("uncertainty_log", []).append(
                f"{node_name}: live LLM failed; used deterministic fallback ({exc.__class__.__name__})."
            )
            result = fallback_fn()
            completion_tokens = estimate_tokens(result.model_dump_json())
    state.setdefault("token_usage", {})[node_name] = {
        "model": model,
        "prompt_tokens": prompt_tokens,
        "completion_tokens": completion_tokens,
        "estimated_cost_usd": round(estimate_cost_usd(model, prompt_tokens, completion_tokens), 6),
    }
    return result
