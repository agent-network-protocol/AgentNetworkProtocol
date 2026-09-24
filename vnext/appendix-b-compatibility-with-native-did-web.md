# Appendix B: Native did:web Integration

- Status: Draft / not released
- Chinese mirror: [原生 did:web 集成](chinese/附录B：与原生did-web-的兼容.md)
- Historical baseline: [released compatibility appendix](../appendix-b-compatibility-with-native-did-web.md), retained unchanged

## B.1 Scope and ownership

This candidate is the integration entry point for native Web identities in the DID-method-independent ANP contracts. It does not define another authentication or messaging protocol. A subject retains its `did:web` identity; conversion to WBA is unnecessary.

| Contract | Normative owner |
|---|---|
| Web identity inputs and request authentication | [ANP-02 Web binding](02-anp-did-authentication-protocol-specification.md#web-binding) and common authentication |
| WBA-specific Document validation | [ANP-03 method rules](03-did-wba-method-design-specification.md) |
| Handle forward/reverse binding and status | [ANP-04 WNS](04-anp-did-wba-name-space-specification.md#binding-verification) |
| Message identity, devices, and services | [Messaging P2](message/02-identity-and-discovery.md) |
| Origin and object proof bindings | [Messaging P1](message/01-core-binding.md) |
| Direct/Group E2EE and extensions | The selected P5/P6/P7/P9 Profile and its dependencies |

## B.2 Method validation

Verifiers MUST apply ANP-02's Web binding before consuming Web identity material. WBA E1/K1 fingerprints and WBA-specific Document proof requirements do not apply to native Web. This method difference does not waive any purpose authorization, object signature, device-eligibility, or message-authentication requirement imposed by a selected ANP Profile.

## B.3 Authentication integration

Web and WBA callers use ANP-02's same HTTP component, digest, signature, challenge, replay, and optional-token rules. An ordinary API does not require a Handle or `deviceManifest`. Messaging P1 adds its application-origin context; P8 uses actual HTTP service-hop authentication. A successful hop signature does not establish the business sender's origin proof.

<a id="legacy-web-handle"></a>
## B.4 Handle / WNS integration (existing model)

The original Appendix B.4 body is retained below. This model confirms the forward Handle-to-DID mapping and the DID's Provider-domain declaration; it does not require dereferencing an exact endpoint or automatically produce the WBA mainline `exact-handle` or private-endpoint `provider-confirmed` result. This revision adds no Web weak-binding migration, cross-domain WBA Handle, or Provider-management requirements.

Native `did:web` is compatible with did:wba's Handle / WNS system.

When a `did:web` DID Document declares `ANPHandleService` in `service`, the verifier MAY perform bidirectional binding verification using the legacy domain-based compatibility model derived from earlier WNS behavior. This compatibility model is intentionally weaker than the mainline WNS exact-handle / provider-confirmed model defined in the [ANP DID:WBA Namespace Specification](../04-anp-did-wba-name-space-specification.md):

1. Parse the Handle through the Handle Resolution Endpoint and obtain the DID;
2. Parse the DID;
3. Find `ANPHandleService` in DID Document;
4. Extract the scheme and domain of `ANPHandleService.serviceEndpoint`;
5. Verify that `serviceEndpoint` uses `https` and its domain is consistent with the domain of the input Handle.

In compatibility mode, the role of `ANPHandleService.serviceEndpoint` remains domain-oriented: it is mainly used to declare the Handle Provider domain used by the DID subject, rather than requiring the declaration of a precise Handle Resolution Endpoint.

Therefore, the reverse binding check for native `did:web`:

- Only compare the domain of `ANPHandleService.serviceEndpoint` with the domain of the input Handle;
- The path of `serviceEndpoint` is not required to be exactly the same as a specific Resolution Endpoint;
- There is no requirement that `serviceEndpoint` be exactly equal to `https://{domain}/.well-known/handle/{local-part}`;
- You can use the Resolution Endpoint corresponding to the Handle, or you can use other stable HTTPS URLs under the same domain.

For native `did:web`, two-way binding verification only relies on:

- Handle → DID parsing result;
- Statement of Name Service domain by `ANPHandleService` in DID Document;

There is no need to perform did:wba's `e1_` / `k1_` fingerprint binding check.

## B.5 E2EE integration

Web devices use the method-validated Document and current P2 Manifest, then the same P5/P6 validation rules as WBA devices. A `keyAgreement` entry alone does not establish multi-device E2EE support. The selected suite, complete Profile dependency set, exact device/key references, and current eligibility MUST be present.

P5 Bundle Object Proof, X3DH-like inputs, Session/AAD/AEAD authentication and replay checks remain required as specified by P5. P5 MTI ciphertexts do not acquire an extra origin-signature requirement. P6 `did_wba_binding` remains the existing wire field name for the method-independent DID/device-to-MLS binding: its Object Proof, embedded extension, KeyPackage/Leaf signatures, credential identity, suite and group-state checks all remain necessary. Missing a WBA-specific Document proof is never a reason to omit those object or MLS checks.

## B.6 Services, attachments, and mentions

Service selection follows P2's validated `ANPMessageService`, advertised Profiles and security capabilities. Where federation authenticates a service, it resolves and verifies the declared `serviceDid` independently of the Agent DID, under that service DID's method. A subject cannot acquire hosting authority or local account permissions by naming somebody else's endpoint.

P7 ordinary and encrypted attachments and P9 Mention payloads use the same composition rules for WBA and Web. Whole-payload signature/AEAD coverage, object authorization, unknown-extension handling, and no-downgrade rules remain owned by the selected Profile. No Web-specific attachment or mention wire format is introduced.

## B.7 Continuity and evidence

Current Handle resolution and current DID authentication do not establish cross-DID authority migration. P2 registers no automatic Web transition-verification Profile in this candidate. Same-DID key updates and cross-DID changes MUST remain distinct; group roles, attachment authorization, and E2EE state require their own valid continuity and migration contracts.

[Mixed-method draft vectors](../examples/did-authentication-vnext/README.md) cover the contract boundaries and identify which cases remain design inputs for SDK/product execution. Candidate publication is not implementation conformance or a production rollout.

## Copyright Notice

Copyright (c) 2024 ANP Open Source Community
This file is released under the [Apache License 2.0](../LICENSE). You are free to use and modify it, but you must retain this copyright notice.
