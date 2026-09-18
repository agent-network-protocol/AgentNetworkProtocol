# ANP End-to-End Instant Messaging Protocol Overview

- Document ID: ANP-09
- Title: ANP End-to-End Instant Messaging Protocol Overview
- Status: Published overview; P6 stable release remains subject to its registration gate
- Version: 1.2
- Language: English
- Applicability: This document indexes the mixed-version ANP Messaging 1.2 specification set, including the candidate P6 Group E2EE document.

> This document provides a top-level overview of the ANP end-to-end instant messaging specification suite. It is intended to help readers quickly understand the goals, layering, core ideas, and key technical directions of the protocol family. This document is not a clause-by-clause normative specification; normative requirements are defined by the individual Profile specifications.

---

## 1. What is ANP end-to-end instant messaging

ANP end-to-end instant messaging is a family of protocol specifications for **cross-domain instant messaging between Agents**.

It is not designed to solve "how to chat within a certain product", but:

- How agents in different domains, different platforms, and different implementations can discover each other;
- How to send direct and group messages;
- How to provide end-to-end encryption when needed;
- How to transfer attachments and large objects;
- How to complete routing, relaying, sorting and result witnessing in cross-domain scenarios.

The business identity and authorization endpoint for ANP remains the **Agent DID**. In Messaging 1.2, ordinary non-E2EE Direct, Group, Mention, and Attachment operations remain DID-addressed, with endpoint fan-out internal to the receiving domain. P3 retains v1; P4 uses v2 because its membership and DID-update contracts change. Only E2EE v2 Profiles expose the minimum device semantics needed for secure cross-domain cryptographic communication: a `device_id` identifies one cryptographic endpoint under the same DID. It is not a new business identity, Group member, or `target.kind`.

---

## 2. Core Principles

### 2.1 Federation, not a single center

ANP adopts a **Federated** architecture, which is closer to Email in concept than a single central server architecture.

Each Agent or group can belong to different domains, and different domains communicate through standardized service discovery, service-to-service direct invocation, and result witness mechanisms. That is to say:

- Identity is distributed;
- Service endpoints are distributed;
- cross-domain service invocations can occur;
- But each type of operation has clear boundaries of responsibility.

In the direct messaging scenario, the ingress service of the domain where the target Agent is located is responsible for receiving messages; in the group scenario, the group Host Service is responsible for group status sorting and group event serialization.

### 2.2 Identity priority, service discovery priority

The first-class identifier of the ANP is not the username or device number, but:

- `agent_did`
- `group_did`

ANP discovers interactive service endpoints through DID documents, and uses this to establish subsequent message sending, key discovery, group service discovery, and object service discovery paths. In the current version, the ANP service endpoint disclosed by DID documents is unified as `ANPMessageService`; capabilities such as direct messaging, group messaging, key material access, and object control are carried by this unified service endpoint.

In Messaging 1.2, a DID that advertises a device-addressed E2EE v2 Profile must publish a complete `deviceManifest` in its DID Document validated under the applicable DID method, as specified by P2. WBA-specific root-signature requirements must not be imposed on native `did:web`. Its entries expose only the current device endpoint identifier, signing-key reference, E2EE-key reference, and supported Profile identifiers with their dependencies. Base-only discovery does not require a Manifest. Product-local roles, tokens, recovery state, registry versions, and document checkpoints are not ANP wire semantics.

### 2.3 Layered design instead of “one unified protocol”

ANP does not cram all the issues into one document, but splits them into 9 Profiles:

- P1/P2: Core Binding and Identity and Discovery
- P3/P4: Basic business semantics of direct messaging and group messaging
- P5/P6: E2EE Overlay of direct messaging and group messaging
- P7: Attachments and large objects
- P8: Federation, cross-domain service invocation and group event distribution
- P9: Group-message mentions and selector semantics

The benefits of this design are:

- Decoupling basic message semantics and security semantics;
- Plaintext mode and encryption mode can coexist;
- Direct messaging, group messaging, attachments, and federation are all cleanly separated;
- Subsequent upgrade of a certain layer does not require overturning the entire protocol.

### 2.4 Separation of the control plane and the data plane

ANP clearly distinguishes between:

- **control plane**: group creation, joining, adding members, removing members, capability negotiation, ticket issuance, cross-domain service invocation, etc.;
- **data plane**: direct messages, group messages, attachment object content.

Especially in attachment scenarios, ANP explicitly adopts:

- Carry the **manifest** in the message;
- Object content is downloaded through a separate HTTP(S) channel;
- The cross-domain service invocation path does not forward the object byte stream.

---

## 3. Core Design

### 3.1 Unified outer binding: JSON-RPC

ANP's unified outer binding adopts **JSON-RPC 2.0** and has been tightened:

- `params` uses object form;
- `id` uses strings;
- batch is not used;
- Notification is only used in explicit asynchronous notification scenarios.

The purpose of this is to maintain a unified request/response/error model between different languages, different platforms, and different services while keeping the implementation simple.

### 3.2 Direct messaging and group messaging are modeled separately

ANP does not make "message" into a vague large object, but clearly distinguishes:

- `direct.send`: direct messaging
- `group.send`: group messaging

At the same time, group messaging is not only "sending messages", but also includes:

- `group.create`
- `group.join`
- `group.add`
- `group.remove`
- `group.leave`
- `group.update_profile`
- `group.update_policy`

This allows group governance, group status, and group encryption to be naturally connected. P4 v2 does not define `group.invite`, `group.accept_invite`, or standard invitation objects. Invitation links and Join Tokens are deployment extensions and cannot establish standard membership before `group.join` succeeds.

Messaging 1.2 does not create device-level business membership. P3 Direct Base v1 delivery and P4 Group Base v2 membership, roles, policy, sending, and notifications remain DID-scoped. P4 v2 uses DID-only membership and Host-coordinated member DID updates according to P2 verification. Only P5/P6 v2 E2EE delivery and MLS cryptographic leaves are device-scoped.

### 3.3 Plaintext and E2EE coexist

ANP allows:

- `transport-protected`: Relies only on transport security
- `direct-e2ee`: direct messaging end-to-end encryption
- `group-e2ee`: group messaging end-to-end encryption

In other words, the base profile can run independently; the security overlay is superimposed on top of it. This is conducive to progressive deployment and the adoption of different security levels in different scenarios.

---

## 4. Core technical route

### 4.1 Transport and message binding: JSON-RPC 2.0

ANP uses JSON-RPC 2.0 as the unified message binding layer. Its function is not to "simulate function calls", but to provide unified:

- Request format
- response format
- Error model
- Capability negotiation interface
- Asynchronous notification mechanism

This allows ANP to share a consistent outer protocol shape in different scenarios such as direct messaging, group messaging, attachment control, and cross-domain service invocation.

### 4.2 Direct messaging end-to-end encryption: X3DH-like + Double Ratchet-like

ANP's direct messaging E2EE adopts the following technical route:

- Identity anchor: an Agent DID validated under ANP-02 and P2, including `did:wba` and native `did:web`
- Key discovery: Obtained via `ANPMessageService` exposed by DID document
- Initial link establishment: `X3DH-like`
- Subsequent message protection: `Double Ratchet-like`

Specifically:

- The authentication key in the DID document is used to prove identity;
- `keyAgreement` (e.g. X25519) in the DID document is used for negotiation;
- Prekey Bundle is used for asynchronous offline link building;
- Ratchet is used for subsequent per-message key rolling, out-of-order tolerance and replay protection.

In Direct E2EE v2, Prekey Bundles, asynchronous sessions, ratchet state, AAD, replay state, and Mailboxes are bound to the concrete `(DID, device_id)` pair at both ends. One logical message is encrypted and submitted separately for each eligible recipient device; private state is never shared between devices.

This route is suitable for Agent asynchronous communication and leaves room for upgrades to stronger packages.

### 4.3 Group end-to-end encryption: MLS + DID and device binding

ANP's group E2EE mainline adopts:

- **MLS** as a group key state machine;
- **An Agent DID validated under its method** as the identity anchor, with device eligibility defined by the P2 Manifest rules;
- **Group Host Service** as the authority for sequencing and receipts.

This means:

- Group application messages are carried using `PrivateMessage`;
- Member addition, removal, welcome, external joining and other capabilities are completed through MLS's `KeyPackage / Commit / Welcome / External Commit`;
- `group_did`, `group_state_version`, `policy_hash` are bound to the cryptographic group status;
- `group_receipt` is responsible for proving that "the operation or message was accepted and sequenced by the group".

In Group E2EE v2, one business-member DID may own multiple authenticated MLS leaves. Each leaf uses its own device-bound KeyPackage and private state. Adding or removing one device leaf does not by itself add or remove the DID-level group member.

This approach is more suitable to become a long-term standard than inventing a group cryptography state machine.

### 4.4 Attachments and objects: Manifest + standalone HTTPS download + optional object-level encryption

The attachment scheme adopts a three-layer structure:

1. **Message layer**: carry only `attachment_manifest`
2. **Access layer**: Control downloads through Object Service and short-term download ticket
3. **Content layer**: Do object-level encryption (`object-e2ee`) on the object itself if necessary

Therefore:

- Large objects are not transferred through the cross-domain service invocation link;
- The download link can be made into a locator instead of a long-term direct link;
- Even if the link is leaked, object-level encryption can be used to ensure that the third party cannot get the clear text.

For Direct E2EE v2, the same uploaded object and `object_key` may be referenced by multiple per-device encrypted messages, with the key delivered independently to each recipient device. For Group E2EE v2, the key is carried in an MLS Application Message for the current epoch. P7 remains `anp.attachment.v1`; it does not duplicate object, Access Grant, or Ticket state per device.

### 4.5 Federation: Direct call from service to service

The federation layer of ANP defines:

- Service discovery
- cross-domain direct call from service to service
- Group Host sorting
- cross-domain call of attachment control plane
- The final landing point of `attachment.get_download_ticket`

One of the important principles is:

- In cross-domain, directly use the original business method or control method to interact with the target service, instead of adding an independent Relay packaging protocol;
- The object byte stream must be downloaded independently via HTTPS;
- Group operations use Group Host acceptance and sorting as cross-domain success semantics;
- direct messaging takes acceptance of the target Agent ingress service as cross-domain success semantics.
- P8 v1 federation preserves and validates sender and recipient device identifiers only when the enclosing E2EE v2 Profile declares them. Ordinary P3/P4/P7 operations remain DID-addressed, and any endpoint fan-out stays internal to the receiving domain; a gateway neither adds device selectors to those operations nor performs hidden fan-out for an E2EE delivery.

---

## 5. Key design trade-offs

ANP has several conscious design trade-offs:

### 5.1 Keep business identity separate from device endpoints

The v1.1 baseline treats devices, terminals, and replicas as Agent-internal details. Messaging 1.2 preserves ordinary DID-addressed messaging: P3, P7, and P8 retain v1, while P4 uses v2 for DID-only membership and Host-coordinated updates. P5/P6 v2 change the E2EE cryptographic endpoint boundary, exposing the minimum device identifier and key bindings needed to avoid shared device keys, shared ratchets, hidden encrypted-delivery fan-out, or ambiguous MLS leaves. DID remains the business identity, and product-local device management is still out of scope.

### 5.2 Group governance takes precedence over ultimate anonymity

In a group scenario, ANP simultaneously preserves:

- Proof of originator (who initiated the request)
- Witness the group result (whether the group accepts it)
- In-group message confidentiality (MLS)

This means that it is more of a "governance-friendly Agent protocol" than a purely anonymous chat protocol.

### 5.3 Attachment security does not rely on "hidden links"

ANP does not use "absolutely hidden download links" as a core security method, but uses:

- Controlled download ticket
- Short URL
- object-level encryption

To ensure that even if the link is leaked, meaningful plaintext may not be obtained.

---

## 6. Document structure

The following nine documents form the ANP Messaging 1.2 specification set. P6 is included in full, but its stable v2 release remains pending a registered MLS ExtensionType. See P6 for the provisional `0xF0A1` value and its use restrictions; integrating the documentation does not complete that release gate.


|serial number|document|effect|Content overview|
| --- | --- | --- | --- |
| 1 | [01-Core Binding](message/01-core-binding.md) | Defines the unified outer binding | Specifies JSON-RPC interoperability constraints, the common `params` structure, payload representation, capability negotiation, idempotency, the error model, and method namespaces. |
| 2 | [02-Identity and Discovery](message/02-identity-and-discovery.md) | Defines identity and service discovery | Specifies the semantics of Agent DID / Group DID, the ANP interpretation rules for DID documents, the unified `ANPMessageService` service endpoint, and the discovery process. |
| 3 | [03-Direct Messaging Base Semantics](message/03-direct-messaging-base-semantics.md) | Defines the direct messaging base business layer | Specifies base direct messaging methods such as `direct.send`, the content model, acceptance semantics, idempotency semantics, ordering semantics, and the boundary of sender proof. |
| 4 | [04-Group Messaging Base Semantics](message/04-group-messaging-base-semantics.md) | Defines the group lifecycle and the base layer for group messages | Specifies group creation, self-service joining, direct member addition, membership changes, group profile / policy updates, `group.send`, group state versions, and the ordering responsibilities of the Group Host. |
| 5 | [05-Direct End-to-End Encryption](message/05-direct-end-to-end-encryption.md) | Defines the direct messaging E2EE overlay | Specifies the Prekey Bundle, DID and device bindings, X3DH-like initial session establishment, Double Ratchet-like follow-up messages, AAD, replay protection, and session re-establishment. |
| 6 | [06-Group End-to-End Encryption](message/06-group-end-to-end-encryption.md) | Defines the group E2EE overlay | Specifies MLS-based group cryptographic state, KeyPackage publication and discovery, the mapping from base group methods to the cryptographic state machine, and the handling of `epoch` and forks. |
| 7 | [07-Attachments and Object Transfer](message/07-attachments-and-object-transfer.md) | Defines attachments and large-object semantics | Specifies the `attachment_manifest`, Object Service, upload / commit / download tickets, object-level encryption, and how attachments are carried in direct messaging and group messaging. |
| 8 | [08-Federation and Cross-Domain](message/08-federation-and-cross-domain.md) | Defines the principles of cross-domain service invocation | Specifies service roles, discovery and routing, service-to-service security, principles for direct cross-domain calls, group event distribution, and cross-domain success semantics. |
| 9 | [09-Message Mentions Extension](message/09-message-mentions.md) | Defines group-message mention payload semantics | Specifies structured mention objects, group selectors such as `@all`, `@agents`, and `@humans`, placement rules for Group Base and Group E2EE, and terminal-side validation. |

The [ANP Messaging 1.2 Profile index](message/README.md) keeps each Profile on its independent lifecycle. P1/P2/P3/P7/P8 and the P9 Mention binding retain v1; P4 Group Base and P5/P6 multi-device E2EE use v2:

| Profile | Messaging 1.2 | Main multi-device change |
| --- | --- | --- |
| P1 | [`anp.core.binding.v1`](message/01-core-binding.md) | DID-level common metadata plus registered conditional device fields owned by P5/P6 v2 |
| P2 | [`anp.identity.discovery.v1`](message/02-identity-and-discovery.md) | Method-validated `deviceManifest` and current eligibility for device-addressed security Profiles; Base discovery stays DID-level |
| P3 | [`anp.direct.base.v1`](message/03-direct-messaging-base-semantics.md) | One DID-to-DID ordinary delivery with no device selectors |
| P4 | [`anp.group.base.v2`](message/04-group-messaging-base-semantics.md) | DID-only membership, Host-coordinated member DID updates, and DID-addressed sends and notifications |
| P5 | [`anp.direct.e2ee.v2`](message/05-direct-end-to-end-encryption.md) | Device-bound PreKey, Session, Ratchet, AAD, replay state, and Mailbox |
| P6 | [`anp.group.e2ee.v2`](message/06-group-end-to-end-encryption.md) | Multiple independently authenticated device leaves for one member DID; candidate pending the stable MLS code point |
| P7 | [`anp.attachment.v1`](message/07-attachments-and-object-transfer.md) | DID-addressed manifest, object control, and Ticket flows; E2EE object-key delivery is inherited from P5/P6 |
| P8 | [`anp.federation.relay.v1`](message/08-federation-and-cross-domain.md) | Conditional device-selector preservation and eligibility validation for an enclosing E2EE v2 Profile |
| P9 | [v1 binding](message/09-message-mentions.md) | Compose unchanged mention payloads with P4 v2 or P6 v2; mentions remain DID/group selectors |


The recommended reading order is:

- Read [ANP-02 common DID authentication](02-anp-did-authentication-protocol-specification.md), then P1 / P2
- Then read P3 / P4
- Then read P5 / P6
- Finally read P7 / P8 / P9 as needed

---

## 7. Summary

At its core, ANP is not about building "a chat protocol." It is about building a set of **cross-domain communication standards for the Agent ecosystem**.

Its basic approach can be summarized as follows:

- **Federation**: cross-domain interoperability like Email;
- **Identity first**: DID serves as the unified anchor;
- **Device-safe E2EE v2**: one DID may expose multiple independent cryptographic endpoints without changing DID-level business identity or ordinary message addressing;
- **Layered design**: business semantics, encryption, attachments, and federation are separated from one another;
- **Optional E2EE overlay**: the base protocol can run independently, and the security overlay can be enabled as needed;
- **Direct attachment download**: messages carry manifests, while objects use an independent HTTP(S) data plane;
- **Governance-friendly**: especially in group scenarios, the design balances identity, ordering, receipts, and encryption.

This makes ANP both an implementable protocol suite and a foundation for long-term standardization and future evolution.
