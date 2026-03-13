---
'@xpert-ai/plugin-volcengine': patch
---

Sync Volcengine model metadata with Dify and fix Ark runtime credential handling.

- Add predefined LLM model YAML files and model ordering for Doubao/DeepSeek/Kimi/GLM entries.
- Align provider credential schema to Ark usage: `ark_api_key` required and `api_endpoint_host` optional with default.
- Fix runtime credential lookup in `getChatModel` to use provider credentials.
- Add safe fallback handling for undefined credentials and default Ark base URL to prevent runtime errors.
