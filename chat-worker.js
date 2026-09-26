const ENGINE_URL = 'https://cdn.jsdelivr.net/npm/@huggingface/transformers@4.3.0/dist/transformers.min.js';
const ENGINE_SHA384 = 'qgXJ7dcf8bYoYbel57c9rhOd7qRdLSraaF9XvjXERQll0Pf5e/HV8CDccvn3xgTp';
const ORT_DIR = new URL('./vendor/ort-1.31.0-dev.20260914-8d85527a0/', self.location.href).href;
let runtime, pipe, model, device, current;
const send = (id, kind, data = {}) => self.postMessage({id, kind, ...data});
const errorText = e => String(e?.message || e || 'Unknown engine error').slice(0, 500);

async function loadRuntime() {
  if (runtime) return runtime;
  const response = await fetch(ENGINE_URL, {mode: 'cors', credentials: 'omit', cache: 'force-cache'});
  if (!response.ok) throw new Error('Engine download failed (' + response.status + ')');
  const bytes = await response.arrayBuffer();
  const hash = btoa(String.fromCharCode(...new Uint8Array(await crypto.subtle.digest('SHA-384', bytes))));
  if (hash !== ENGINE_SHA384) throw new Error('Engine integrity check failed');
  const url = URL.createObjectURL(new Blob([bytes], {type: 'text/javascript'}));
  try { runtime = await import(url); }
  finally { URL.revokeObjectURL(url); }
  const {env} = runtime;
  const w = env.backends?.onnx?.wasm;
  if (w?.wasmPaths && typeof w.wasmPaths === 'object') {
    for (const ext of ['mjs', 'wasm']) w.wasmPaths[ext] = String(w.wasmPaths[ext]).replace(/^https:\/\/cdn\.jsdelivr\.net\/npm\/onnxruntime-web@[^/]+\/dist\//, ORT_DIR);
  } else if (w) w.wasmPaths = ORT_DIR;
  env.allowLocalModels = false;
  env.useBrowserCache = true;
  return runtime;
}

async function unload() {
  if (pipe?.dispose) await pipe.dispose();
  pipe = null; model = null; device = null;
}

async function load(id, data) {
  if (pipe) await unload();
  const {pipeline} = await loadRuntime();
  const progress_callback = p => send(id, 'progress', {progress: {
    status: p.status, file: String(p.file || '').slice(0, 180), loaded: p.loaded, total: p.total
  }});
  const choices = data.device === 'webgpu' ? [
    ['webgpu', data.dtype || 'q4f16'],
    ...(data.custom ? [] : [['webgpu', 'q4'], ['wasm', 'q4']])
  ] : [['wasm', 'q4']];
  let last;
  for (const [dev, dtype] of choices) {
    try {
      pipe = await pipeline('text-generation', data.repo, {device: dev, dtype, progress_callback});
      device = dev; model = data.repo;
      send(id, 'loaded', {device: dev, model});
      return;
    } catch (e) { last = e; }
  }
  throw last;
}

async function generate(id, data) {
  if (!pipe) throw new Error('Load a chat model first');
  const {TextStreamer} = await loadRuntime();
  let text = '', tokens = 0;
  const start = performance.now();
  current = id;
  const streamer = new TextStreamer(pipe.tokenizer, {
    skip_prompt: true, skip_special_tokens: true,
    callback_function: chunk => {
      text += chunk; tokens++;
      send(id, 'chunk', {text, tokens});
    }
  });
  try {
    const options = data.options || {};
    await pipe(data.messages, {
      max_new_tokens: options.max_new_tokens,
      do_sample: options.temperature > 0,
      temperature: Math.max(options.temperature, .01),
      top_p: options.top_p,
      repetition_penalty: 1.15,
      streamer
    });
    const seconds = (performance.now() - start) / 1000;
    send(id, 'result', {text, metrics: {
      tokens, seconds: Number(seconds.toFixed(2)),
      tokens_per_second: Number((tokens / Math.max(seconds, .001)).toFixed(2)),
      engine: device, model
    }});
  } finally { current = null; }
}

self.onmessage = async ({data}) => {
  const {id, action} = data;
  if (current) { send(id, 'error', {error: 'Engine is busy'}); return; }
  try {
    if (action === 'load') await load(id, data);
    else if (action === 'generate') await generate(id, data);
    else if (action === 'unload') { await unload(); send(id, 'unloaded'); }
  } catch (e) { send(id, 'error', {error: errorText(e)}); }
};
