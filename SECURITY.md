# Security

EDGE//AI is a static page. There is no server of ours, no account, and no telemetry.

## Where the page can connect

The page policy (`connect-src`) allows exactly these destinations:

| Destination | When | What is sent |
| --- | --- | --- |
| this site (`aeiouvcode.github.io`) | always | requests for the app shell and the vendored runtime |
| `cdn.jsdelivr.net` (one pinned file, as a script) | on load | nothing; the hash-locked engine is downloaded |
| `huggingface.co`, `*.huggingface.co`, `*.hf.co` | when you load a model or validate a repo | public model and metadata downloads; nothing you type |
| `generativelanguage.googleapis.com` | only after you connect a Gemini key and press Send | the previewed, cloaked prompt and your key |
| `localhost` / `127.0.0.1` | only after you connect a self-hosted NIM | the previewed, cloaked prompt |

Anything else is blocked by the browser. There is no analytics, error reporting or tracking script.

## Code the page runs

Scripts may come only from this site, two inline blocks pinned by SHA-256 hash, and one exact
CDN file: Transformers.js 4.3.0 at
`https://cdn.jsdelivr.net/npm/@huggingface/transformers@4.3.0/dist/transformers.min.js`, locked with
Subresource Integrity (`sha384-qgXJ7dcf8bYoYbel57c9rhOd7qRdLSraaF9XvjXERQll0Pf5e/HV8CDccvn3xgTp`,
import map plus modulepreload). If jsDelivr served different bytes, the browser would refuse to run them.
Browsers too old for import-map integrity still get the CSP path lock but not the hash check.

It is not vendored here because GitHub secret scanning flags a false positive inside the bundle,
and we do not bypass push protection. ONNX Runtime's WebAssembly is vendored, byte-identical to the
npm release (checked against the registry's published `sha512` tarball integrity):

| File | SHA-256 |
| --- | --- |
| jsDelivr `transformers.min.js` (not vendored) | `1475fd440e9932ab206682ee42cb18f6097403e9ee77ea62084c592d0f83597d` |
| `vendor/ort-1.31.0-dev.20260914-8d85527a0/ort-wasm-simd-threaded.asyncify.mjs` | `0966b6105cd936744498aa60df7a22cbd47af3374dbc64a9ab561c08a71e3611` |
| `vendor/ort-1.31.0-dev.20260914-8d85527a0/ort-wasm-simd-threaded.asyncify.wasm` | `49871f5a4409519797e127440868a6d1923339d9185907f301a5b2a1d90af082` |
| `vendor/ort-1.31.0-dev.20260914-8d85527a0/ort-wasm-simd-threaded.mjs` | `c57ca56328877353a575e51bbca6f18450027d6c9bf2307a2cb2c41363b4de9f` |
| `vendor/ort-1.31.0-dev.20260914-8d85527a0/ort-wasm-simd-threaded.wasm` | `06ba057753da3847e4c24f02d91ab133455b0817c69a44993a9a53a2146df9e3` |

## Keys and history

- Cloud keys live in memory. They are saved only if you tick Remember while an encrypted vault is unlocked.
- The vault uses PBKDF2-SHA-256 (250,000 rounds, random 128-bit salt) and AES-256-GCM with a fresh 96-bit nonce per write.
- Lock reloads the page, so keys and decrypted history leave memory.
- Model output and remote text are written with `textContent` or escaped before display.

## Known limits

- GitHub Pages cannot send security headers. The policy is a `<meta>` tag, so `frame-ancestors`
  is enforced in script instead: the app refuses to run inside a cross-origin frame.
- The app shares the `aeiouvcode.github.io` origin with other projects by the same author. Those
  pages could read the encrypted vault blob (not its contents) and message the local tool bridge.
- Model weights are public third-party files. A malicious browser extension can observe any page.

Report a problem by opening an issue on this repository.
