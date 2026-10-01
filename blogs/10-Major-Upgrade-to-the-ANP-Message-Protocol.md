# Major Upgrade to the ANP Message Protocol: A Protocol Designed for Agent Collaboration

Recently, we made a major adjustment to the ANP messaging protocol. We also shared the thinking behind this upgrade at our community meeting. This article provides a systematic explanation of the changes.

First, let us answer several key questions at a high level. A more detailed technical summary follows later in the article. If you are interested in the overall rationale, the section below is enough; if you want the technical details, please continue reading.

1. Why do we need protocols?

I have discussed this many times in previous articles. In one sentence: future agents will not only collaborate inside a single organization; they will also collaborate across domains on the internet. Protocols are the most efficient way to transmit context, especially on the open internet.

2. Why do we need a new protocol?

For messaging, there are already many protocols such as XMPP, Matrix, and email. Why design another one?

The most important reason is that most existing protocols were designed for human-oriented IM or email systems, and most of them tightly couple identity and communication. In agent scenarios, identity is not only used for communication; it must also support payments, transactions, authorization, and many other activities.

Therefore, we need an agent-native protocol. ANP keeps identity and business logic more loosely coupled than other approaches.

3. Why not use DIDComm, which is based on DID and also separates identity from communication?

We studied DIDComm early in the design process. DIDComm is a general-purpose secure messaging framework based on DID; it is not a complete IM protocol. It is closer to a “secure message envelope + routing + upper-layer protocol carrier” than to a chat system.

It also lacks core IM concepts such as groups.

4. What problems does this upgrade mainly solve?

This upgrade took some time, but it was well worth it. The main improvements are:

- **Stronger security.** Signing now uses RFC 9421 and RFC 9530 to strengthen security and adopts more standardized identity verification methods.
- **Stronger cross-domain capabilities.** The previous design still had gaps in cross-domain collaboration. For example, how can we cryptographically prove that a message really came from a specific person rather than being constructed by a server? The new design uses proofs to ensure that every step in a cross-domain flow is secure.
- **Stronger E2EE.** We have always placed great importance on end-to-end encryption. This is also a major focus globally; for example, one of the headline capabilities of Elon Musk’s XChat is end-to-end encryption. In this upgrade, direct-message E2EE is aligned with the Signal-style approach, while group messaging uses IETF MLS. Combining MLS with DID addresses many shortcomings of previous group E2EE designs, such as the complexity of membership changes.
- **Support for file transfer and file E2EE.** File support was weak in the previous version. This version provides comprehensive file support, including files in direct messages and groups, file security considerations, and end-to-end encryption for files.
- **A more flexible message envelope.** Messages are encapsulated with JSON-RPC 2.0. JSON-RPC 2.0 is very flexible as a message envelope, so we reuse it directly.

5. What is not included in this upgrade?

- **Multi-device support is not included.** Matrix and Signal have strong multi-device support, but we did not add it at the protocol level in this upgrade. We believe ANP is positioned as a cross-domain interoperability protocol. How many devices an agent has is an intra-domain matter and should not expose complexity to other domains. In other words, when I send a message to an agent in another domain, whether that agent receives it on one device or multiple devices is its own business. I do not need to care. This reduces overall protocol complexity and gives implementations more flexibility. Otherwise, the protocol would become extremely complex.
- **The architecture currently supports relay forwarding only.** What does that mean? If an agent wants to exchange messages with an agent on another platform, it needs its own message service; it does not send messages directly to the other agent. Technically, direct agent-to-agent messaging is possible. We did not include it this time mainly because we believe the mainstream architecture will be that agents connect to nearby message services, and those message services provide relay capabilities. This architecture also provides the best QoS.

6. What was the biggest surprise during the upgrade?

DID is genuinely useful. We applied DID identities not only to agents, but also to groups and services. This perfectly solved complex identity, permission, and credential problems in multi-party flows.

Finally, if you are interested in this technology, we will introduce the upgrade again at tomorrow’s community meeting (May 14). You are welcome to join the discussion and contribute.

Below is the detailed protocol upgrade explanation. You can continue reading, or go directly to the original technical documents:

- did:wba Method Specification: https://github.com/agent-network-protocol/AgentNetworkProtocol/blob/main/03-did-wba-method-design-specification.md
- Namespace Specification Based on DID:WBA: https://github.com/agent-network-protocol/AgentNetworkProtocol/blob/main/04-anp-did-wba-name-space-specification.md
- Instant Messaging Specifications: https://github.com/agent-network-protocol/AgentNetworkProtocol/tree/main/message


## Abstract

The focus of this protocol upgrade is not to patch the old specifications in small increments. Instead, it raises both “identity authentication” and “instant messaging” from “working” to “more standardized, more verifiable, and better suited for cross-domain interoperability.”

On the identity side, the new `did:wba` is no longer merely “a request signature based on DID.” It further introduces **strong binding between path-based DIDs and bound public-key fingerprints**, **top-level integrity proofs for DID Documents**, **HTTP Message Signatures based on RFC 9421**, and **Content-Digest based on RFC 9530**. Together, these mechanisms connect four layers: DID, key, document, and request.

On the messaging side, the new ANP no longer uses one large monolithic specification to carry all semantics. It is split into eight profiles: **core binding, identity and discovery, direct-messaging base semantics, group-messaging base semantics, direct E2EE, group E2EE, attachments and object transfer, and federation/cross-domain communication**. As a result, business semantics, security semantics, object transfer, and cross-domain calls are decoupled while still being recomposed through a unified binding layer.

In one sentence, the value of the new design is: **identity becomes more trustworthy, messaging becomes more layered, encryption becomes more standardized, and cross-domain collaboration becomes genuinely deployable in engineering practice.**

---

## I. Why Continue Upgrading?

The previous `did:wba` and instant messaging protocols had already gone through an important upgrade. The previous identity scheme had introduced DID into cross-platform authentication. The previous instant messaging protocol had also evolved from earlier WebSocket routing and interactive handshakes to JSON-RPC 2.0-based message formats, HPKE-based direct-message E2EE, and Sender Key-based group E2EE. In other words, the previous design was not primitive; it had already solved the core problem of allowing agents to chat and encrypt messages.

However, as the protocol moves further toward cross-domain interconnection, group governance, attachment transfer, federated service calls, and long-term standardization, the previous design began to expose new bottlenecks:

1. **Identity authentication was not standardized or strongly bound enough.**
   The previous did:wba could already perform signed authentication, but there was no default strong binding between the DID path and the bound public key. Request signing still used the custom `Authorization: DIDWba ...` header. Top-level DID Document proofs, modern TLS service identity verification rules, and standardized challenge mechanisms were still incomplete.

2. **The messaging protocol was still too monolithic.**
   The previous instant messaging specification placed message formats, transport bindings, E2EE, groups, interface examples, and other capabilities in one document. This made it easy to get started, but as the protocol continued to evolve, its boundaries became increasingly blurry.

3. **Complex scenarios such as groups, attachments, and federation needed clearer abstraction layers.**
   The previous group E2EE used Sender Key + epoch rotation. It worked, but there was still room for improvement in large-group scalability, standardization, binding with group state, and witnessing group results. Object transfer and federated cross-domain communication were also not separated into clear independent capability layers.

Therefore, the new design does not overturn the previous design. It continues from that foundation and evolves toward a protocol stack that can be maintained over the long term.

---

## II. New Identity Authentication: From “Can Sign” to “Strong Binding, Strong Verification, Strong Interoperability”

### 2.1 Overall Thinking Behind the New did:wba

The core goal of the new `did:wba` is to make a DID answer more than “where can I find a document?” It must also answer the following questions:

1. Which key is this DID actually bound to?
2. Has this DID Document been silently replaced by the platform?
3. Was this request initiated by the holder of the private key corresponding to the DID?
4. Can the server complete standardized verification without adding extra round trips?

Around these questions, the new did:wba introduces a four-layer design:

* **DID layer**: path-based DIDs carry bound public-key fingerprints by default.
* **Document layer**: `e1_` path-based DIDs require a top-level `proof` in the DID Document.
* **Request layer**: requests are signed with `Signature-Input` / `Signature` / `Content-Digest`.
* **Session layer**: after successful authentication, the access token is returned via `Authentication-Info`.

### 2.2 Path-Based DIDs Introduce the `e1_` Bound Public-Key Fingerprint by Default

The biggest structural change in the new did:wba is the default design for **newly created path-based DIDs**: the last segment of the DID path must be an `e1_` bound public-key fingerprint. This is not merely “adding a suffix”; it makes the DID itself directly carry verifiable semantics related to the bound public key.

This brings three direct benefits:

* **A strong binding between the DID and the user-held key**
* **Reduced risk of a platform silently replacing the identity public key**
* **A clearer boundary for identity rotation, with stable names delegated to Handle / WNS**

The default profile in the new main specification is `e1_`, which means **Ed25519**. At the same time, the `k1_` compatibility extension remains in the appendix to support the **secp256k1** ecosystem. This means the main path of the new design emphasizes standardization and long-term interoperability without abruptly abandoning compatibility with existing ecosystems.

By contrast, path-based DIDs in the previous did:wba were ordinary paths; they did not place the bound public-key fingerprint directly inside the DID path.

### 2.3 DID Documents Upgrade from “Listing Public Keys” to “Proving the Binding Relationship”

The previous did:wba DID Document could already express fields such as `authentication`, `keyAgreement`, and `service`, and it allowed multiple verification method types. In the new version, however, the DID Document’s role is elevated: it must not only “list keys,” but also “prove that this document is consistent with the DID path binding.”

Therefore, for the default `e1_` profile, the new version adds several key constraints:

* The DID Document **must have a top-level `proof`**.
* The `proof` **must** use `DataIntegrityProof + eddsa-jcs-2022`.
* The RFC 7638 thumbprint of the Ed25519 public key corresponding to `proof.verificationMethod` **must exactly match the final `e1_` fingerprint in the DID path**.

This step is crucial. The previous did:wba mainly verified signatures at the “request authentication” layer. The new version unifies the **DID path, bound key, document proof, and authentication relationship** into one continuous verification chain.

### 2.4 Request Authentication Upgrades from a Custom Header to Standard HTTP Message Signatures

The previous did:wba request authentication method was custom:

```http
Authorization: DIDWba did=..., nonce=..., timestamp=..., verification_method=..., signature=...
```

This design works, but it is essentially a protocol-private format, which makes it harder to integrate with existing HTTP security mechanisms and standards ecosystems.

The new did:wba moves directly onto a standardized path:

* Use **RFC 9421** `Signature-Input` and `Signature` headers to represent request signatures.
* Use **RFC 9530** `Content-Digest` to bind message body integrity.
* Return the access token through **`Authentication-Info`** after successful authentication.
* Return challenge information and the components that the next request should cover through **`WWW-Authenticate` + `Accept-Signature`** when authentication fails.

This means the new identity authentication scheme is no longer “a custom DID signing header.” Instead, it embeds DID identity verification into mature HTTP standard semantics. For engineering implementation, this change is highly valuable:

* The request coverage scope is clearer.
* Server challenges are more standardized.
* Middleware and gateways are easier to integrate.
* Standard libraries and existing implementations are easier to reuse.

### 2.5 TLS, Tokens, and High-Assurance Authorization Semantics Are Also Clearer

The new did:wba also tightens several engineering-critical issues:

* **TLS service identity verification**: the previous version was closer to “certificate common name matching.” The new version explicitly requires `subjectAltName.dNSName` and no longer relies on Common Name.
* **Token return method**: the previous version was closer to returning the access token as a normal `Authorization: Bearer ...` response header. The new version explicitly requires the server to return the access token through `Authentication-Info`.
* **Human confirmation semantics**: the previous DID Document included a `humanAuthorization` field. The new version explicitly removes this field and moves “whether human presence is required” out of the DID Document into upper-layer authorization policies and interface semantics, such as `authorizationLevel: user-presence-required`. This returns the DID Document to its proper responsibility: declaring identity capabilities, rather than mixing in too much business authorization semantics.

### 2.6 Identity Authentication: Previous Version vs. New Version

| Dimension | Previous did:wba | New did:wba | Meaning of the Change |
| --- | --- | --- | --- |
| Path-based DID | Ordinary path-based DID; no default requirement to carry a bound fingerprint | Uses the `e1_` fingerprint path by default | Strong semantic binding between DID and bound key |
| Default main path | Multiple key types in parallel; main path not clear enough | Main specification defaults to `e1_`, with `k1_` compatibility | Clearer main path while preserving compatibility |
| DID Document | Mainly lists verification methods and services | `e1_` path-based DIDs require a top-level `proof` | Unified verification of document integrity and identity binding |
| Request authentication | Custom `Authorization: DIDWba ...` | `Signature-Input` + `Signature` + `Content-Digest` | More standardized and interoperable |
| Message body integrity | No unified standard field | Uses `Content-Digest` | Clearer anti-tampering semantics |
| Token after success | Semantics relatively loose | Returned through `Authentication-Info` | Better aligned with HTTP authentication semantics |
| Human confirmation | `humanAuthorization` in the DID Document | Moved up to the authorization policy layer | Separates identity and authorization responsibilities |
| TLS verification | Closer to CN matching | Explicitly uses `subjectAltName.dNSName` | Better aligned with modern TLS practice |

In one sentence: **the new did:wba turns “who the DID is,” “whether the document is trustworthy,” and “whether the request was initiated by it” into a complete, standardized, verifiable chain.**

---

## III. New End-to-End Instant Messaging Protocol: From a “Monolithic Messaging Protocol” to a “Layered Protocol Stack”

### 3.1 From One Large Specification to Eight Profiles

The advantage of the previous instant messaging protocol was that it was intuitive: one document explained message formats, transport bindings, direct messaging, group messaging, E2EE, and interface examples. A reader could implement a basic version after reading it.

But its problem was also obvious: as the protocol grows, putting every capability into one specification makes boundaries increasingly blurry. For example, binding-layer issues, business-layer issues, encryption-layer issues, object-transfer issues, and cross-domain federation issues gradually become mixed together.

The core upgrade in the new ANP is to split the protocol into eight profiles:

| Profile | Role | Problem Solved |
| --- | --- | --- |
| P1 Core Binding | Unifies the outer message binding | JSON-RPC constraints, `meta/auth/body`, capability negotiation, idempotency, error model |
| P2 Identity and Discovery | Unifies DID and service discovery | Agent DID, Group DID, `ANPMessageService`, discovery and selection |
| P3 Direct Messaging Base Semantics | Unifies the direct-messaging business layer | `direct.send`, content model, acceptance semantics, `sender_proof` |
| P4 Group Messaging Base Semantics | Unifies group lifecycle and group messages | Group creation, adding members, removing members, group policy, `group_receipt`, Group Host ordering |
| P5 Direct End-to-End Encryption | Defines the direct E2EE overlay | Prekey Bundle, X3DH-like, Double Ratchet-like |
| P6 Group End-to-End Encryption | Defines the group E2EE overlay | MLS, KeyPackage, External Commit, `did_wba_binding` |
| P7 Attachments and Object Transfer | Unifies attachment and large-object semantics | `attachment_manifest`, Object Service, download tickets, object-level encryption |
| P8 Federation and Cross-Domain | Unifies cross-domain invocation principles | Service discovery, cross-domain forwarding, Group Host, Object Service destination |

The greatest value of this split is that **base business logic, E2EE, security proofs, object transfer, and federation/cross-domain communication can evolve independently while still sharing the same outer binding.**

### 3.2 The New Protocol Is Not a “Chat API,” but a Cross-Domain Communication Standard for the Agent Ecosystem

The previous protocol read more like a “messaging system API specification.” The new protocol is positioned one level higher: it aims to solve **how agents from different domains, platforms, and implementations interoperate**.

Therefore, the new protocol emphasizes several first-class concepts:

* **Agent DID**
* **Group DID**
* **ANPMessageService**
* **Group Host Service**
* **Object Service**

This means the protocol is no longer just about “sending a message.” It begins to explicitly describe:

* how identity is discovered,
* how messages are addressed,
* who orders group state,
* who controls objects,
* and at which layer cross-domain success semantics are established.

---

## IV. Core Technical Direction of the New Messaging Protocol

### 4.1 Unified Outer Binding: Stricter JSON-RPC 2.0

One point needs special emphasis: **this is not the first time ANP introduces JSON-RPC 2.0.** The previous instant messaging protocol already used JSON-RPC 2.0 as the unified message format. The real change in the new version is that it further tightens and formalizes this foundation.

Key tightening in P1 includes:

* `params` **must** be an object.
* `id` **must** be a non-empty string.
* Batch requests are **forbidden**.
* Notifications are used only for explicitly defined asynchronous notifications.
* The common top-level `params` structure is fixed as `meta / auth / body`.
* `anp.get_capabilities` is introduced for capability negotiation.
* `operation_id` and `message_id` are introduced for unified idempotency and message identification.
* `security_profile` explicitly distinguishes `transport-protected`, `direct-e2ee`, and `group-e2ee`.

In other words, the new protocol is not “switching to JSON-RPC.” It elevates JSON-RPC into the unified binding layer of the entire protocol stack.

### 4.2 Unified Identity Discovery: `ANPMessageService` as the Unified Entry Point

An important change in P2 is that agent, group, object, and related capabilities are converged as much as possible under a unified **`ANPMessageService`**. Behind this service, implementations can provide roles such as Home, Key, Group, Join, Capability, and Object.

Compared with the previous version’s more “general outline” style of interface and endpoint description, the new version makes “discovery entry points” and “capability negotiation” more protocolized and more suitable for federation.

### 4.3 Direct-Message Security Model: From “One-Step HPKE Init” to “Prekey Bundle + X3DH-like + Double Ratchet-like”

This must be stated accurately: **the previous direct-message E2EE was not an early three-step ECDHE handshake; it was already HPKE one-step initialization plus a chained ratchet.** Therefore, the comparison between the old and new designs should not be simplified as “from insecure to secure.” It should be described as “from a usable HPKE session initialization model to a more mature asynchronous session establishment model.”

The core technical stack of the new direct-message E2EE is:

* **Prekey Bundle**
* **Signed Prekey / One-Time Prekey**
* **X3DH-like initial asynchronous session establishment**
* **Double Ratchet-like protection for subsequent messages**
* **AAD binding, out-of-order handling, replay protection, and session rebuilding**

This design matters because:

1. **It is more suitable for asynchronous offline scenarios**: the sender does not need to wait for the recipient to be online and respond.
2. **It is closer to a mature IM security model than simple HPKE init.**
3. **Security boundaries are clearer**: P5 explicitly requires signing/assertion keys to be separated from `keyAgreement` keys and emphasizes that Bundle signatures cannot be omitted.
4. **It leaves room for future upgrades**: P5 clearly states that v1 is not a post-quantum scheme, but reserves room to upgrade toward a PQXDH-like design.

### 4.4 Group Security Model: From Sender Keys to MLS as the Main Path

The core of the previous group E2EE design was **Sender Keys + epoch rotation**. This works well for small and medium-sized groups, but its limitations are also clear:

* Sender Key distribution is **O(N)**.
* Group membership changes, welcome flows, external joins, and group state proofs are hard to express elegantly in a long-term standardized group cryptography model.

The previous specification itself identified **MLS integration** as a future direction. In P6, the new version moves this “future direction” into the main path:

* **MLS** acts as the group key state machine.
* **did:wba** acts as the identity anchor.
* **did_wba_binding** binds MLS leaf signature keys to `agent_did`.
* **Group Host Service** handles ordering and receipts, but by default does not hold group plaintext.
* `group_did`, `group_state_version`, and `policy_hash` are bound to cryptographic group state.
* Group messages are carried as **MLS PrivateMessage**.

This is a major step: **group E2EE is no longer “a custom group encryption design that works,” but is directly connected to the long-term standardization path.**

### 4.5 Proof Model Upgrade: `sender_proof`, `actor_proof`, and `group_receipt`

In the previous protocol, message encryption and message sending were the main focus. The new version strictly separates three questions: “who initiated the request,” “who accepted and ordered the request,” and “who has decryption rights.”

In direct messaging:

* `sender_proof` proves that a given `direct.send` was indeed initiated by `sender_did`.
* Hop-level authentication only proves the identity of the caller on a given hop; it **cannot replace** proof of the original sender.

In groups:

* `actor_proof` proves who initiated a group operation or group message.
* `group_receipt` is generated by the Group Host to prove that the group has accepted and ordered the operation or message.
* MLS member signatures prove which cryptographic member produced a handshake or ciphertext.

This makes the new group protocol better suited for governance scenarios. It preserves three layers of semantics at the same time: **initiator proof, group result witnessing, and intra-group confidentiality**, instead of mixing all problems into one signature.

### 4.6 Attachments and Objects: From Inline Messages to Manifest + Object Service

The previous protocol supported message types such as `image` and `file`, and it acknowledged the efficiency problem of large files, but it did not provide an independent, complete, cross-domain reusable attachment object specification.

P7 formalizes attachments:

* The message layer carries only the **`attachment_manifest`**.
* The object layer uploads and downloads through the **Object Service**.
* Access control uses **short-lived download tickets**.
* For higher confidentiality requirements, **object-level encryption (`object-e2ee`)** can be enabled.
* Relays **do not forward object byte streams**.

This means the new protocol fully separates the “message control plane” from the “object data plane.” For engineering implementation, this step is almost mandatory because it significantly reduces the coupling between cross-domain messaging links and large byte streams.

### 4.7 Federation and Cross-Domain Communication: From “Define Later” to a First-Class Part of the Stack

The previous protocol explicitly stated that communication between Message Servers was outside the scope of the specification, and that cross-server interoperability was future work.

P8 brings this part formally into the main specification system:

* Cross-domain communication **directly uses the original business methods** instead of wrapping them in a new relay method.
* Direct cross-domain messaging uses `direct.send` directly.
* Cross-domain group operations use `group.create`, `group.send`, `group.add`, `group.remove`, and similar methods directly.
* `attachment.get_download_ticket` is sent directly to the final Object Service.
* Object byte streams **must not** pass through the cross-domain service invocation chain.
* Success semantics for cross-domain group operations are determined by **acceptance and ordering by the Group Host**.
* Success semantics for direct cross-domain messages are determined by **acceptance by the target Agent’s entry service**.
* The original `sender_proof` / `actor_proof` must be preserved across domains and must not be rewritten by intermediate services.

This marks the point at which the new protocol is no longer merely a “single-domain messaging API.” It now has the protocol boundaries required for **federated agent interoperability**.

---

## V. End-to-End Instant Messaging Protocol: Previous Version vs. New Version

| Dimension | Previous Instant Messaging Specification | New ANP Profile System | Meaning of the Change |
| --- | --- | --- | --- |
| Specification structure | One large monolithic specification | Eight composable layered profiles | Clearer boundaries and easier independent upgrades |
| Outer binding | Already used JSON-RPC 2.0 | Continues using JSON-RPC 2.0 and adds stricter interoperability constraints | More stable unified binding layer |
| Service discovery | More like a general endpoint outline | `ANPMessageService` in DID Documents + `anp.get_capabilities` | More protocolized discovery and negotiation |
| Direct-message model | `send` + multiple message types | `direct.send` + base semantics + E2EE overlay | Separates business semantics from security semantics |
| Direct E2EE | HPKE one-step init + chained ratchet | Prekey Bundle + X3DH-like + Double Ratchet-like | More suitable for asynchronous session establishment |
| Group E2EE | Sender Keys + epoch | MLS main path + did:wba binding | Better for large groups and long-term standardization |
| Group governance | Group messages and group APIs exist, but proof boundaries are weaker | Introduces Group Host, `group_state_version`, `group_event_seq`, and `group_receipt` | Clearer group state ordering and result witnessing |
| Original-sender proof | Focused on message content and encryption | Explicit layering of `sender_proof` / `actor_proof` / hop auth | Better for cross-domain use and auditability |
| Attachments and objects | File messages exist, but no independent object specification | `attachment_manifest` + Object Service + download tickets + object-level encryption | Engineering-ready large-object transfer |
| Federation and cross-domain | Treated as future work | P8 formally defines cross-domain connection and success semantics | Truly becomes a federated protocol |

In one sentence: **the previous version was already a working messaging protocol; the new version upgrades it into a protocol stack that can evolve over the long term and support a cross-domain agent ecosystem.**

---

## VI. Five Characteristics Most Worth Emphasizing

### 6.1 Characteristic One: Higher Standardization

On the identity side, the design aligns with RFC 9421, RFC 9530, and W3C Data Integrity. On the group encryption side, it moves toward MLS. The message binding layer continues to build on JSON-RPC 2.0 while tightening its use. The new design is clearly closer to a long-term standardization path rather than an internal proprietary protocol.

### 6.2 Characteristic Two: Stronger Identity Binding

The `e1_` fingerprint path plus DID Document proof turns the binding among DID, key, and document from something that is “logically true” into something that is “mandated and verifiable by the protocol.” This is one of the most important security improvements in the new identity design.

### 6.3 Characteristic Three: True Decoupling Between the Business Layer and the Security Layer

`transport-protected`, `direct-e2ee`, and `group-e2ee` are composable security profiles. The base business layer can operate independently, and security overlays can be added as needed. This design is suitable both for gradual deployment and for future upgrades.

### 6.4 Characteristic Four: Federation and Object Transfer Enter the Main Path

Attachment objects, download tickets, cross-domain forwarding, Group Host ordering, and Object Service destinations used to be treated more as “engineering implementation issues” or “future work.” They are now part of the main specification path.

### 6.5 Characteristic Five: Better Suited for Agent Collaboration, Not Just Chat

The keywords of the new protocol are not only “message,” but also:

* DID
* discovery
* proof
* governance
* object
* federation
* receipt

This makes it feel more like a **cross-domain collaboration protocol between agents**, rather than merely a “chat interface with E2EE.”

---

## VII. Suggested Narrative for Presenting the Upgrade

If this article is used for an external or internal presentation, I recommend the following narrative:

### First layer: explain the upgrade goal

This is not about changing terminology. It is about making identity more trustworthy, cross-domain interaction more natural, group governance clearer, and the protocol more capable of long-term evolution.

### Second layer: explain identity

Highlight three terms:

* **Path binding**
* **Document proof**
* **Standard request signatures**

### Third layer: explain messaging protocol layering

Help the audience understand that the new protocol is not a “chat interface document,” but a layered protocol family.

### Fourth layer: focus on the encryption route changes

* Direct messaging upgrades from “HPKE init” to “Prekey Bundle + X3DH-like + Double Ratchet-like.”
* Group messaging upgrades from “Sender Key + epoch” to “MLS as the main path.”

### Fifth layer: end with engineering value

Attachments use an independent data plane. Cross-domain communication uses direct business methods. Group results have receipts. Service discovery has a unified entry point. This shows that the design is not merely cryptographic; it is protocol engineering for real-world systems.

---

## VIII. Conclusion

The new identity authentication scheme and the new end-to-end instant messaging protocol can be summarized in one sentence:

**On the identity side, the new did:wba upgrades from “can authenticate” to “strong binding, strong proof, and strong standardization.” On the messaging side, the new ANP upgrades from “can chat and encrypt” to a protocol stack that is “layered, governable, federated, and capable of long-term evolution.”**

If the previous design solved the problem of “building agent communication,” the new design solves the next problem: **how to make agent communication a truly interoperable, verifiable, and extensible infrastructure.**

---

## Appendix: A 12-Slide Structure Ready for a Slide Deck

### Slide 1: Title

* From did:wba to ANP: Understanding the Next-Generation Identity Authentication and End-to-End Instant Messaging Protocol
* One-sentence positioning: a cross-domain communication standard for the agent ecosystem

### Slide 2: Why Upgrade?

* Identity binding was not strong enough.
* The protocol structure was too monolithic.
* Groups, attachments, and federation lacked independent abstraction layers.

### Slide 3: Overall Thinking Behind the New Identity Authentication

* DID path binding
* DID Document proof
* HTTP Message Signatures
* Content-Digest
* Access token session optimization

### Slide 4: did:wba Old vs. New

* `e1_` / `k1_`
* `proof`
* `Signature-Input`
* `Authentication-Info`
* Moving `humanAuthorization` semantics up a layer

### Slide 5: New Messaging Protocol Architecture Diagram

* Layering relationship among P1–P8
* Business layer / security layer / object layer / federation layer

### Slide 6: Unified Binding Layer

* Tightened JSON-RPC 2.0
* `meta/auth/body`
* `operation_id`
* `message_id`
* `anp.get_capabilities`

### Slide 7: Direct E2EE

* Prekey Bundle
* X3DH-like
* Double Ratchet-like
* Asynchronous session establishment
* Replay and out-of-order handling

### Slide 8: Group E2EE

* Group DID
* Group Host
* MLS
* `did_wba_binding`
* `group_receipt`

### Slide 9: Original-Sender Proof and Group Result Witnessing

* `sender_proof`
* `actor_proof`
* hop-level auth
* `group_receipt`

### Slide 10: Attachments and Object Transfer

* `attachment_manifest`
* Object Service
* Download tickets
* Object-level encryption
* Independent data-plane download

### Slide 11: Federation and Cross-Domain Communication

* Directly use existing business methods across domains.
* Group success depends on Group Host ordering.
* Object Service is the final ticket destination.
* Relays do not forward object byte streams.

### Slide 12: Summary

* More trustworthy identity
* More standardized encryption
* More layered protocol
* More deployable engineering design
* Better suited for a cross-domain agent ecosystem

If needed, this material can be further condensed into a 10-minute presentation script.

## Copyright Notice
Copyright (c) 2024 ANP Community
This file is released under the [MIT License](../LICENSE). You are free to use and modify it, but you must retain this copyright notice.
