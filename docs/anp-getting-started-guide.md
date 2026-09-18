# ANP Getting Started Guide

- Specification Set: ANP 1.2

## Overview

### What is ANP

ANP (Agent Network Protocol) is an open protocol suite for the Agentic Web. It is designed to let agents on the open internet identify each other, publish capabilities, discover services, negotiate usable interfaces, exchange secure messages, and build application-level collaborations.

This guide follows the ANP 1.2 document set in the current working tree. Its core and messaging specifications cover:

- [ANP-02 common DID request authentication](../02-anp-did-authentication-protocol-specification.md) for `did:wba` and native `did:web`
- ANP-03 WBA method rules and identity continuity
- WNS (WBA Name Space) human-readable handles
- Agent Description documents
- Agent Discovery documents and search registration
- End-to-end instant messaging profiles

ANP-06 remains a draft. P6 Group E2EE is included in full but remains a candidate pending its stable registered MLS ExtensionType; the provisional `0xF0A1` release gate has not been removed. The AP2 payment adaptation is independently versioned and remains a draft / not released.

Document status does not establish SDK or product implementation, conformance, public capability enablement, or completion of a tag / GitHub Release.

> Version note: `Version: 1.2` is the specification/document version, not a wire version. P1/P2/P3/P7/P8 retain `.v1`; P4/P5/P6 use the `.v2` contracts already defined in vNext. P9 retains its v1 binding extension without an independent `meta.profile`. Fields such as `protocolVersion` follow their owning specifications and are not globally renumbered.

### Why ANP is Needed

Today, most AI agents still interact with network services in one of three limited ways: simulating a human browser, using platform-specific APIs, or staying inside a single application ecosystem. ANP provides a protocol-first alternative:

- **Interconnection**: agents from different domains can authenticate, discover, and communicate with each other.
- **Native interfaces**: agents can use machine-readable descriptions, interface documents, and JSON-RPC / OpenRPC style calls instead of only reading human webpages.
- **Stable identity and naming**: DIDs provide verifiable cryptographic identity, while WNS handles provide user-friendly names.
- **Secure messaging**: direct messages, group messages, attachments, federation, and end-to-end encryption are specified as layered profiles.
- **Open implementation path**: ANP reuses HTTP, DNS, TLS, JSON, JSON-LD, DID, and existing Web deployment patterns.

### Example: Cross-Platform Hotel Booking

Suppose a personal assistant needs to book a hotel room. Without ANP, it may have to scrape a website, log in through a platform account, or integrate with a vendor-specific API.

With ANP:

1. The personal assistant has its own DID and may also have a human-readable WNS handle.
2. It discovers hotel agents through search, `.well-known/agent-descriptions`, or a handle.
3. It reads the hotel agent's Agent Description document to understand products, services, and interfaces.
4. It authenticates requests under ANP-02 with a supported `did:wba` or native `did:web` identity; the service separately decides business permissions.
5. It can use a structured interface for booking and a natural-language interface for special requests.
6. If payment or human authorization is required, that requirement is visible in the interface description and handled by the relevant application protocol.

### Relationship with MCP and A2A

ANP is complementary to other agent protocols:

- **MCP (Model Context Protocol)** connects a model or agent host to tools and resources.
- **A2A-style protocols** often focus on task collaboration in controlled environments.
- **ANP** focuses on identity, naming, discovery, secure communication, and application collaboration across the open internet.

A simple rule of thumb: use MCP to connect tools, use enterprise collaboration protocols for controlled workflows, and use ANP when agents need to find and communicate with each other across domains.

## Current ANP Architecture

The latest README architecture organizes the released ANP capabilities into existing Internet infrastructure, two core protocol layers, and domain-specific application protocols.

![ANP protocol architecture](../images/anp-architecture2.png)

### Open Internet Infrastructure

ANP does not rebuild the internet stack. It reuses:

- HTTP / HTTPS for transport
- DNS and domain names for reachability
- CA / TLS for Web security roots
- CDN and hosting infrastructure for static documents
- Search engines and crawlers for public discovery

### Identity and Encrypted Communication Layer

This layer answers: **who is the agent, how can the peer verify it, and how can messages be protected?**

It includes:

- W3C DID-based identity
- ANP-03 `did:wba` method rules and the native `did:web` method binding
- ANP-02 HTTP Message Signatures / JSON authentication metadata carriage
- DID Document service discovery
- key separation for signing and key agreement
- end-to-end encryption foundations for direct and group messaging

### Application Protocol Layer

This layer answers: **what can the agent do, how can it be found, and which application protocol should be used?**

It includes:

- Agent Description Protocol
- Agent Discovery Protocol
- instant messaging profiles
- application protocols such as payment, authorization, authentication, and transactions

### Meta-Protocol Status

ANP-06 is a draft. The updated direction is Agent Description-driven semantic negotiation:

```text
Agent Description -> MetaProtocolInterface -> anp.get_capabilities -> anp.negotiate
```

In the released path, agents can already interoperate through DID service discovery, Agent Description documents, declared interfaces, and messaging profiles. Treat `MetaProtocolInterface` and `anp.negotiate` as optional draft features unless your implementation explicitly supports them.

## How Agents Connect

A typical ANP connection path is:

```text
WNS Handle or Search Result
  -> DID
  -> DID Document
  -> AgentDescription / ANPMessageService
  -> Runtime capabilities
  -> Business interface or messaging profile
```

The important separation is:

- **WNS Handle** is a human-readable name.
- **DID** is the cryptographic identity anchor.
- **DID Document** is the authoritative source for verification methods and service endpoints.
- **Agent Description** explains the agent's public information and available interfaces.
- **ANPMessageService** is the unified messaging and interaction endpoint used by the instant messaging profile suite.
- **Runtime capability negotiation** confirms what the endpoint currently supports.

## Identity: `did:wba`

<a id="authentication-model"></a>
### Separate Authentication from DID Methods

[ANP-02](../02-anp-did-authentication-protocol-specification.md) owns common request authentication. [ANP-03](../03-did-wba-method-design-specification.md) owns WBA identifiers, DID Documents, resolution, key binding, and transitions. The [native did:web integration appendix](../appendix-b-compatibility-with-native-did-web.md) explains how Web identities use the same authentication and messaging contracts without conversion to WBA or WBA-specific root-proof requirements.

Ordinary API authentication does not require WNS, messaging Profiles, or a `deviceManifest`. The WBA examples below do not impose extra requirements on other DID methods. Methods such as `did:webvh` need their own binding and implementation support; DID Core compatibility alone does not imply that support.

### What `did:wba` Provides

`did:wba` is ANP's Web-based DID method. It gives agents decentralized identity while still using ordinary Web infrastructure.

A root domain DID:

```text
did:wba:example.com
```

resolves to:

```text
https://example.com/.well-known/did.json
```

A path DID using the default `e1_` profile:

```text
did:wba:example.com:user:alice:e1_<fingerprint>
```

resolves to:

```text
https://example.com/user/alice/e1_<fingerprint>/did.json
```

If the domain contains a port, the colon is percent-encoded in the DID:

```text
did:wba:example.com%3A3000:user:alice:e1_<fingerprint>
```

### Root DID vs Path DID

- A **root domain DID** such as `did:wba:example.com` usually represents a domain-level subject or service identity.
- A **path DID** such as `did:wba:example.com:user:alice:e1_<fingerprint>` represents a specific subject under the domain.
- New path DIDs should use the default `e1_` Ed25519 binding fingerprint profile.
- When the binding key changes, a path DID may rotate; WNS handles can provide a stable human-readable reference. Neither a matching stable subject path nor a Handle resolving to a new DID independently proves authority continuity. Verify the ANP-03 transition chain from the previously trusted DID, then apply business policy.

### Minimal DID Document Shape

A DID Document publishes keys and services. For ANP, the common service types are:

- `AgentDescription`: points to the agent's `ad.json` document.
- `ANPHandleService`: supports WNS bidirectional binding verification.
- `ANPMessageService`: exposes the unified ANP messaging / interaction endpoint.

Example:

```json
{
  "@context": [
    "https://www.w3.org/ns/did/v1",
    "https://w3id.org/security/data-integrity/v2",
    "https://w3id.org/security/multikey/v1"
  ],
  "id": "did:wba:example.com:user:alice:e1_<fingerprint>",
  "verificationMethod": [
    {
      "id": "did:wba:example.com:user:alice:e1_<fingerprint>#key-1",
      "type": "Multikey",
      "controller": "did:wba:example.com:user:alice:e1_<fingerprint>",
      "publicKeyMultibase": "z6Mk..."
    },
    {
      "id": "did:wba:example.com:user:alice:e1_<fingerprint>#key-x25519-1",
      "type": "X25519KeyAgreementKey2019",
      "controller": "did:wba:example.com:user:alice:e1_<fingerprint>",
      "publicKeyMultibase": "z9h..."
    }
  ],
  "authentication": [
    "did:wba:example.com:user:alice:e1_<fingerprint>#key-1"
  ],
  "assertionMethod": [
    "did:wba:example.com:user:alice:e1_<fingerprint>#key-1"
  ],
  "keyAgreement": [
    "did:wba:example.com:user:alice:e1_<fingerprint>#key-x25519-1"
  ],
  "service": [
    {
      "id": "did:wba:example.com:user:alice:e1_<fingerprint>#ad",
      "type": "AgentDescription",
      "serviceEndpoint": "https://example.com/agents/alice/ad.json"
    },
    {
      "id": "did:wba:example.com:user:alice:e1_<fingerprint>#handle",
      "type": "ANPHandleService",
      "serviceEndpoint": "https://example.com/.well-known/handle/alice"
    },
    {
      "id": "did:wba:example.com:user:alice:e1_<fingerprint>#anp",
      "type": "ANPMessageService",
      "serviceEndpoint": "https://example.com/anp",
      "serviceDid": "did:wba:example.com"
    }
  ],
  "proof": {
    "type": "DataIntegrityProof",
    "cryptosuite": "eddsa-jcs-2022",
    "created": "2025-01-01T00:00:00Z",
    "verificationMethod": "did:wba:example.com:user:alice:e1_<fingerprint>#key-1",
    "proofPurpose": "assertionMethod",
    "proofValue": "z..."
  }
}
```

### Authentication Flow

The common flow follows [ANP-02 HTTP request authentication](../02-anp-did-authentication-protocol-specification.md#http-binding):

1. Agent A signs with a key authorized by `authentication`, using `Signature-Input` and `Signature`; a request body also requires a computed and signed `Content-Digest`.
2. Agent B resolves and validates A's DID Document under its method, then checks `keyid` and authentication-key authorization.
3. B reconstructs the signature base from the actual HTTP request and verifies the signature, digest, coverage, time window, and replay protection.
4. B independently checks business permissions. Authentication is not operation authorization or evidence of human approval.
5. An optional token flow follows ANP-02 and service policy. Message origin proofs remain separately governed by P1 and the owning Profile.

## Name Service: WNS Handles

### Why WNS Exists

DIDs are reliable machine identifiers, but they are not convenient for humans to type, remember, or share. WNS (WBA Name Space) adds a stable human-readable naming layer on top of `did:wba`.

Example handle:

```text
alice.example.com
```

Optional sharing form:

```text
wba://alice.example.com
```

A handle resolves to a DID, and the DID then resolves to a DID Document:

```text
Handle -> Handle Resolution Endpoint -> DID -> DID Document -> service
```

### Handle Resolution Endpoint

For `alice.example.com`, the standard endpoint is:

```text
https://example.com/.well-known/handle/alice
```

Example response:

```json
{
  "handle": "alice.example.com",
  "did": "did:wba:example.com:user:alice:e1_<fingerprint>",
  "status": "active",
  "updated": "2025-01-01T00:00:00Z",
  "versionId": "42",
  "ttl": 300,
  "profile": {
    "type": "DIDSubjectProfile",
    "subject_did": "did:wba:example.com:user:alice:e1_<fingerprint>",
    "subject_type": "agent",
    "handle": "alice.example.com",
    "display_name": "Alice Agent",
    "description": "A travel planning agent",
    "avatar_uri": "https://example.com/avatars/alice.png",
    "discoverability": "listed"
  }
}
```

The following rules describe mainline WBA WNS. Native Web uses the weaker domain-declaration compatibility model in [Appendix B](../appendix-b-compatibility-with-native-did-web.md#legacy-web-handle), which does not establish `exact-handle`:

- The top-level `did` is the authoritative identity result.
- `profile` is public display metadata only.
- `profile` must not be used for authentication, authorization, routing, E2EE binding, or service endpoint selection.
- For security-sensitive use of a WBA Handle, clients must verify the Handle-to-DID binding through the DID Document's `ANPHandleService`; ordinary DID-based API authentication does not require a Handle.
- `exact-handle` verification is required when a specific handle must be trusted; `provider-confirmed` alone is not enough for high-assurance handle binding.

## Agent Description

### What an Agent Description Does

The Agent Description document is the public entry page of an agent. Other agents read it to understand:

- the agent's name, DID, owner, and description
- public information resources such as products, services, documents, or media
- supported natural-language and structured interfaces
- security requirements
- optional proof for document integrity

ANP's information interaction pattern is crawler-like: agents publish URLs for data, descriptions, and interface documents; other agents fetch those resources, reason locally, and call the appropriate interface only when needed.

### Information and Interfaces

Agent Description uses two core ideas:

- **Information**: externally available resources, such as product descriptions, service descriptions, documents, videos, or other data.
- **Interface**: ways to interact with the agent.
  - `NaturalLanguageInterface`: flexible conversation interface.
  - `StructuredInterface`: structured API interface such as YAML-described APIs, OpenRPC, JSON-RPC, MCP-compatible interfaces, or WebRTC.
  - `MetaProtocolInterface`: optional draft extension for semantic negotiation.

If a structured interface can satisfy the task, agents should prefer it for precision and efficiency. Natural-language interfaces remain useful for open-ended requests.

### Agent Description Example

```json
{
  "protocolType": "ANP",
  "protocolVersion": "1.0.0",
  "type": "AgentDescription",
  "url": "https://grand-hotel.com/agents/hotel-assistant/ad.json",
  "name": "Grand Hotel Assistant",
  "did": "did:wba:grand-hotel.com:service:hotel-assistant:e1_<fingerprint>",
  "owner": {
    "type": "Organization",
    "name": "Grand Hotel Management Group",
    "url": "https://grand-hotel.com"
  },
  "description": "An intelligent hospitality agent for room booking, concierge services, guest assistance, and messaging.",
  "created": "2024-12-31T12:00:00Z",
  "securityDefinitions": {
    "didwba_sc": {
      "scheme": "didwba",
      "in": "header",
      "name": "Authorization"
    }
  },
  "security": "didwba_sc",
  "Infomations": [
    {
      "type": "Product",
      "description": "Luxury hotel rooms with premium amenities and personalized services.",
      "url": "https://grand-hotel.com/products/luxury-rooms.json"
    },
    {
      "type": "Information",
      "description": "Hotel facilities, amenities, location, and policies.",
      "url": "https://grand-hotel.com/info/hotel-basic-info.json"
    }
  ],
  "interfaces": [
    {
      "type": "NaturalLanguageInterface",
      "protocol": "YAML",
      "version": "1.2.2",
      "url": "https://grand-hotel.com/api/nl-interface.yaml",
      "description": "Natural language interface for conversational hotel services."
    },
    {
      "type": "StructuredInterface",
      "protocol": "openrpc",
      "url": "https://grand-hotel.com/api/booking-openrpc.json",
      "humanAuthorization": true,
      "description": "Structured interface for booking and reservation management."
    },
    {
      "type": "MetaProtocolInterface",
      "profile": "anp.meta.negotiation.v1",
      "binding": "jsonrpc-2.0",
      "url": "https://grand-hotel.com/anp",
      "methods": ["anp.get_capabilities", "anp.negotiate"],
      "description": "Optional draft negotiation interface."
    }
  ]
}
```

> Authentication note: this example preserves ANP-07's `didwba` declaration and its legacy `Authorization` field label. It does not replace ANP-02 request-header rules: new signed requests use `Signature-Input`, `Signature`, and applicable `Content-Digest`; do not infer the legacy DIDWba authorization scheme from this declaration.

> Note: the current Agent Description specification uses the field name `Infomations` in examples. Implementations should follow the active specification while being careful with compatibility if future versions correct the spelling.

## Agent Discovery

Agent Discovery defines how agents and search services find public Agent Description documents.

### Active Discovery

A domain can publish all public Agent Description URLs under:

```text
https://{domain}/.well-known/agent-descriptions
```

Example:

```json
{
  "@context": {
    "@vocab": "https://schema.org/",
    "did": "https://w3id.org/did#",
    "ad": "https://agent-network-protocol.com/ad#"
  },
  "@type": "CollectionPage",
  "url": "https://example.com/.well-known/agent-descriptions",
  "items": [
    {
      "@type": "ad:AgentDescription",
      "name": "Hotel Assistant",
      "@id": "https://example.com/agents/hotel-assistant/ad.json"
    },
    {
      "@type": "ad:AgentDescription",
      "name": "Customer Support Agent",
      "@id": "https://example.com/agents/support/ad.json"
    }
  ],
  "next": "https://example.com/.well-known/agent-descriptions?page=2"
}
```

Clients and search crawlers should follow `next` until all pages are retrieved.

### Passive Discovery

In passive discovery, an agent submits its Agent Description URL to a search service agent. The search service's registration API is described in that search service agent's own Agent Description document.

A typical passive discovery flow:

1. Read the search service agent's Agent Description.
2. Find its registration interface.
3. Submit your Agent Description URL.
4. The search service verifies, crawls, and indexes the description.

### Handle-Based Entry

WNS handle resolution can also be used as a discovery entry:

```text
alice.example.com -> DID -> DID Document -> AgentDescription service
```

However, clients must not infer service endpoints directly from the handle. The DID Document remains authoritative.

## Instant Messaging Protocol

ANP end-to-end instant messaging is a profile suite for cross-domain agent messaging. It is not a single centralized chat product protocol. It defines how agents discover messaging services, send direct and group messages, protect content, transfer attachments, and federate across domains.

### Core Ideas

- **Federated, not centralized**: different domains host their own agents and services.
- **Identity first**: `agent_did` and `group_did` are the primary identifiers.
- **Service discovery first**: messaging endpoints are discovered through DID Document `ANPMessageService` entries.
- **JSON-RPC 2.0 outer binding**: requests use `jsonrpc`, `method`, `id`, and object-shaped `params`.
- **Common params shape**: most methods use `params.meta`, optional `params.auth`, and `params.body`.
- **Base semantics and E2EE overlays are separate**: plaintext transport-protected mode and E2EE modes can coexist.
- **Control plane and data plane are separated**: attachments use manifests and separate HTTPS object transfer.

### Unified `ANPMessageService`

The current messaging profiles expect a DID Document to expose a single public `ANPMessageService` for cross-domain interaction. Internally, an implementation may have separate components for direct messages, groups, keys, objects, and federation, but externally these capabilities converge behind the unified service endpoint.

This example declares only ordinary DID-addressed messaging and attachment capabilities, without E2EE or a device Manifest requirement:

```json
{
  "id": "did:wba:example.com:user:alice:e1_<fingerprint>#message",
  "type": "ANPMessageService",
  "serviceEndpoint": "https://example.com/anp",
  "serviceDid": "did:wba:example.com",
  "profiles": [
    "anp.core.binding.v1",
    "anp.identity.discovery.v1",
    "anp.direct.base.v1",
    "anp.attachment.v1"
  ],
  "securityProfiles": [
    "transport-protected"
  ]
}
```

Before important interactions, callers should confirm runtime capabilities with:

```text
anp.get_capabilities
```

Runtime results are authoritative when static DID hints and runtime capability results differ.

Enabling `anp.direct.e2ee.v2` or candidate `anp.group.e2ee.v2` requires the full dependencies and P2 current `deviceManifest` eligibility rules. Appending a Profile string to the Base example is insufficient, and v1 sessions must not be silently interpreted as v2. See the [full messaging index](../message/README.md) and its multi-device examples.

### Messaging Profile Index

The [ANP Messaging 1.2 index](../message/README.md) contains nine documents. Ordinary Base operations remain DID/Group DID-addressed. P4 v2 defines DID-only membership and Host-coordinated DID updates; only P5/P6 v2 introduce cryptographic device endpoints. P6 remains a candidate pending its registered MLS ExtensionType release gate.

| Profile | Identifier / status | Purpose |
| --- | --- | --- |
| [P1 Core Binding](../message/01-core-binding.md) | `anp.core.binding.v1` | JSON-RPC 2.0 binding, `params` structure, capability negotiation, idempotency, and errors |
| [P2 Identity and Discovery](../message/02-identity-and-discovery.md) | `anp.identity.discovery.v1` | Agent DID / Group DID, DID Document interpretation, and `ANPMessageService` discovery |
| [P3 Direct Messaging Base Semantics](../message/03-direct-messaging-base-semantics.md) | `anp.direct.base.v1` | `direct.send`, content model, receipts, ordering, and sender proof boundaries |
| [P4 Group Messaging Base Semantics](../message/04-group-messaging-base-semantics.md) | `anp.group.base.v2` | group lifecycle, membership, group messages, group state versions, and host ordering |
| [P5 Direct End-to-End Encryption](../message/05-direct-end-to-end-encryption.md) | `anp.direct.e2ee.v2` | direct E2EE using DID-bound key material and ratcheting concepts |
| [P6 Group End-to-End Encryption](../message/06-group-end-to-end-encryption.md) | `anp.group.e2ee.v2`; candidate | MLS-based group E2EE and group cryptographic state |
| [P7 Attachments and Object Transfer](../message/07-attachments-and-object-transfer.md) | `anp.attachment.v1` | attachment manifests, object service, upload / download tickets, and object-level encryption |
| [P8 Federation and Cross-Domain](../message/08-federation-and-cross-domain.md) | `anp.federation.relay.v1` | cross-domain service invocation, routing, relaying, and result witnessing |
| [P9 Message Mentions Extension](../message/09-message-mentions.md) | v1 binding; no independent Profile | structured group-message mentions and selector semantics |

Recommended reading order: ANP-02 and the applicable method binding first, then P1/P2, P3/P4, P5/P6, and P7/P8/P9 as needed.

## Protocol SDK: AgentConnect

The ANP open-source SDK and reference implementation is maintained in AgentConnect:

- [https://github.com/agent-network-protocol/AgentConnect](https://github.com/agent-network-protocol/AgentConnect)

AgentConnect provides SDK support for identity, authentication, proofs, WNS, Agent Description, OpenRPC / JSON-RPC, crawling, AP2, E2EE, and examples.

The table below is a historical SDK navigation snapshot checked on 2026-06-27, not current registry status or an ANP 1.2 conformance matrix. Confirm package names, versions, Profile support, and enablement in the SDK repository and the implementation's verification evidence:

| Language | Package / module | How to start | Status |
| --- | --- | --- | --- |
| Python | `anp` | `pip install anp` or `pip install "anp[api]"` | stable published SDK |
| Go | `github.com/agent-network-protocol/anp/golang` | `go get github.com/agent-network-protocol/anp/golang@latest` | stable published SDK |
| Rust | `anp` | `cargo add anp` | stable published SDK |
| Dart | `anp` | `dart pub add anp` | published SDK |
| TypeScript | `@anp/typescript-sdk` workspace | build from `typescript/ts_sdk` source | preview / local source |
| Java | `com.agentconnect:anp4j` and Spring Boot starter | build from `java` source | local SDK |

### Minimal Python Agent with OpenANP

```bash
pip install "anp[api]"
```

```python
from fastapi import FastAPI
from anp.openanp import AgentConfig, anp_agent, interface

@anp_agent(AgentConfig(
    name="Calculator",
    did="did:wba:example.com:calculator:e1_<fingerprint>",
    prefix="/agent",
    description="A simple calculator agent",
))
class CalculatorAgent:
    @interface
    async def add(self, a: int, b: int) -> int:
        return a + b

app = FastAPI(title="Calculator Agent")
app.include_router(CalculatorAgent.router())
```

Typical generated endpoints:

| Endpoint | Purpose |
| --- | --- |
| `GET /agent/ad.json` | Agent Description document |
| `GET /agent/interface.json` | OpenRPC interface document |
| `POST /agent/rpc` | JSON-RPC 2.0 method calls |

## Recommended Reading Path

1. Read the [README](../README.md) for the current specification index and architecture.
2. Read [ANP-02: DID Authentication](../02-anp-did-authentication-protocol-specification.md) first, then [ANP-03: did:wba](../03-did-wba-method-design-specification.md) or the [native did:web integration appendix](../appendix-b-compatibility-with-native-did-web.md) for the applicable method; read [ANP-04: WNS](../04-anp-did-wba-name-space-specification.md) when human-readable naming is needed.
3. Read [ANP-07: Agent Description](../07-anp-agent-description-protocol-specification.md) and [ANP-08: Agent Discovery](../08-ANP-Agent-Discovery-Protocol-Specification.md) to publish and find agents.
4. Read [ANP-09](../09-ANP-end-to-end-instant-messaging-protocol-specification.md) and the messaging profiles when building messaging.
5. Use [AgentConnect](https://github.com/agent-network-protocol/AgentConnect) to build or test a working implementation.

### ANP Process Detailed Explanation

The overall ANP process is as follows:

![](/images/anp-flow.png)

The ANP process mainly includes the following steps:

1. **Agent Discovery**: Search engines crawl Agent B's information through the agent discovery mechanism (`.well-known/agent-descriptions`), including its description document URL, name, and other basic information.

2. **Agent Search**: Agent A finds Agent B's description document URL through a search engine. This step allows agents to find suitable service providers through semantic search without knowing the specific domain of the other party.

3. **Authentication Request**: Agent A signs the request using its private key and carries its own DID identifier, requesting a description document or service from Agent B. The signature ensures the authenticity and integrity of the request.

4. **Authentication**: After receiving the request, Agent B obtains Agent A's DID document based on the DID identifier in the request, extracts the public key from it, and verifies the validity of the request signature, confirming Agent A's identity.

5. **Service Interaction**: After authentication and independent business-authorization checks succeed, Agent B returns the requested data or service response. Agent A completes tasks based on the returned data, such as booking a hotel, querying information, etc. The entire process is based on standardized interfaces and data formats, ensuring cross-platform interoperability.

This method of authentication based on DIDs and standardized description documents enables agents to securely and efficiently discover and interact with each other on the internet without relying on centralized platforms.
