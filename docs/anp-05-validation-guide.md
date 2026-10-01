# ANP-05 Implementation Validation Guide

- Status: Informative validation guide for the unreleased protocol draft
- Protocol baseline: [ANP-05 v0.6](../05-anp-did-authorization-protocol-specification.md)
- Profiles: OAuth `anp.authorization.oauth2.did.v1-draft4`; VC `anp.authorization.vc.v1-draft2`
- Chinese mirror: [实现验证指南](chinese/anp-05-validation-guide.md)

This guide collects implementation validation scenarios derived from ANP-05. The protocol defines the requirements and conformance rules, especially in [Section 14](../05-anp-did-authorization-protocol-specification.md#conformance). Section numbers in the scenarios below refer to the protocol.

## Validation scenarios

These are design scenarios, not a claim that an implementation has passed them. Test applicable positive flows and all relevant rejection paths for the declared roles and capabilities; record unsupported optional features rather than reporting them as passes. This guide records no execution results for JWT/VC signature verification, end-to-end authorization or interoperability tests.

| ID | Scenario and expected result |
| --- | --- |
| AUTHZ-01 | Approved `did:wba` client, method-validated DID document, authorized key and client-credentials policy: issue a target-limited token. Repeat this positive flow for every advertised DID method. |
| AUTHZ-02 | Approved WBA client: issue only after the advertised WBA binding and key policy pass. |
| AUTHZ-04 | User-approved authorization code with matching redirect, state/session, and S256 PKCE: preserve the user subject and resource. |
| AUTHZ-05 | Wrong signature, `none`/`HS*`, incompatible algorithm, or unsupported curve: reject. |
| AUTHZ-06 | Key absent from `authentication`, foreign-DID `kid`, wrong document `id`, or injected JWS key: reject. |
| AUTHZ-07 | Wrong iss/sub, wrong or multiple AS audiences, a differing token-endpoint audience, or a conflicting JWT type: reject. A one-element issuer array and allowed/omitted typ follow Section 6.1. |
| AUTHZ-08 | Expired, future-dated, over-300-second assertion or malformed NumericDate: reject under the stated skew bounds. |
| AUTHZ-09 | Reuse or concurrent submission of one `jti`, including another key/replica: at most one accepted authentication. |
| AUTHZ-10 | Valid DID proof without successful admission or permission, or user access attempted with client-only authority: do not grant that access. |
| AUTHZ-11 | Wrong/reused code, redirect or PKCE mismatch, scope/resource escalation, or another client's refresh token: reject. |
| AUTHZ-12 | Removed key, stale-resolution failure, deactivated DID, or unapproved successor migration: no new authentication or inherited grant. |
| AUTHZ-13 | SSRF through DID/metadata/context fetch, redirects, or DNS rebinding: block without token issuance. |
| AUTHZ-14 | Client assertion used as resource token, ANP-02 cache token substituted, or wrong AS/RS audience: reject. |
| AUTHZ-15 | Grant revocation or refresh reuse: prevent issuance/refresh according to the configured lifecycle policy. |
| AUTHZ-16 | Duplicate form/JSON security fields or simultaneous authentication methods: reject without ambiguous parsing. |
| AUTHZ-17 | Where DPoP is required, wrong proof/key/token hash or Bearer downgrade: reject. |
| AUTHZ-18 | Core advertisement with a wrong Profile revision or a client-ID mode other than `did`: reject without substituting identity or weakening authentication. |
| AUTHZ-20 | Protected-resource metadata points to a different resource, or AS metadata issuer mismatches: stop before transmitting credentials. |
| AUTHZ-21 | Authorization response `iss` missing, duplicated, or mismatched, including error responses: reject before code redemption. |
| AUTHZ-22 | Code redemption or refresh omits `resource`, changes its target, or reuses another AS/tenant's client record or token: reject. |
| AUTHZ-23 | An inbound A-targeted token is presented to B: reject; a separately authorized B-targeted token succeeds. |
| AUTHZ-26 | A public client is treated as confidential merely for owning a key or using PKCE: reject that client-credentials configuration. |
| AUTHZ-27 | Scope challenge is accepted only for the trusted RS/AS context, with new approval and bounded retries; it cannot silently escalate rights. |
| AUTHZ-29 | Unknown DID with self-published admission enabled, valid metadata/proof, and independent authorized grant: issue without a prior client row or registration API call. |
| AUTHZ-30 | First-contact admission disabled, policy denies, or a disabled client attempts reenrollment after cache eviction: reject without bypassing the current identity or policy checks. |
| AUTHZ-31 | Missing/ambiguous service, wrong native metadata DID/Profile, redirected/oversized/duplicate JSON or injected JWKS: reject before code/token issuance. |
| AUTHZ-32 | Discovery at authorization endpoint creates only a candidate; proof is checked at redemption, and changed callback/service/authentication/grant metadata aborts the pending code. |
| AUTHZ-33 | Metadata lists privileged scopes or client_credentials: do not treat these as resource grants; refresh still needs an existing authorized token binding. |
| AUTHZ-41 | A metadata host changes a name, callback, grants or serialization without updating the validated DID digest: reject before display, redirection or token issuance. Missing/malformed digest also fails. |
| AUTHZ-42 | Approved native loopback metadata with an ephemeral request port and exact code-redemption URI succeeds; wrong host/path, port substitution at redemption, disabled mode or non-native application fails. |
| AUTHZ-43 | A local callback does not authorize AS-side loopback/private metadata fetches; listener on a LAN/all-interfaces address is not this binding. |
| AUTHZ-44 | Rotate an authorized e1_ runtime key while retaining the binding key/DID: retain valid grants under policy and reject the removed key. A new binding-key DID receives no automatic grant inheritance. |
| AUTHZ-45 | Preferred, legacy-specific, generic or absent typ is accepted only with all other checks; singleton issuer audience is accepted, multiple/empty/non-string audiences or an access-token type are rejected. |
| AUTHZ-46 | AS-verified token or active introspection client_id identifies the Agent while sub identifies the user; caller-injected DID and inactive-token identity disclosure are rejected. |
| AUTHZ-47 | One Agent obtains separate user grants for two resources; token selection includes user/issuer/resource and rejects cross-resource or cross-AS account/permission substitution. |
| AUTHZ-48 | A service requires approval of a high-risk action: absent, mismatched or already consumed operation approval blocks execution; login, broad scope or DID/DPoP proof alone cannot satisfy that policy. |
| AUTHZ-49 | k1_ is rejected by this v1 binding; EdDSA is accepted only when enabled and using an Ed25519 key. Relabeled curves or unsupported algorithms fail. |
| AUTHZ-50 | A client-credentials-only deployment does not claim user-delegation support; roadmap redelegation/per-operation approval/cumulative budgets do not become active capabilities merely through metadata claims. |
| AUTHZ-53 | Invalid credential proof, signing key outside the issuer's `assertionMethod`, VP key outside the holder's `authentication`, unverifiable issuer DID, a cryptosuite that is not enabled, or a context outside the allowlist: reject. |
| AUTHZ-54 | Credential not yet valid or expired, status revoked or suspended, status list from a different issuer, status list without `validUntil` or expired, or status list unavailable: reject and never treat as valid. |
| AUTHZ-55 | Issuer DID cannot be confirmed as a local principal with authority over the resource, or the Agent self-issues a delegation (issuer equals holder): reject; the credential cannot establish an account correspondence, and issuing authority comes only from the verifier's local binding or trust policy. |
| AUTHZ-56 | Requested resource not in the credential, actions beyond the credential or local policy, an unknown constraint, constraints that the verifier cannot enforce, or a `perOperationLimit` whose currency differs or whose operation has no documented amount: reject; granted authority is the three-way intersection. |
| AUTHZ-57 | In direct presentation, a missing, expired or used challenge, a `domain` naming another verifier, an ANP-02-authenticated DID different from the holder or the transaction's requester, an operation different from the one stored in the presentation transaction, or a presentation for `mode` `operation` used to establish a session: reject and do not perform the operation. |
| AUTHZ-59 | A raw VC or VP in the `Authorization` header at an RS, or a VC/VP submitted to an OAuth token endpoint under this Profile: reject or do not send. |
| AUTHZ-60 | Agent A holds a user's delegation but has no independent issuing authority, and issues Agent B a cryptographically valid delegation credential (redelegation): rejected in this version. |
| AUTHZ-61 | A role credential issued by an organization that is confirmed as one the verifier recognizes, with the requested operation within the listed actions and constraints under a documented correspondence: accept, with the organization's local account as principal of the operation. |
| AUTHZ-62 | A role credential containing an action URI with no correspondence at the verifier, a requested operation outside every listed action, or an amount above the per-operation limit: reject that entry or operation. |
| AUTHZ-63 | Issuer DID cannot be confirmed as an organization the verifier recognizes, or an organization identity credential required by verifier policy is missing or untrusted: reject; the `role` name or a did:web domain alone does not pass. |
| AUTHZ-64 | Using a role credential alone, without a valid basis independently confirmed by the resource side, to read third-party personal data or in place of per-operation approval for a high-risk action: not sufficient; reject or route to the verifier's own approval mechanism. |
| AUTHZ-65 | Positive direct presentation: the carrying interface's authenticated requester DID, VP holder and authorization credential credentialSubject.id match, with valid issuer authority, status and constraints; substituting any of those DIDs is rejected. |
| AUTHZ-66 | VP domain/challenge differs from the stored presentation transaction, or challenge expiry, reuse or concurrent consumption: reject; at most one concurrent presentation is accepted. |
| AUTHZ-67 | Delegation revoked, suspended or expired, or status list missing, expired or unverifiable: reject the direct operation and stop credential-based sessions when status rechecks detect it. |
| AUTHZ-68 | Direct presentation performs only the stored operation and enforces permission intersection and the 5000 CNY per-operation limit; excess amount, different currency, missing amount, broader action or unknown constraint: reject. |
| AUTHZ-69 | Presentation request omits profile or uses an unsupported version: do not sign a VP or silently downgrade; VC/VP cannot bypass an OAuth-only interface or obtain an access token under this Profile. |
| AUTHZ-70 | The presentation transaction accepts only a delegation credential but receives a role credential, or one credential has both ANP authorization types: reject substitution even though the individual types are supported by this Profile. |
| AUTHZ-71 | After session creation, only a session reference is supplied or the subsequent authenticated DID differs from the bound holder: reject the request; the reference is not identity or access evidence. |
| AUTHZ-72 | A 5000 CNY session accepts a 4200 CNY order but must still reject a later 6000 CNY order, different currency, broader target/action or unenforceable constraint; the first operation's approval cannot be reused. |
| AUTHZ-73 | Session expiry exceeds the local maximum or credential validity, slides forward with use, or renewal omits a newly verified fresh-challenge VP: reject that creation, extension or renewal. |
| AUTHZ-74 | Only a qualification or attribute credential is presented without the delegation/role authorization credential required by this Profile: reject; a valid qualification signature and trusted issuer do not establish this version's standalone presentation flow. |
| AUTHZ-75 | The resource side independently confirms enterprise-account authority to access the personal data and the role presentation passes all other type, identity, permission and constraint checks: it may allow access under that basis and interface policy; absent a valid access basis, reject. |

## Scenario identifier maintenance

Scenario identifiers are stable evidence references, not an ordered checklist. Retired IDs (03, 19, 24, 25, 28, 34–40, and 51, 52, 58 retired in 0.6) remain unused. Requirements added in 0.4 start at 41, VC scenarios added in 0.5 start at 51 (61–64 for role credentials), and new direct-presentation scenarios in 0.6 are 65–75. Numbering gaps do not waive any listed scenario.

## Copyright Notice

Copyright (c) 2026 ANP Open Source Community
This file is released under the [Apache License 2.0](../LICENSE). You are free to use and modify it, but you must retain this copyright notice.
