# ANP 1.2: ANP-02 and Mixed-Method Vectors

Status: offline fixtures and protocol scenario designs; no SDK or product conformance claim.

[中文](README.cn.md)

These artifacts support [ANP-02](../../02-anp-did-authentication-protocol-specification.md), its WBA/Web bindings, and the method-independent [Messaging 1.2 suite](../../message/README.md). All identities use reserved example domains. Keys are deterministically derived public test material, never operational credentials. No identity is registered and no request is sent to a backend.

| Artifact | Contents and evidence boundary |
|---|---|
| [identities.json](identities.json) | Ten public DID fixtures: ordinary API, two device-capable Agents, service, and group identities for each method. Active E1 Documents have real proof bytes; native Web Documents have no WBA Document proof. HTTPS resolution is a controlled precondition, not a test result. |
| [byte-vectors.json](byte-vectors.json) | Exact request components, payload/JCS bytes, signature bases, Ed25519 signatures, E1/Object Proof hashes and signatures, and P5 ChaCha20-Poly1305 AAD/ciphertexts, with explicit tamper mutations. |
| [scenario-vectors.json](scenario-vectors.json) | Phase A/B setup/action/expected-outcome inputs for authentication, WNS, message/E2EE flows, extensions, continuity and admission. Every scenario is explicitly not executed against an SDK or product. |
| [manifest.json](manifest.json) | File hashes, generation/check commands and counts. Counts describe artifacts, not successful SDK tests. |
| [Verification responsibilities](../../message/02-identity-and-discovery.md#method-validation) | DID method validation and the identity, key-purpose, and device-eligibility rules of the message Profiles. |

## 1. Reproduce and check

From the protocol worktree root, using Node.js 22 or later:

```sh
node scripts/generate-anp02-vectors.mjs
node scripts/check-anp02-vectors.mjs
```

The first command compares deterministic regeneration with the stored files without writing. The second checks hashes, fixture references, selected primitive known answers, signature/digest/Object Proof/AEAD bytes, tamper rejection, and scenario-catalog coverage. It reports SDK and product scenario execution counts as zero.

To intentionally regenerate these owned fixtures after a reviewed vector change:

```sh
node scripts/generate-anp02-vectors.mjs --write
```

The fixed clock is `2026-09-07T08:00:00Z`; tests must use the scenario clock, not wall time. The key derivation label begins `ANP02-PUBLIC-TEST-ONLY:`. No generated key may be reused outside tests. P5 message keys/nonces are controlled inputs from a pre-established Session: those vectors verify AAD/AEAD bytes, not X3DH, Ratchet advancement, or device admission. P6 binding proofs are real signatures, but they are not a complete encoded MLS KeyPackage or an executed MLS group.

## 2. Authentication and transport boundaries

`HTTP-*` vectors use actual HTTP method/target/content components. `JSON-*` vectors use a declared HTTP JSON-metadata binding whose digest covers JCS payload bytes, excluding `auth`. `ORIGIN-*` vectors use the unchanged P1 Signed Request Object and `anp://` target mapping. Their signatures are not interchangeable.

Byte-negative vectors mutate a prepared signed input or signature and check cryptographic integrity failure. Protocol scenarios separately test field parsing, method evidence, purpose authorization, clock/replay state, and business permission. A byte check does not establish those stateful conditions. Native Web without Document proof must still undergo required Bundle, control-origin, MLS and message authentication checks.

## 3. Scenario adapter contract

These fixtures deliberately select Ed25519, Multikey, and JWK to demonstrate interoperability under those capabilities; they do not add universal ANP-02 algorithm or representation requirements. Select applicable scenarios according to an implementation's declared support. JWT issuer/audience/scope scenarios explicitly select an example token policy and error mapping; they apply only when that policy is adopted and do not require every ANP-02 implementation to use those fields or policies. Existing WBA E1 and selected E2EE Profile cryptographic requirements remain in force.

Authentication-related scenarios carry `applicability: illustrative-implementation-policy-not-additional-anp02-conformance`. Their replay boundaries, cache, resolver, credential selection, error mapping, digest, and token policies are example choices, not additional ANP-02 requirements or mandatory changes to existing behavior. Where the original text does not specify a particular condition, use ANP-02 1.2 and existing implementation policy rather than deriving protocol rules from expected scenario results. Verbatim extraction also preserves the original JWT date-string example; NumericDate fixtures here are a selected JWT example and do not mandate changing existing tokens through test vectors.

Each scenario contains:

- `input`: referenced identity/byte fixtures and controlled initial state;
- `actions`: the exact mutation or owning-Profile flow to exercise;
- `expected`: rejection, acceptance, assurance, or state-side-effect boundary under the scenario applicability and selected policy;
- `normative_refs`: the specifications that own those obligations;
- `execution_status`: always `design-only-not-run-against-sdk-or-product` in this phase-P catalog.

An adapter must construct a valid baseline before applying a negative mutation. When a mutation changes a WBA Document for a test about a later layer, regenerate its E1 proof with the test root key so the test isolates that later layer. Tests explicitly targeting invalid E1 evidence must not repair it. For MLS scenarios, construct a valid suite KeyPackage/Leaf and group state with the exact provided binding first, then apply the named mutation; the offline binding bytes alone do not supply that state.

WNS scenarios retain the original models separately: WBA keeps hostname consistency, public exact-Handle checks and private Provider confirmation; Web keeps forward-DID and HTTPS Provider-domain checks without mandatory endpoint dereferencing or weak-binding migration. The example outcome `legacy-domain-binding-accepted` is only a test label, not a new wire result or an exact-Handle assertion. API fixtures intentionally omit Handle, service entries, and device Manifests. Full message scenarios cover WBA→WBA, WBA→Web, Web→WBA, and Web→Web with Direct, Group, P5/P6, ordinary/encrypted Direct/Group attachments, and ordinary/encrypted Mentions. Service identity is also varied independently from its caller anchor.

An SDK/product runner must record actual results in its own evidence without rewriting this catalog's design status. Required method-resolution, TLS/cache, concurrency, persistence, revocation, MLS, object-store, and user-facing behavior remain phase A/B work. WebVH is deliberately unsupported in the enabled-method negative case; this does not claim a WebVH implementation.

> The `-vnext` directory name is retained for path compatibility. References point to the 1.2 documents; P6 remains a candidate pending its registered MLS ExtensionType release gate.

## Copyright Notice

Copyright (c) 2024 ANP Open Source Community
This file is released under the [Apache License 2.0](../../LICENSE). You are free to use and modify it, but you must retain this copyright notice.
