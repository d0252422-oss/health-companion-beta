# CLIP-only browser runtime build

This custom subset uses unmodified npm `@huggingface/transformers@4.3.2` source plus a small CLIP session adapter. It retains the pinned CLIP model, tokenizer, image processing, q8 WASM inference and zero-shot scoring. It excludes all-model registries, generic pipelines, generation and other model implementations. It does not execute or load the upstream all-model dist from any delivery location.

Reproduce here with Node 24:

```
npm ci --ignore-scripts --no-audit --no-fund
npm run build
```

The exact dependency lock and build manifest record package integrity and every input SHA256. Browser stubs exclude unavailable Node adapters. No source map or external JS import is emitted. Rebuild output and update the model manifest together.

This is a CLIP-only adapter, not the generic pipeline API. Scores remain uncalibrated similarity, not verified identity, portion weight or nutrition. Confirm food and grams before deterministic calculation.

Original GitHub detection remains UNVERIFIED. Content replacement does not approve an exception or disable protection. Old unpublished candidate remains local; do not push its history with this successor.
