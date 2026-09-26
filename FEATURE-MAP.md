# EDGE//AI feature map

Live app: https://aeiouvcode.github.io/edge-ai/. Start at the vault overlay: create/unlock a passphrase vault for encrypted persistence, or tap **Session only - save nothing** for a session-only run. Bottom navigation is Probe, Models, Work, Lab, Truth. This map describes the current UI, not a promise that every model fits every device.

| Feature | Route / trigger | What to expect |
| --- | --- | --- |
| Device probe | Probe tab, runs on entry | WebGPU, WebNN, WASM, memory and storage readings; fit guidance. |
| Offline readiness | Probe > Recheck readiness | Shell, model cache, connection and storage status. |
| Model shelf | Models tab > Load on a model card | Downloads public weights, then opens the matching Work panel. WebGPU when available; WASM fallback. Loading another chat model unloads the first. |
| Cache | Models > Model cache > Delete all cached models > Yes | Clears Transformers.js cache only; model files download again. Keeps the app shell and vault history. An already-loaded model stays in memory until unload. |
| Streaming local chat | Models > Chat > Load > Work > write > Send or Enter | Runs in a dedicated worker. Stop terminates the worker and unloads the model to keep the UI responsive; partial text stays visible. Reload the model to continue. Prompt lab controls live above the composer. |
| New chat | Work > chat model loaded > New chat > Yes | Clears the current model conversation. Does not remove the downloaded model. In vault mode, clears that model's saved history. |
| Encrypted chat history | Create/unlock vault, then chat | Stores recent chat by model. Session mode does not persist it. Lock and 10-minute idle timeout reload the page, clearing decrypted in-memory state. |
| Speech transcription | Models > Speech to text > Load > Work > Record > Stop + transcribe | Microphone permission, then local decoding/transcription. |
| Translation | Models > Translation > Load > Work > Translate | English to chosen language. |
| Semantic similarity | Models > MiniLM-L6 > Load > Work > Compare meaning | Two sentence inputs, local score. |
| Image classification | Models > MobileNetV4 > Load > Work > Choose image | Local top-five labels. |
| Sentiment | Models > DistilBERT > Load > Work > Read the mood | Local positive/negative estimate. |
| Speech synthesis | Models > Kokoro > Load > Work > Speak | Experimental synthesized audio. |
| Benchmarks | Lab > select chat models > Run selected | Timing and tokens/s, optional 3-run thermal loop; export JSON or clear history. |
| Hugging Face custom repo | Lab > repo path > Validate package > Load on WebGPU | Preflight checks metadata/packaging; unavailable without WebGPU. |
| Gemini BYO key | Lab > Gemini > Connect > choose model > write > Preview > Send | Explicit opt-in cloud call; preview shows what leaves. Remember key only in encrypted vault. |
| Loopback NIM | Lab > Advanced: Local NIM > Connect + load models > preview > Send to NIM | Only localhost/127.0.0.1 endpoints. |
| Cloud cloak | Lab > Cloud cloak > enter terms and test prompt > Preview local cloak | Local replacement preview. Cloud providers still require explicit connect, preview and send. |
| Local tool bridge | Lab > Local tool bridge; same-origin client postMessage or `?bridge=openmuse&nonce=...` | A loaded local chat model serves same-origin requests; bridge outputs stay on device. |
| Device truth table | Truth tab | Device limitations and security notes. |

## Surface quality and release checklist

- App head: real page title, search description and local SVG favicon (`index.html`, `favicon.svg`).
- Unknown URL: GitHub Pages serves `404.html` with a direct path back to `/edge-ai/`. The offline shell gives unknown navigations the cached 404 rather than the app shell.
- Empty states: Work before loading a model; Models cache before downloads; chat before its first message; Lab before benchmarks, custom repo validation, provider connection or preview. Confirm no stale success copy survives a reset.
- Success states: model ready with timing/device, chat response with measured tokens/s, benchmark result, custom repo preflight, cloud reply only after a fresh preview.
- Error states: local model/load error, failed cloud connection, request timeout and stop/interruption show human copy. Never display raw service error JSON, stack traces or secrets. In session mode history and keys are not persisted.
- QA at 390px: take frames of Probe, Models, Work (empty/running/stopped), Lab (disconnected and an authorized preview), Truth and the 404. Check horizontal overflow, focus/disabled states, console and network, CSP/SRI, missing route status, offline fallback, and real model load/generate/Stop. Distinguish local evidence from deployed evidence.
