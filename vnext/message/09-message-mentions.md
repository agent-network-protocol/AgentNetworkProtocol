# ANP Profile 9: Message Mentions Extension

- Document ID: ANP-P9-vNext
- Title: Message Mentions Extension
- Status: Draft
- Specification Set: ANP Messaging 1.2 Draft
- Language: English
- Binding Version: v1 extension; it does not define an independent `meta.profile`
- Applicability: This Profile defines an application-payload extension for expressing human-readable and machine-readable mentions in ANP group messages. In this vNext set it composes with `anp.group.base.v2` and `anp.group.e2ee.v2` when the carried application payload is structured JSON.
- Dependencies:
  - `anp.core.binding.v1`
  - `anp.group.base.v2` when used with group non-E2EE messages
  - `anp.group.e2ee.v2` when used with group E2EE messages

---

## 1. Purpose

This Profile defines the minimum interoperable representation of mentions in ANP group messages.

A mention is a structured application-layer object that binds a human-visible surface form such as:

```text
@alice
@product-agent
@all
@agents
@humans
```

to a machine-readable target such as a DID or a group selector.

This Profile standardizes:

1. The JSON shape of a mention-bearing group message payload;
2. The minimum fields of a mention object;
3. The first-version supported target kinds: `human`, `agent`, and `group_selector`;
4. The first-version supported group selectors: `all`, `agents`, and `humans`;
5. The required placement of `mentions` so that it is covered by the enclosing ANP message integrity mechanism;
6. The sender-proof and validation model for mention-bearing group messages.

This Profile does not define:

- A new JSON-RPC method;
- A new outer `meta.profile` value for `group.send` or `group.e2ee.send`;
- A new content type solely for mentions;
- A new payload `protocol` marker solely for mentions;
- A new mention-specific sender field;
- A new mention-specific proof or signature;
- A server-side mention authorization model;
- Server-side expansion of `@all`, `@agents`, or `@humans`;
- Read status, delivery receipts, notification delivery, or user mute settings;
- Capability-based selectors such as "agents that support protocol X";
- Custom group governance roles beyond `owner`, `admin`, and `member`;
- Direct-message mention semantics.

---

This Profile applies to `did:wba`, `did:web`, and other supported DID methods; identity resolution and validation follow [P2](02-identity-and-discovery.md#method-validation).

## 2. Terminology and Normative Conventions

### 2.1 Normative Keywords

In this article, **MUST**, **MUST NOT**, **REQUIRED**, **SHALL**, **SHALL NOT**, **SHOULD**, **SHOULD NOT**, **RECOMMENDED**, **NOT RECOMMENDED**, **MAY**, **OPTIONAL** are interpreted as normative requirements according to their capitalized form.

### 2.2 Terminology

- **Mention**: A structured application-layer object that identifies a target mentioned in a message.
- **Mention-bearing Group Message**: A group application message whose structured JSON payload contains a top-level `mentions` array conforming to this Profile.
- **Surface Syntax**: The human-visible text form of a mention, such as `@alice` or `@agents`. The surface syntax is not the protocol identity.
- **Mention Target**: The machine-readable target of a mention. It may be a human DID, an agent DID, or a group selector.
- **Group Selector Mention**: A mention whose target is a group-scoped selector, such as `all`, `agents`, or `humans`.
- **Terminal-side Validation**: Local validation and processing performed by the receiving client, user agent, or Agent runtime after it receives or decrypts the application payload. This term does not introduce a device-level or terminal-level protocol identity.
- **Group Host Service**: The group service defined by `anp.group.base.v2`. In this Profile, it does not validate mention semantics.

---

## 3. Design Principles

### 3.1 `@` is surface syntax, not identity

The character `@` and the text following it are human interface syntax only.

The protocol identity of a single-target mention is the target DID:

```json
{
  "target": {
    "kind": "agent",
    "did": "did:wba:example.com:agent:product-assistant"
  }
}
```

The protocol identity of a group selector mention is the selector value scoped to the enclosing group message:

```json
{
  "target": {
    "kind": "group_selector",
    "selector": "agents"
  }
}
```

### 3.2 Mentions do not carry an independent sender

A mention object **MUST NOT** contain a sender field such as `sender`, `sender_did`, `from`, or `actor_did`.

The sender of a mention-bearing group message is always the sender of the enclosing ANP group message:

- `params.meta.sender_did` for Group Base;
- `params.meta.sender_did` plus the Group E2EE message authentication context for Group E2EE.

### 3.3 Mentions do not carry an independent proof

A mention object **MUST NOT** contain `proof`, `signature`, `auth`, `origin_proof`, or any equivalent mention-local proof field.

For non-E2EE Group Base, the mention-bearing payload **MUST** be located inside `params.body` so that it is covered by the `Signed Request Object` bound by `auth.origin_proof`.

For Group E2EE, the mention-bearing payload **MUST** be located inside the corresponding inner plaintext object before encryption.

### 3.4 Mention authorization is not a v1 server-side concern

This Profile defines no mention-specific permission policy in v1.

If the sender is allowed to send the enclosing group message under the applicable base Profile, the sender is allowed at the mention layer to include any supported mention target:

- a single human DID;
- a single agent DID;
- `@all`;
- `@agents`;
- `@humans`.

Servers, relay services, ingress services, and Group Host Services **MUST NOT** reject a message solely because of the mention target, mention selector, or mention role. They continue to enforce only the existing checks required by the enclosing Profile, such as sender authentication, idempotence, target binding, content-shape rules, and group send permission.

This rule does not prevent ordinary operational enforcement such as payload-size limits, documented maximum mention-object counts, rate limits, anti-abuse controls, spam controls, malformed-payload rejection, or denial-of-service protection. Such enforcement is operational policy, not mention-specific authorization.

### 3.5 Group selectors are not group governance roles

The selector values `all`, `agents`, and `humans` **MUST NOT** be interpreted as P4 group governance roles.

P4 group governance roles remain:

```text
owner
admin
member
```

This Profile’s group selectors are mention targets, not authorization roles.

### 3.6 Mention targets are not device targets

A single-target Mention identifies a human or Agent DID, and a group-selector Mention identifies a set of P4 business members. Neither form identifies a device or MLS Leaf. Multiple devices or Leaves belonging to one DID remain one Mention subject.

P6 exclusively owns any sender- or recipient-device binding in the enclosing Group E2EE message. Mention objects **MUST NOT** copy, infer, or override those outer device selectors.

### 3.7 Historical Mentions and DID transitions

A historical Mention target remains the exact DID carried by the accepted message. A Group Host, relay, or client **MUST NOT** rewrite a signed or encrypted historical Mention payload after that DID changes.

A receiving product **MAY** verify the P2 transition from the historical DID to a current DID and, after its business policy accepts the returned assurance, associate the historical surface or notification behavior with the current identity. This association is local and does not change the payload. Newly created Mentions **MUST** use the current complete target DID.

---

## 4. Profile Binding Model

### 4.1 Extension marker

This Profile does not require a dedicated payload protocol name.

A structured JSON payload is mention-bearing when it is carried in one of the supported group-message payload locations and contains a top-level `mentions` array conforming to this Profile.

Receivers **MUST NOT** require or rely on a top-level `protocol` field to recognize mentions.

If a structured JSON payload does not contain a top-level `mentions` array, this Profile does not apply to that payload.

### 4.2 Relationship with outer `meta.profile`

This Profile **MUST NOT** replace the outer `params.meta.profile` of the enclosing group message operation.

The enclosing group message operation keeps its original Profile name, for example:

- `anp.group.base.v2` for `group.send` without Group E2EE;
- `anp.group.e2ee.v2` for `group.e2ee.send`.

### 4.3 Content type

Mention-bearing structured payloads **MUST** use ordinary JSON payload carriage.

For non-E2EE Group Base:

```text
"meta": {
  "content_type": "application/json"
}
```

For Group E2EE inner plaintext:

```json
{
  "application_content_type": "application/json"
}
```

Implementations **MUST NOT** define a new content type solely to distinguish mention-bearing messages from other structured JSON application payloads.

---

## 5. Mention-bearing Message Object

### 5.1 Recommended structure

A mention-bearing message payload has the following minimum structure:

```json
{
  "text": "@agents please summarize this discussion.",
  "mentions": [
    {
      "id": "men_1",
      "range": {
        "start": 0,
        "end": 7,
        "unit": "unicode_code_point"
      },
      "target": {
        "kind": "group_selector",
        "selector": "agents"
      },
      "mention_role": "addressee"
    }
  ]
}
```

### 5.2 Top-level fields

| Field | Requirement | Type | Semantics |
|---|---:|---|---|
| `text` | **MUST** | string | Human-readable message text containing the mention surface syntax. |
| `mentions` | **MUST** | array | Structured mention objects in this message. |
| `annotations` | **MAY** | object | Application extension metadata. It is not used for routing, security, or authorization. |

If the message has no structured mention semantics, the sender **SHOULD NOT** include a top-level `mentions` field and should instead use the ordinary content model of the enclosing Profile.

Unrecognized top-level fields **MAY** be ignored by mention processors.

### 5.3 `mentions` array

`mentions` **MUST** be an array.

Each element **MUST** be a mention object as defined in Section 5.4.

`mentions[*].id` values **MUST** be unique within the same message payload.

The order of `mentions` **SHOULD** follow the order in which mention surfaces appear in `text`.

---

### 5.4 Mention object

The minimum mention object is:

```json
{
  "id": "men_1",
  "range": {
    "start": 0,
    "end": 7,
    "unit": "unicode_code_point"
  },
  "target": {
    "kind": "group_selector",
    "selector": "agents"
  },
  "mention_role": "addressee"
}
```

Field requirements:

| Field | Requirement | Type | Semantics |
|---|---:|---|---|
| `id` | **MUST** | string | Message-local mention identifier. It has no global semantics. |
| `range` | **MUST** | object | Range of the mention surface in `text`. |
| `target` | **MUST** | object | Machine-readable mention target. |
| `mention_role` | **MAY** | string | Mention role. If omitted, the receiver **MUST** interpret it as `addressee`. |

A mention object **MUST NOT** contain:

- `sender`;
- `sender_did`;
- `from`;
- `actor_did`;
- `auth`;
- `origin_proof`;
- `proof`;
- `signature`;
- `sender_device_id`;
- `recipient_device_id`;
- `device_id` or an MLS Leaf identifier.

---

### 5.5 Mention range

The range object is:

```json
{
  "start": 0,
  "end": 7,
  "unit": "unicode_code_point"
}
```

Field requirements:

| Field | Requirement | Type | Semantics |
|---|---:|---|---|
| `start` | **MUST** | non-negative integer | Inclusive start offset in `text`. |
| `end` | **MUST** | non-negative integer | Exclusive end offset in `text`. |
| `unit` | **MUST** | string | In v1, it **MUST** be `unicode_code_point`. |

Rules:

1. `start` **MUST** be less than `end`.
2. `end` **MUST NOT** exceed the number of Unicode code points in `text`.
3. The range is calculated over the exact JSON string value of `text` after JSON parsing and before any UI normalization, transliteration, or Markdown rendering.
4. The substring identified by `range` is the mention surface. The surface string is intentionally not duplicated in the mention object in v1.
5. If a terminal cannot validate the range, it **MUST** ignore that mention object for mention-triggering purposes, but it **MAY** still display the original `text`.

---

### 5.6 Mention target

#### 5.6.1 Single human target

```json
{
  "kind": "human",
  "did": "did:wba:example.com:user:alice",
  "display_name": "Alice"
}
```

Rules:

- `kind` **MUST** be `human`.
- `did` **MUST** exist and **MUST** be a DID.
- `display_name` **MAY** exist as a sender-side display snapshot.
- `display_name` **MUST NOT** be used as identity or authorization evidence.

#### 5.6.2 Single agent target

```json
{
  "kind": "agent",
  "did": "did:wba:example.com:agent:product-assistant",
  "display_name": "Product Assistant"
}
```

Rules:

- `kind` **MUST** be `agent`.
- `did` **MUST** exist and **MUST** be a DID.
- `display_name` **MAY** exist as a sender-side display snapshot.
- Agent capability discovery, Agent Description resolution, and profile lookup are outside this Profile.

#### 5.6.3 Group selector target

```json
{
  "kind": "group_selector",
  "selector": "agents"
}
```

Rules:

- `kind` **MUST** be `group_selector`.
- `selector` **MUST** be one of:
  - `all`
  - `agents`
  - `humans`
- `did` **MUST NOT** appear when `kind = "group_selector"`.
- The selector scope is the group identified by the enclosing group message context.
- The selector **MUST NOT** be interpreted as a P4 group governance role.

---

### 5.7 Mention role

The `mention_role` field is optional.

Allowed values in v1:

| Value | Semantics |
|---|---|
| `addressee` | The mentioned target is an intended recipient of attention. This is the default. |
| `cc` | The mentioned target is copied or referenced, but not necessarily expected to act. |

Rules:

- If `mention_role` is omitted, the receiver **MUST** interpret it as `addressee`.
- If `mention_role` is present, it **MUST** be one of the allowed values in this section.
- `mention_role` **MUST NOT** be used as a group governance role.
- `mention_role` **MUST NOT** be used to override group send permission or any enclosing Profile authorization rule.

---

## 6. Group Selector Semantics

### 6.1 `@all`

`@all` is represented as:

```json
{
  "target": {
    "kind": "group_selector",
    "selector": "all"
  }
}
```

Terminal-side interpretation:

```text
all active group members in the enclosing group context
```

### 6.2 `@agents`

`@agents` is represented as:

```json
{
  "target": {
    "kind": "group_selector",
    "selector": "agents"
  }
}
```

Terminal-side interpretation:

```text
active group members that the local application roster or profile layer classifies as agents
```

### 6.3 `@humans`

`@humans` is represented as:

```json
{
  "target": {
    "kind": "group_selector",
    "selector": "humans"
  }
}
```

Terminal-side interpretation:

```text
active group members that the local application roster or profile layer classifies as humans
```

### 6.4 Selector resolution snapshot

For group messages, a terminal **SHOULD** resolve group selectors against the group state snapshot associated with the accepted message when that snapshot is available.

In Group Base and Group E2EE, this is normally the `group_state_version` returned or delivered with the accepted message context.

If the terminal does not have that exact group state snapshot, it **MAY** resolve the selector against the best available local group state and mark the result as best-effort.

### 6.5 Member kind source

The classification of a member as `human` or `agent` is an application-layer roster or profile attribute.

This Profile does not define a new P4 `group_member` field for this classification.

Implementations **MUST NOT** infer `human` or `agent` solely from a P4 governance role such as `owner`, `admin`, or `member`.

---

## 7. Placement Rules

### 7.1 Group Base without E2EE

For `group.send` under `anp.group.base.v2`:

- `params.meta.content_type` **MUST** be `application/json`;
- `params.body.payload` **MUST** carry the mention-bearing message object;
- `params.auth.origin_proof` is the sender proof required by Group Base;
- `params.meta.sender_device_id` and `params.meta.recipient_device_id` **MUST NOT** appear;
- the Group Host applies the existing Group Base checks;
- the Group Host **MUST NOT** perform mention-specific authorization or selector expansion.

Example:

```json
{
  "jsonrpc": "2.0",
  "id": "req-group-mention-001",
  "method": "group.send",
  "params": {
    "meta": {
      "profile": "anp.group.base.v2",
      "security_profile": "transport-protected",
      "sender_did": "did:wba:example.com:user:alice",
      "target": {
        "kind": "group",
        "did": "did:wba:groups.example.com:team:waic-demo"
      },
      "operation_id": "msg-group-mention-001",
      "message_id": "msg-group-mention-001",
      "created_at": "2026-06-14T12:00:00Z",
      "content_type": "application/json"
    },
    "auth": {
      "scheme": "anp-rfc9421-origin-proof-v1",
      "origin_proof": {
        "contentDigest": "sha-256=:BASE64_SHA256_DIGEST:",
        "signatureInput": "sig1=(\"@method\" \"@target-uri\" \"content-digest\");created=1781438400;expires=1781438460;nonce=\"n-002\";keyid=\"did:wba:example.com:user:alice#key-1\"",
        "signature": "sig1=:BASE64_SIGNATURE:"
      }
    },
    "body": {
      "payload": {
        "text": "@agents please summarize yesterday's meeting.",
        "mentions": [
          {
            "id": "men_1",
            "range": {
              "start": 0,
              "end": 7,
              "unit": "unicode_code_point"
            },
            "target": {
              "kind": "group_selector",
              "selector": "agents"
            },
            "mention_role": "addressee"
          }
        ]
      }
    }
  }
}
```

### 7.2 Group E2EE

For `group.e2ee.send` under `anp.group.e2ee.v2`:

- the outer `params.meta.content_type` remains `application/anp-group-cipher+json`;
- the outer `params.body` carries `group_cipher_object`;
- the mention-bearing object **MUST** be placed inside the inner `Group Application Plaintext.payload` before MLS `PrivateMessage` encryption;
- the inner `application_content_type` **MUST** be `application/json`.

Any sender- or recipient-device fields required for this encrypted delivery remain in the P6 outer envelope and are not part of the Mention payload.

Example inner plaintext before encryption:

```json
{
  "application_content_type": "application/json",
  "thread_id": "thr-001",
  "payload": {
    "text": "@all please review the agenda.",
    "mentions": [
      {
        "id": "men_1",
        "range": {
          "start": 0,
          "end": 4,
          "unit": "unicode_code_point"
        },
        "target": {
          "kind": "group_selector",
          "selector": "all"
        }
      }
    ]
  }
}
```

The Group Host sees the outer ciphertext object. It authenticates and orders the `group.e2ee.send` request according to Group E2EE and Group Base rules, but it does not inspect or validate the encrypted `mentions` array.

### 7.3 Incoming notifications

When an ANP service pushes a mention-bearing group message using `group.incoming` or the corresponding Group E2EE delivery path:

- the pushed payload **MUST** remain semantically equivalent to the accepted original message;
- if the enclosing Profile allows the original `auth.origin_proof` to be copied into the notification, the service **SHOULD** include a lossless copy so that terminal-side verification can bind the mention-bearing payload to the original sender;
- intermediate services **MUST NOT** rewrite `mentions` when forwarding or pushing the message.
- Group Base delivery remains DID-addressed, while Group E2EE device delivery follows only the enclosing P6 selector fields.

---

## 8. Sender Proof and Cryptographic Binding

### 8.1 Non-E2EE Group Base

For non-E2EE Group Base, the sender of a mention-bearing message is proven by the enclosing `auth.origin_proof`.

The verification subject is the enclosing message sender:

```text
params.meta.sender_did
```

The `mentions` array is protected because it is inside the `body` member of the `Signed Request Object`.

### 8.2 Group E2EE

For Group E2EE, `group.e2ee.send` uses the origin proof and group E2EE authenticated message semantics of the enclosing Profile.

The `mentions` array is inside the MLS-protected inner `Group Application Plaintext`. It is not visible to the Group Host and is validated only after decryption by terminals or Agent runtimes.

### 8.3 No mention-local proof

A verifier **MUST NOT** require a mention-local signature or proof in v1.

A receiver **MUST** treat any `proof`, `signature`, `origin_proof`, or `auth` field embedded inside a mention object as invalid for this Profile.

---

## 9. Validation and Processing

### 9.1 Server-side processing

Servers, relay services, ingress services, and Group Host Services:

1. **MUST** process the enclosing ANP group message according to the enclosing Profile;
2. **MUST** perform existing sender authentication, idempotence, target binding, security profile, and payload-carriage checks required by the enclosing Profile;
3. For group messages, **MUST** enforce group send permission as required by Group Base / Group E2EE;
4. **MUST NOT** perform mention-specific authorization;
5. **MUST NOT** expand `@all`, `@agents`, or `@humans` into member DID lists as part of message acceptance;
6. **MUST NOT** reject a message solely because a mention target DID is unknown to the server or a selector is broad;
7. **MUST** preserve the mention-bearing payload without unauthorized modification.

This rule does not prevent a server from rejecting a message for ordinary enclosing-Profile or operational reasons, such as invalid JSON-RPC shape, unsupported content type, invalid origin proof, failed group send permission, invalid ciphertext object, idempotency conflict, payload-size limit, documented maximum mention-object count, rate limit, anti-abuse policy, spam control, or denial-of-service protection.

### 9.2 Terminal-side validation

A terminal, client, user agent, or Agent runtime that supports this Profile **MUST** perform mention validation after it has received or decrypted the application payload.

The minimum terminal-side validation steps are:

1. Verify or rely on the enclosing Profile’s authenticated sender context before triggering mention behavior.
2. Parse the JSON payload.
3. Check that the payload contains a top-level `mentions` array before applying this Profile.
4. Check that `text` is a string.
5. Check that `mentions` is an array.
6. Check each mention object has a unique `id`.
7. Check each `range` is valid for `text`.
8. Check `target.kind` is one of `human`, `agent`, or `group_selector`.
9. If `target.kind = "human"` or `target.kind = "agent"`, check that `target.did` exists.
10. If `target.kind = "group_selector"`, check that `target.selector` is one of `all`, `agents`, or `humans`.
11. If `mention_role` exists, check that it is one of `addressee` or `cc`.
12. Apply local rendering, notification, or Agent runtime behavior according to local policy.

If a mention object fails terminal-side validation, the terminal **SHOULD** ignore that mention object for triggering, notification, or Agent activation purposes, but **MAY** still display the original message text.

### 9.3 Mention permission interpretation

In v1, there is no mention-specific permission policy.

A terminal **MUST** treat a mention as allowed at the wire-protocol layer if:

1. the enclosing group message was accepted or delivered under the applicable ANP Message Profile; and
2. the mention object is syntactically valid under this Profile.

A terminal **MAY** apply local user preferences such as muting, notification throttling, or spam control. Such local preferences are not protocol-level mention authorization and **MUST NOT** be represented as a rejection of the ANP message itself.

---

## 10. Examples

### 10.1 Mentioning all humans in a group

```json
{
  "text": "@humans please confirm your attendance.",
  "mentions": [
    {
      "id": "men_1",
      "range": {
        "start": 0,
        "end": 7,
        "unit": "unicode_code_point"
      },
      "target": {
        "kind": "group_selector",
        "selector": "humans"
      }
    }
  ]
}
```

### 10.2 Mentioning a single human in a group

```json
{
  "text": "@张三 please review this.",
  "mentions": [
    {
      "id": "men_1",
      "range": {
        "start": 0,
        "end": 3,
        "unit": "unicode_code_point"
      },
      "target": {
        "kind": "human",
        "did": "did:wba:example.com:user:zhangsan",
        "display_name": "张三"
      },
      "mention_role": "cc"
    }
  ]
}
```

### 10.3 Mentioning a single agent in a group

```json
{
  "text": "@InvoiceBot extract the invoice fields.",
  "mentions": [
    {
      "id": "men_1",
      "range": {
        "start": 0,
        "end": 11,
        "unit": "unicode_code_point"
      },
      "target": {
        "kind": "agent",
        "did": "did:wba:example.com:agent:invoice-bot",
        "display_name": "InvoiceBot"
      },
      "mention_role": "addressee"
    }
  ]
}
```

---

## 11. Security Considerations

### 11.1 Mention spoofing

Terminals **MUST NOT** use the visible text alone to determine a mention target.

For example, the text `@Alice` is not sufficient to identify Alice. The terminal must use the corresponding structured `mentions[*].target` object.

### 11.2 Display name is not identity

`target.display_name` is only a display snapshot.

Identity decisions **MUST** be based on DID for single-target mentions or on selector semantics for group selector mentions.

### 11.3 No server-side mention authorization

Because mention validation is terminal-side in v1, a server may accept and deliver a message whose mention objects later fail terminal-side validation.

Terminals and Agent runtimes **MUST** avoid triggering privileged behavior from invalid mention objects.

### 11.4 E2EE privacy

In Group E2EE mode, mention objects are inside encrypted plaintext.

Servers and Group Host Services should not expect to inspect or index mention targets unless an explicit future extension introduces encrypted or privacy-preserving notification hints.

This Profile does not define such hints in v1.

### 11.5 Replay and duplicate handling

This Profile defines no mention-specific replay protection.

Replay and duplicate handling are inherited from the enclosing ANP Message Profile through `operation_id`, `message_id`, E2EE session state, or group ordering semantics.

---

## 12. Privacy Considerations

### 12.1 Minimum metadata

Mention targets can reveal social attention patterns.

Implementations **SHOULD** keep `mentions` inside the protected payload position required by this Profile and **SHOULD NOT** duplicate mention targets into outer metadata.

### 12.2 Group selector privacy

A group selector such as `@agents` or `@humans` may reveal the sender’s intended audience, but it avoids exposing an expanded member DID list in the message payload.

Implementations **SHOULD** preserve the selector rather than expanding it into individual DIDs at send time.

---

## 13. Minimum Interoperability Requirements

An implementation conforming to this Profile MUST support at least:

1. top-level `mentions` as the extension marker in structured JSON group-message payloads;
2. `text` plus `mentions` message object structure;
3. mention targets of kind `human`, `agent`, and `group_selector`;
4. group selector values `all`, `agents`, and `humans`;
5. `unicode_code_point` mention ranges;
6. terminal-side validation of mention object shape and ranges;
7. no mention-local sender field;
8. no mention-local proof field;
9. placement of mention-bearing payloads inside `params.body.payload` for non-E2EE `application/json` group messages;
10. placement of mention-bearing payloads inside inner `Group Application Plaintext.payload` for Group E2EE messages;
11. preservation of existing sender-proof and send-permission semantics from the enclosing ANP Message Profile;
12. no server-side mention authorization or selector expansion in v1;
13. DID and group-selector Mention targets with device binding left to the enclosing P6 message.
14. historical Mention DIDs remain unchanged, while any association with a current DID requires P2 transition verification and local business-policy acceptance.

---

## 14. Future Extensions

Future versions may define:

- Direct-message mention semantics;
- Mention notification hints for E2EE messages;
- Mention-specific notification delivery policies;
- Capability selector mentions, such as agents that support a specific protocol;
- Mention-level human authorization for high-risk actions;
- Rich text or multiple-body mention anchoring;
- Cross-group or external mention references;
- Standard roster fields for human / agent classification.

These features are intentionally outside v1.
