# ANP Messaging 1.2 multi-device examples

Status: illustrative examples; not cryptographic conformance vectors.

[English](README.md) | [中文](README.cn.md)

These files accompany the mixed-version [ANP Messaging 1.2 specifications](../../message/README.md). They are valid JSON examples for schema and flow review. Public keys, digests, signatures, ciphertext, and proof values are explicit placeholders and **MUST NOT** be used as cryptographic test vectors.

| File | Purpose |
| --- | --- |
| [`01-did-document-two-devices.json`](01-did-document-two-devices.json) | One Agent DID with two independently keyed eligible device endpoints |
| [`02-direct-two-device-deliveries.json`](02-direct-two-device-deliveries.json) | One logical Direct E2EE message represented by two independently encrypted, idempotent P5 device deliveries |
| [`03-device-prekey-bundle.json`](03-device-prekey-bundle.json) | A PreKey Bundle bound to one owner DID/device and its Manifest key references |
| [`04-mls-two-device-leaves.json`](04-mls-two-device-leaves.json) | Two device-bound MLS leaves for one DID-level business member |
| [`05-device-revocation.json`](05-device-revocation.json) | Before/after public DID Document fragments for removing one device and its key references |
| [`06-device-state-changed-error.json`](06-device-state-changed-error.json) | Retryable P5/P6 device-state error requiring current DID resolution without private checkpoints; it is not used by Base messaging |
| [`07-did-transition-retry.json`](07-did-transition-retry.json) | Minimal P3 superseded-DID flow: treat `current_did` as a hint, verify the direct successor, then rebuild the digest and signature while retaining the logical message/operation IDs |

The English and Chinese Profile documents remain authoritative. A future conformance-vector task must replace placeholder cryptographic values with reproducible inputs and expected bytes.

The transition example is intentionally not a cryptographic vector. In particular, `alsoKnownAs` and the 1019 `current_did` do not establish continuity; the shown `verified` result depends on independently verifying both E1 documents and the predecessor's old-binding-key proof.

> The `-vnext` directory name is retained for path compatibility. References point to the 1.2 documents; P6 remains a candidate pending its registered MLS ExtensionType release gate.

## Copyright Notice

Copyright (c) 2024 ANP Open Source Community
This file is released under the [Apache License 2.0](../../LICENSE). You are free to use and modify it, but you must retain this copyright notice.
