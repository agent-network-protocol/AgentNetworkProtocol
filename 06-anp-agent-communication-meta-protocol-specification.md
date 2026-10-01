# ANP Agent Communication Meta-Protocol Specification (Draft)

- Document ID: ANP-06
- Title: ANP Agent Communication Meta-Protocol Specification
- Status: Draft
- Version: 1.2
- Language: English
- Applicability: This specification applies to semantic meta-protocol negotiation, interface selection, Profile selection, security-profile selection, schema selection, and negotiation-result reuse between ANP agents.

Notes:

- The meta-protocol is not a mandatory protocol for agent collaboration; it is optional. In normal cases, agent identity, messaging, discovery, and description protocols are sufficient for most interoperability needs. The meta-protocol is primarily used when two agents need to dynamically negotiate a pair-specific interface, temporary protocol, or special execution constraints.
- This specification is still a draft and has not been released. Its goal is to upgrade the early message-embedded meta-protocol negotiation model into an independent negotiation Profile compatible with the current ANP description, discovery, Core Binding, DID authentication, and messaging Profile architecture.
- This specification does not modify the ANP Agent Description Protocol. The `MetaProtocolInterface` defined here is an ANP-06 extension interface type that can be declared in the `interfaces` array of an Agent Description document.
- New implementations should use `anp.meta.negotiation.v1` and `anp.negotiate` as defined in this specification. The early encrypted-message-internal binary `PT=00` negotiation model is deprecated, and this specification does not require or recommend compatibility with old implementations.

## Abstract

A meta-protocol is a protocol for negotiating communication protocols. In an agent network, it lets a caller and a target agent select the protocol, interface, Profile, schema, content type, security profile, and execution mode that should be used for the subsequent business interaction, based on intent, capabilities, constraints, security requirements, and available interfaces.

This specification redefines the ANP meta-protocol as an independent semantic negotiation Profile:

```text
Agent Discovery
  -> Agent Description
  -> MetaProtocolInterface
  -> anp.get_capabilities
  -> anp.negotiate
  -> selected interface / profile / security profile / schema
  -> business call or message exchange
```

Unlike the early design that distinguished meta protocol, application protocol, natural-language protocol, and verification protocol by a binary Protocol Type inside a message payload, this specification does not define a new transport layer, a new encrypted-message format, or a replacement for ANP Core Binding. Meta-protocol negotiation messages should run as ordinary ANP JSON-RPC requests on existing ANP endpoints.

## 1. Background and Problem Statement

Agent interoperability usually starts from public descriptions: a target agent exposes capabilities, interfaces, and security requirements through its Agent Description, and the caller reads that description to select an appropriate interaction method. As the number of agents and interface types grows, static description alone has several limitations:

1. **Static description cannot cover runtime changes**: server throttling, available security profiles, temporarily disabled interfaces, user authorization state, and deployment policy can change at runtime.
2. **The same intent may have multiple usable interfaces**: for example, hotel booking may be performed through a structured OpenRPC interface or through a natural-language messaging interface.
3. **Caller capability also affects selection**: whether the caller supports a specific ANP Profile, security profile, content type, or asynchronous execution mode affects the final protocol choice.
4. **Natural-language ad-hoc negotiation is expensive**: fully relying on natural-language multi-round negotiation increases latency, cost, and uncertainty.
5. **The early message-embedded model is no longer aligned with the current protocol stack**: early ANP-06 directly extended encrypted message payloads and used a binary `PT` field to distinguish protocol types. Current ANP has converged on DID discovery, Agent Description, `ANPMessageService`, JSON-RPC 2.0 Core Binding, and runtime capability confirmation.

Therefore, the new ANP-06 positions the meta-protocol as a semantic negotiation control plane. It does not carry business data; it helps both parties determine which interoperability path should be used before business execution begins.

### 1.1 Design Origins

The ANP meta-protocol draws inspiration from [Agora Protocol, described in *A Scalable Communication Protocol for Networks of Large Language Models*](https://arxiv.org/html/2410.11905v1), particularly the use of a meta-protocol to negotiate how agents communicate and combine natural-language flexibility with structured-protocol efficiency. ANP adapts these ideas to its own agent description, discovery, identity authentication, and Core Binding architecture; the negotiation interfaces and interoperability requirements are defined by this specification.

## 2. Design Goals and Non-Goals

### 2.1 Design Goals

This specification aims to:

- Define a standard Profile: `anp.meta.negotiation.v1`;
- Define `MetaProtocolInterface` as an interface type that can be declared in the `interfaces` array of an Agent Description document;
- Reuse ANP Core Binding's JSON-RPC 2.0, `params.meta/body/auth`, `profile`, `security_profile`, `target`, and error model;
- Reuse `anp.get_capabilities` as the runtime capability confirmation method;
- Define `anp.negotiate` for selecting the final execution interface based on caller intent, caller capabilities, and constraints;
- Support structured-interface-first negotiation, natural-language fallback, cache reuse, and future protocol artifact publication;
- Explicitly mark the early `PT=00` message negotiation model as deprecated and outside the compatibility scope of this specification.

### 2.2 Non-Goals

This specification does not define:

- A new transport layer, session layer, or binary message header;
- A new DID method or a new identity authentication mechanism;
- A new end-to-end encryption algorithm;
- The complete specification of `anp.get_capabilities`; that method is defined by Core Binding;
- The request, response, or state machine of business interfaces themselves;
- Mandatory AI code generation, remote code loading, or code exchange;
- A global protocol registry, consensus-protocol election algorithm, or economic incentive mechanism.

## 3. Relationship with Existing ANP Protocols

### 3.1 Relationship with Agent Description

Agent Description is the public entry point of an agent and describes the agent's DID, owner, information resources, interfaces, and security configuration. The `MetaProtocolInterface` defined in this document is an extension interface type that can be placed in the `interfaces` array of an Agent Description document. It declares:

- That the agent supports ANP-06 meta-protocol negotiation;
- Where the negotiation endpoint is;
- Which binding the endpoint uses;
- Which negotiation methods are supported;
- Which objects can be negotiated, such as Profiles, Interfaces, Schemas, Security Profiles, Content Types, and Execution Modes.

This specification does not require changes to ANP-07. Implementations can publish `MetaProtocolInterface` as an extension `Interface` object while preserving the existing Agent Description structure.

### 3.2 Relationship with Agent Discovery

Discovery remains defined by ANP-08. A caller can first obtain an Agent Description URL through active discovery or another trusted channel, for example:

```text
https://{domain}/.well-known/agent-descriptions
```

The caller then reads the target Agent Description document and looks for `MetaProtocolInterface` in the `interfaces` array.

### 3.3 Relationship with Core Binding

ANP-06 runtime messages use ANP Core Binding conventions:

- JSON-RPC 2.0;
- The `params.meta`, `params.auth`, and `params.body` structure;
- `meta.profile` indicates the interpretation Profile of the request;
- `meta.security_profile` indicates the security profile used by the request;
- `meta.target` indicates the target modeling;
- JSON-RPC `error` objects carry errors.

For `anp.negotiate`, `params.meta.profile` MUST be exactly:

```text
anp.meta.negotiation.v1
```

### 3.4 Relationship with DID Documents and ANPMessageService

`MetaProtocolInterface.url` in an Agent Description is a static declaration and availability hint. The authority for identity and service discovery still comes from the `ANPMessageService` exposed in the DID Document, and the authority for runtime capabilities comes from the result of `anp.get_capabilities`.

When Agent Description, DID Document, and runtime capability results conflict, the caller SHOULD process them in this order:

1. Use the DID Document and DID resolution result to establish trust in identity and service endpoints;
2. Call `anp.get_capabilities` to obtain runtime capabilities;
3. Treat `MetaProtocolInterface` in Agent Description as discovery and semantic hints;
4. If static hints conflict with runtime capabilities, the caller MUST use the runtime capability result and refresh its local cache.

### 3.5 Relationship with DID:WBA and Security Mechanisms

This specification does not redefine DID methods or authentication. Common request authentication, HTTP Message Signatures, and access tokens follow [ANP-02](02-anp-did-authentication-protocol-specification.md); WBA method validation follows [ANP-03](03-did-wba-method-design-specification.md), while other DIDs follow their own methods. `auth.origin_proof` and messaging service-to-service verification follow P1/P2 and the owning Profile's security requirements. Document version 1.2 does not change this specification's draft status or its `anp.meta.negotiation.v1` wire identifier.

The negotiation result of `anp.negotiate` is not an identity credential, authorization credential, access token, Verifiable Credential, or human-authorization result.

## 4. Profile Identification and Minimum Interoperability

### 4.1 Profile Name

The Profile name defined by this specification is:

```text
anp.meta.negotiation.v1
```

Agent Description, `anp.get_capabilities` results, `params.meta.profile`, and Profile references in negotiation results should use this name.

### 4.2 Standard Method

This specification defines one standard method:

```text
anp.negotiate
```

This method selects the capability, interface, protocol, Profile, security profile, content type, schema, and execution mode that should be used for the subsequent business interaction, based on caller intent, caller capabilities, candidate interfaces, and constraints.

### 4.3 Minimum Interoperability Requirements

An implementation that supports `anp.meta.negotiation.v1` MUST at least support:

1. Declaring `anp.meta.negotiation.v1` in runtime capabilities;
2. Handling `anp.negotiate` on endpoints that support meta-protocol negotiation;
3. Recognizing the basic fields of `MetaProtocolInterface`: `type`, `profile`, `binding`, `url`, and `methods`;
4. Negotiation under the `transport-protected` security profile;
5. Returning a structured `NegotiationResult`;
6. Returning explicit errors for unsupported Profiles, interfaces, security profiles, or content types;
7. Not interpreting a negotiation result as authorization for business execution.

## 5. `MetaProtocolInterface` Declaration

### 5.1 Semantics

`MetaProtocolInterface` represents a semantic meta-protocol negotiation interface publicly exposed by an agent. It is an extension interface type inside the Agent Description `interfaces` array.

This interface declares:

- Which URL callers should send negotiation requests to;
- Which binding negotiation requests use;
- Which negotiation methods are supported;
- Which objects can be negotiated;
- Which security configuration is required.

### 5.2 Field Definitions

| Field | Type | Requirement | Description |
|---|---|---|---|
| `id` | string | SHOULD | Stable identifier of the Interface, used for references in negotiation results. |
| `type` | string | MUST | Fixed to `MetaProtocolInterface`. |
| `protocol` | string | SHOULD | Recommended value: `ANP`, indicating that this is an ANP protocol interface. |
| `version` | string | SHOULD | Version of the interface declaration. |
| `profile` | string | MUST | Fixed to `anp.meta.negotiation.v1`. |
| `binding` | string | MUST | In this version, it should be `jsonrpc-2.0`. |
| `url` | string | MUST | Negotiation endpoint URL. This URL is a static hint; DID Document and `anp.get_capabilities` remain authoritative at runtime. |
| `methods` | array | MUST | MUST include at least `anp.negotiate`; usually also includes `anp.get_capabilities`. |
| `security` | array/string | MAY | References security definitions in the Agent Description. |
| `securityProfiles` | array | SHOULD | Supported security profiles, such as `transport-protected` or `direct-e2ee`. |
| `negotiates` | array | SHOULD | List of negotiable object types. |
| `inputSchema` | string | MAY | URI of the negotiation request schema. |
| `outputSchema` | string | MAY | URI of the negotiation result schema. |
| `description` | string | SHOULD | Human-readable description. |

### 5.3 Negotiable Objects

Common values in `negotiates` include:

| Value | Description |
|---|---|
| `profiles` | Negotiate the ANP Profile used for subsequent business calls. |
| `interfaces` | Negotiate which Agent Description interface to use. |
| `schemas` | Negotiate request and response schemas. |
| `security_profiles` | Negotiate security profiles. |
| `content_types` | Negotiate content types. |
| `execution_modes` | Negotiate synchronous calls, messages, asynchronous tasks, streaming, or natural-language fallback. |
| `protocol_artifacts` | Negotiate reusable protocol artifacts, digests, or URIs. |

### 5.4 Declaration Example

```json
{
  "id": "interface.negotiation.default",
  "type": "MetaProtocolInterface",
  "protocol": "ANP",
  "version": "1.0",
  "profile": "anp.meta.negotiation.v1",
  "binding": "jsonrpc-2.0",
  "url": "https://grand-hotel.com/anp",
  "methods": [
    "anp.get_capabilities",
    "anp.negotiate"
  ],
  "security": ["didwba_sc"],
  "securityProfiles": [
    "transport-protected"
  ],
  "negotiates": [
    "profiles",
    "interfaces",
    "schemas",
    "security_profiles",
    "content_types",
    "execution_modes"
  ],
  "description": "Semantic meta-protocol negotiation interface for selecting the best execution interface."
}
```

### 5.5 Recommended Endpoint Deployment

Implementations SHOULD prefer reusing a unified ANP endpoint, for example:

```text
https://example.com/anp
```

The same endpoint can support:

```text
anp.get_capabilities
anp.negotiate
direct.send
group.send
...
```

Implementations MAY deploy a dedicated endpoint for meta-protocol negotiation, for example:

```text
https://example.com/anp/negotiation
```

However, this is a deployment choice, not a protocol requirement. Regardless of URL organization, service identity and runtime capabilities should still be confirmed through the DID Document and `anp.get_capabilities`.

## 6. Negotiation Flow

### 6.1 Overall Flow

```text
Caller Agent
  -> discover Agent Description
  -> parse MetaProtocolInterface
  -> resolve target DID and ANPMessageService
  -> call anp.get_capabilities
  -> call anp.negotiate
  -> receive NegotiationResult
  -> invoke selected interface or profile
```

### 6.2 Step 1: Discover Agent Description

The caller obtains the target Agent Description URL through ANP-08 active discovery or another trusted channel.

### 6.3 Step 2: Parse `MetaProtocolInterface`

The caller reads the Agent Description and looks in the `interfaces` array for:

```json
{
  "type": "MetaProtocolInterface",
  "profile": "anp.meta.negotiation.v1"
}
```

If the target agent does not declare `MetaProtocolInterface`, the caller MAY:

- Directly use existing structured interfaces in the Agent Description;
- Use a natural-language interface;
- Stop automatic negotiation and ask for human handling;
- Use a protocol artifact cached by both parties.

### 6.4 Step 3: Runtime Capability Confirmation

The caller SHOULD call `anp.get_capabilities` before the first interaction. This method returns the endpoint's currently supported Profiles, security profiles, content types, and limits.

`anp.get_capabilities` may be called anonymously. If the server returns different capability subsets based on caller identity, the caller MAY call it again after authentication.

### 6.5 Step 4: Semantic Negotiation

The caller sends an `anp.negotiate` request carrying:

- Caller intent;
- Required capabilities;
- Profiles, security profiles, and content types supported by the caller;
- Candidate interface references;
- Constraints such as latency, authorization, and natural-language fallback.

The target agent returns a `NegotiationResult` based on static description, runtime capabilities, local policy, authorization state, and caller capabilities.

### 6.6 Step 5: Execute the Business Interaction

After receiving `NegotiationResult`, the caller performs the actual business call or message interaction according to `result.selected` and `result.execution`.

The response to `anp.negotiate` is not a business response. Whether the business interface succeeds, requires human authorization, or creates a transaction or state change is determined by the subsequently selected business protocol.

## 7. `anp.negotiate` Method

### 7.1 Method Semantics

`anp.negotiate` is a JSON-RPC 2.0 Request method used for semantic meta-protocol negotiation.

Method name:

```text
anp.negotiate
```

The request's `params.meta.profile` MUST be exactly:

```text
anp.meta.negotiation.v1
```

The target modeling mode is usually `agent-addressed`. When a deployment exposes meta-protocol negotiation as a service-scoped control-plane capability, the specific Profile or implementation document MUST explicitly define target-binding rules.

### 7.2 Request Structure

```json
{
  "jsonrpc": "2.0",
  "id": "req-neg-001",
  "method": "anp.negotiate",
  "params": {
    "meta": {
      "profile": "anp.meta.negotiation.v1",
      "security_profile": "transport-protected",
      "sender_did": "did:wba:user.example.com:agents:personal-assistant:e1_example",
      "target": {
        "kind": "agent",
        "did": "did:wba:grand-hotel.com:service:hotel-assistant:e1_example"
      },
      "operation_id": "op-neg-001",
      "created_at": "2026-06-27T12:00:05Z",
      "content_type": "application/json"
    },
    "auth": {
      "origin_proof": {
        "type": "anp-rfc9421-origin-proof-v1",
        "keyid": "did:wba:user.example.com:agents:personal-assistant:e1_example#key-1",
        "contentDigest": "sha-256=:BASE64URL_DIGEST:",
        "signature": "BASE64URL_SIGNATURE"
      }
    },
    "body": {
      "negotiation_id": "neg-20260627-001",
      "mode": "structured_selection",
      "intent": {
        "name": "book_hotel_room",
        "description": "Book a hotel room for two people next Friday.",
        "intentTags": [
          "hotel.booking",
          "reservation.create"
        ]
      },
      "requiredCapabilities": [
        "cap.hotel.booking"
      ],
      "callerCapabilities": {
        "supportedProfiles": [
          "anp.core.binding.v1",
          "anp.direct.base.v1",
          "anp.rpc.v1"
        ],
        "supportedSecurityProfiles": [
          "transport-protected",
          "direct-e2ee"
        ],
        "supportedContentTypes": [
          "application/json",
          "text/plain"
        ]
      },
      "constraints": {
        "preferredInterfaceTypes": [
          "StructuredInterface",
          "NaturalLanguageInterface"
        ],
        "requiresHumanAuthorization": true,
        "maxLatencyMs": 3000,
        "allowNaturalLanguageFallback": true
      },
      "candidateInterfaceRefs": [
        "interface.booking.structured.v1",
        "interface.conversation.nl.v1"
      ]
    }
  }
}
```

### 7.3 `body` Field Definitions

| Field | Type | Requirement | Description |
|---|---|---|---|
| `negotiation_id` | string | SHOULD | Identifier of the negotiation process. |
| `mode` | string | SHOULD | Negotiation mode. Default: `structured_selection`. |
| `intent` | object | MUST | The goal the caller wants to accomplish. |
| `requiredCapabilities` | array | MAY | Capability identifiers that the caller considers mandatory. |
| `callerCapabilities` | object | SHOULD | Runtime capabilities of the caller. |
| `constraints` | object | MAY | Constraints such as latency, authorization, interface preference, and security preference. |
| `candidateInterfaceRefs` | array | MAY | Candidate interface IDs selected by the caller from Agent Description. |
| `candidateProtocols` | array | MAY | Candidate protocol artifacts, Profiles, or URIs. A large natural-language text should not be the only machine-processable content. |

### 7.4 `intent` Object

`intent` expresses what the caller wants to accomplish. It SHOULD include structured tags and MAY include a natural-language description.

```json
{
  "name": "book_hotel_room",
  "description": "Book a hotel room for two people next Friday.",
  "intentTags": [
    "hotel.booking",
    "reservation.create"
  ],
  "inputSummary": {
    "city": "Hangzhou",
    "guests": 2,
    "date": "2026-07-03"
  }
}
```

The caller SHOULD follow the principle of minimal disclosure and should not provide sensitive data that is unnecessary for negotiation.

### 7.5 `callerCapabilities` Object

`callerCapabilities` describes the caller's current capabilities. Common fields include:

| Field | Type | Description |
|---|---|---|
| `supportedProfiles` | array | ANP Profiles supported by the caller. |
| `supportedSecurityProfiles` | array | Security profiles supported by the caller. |
| `supportedContentTypes` | array | Content types that the caller can handle. |
| `supportedExecutionModes` | array | Execution modes acceptable to the caller. |
| `limits` | object | Caller-side limits such as maximum message size and timeout. |

### 7.6 `constraints` Object

`constraints` expresses caller preferences or hard requirements. Common fields include:

| Field | Type | Description |
|---|---|---|
| `preferredInterfaceTypes` | array | Preferred interface types, such as `StructuredInterface`. |
| `requiresHumanAuthorization` | boolean | Whether this intent is expected to require human authorization. This is only a negotiation constraint and does not mean authorization has been completed. |
| `maxLatencyMs` | integer | Expected maximum latency. |
| `allowNaturalLanguageFallback` | boolean | Whether fallback to natural-language protocol drafting or a natural-language interface is allowed. |
| `requiredSecurityProfile` | string | Required security profile. |
| `preferredContentTypes` | array | Preferred content types. |

## 8. Negotiation Result Object

### 8.1 Successful Response

When `anp.negotiate` succeeds, it returns `result`:

```json
{
  "jsonrpc": "2.0",
  "id": "req-neg-001",
  "result": {
    "negotiationId": "neg-20260627-001",
    "status": "accepted",
    "selected": {
      "capability": "cap.hotel.booking",
      "interface": "interface.booking.structured.v1",
      "protocol": "openrpc",
      "profile": "anp.rpc.v1",
      "securityProfile": "transport-protected",
      "contentType": "application/json",
      "url": "https://grand-hotel.com/api/booking.openrpc.json"
    },
    "execution": {
      "mode": "direct_structured_call",
      "requiresHumanAuthorization": true,
      "timeoutMs": 3000
    },
    "schemas": {
      "requestSchema": "https://grand-hotel.com/schemas/create-booking-request.schema.json",
      "responseSchema": "https://grand-hotel.com/schemas/create-booking-response.schema.json"
    },
    "validUntil": "2026-06-27T12:10:05Z",
    "negotiationDigest": "sha-256:BASE64URL_DIGEST"
  }
}
```

### 8.2 Field Definitions

| Field | Type | Requirement | Description |
|---|---|---|---|
| `negotiationId` | string | MUST | Identifier of the negotiation result. |
| `status` | string | MUST | `accepted`, `rejected`, or `needs_more_information`. |
| `selected` | object | MUST when `accepted` | Selected capability, interface, protocol, Profile, security profile, content type, and URL. |
| `execution` | object | SHOULD | Subsequent execution mode and execution constraints. |
| `schemas` | object | MAY | Request and response schemas. |
| `validUntil` | string | MAY | Expiration time of the negotiation result. |
| `negotiationDigest` | string | SHOULD | Digest of the negotiation result, used for caching and reuse. |
| `alternatives` | array | MAY | Candidate options that were not selected. |
| `reason` | string | MAY | Human-readable explanation when rejected or when more information is required. |

### 8.3 `selected` Object

`selected` indicates the path that should be used for the subsequent business interaction. Common fields include:

| Field | Description |
|---|---|
| `capability` | Selected capability ID. |
| `interface` | Selected Agent Description interface ID. |
| `protocol` | Protocol used by the selected interface, such as `openrpc`, `ANP`, or `MCP`. |
| `profile` | ANP Profile used by the subsequent business call. |
| `securityProfile` | Security profile used by the subsequent business call. |
| `contentType` | Content type of the subsequent business payload. |
| `url` | Business interface endpoint or interface description URL. |
| `protocolArtifact` | Optional protocol artifact URI or digest. |

### 8.4 `execution` Object

Common values of `execution.mode` include:

| Value | Description |
|---|---|
| `direct_structured_call` | Directly call a structured interface. |
| `direct_message` | Use a direct messaging Profile. |
| `group_message` | Use a group messaging Profile. |
| `async_task` | Create an asynchronous task or collaboration flow. |
| `stream` | Use streaming interaction. |
| `natural_language` | Use a natural-language interface. |
| `natural_language_protocol_drafting` | Use natural language to draft a temporary protocol. |

## 9. Natural-Language Protocol Drafting Fallback

Structured negotiation is the main path of this specification. Natural-language protocol drafting is a fallback for cases where:

- The target agent does not have a structured interface that satisfies the intent;
- The caller and target do not share a supported Profile or schema;
- Both parties need to draft an experimental temporary protocol;
- The task is low-frequency, one-off, or highly personalized.

The caller can declare this in an `anp.negotiate` request:

```json
{
  "mode": "natural_language_protocol_drafting",
  "constraints": {
    "allowNaturalLanguageFallback": true
  }
}
```

Natural-language fallback MAY produce a draft protocol artifact, but that artifact should not be treated as a stable protocol before both parties accept it. Implementations SHOULD convert natural-language drafts into structured fields, schemas, examples, and test cases whenever possible.

## 10. Caching, Reuse, and Protocol Artifacts

### 10.1 Negotiation Result Caching

The caller MAY cache `NegotiationResult` and reuse it within its validity period. A cache key SHOULD include at least:

- Target Agent DID;
- Caller DID or caller capability digest;
- Intent tags or normalized intent digest;
- Selected interface ID;
- `selected.profile`;
- `selected.securityProfile`;
- `negotiationDigest`.

The caller SHOULD renegotiate when:

- `validUntil` expires;
- `anp.get_capabilities` returns a result inconsistent with the cache;
- DID Document or `ANPMessageService` changes;
- A subsequent business call returns an unsupported Profile, interface, security profile, or content type error;
- Local policy, security requirements, or user authorization state changes.

### 10.2 Protocol Artifacts

A protocol artifact is a reusable protocol description object. It MAY include:

- `protocol_id`;
- `protocol_uri`;
- `version`;
- Method list;
- Request and response schemas;
- Supported security profiles;
- Content types;
- Examples;
- Test cases;
- Digest;
- Signature or publisher information.

Example:

```json
{
  "protocol_id": "example.product-info.v1",
  "protocol_uri": "https://example.com/protocols/product-info/1.0",
  "version": "1.0",
  "description": "Get product information by product ID.",
  "depends_on_profiles": [
    "anp.core.binding.v1"
  ],
  "methods": [
    {
      "name": "product.get_info",
      "request_schema_uri": "https://example.com/schemas/product-info-request.json",
      "response_schema_uri": "https://example.com/schemas/product-info-response.json"
    }
  ],
  "content_types": [
    "application/json"
  ],
  "security_profiles": [
    "transport-protected"
  ],
  "digest": "sha-256:BASE64URL_DIGEST"
}
```

This specification does not define a global artifact registry. Artifact publication, review, signing, version governance, and consensus mechanisms are left to future specifications.

### 10.3 Relationship with the Early 0RTT Idea

Early ANP-06 used `usedProtocolHash` in handshake messages to skip negotiation. This specification does not define new handshake messages. The equivalent capability should be implemented as follows:

1. The caller caches `NegotiationResult` or a protocol artifact;
2. Subsequent requests directly use the selected Profile / Interface / Schema;
3. If the target endpoint does not support that selection, it returns an explicit error;
4. The caller then calls `anp.get_capabilities` and `anp.negotiate` again.

## 11. Error Model

`anp.negotiate` uses JSON-RPC `error` objects to return errors. Implementations are recommended to use ANP custom error ranges and provide machine-readable codes in `error.data.anp_code`.

| code | anp_code | Meaning |
|---|---|---|
| 1600 | `meta.negotiation_rejected` | The target rejects the negotiation request. |
| 1601 | `meta.no_matching_interface` | No interface satisfies the intent and constraints. |
| 1602 | `meta.unsupported_negotiation_mode` | The requested negotiation mode is not supported. |
| 1603 | `meta.unsupported_candidate_profile` | A candidate Profile is not supported. |
| 1604 | `meta.unsupported_security_profile` | A candidate security profile is not supported. |
| 1605 | `meta.unsupported_content_type` | A candidate content type is not supported. |
| 1606 | `meta.more_information_required` | More information is required before negotiation can complete. |
| 1607 | `meta.authorization_required` | Authentication or authorization context is required first. |
| 1608 | `meta.negotiation_expired` | The negotiation result or request has expired. |

Error example:

```json
{
  "jsonrpc": "2.0",
  "id": "req-neg-001",
  "error": {
    "code": 1601,
    "message": "No matching interface",
    "data": {
      "anp_code": "meta.no_matching_interface",
      "retryable": false,
      "details": {
        "unsupportedConstraints": [
          "requiredSecurityProfile"
        ]
      }
    }
  }
}
```

## 12. Security and Privacy Considerations

### 12.1 Identity Authentication

`anp.get_capabilities` MAY be called as an anonymous public discovery capability.

If `anp.negotiate` contains any of the following, the caller SHOULD provide `auth.origin_proof` or an equivalent DID authentication context:

- `sender_did`;
- Sensitive intent;
- User context;
- Restricted capabilities;
- Payment, booking, transaction, authorization, identity, or privacy-related capabilities;
- Non-public candidate interfaces;
- Cases where the server returns different negotiation results based on identity.

The server MAY return only a capability subset for anonymous `anp.negotiate`, reject the request, or require authentication.

### 12.2 Negotiation Results Are Not Authorization

`NegotiationResult` only describes how the subsequent interaction should happen. It does not mean:

- The user has approved the business action;
- The server has authorized access to restricted resources;
- A payment, booking, or transaction has been created;
- The caller has obtained a long-term access credential;
- The subsequent business request can omit the proof required by the business Profile.

If the selected interface requires `humanAuthorization`, the subsequent business flow MUST still complete authorization according to the corresponding business protocol.

### 12.3 Minimal Disclosure

The caller SHOULD minimize information disclosure in negotiation requests:

- Intent should include only the summary required for negotiation;
- Full payment information, identity documents, private messages, or large object contents should not be submitted during negotiation;
- `callerCapabilities` should be trimmed to avoid exposing unrelated internal capabilities;
- Negotiation logs should be redacted.

### 12.4 Downgrade Attacks

The caller and server MUST NOT silently downgrade from a stronger security profile to a weaker security profile without explicit agreement.

If the caller requires `direct-e2ee`, the server must not silently return `transport-protected`. If the requirement cannot be satisfied, the server should return an explicit error.

### 12.5 Protocol Artifact Security

If a negotiation result references an external protocol artifact, implementations SHOULD verify:

- Artifact digest;
- Publisher or signature;
- Schema integrity;
- Version and dependencies;
- Whether the artifact contains unsafe code, remote execution instructions, or excessive permission requirements.

This specification does not require executing remote code. Any code generation or code loading is a local implementation detail and must be handled in a sandboxed, least-privilege environment.

## 13. Deprecation of Legacy `PT=00` Message Negotiation

Early ANP-06 drafts defined a one-byte binary header inside end-to-end encrypted message payloads and used the `PT` field to distinguish meta protocol, application protocol, natural-language protocol, and verification protocol. That model also defined flows such as `sourceHello`, `destinationHello`, `candidateProtocols`, `codeGeneration`, `testCasesNegotiation`, and `fixErrorNegotiation`.

That early model is deprecated. New implementations MUST use `anp.meta.negotiation.v1` and `anp.negotiate` as defined in this specification, and MUST NOT implement or depend on the old binary `PT` message header, old Hello flow, or old code-generation flow as an ANP-06 interoperability path.

This specification does not provide a compatibility mapping from the old model to the new model, and does not require compatibility gateways. If a deployment still has an early experimental implementation, it should be treated as a private historical implementation and upgraded to this specification through a separate migration task; that migration is outside the minimum interoperability requirements of ANP-06.

## 14. Examples

### 14.1 Agent Description Fragment

```json
{
  "protocolType": "ANP",
  "protocolVersion": "1.1",
  "type": "AgentDescription",
  "url": "https://grand-hotel.com/agents/hotel-assistant/ad.json",
  "name": "Grand Hotel Assistant",
  "did": "did:wba:grand-hotel.com:service:hotel-assistant:e1_example",
  "securityDefinitions": {
    "didwba_sc": {
      "scheme": "didwba",
      "in": "header",
      "name": "Authorization"
    }
  },
  "security": "didwba_sc",
  "capabilities": [
    {
      "id": "cap.hotel.booking",
      "name": "Hotel room booking",
      "description": "Book hotel rooms, modify reservations, and check room availability.",
      "intentTags": [
        "hotel.booking",
        "reservation.create",
        "reservation.modify"
      ],
      "requiresHumanAuthorization": true
    }
  ],
  "interfaces": [
    {
      "id": "interface.negotiation.default",
      "type": "MetaProtocolInterface",
      "protocol": "ANP",
      "version": "1.0",
      "profile": "anp.meta.negotiation.v1",
      "binding": "jsonrpc-2.0",
      "url": "https://grand-hotel.com/anp",
      "methods": [
        "anp.get_capabilities",
        "anp.negotiate"
      ],
      "security": ["didwba_sc"],
      "securityProfiles": [
        "transport-protected"
      ],
      "negotiates": [
        "profiles",
        "interfaces",
        "schemas",
        "security_profiles",
        "content_types",
        "execution_modes"
      ],
      "description": "Endpoint for runtime capability and semantic meta-protocol negotiation."
    },
    {
      "id": "interface.booking.structured.v1",
      "type": "StructuredInterface",
      "protocol": "openrpc",
      "version": "1.0",
      "profile": "anp.rpc.v1",
      "url": "https://grand-hotel.com/api/booking.openrpc.json",
      "capabilityRefs": [
        "cap.hotel.booking"
      ],
      "humanAuthorization": true,
      "description": "Structured booking interface for room reservation."
    },
    {
      "id": "interface.conversation.nl.v1",
      "type": "NaturalLanguageInterface",
      "protocol": "ANP",
      "version": "1.0",
      "profile": "anp.direct.base.v1",
      "url": "https://grand-hotel.com/anp",
      "capabilityRefs": [
        "cap.hotel.booking"
      ],
      "description": "Natural language conversation interface."
    }
  ]
}
```

Note: `capabilities` in the example above is an optional ANP-06 extension example. Implementations should not treat it as a required top-level field of ANP-07.

### 14.2 Capability Confirmation Request

```json
{
  "jsonrpc": "2.0",
  "id": "req-cap-001",
  "method": "anp.get_capabilities",
  "params": {
    "meta": {
      "profile": "anp.core.binding.v1",
      "security_profile": "transport-protected",
      "operation_id": "op-cap-001",
      "created_at": "2026-06-27T12:00:00Z"
    },
    "body": {}
  }
}
```

### 14.3 Capability Confirmation Response Fragment

```json
{
  "jsonrpc": "2.0",
  "id": "req-cap-001",
  "result": {
    "service_did": "did:wba:grand-hotel.com:e1_service",
    "supported_profiles": [
      "anp.core.binding.v1",
      "anp.meta.negotiation.v1",
      "anp.direct.base.v1",
      "anp.rpc.v1"
    ],
    "supported_security_profiles": [
      "transport-protected"
    ],
    "supported_content_types": [
      "application/json",
      "text/plain"
    ],
    "limits": {
      "max_request_bytes": "1048576"
    }
  }
}
```

### 14.4 Negotiation Request and Result

See Section 7 and Section 8 for the negotiation request and result. Implementations SHOULD preserve `negotiationId` and `negotiationDigest` before making the actual business call, so that debugging, caching, and auditing are possible.

## 15. Future Extensions

Future versions may define:

- Standard JSON Schema for protocol artifacts;
- Protocol artifact registries and discovery mechanisms;
- Signed and verifiable negotiation results;
- Test-case negotiation methods;
- Issue-report / fix-negotiation extensions;
- Mappings to external protocol descriptions such as MCP, OpenAPI, OpenRPC, and A2A;
- Multi-party negotiation and group negotiation;
- Privacy-preserving and minimal-disclosure negotiation profiles;
- Protocol consensus, voting, review, and governance mechanisms.

## Copyright Notice
Copyright (c) 2024 ANP Open Source Community
This file is released under the [Apache License 2.0](./LICENSE). You are free to use and modify it, but you must retain this copyright notice.
