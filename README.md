<div align="center">

[English](README.md) | [中文](README.cn.md)

</div>

# Agent Network Protocol (ANP)

> ANP aims to become the HTTP of the Agentic Web era: a protocol suite for agent identity, naming, discovery, negotiation, secure messaging, and application-level collaboration.

**Current specification set: ANP 1.2.** Core specifications and all nine messaging documents have been integrated from vNext into their canonical release paths. ANP-02 provides DID-method-independent authentication for `did:wba` and native `did:web`; ANP-03 defines WBA method rules and identity continuity; ANP-04 defines WNS naming. Agent description and discovery documents are aligned with this release.

**Release scope:** root-level specifications and `message/` are the current English documents, with Chinese mirrors under `chinese/`. ANP-06 remains a draft. P6 Group E2EE is included in the 1.2 documentation but remains a candidate pending its registered MLS `ExtensionType` release gate; the provisional `0xF0A1` value is not a completed registration. Application protocols are independently versioned; ANP-10 is an AP2 adaptation draft, not a released stable payment standard.

**ANP Messaging 1.2:** the [Profile index](message/README.md) defines the mixed-version suite. P1/P2/P3/P7/P8 and the P9 binding retain v1; P4 Group Base and P5/P6 E2EE use v2. Publication of specifications does not establish SDK or product implementation support; capability advertisement must reflect actual support and each Profile's release restrictions.

**Versioning note:** `Version: 1.2` identifies the specification/document release version, not a wire version. Profile identifiers, `protocolVersion`, interface versions, algorithms, and signature/AAD formats follow their owning specifications and are not globally renumbered. P4/P5/P6 adopt the v2 contracts already defined in vNext; other Profile identifiers and example wire-version fields remain unchanged.

**Note:** This project has not issued any digital currency on any platform or blockchain.

## Vision and Positioning

Agent Network Protocol (ANP) is an open-source communication protocol for intelligent agents. Its goal is to define how agents connect with each other and to build an open, secure, and efficient collaboration network for billions of agents.

<p align="center">
  <img src="images/agentic-web3.png" width="50%" alt="Agentic Web"/>
</p>

We believe the agent internet is the next generation of information infrastructure after the human-centric internet. In this vision:

- **From platform-centric to protocol-centric:** data and services should not remain locked in isolated platforms. Agents need open protocols for direct connection.
- **Connection is power:** every agent can be both an information consumer and a service provider, able to discover, connect to, and collaborate with other nodes.
- **AI-native network:** agents should interact through semantically clear, machine-readable, and callable protocols rather than only through human-facing webpages.

## Why We Need ANP

Current internet infrastructure is mature, but it still lacks a communication and connection layer designed for large-scale agent networks. ANP focuses on three challenges:

- 🌐 **Interconnection:** enable agents from different platforms and domains to authenticate, discover, and communicate with each other.
- 🖥️ **Native interfaces:** let AI use APIs, protocol documents, structured descriptions, and negotiated interfaces instead of imitating human browsing.
- 🤝 **Efficient collaboration:** allow agents to self-organize, self-negotiate, and build lower-cost collaboration networks.

## Protocol Architecture

<p align="center">
  <img src="images/anp-architecture2.png" width="50%" alt="Protocol Architecture Diagram"/>
</p>

ANP is built on existing Internet infrastructure and organizes the released protocol capabilities into two core protocol layers plus domain-specific application protocols:

- 🌐 **Open Internet Infrastructure:** ANP reuses HTTP, CA, DNS, CDN, Search, and TLS instead of rebuilding a new network stack.
- 🔒 **Identity and Encrypted Communication Layer:** based on W3C DID and Web infrastructure. ANP-02 separates common authentication from DID method validation, including `did:wba` and native `did:web`, while the messaging Profiles define DID addressing and device-bound E2EE.
- 📡 **Application Protocol Layer:** includes Agent Description, Agent Discovery, and Agent Application Protocols. Domain protocols such as agent payment, authorization, authentication, and transaction protocols are built on top of this layer.
- 🧪 **Meta-protocol status:** ANP-06 remains a draft and is not part of the currently released architecture. The updated draft positions it as an Agent Description-driven semantic negotiation layer that uses `MetaProtocolInterface`, `anp.get_capabilities`, and `anp.negotiate` to select the subsequent interface, Profile, security profile, and schema.

## Protocol Specification Index

| Area | Document | Status | What it defines |
| --- | --- | --- | --- |
| Overview | [ANP-01: Technical White Paper](01-agentnetworkprotocol-technical-white-paper.md) | Informative v1.2 | Vision, design principles, and conceptual architecture; normative status is defined by each specification |
| Authentication | [ANP-02: DID Authentication Protocol](02-anp-did-authentication-protocol-specification.md) | Released v1.2 | Method-independent HTTP/JSON authentication and WBA/Web bindings; independent of Messaging and WNS |
| Identity | [ANP-03: did:wba Method Specification](03-did-wba-method-design-specification.md) | Released v1.2 | Web-based DID method, `e1_` binding, stable subject paths, and verified DID transitions |
| Naming | [ANP-04: ANP-DID:WBA Name Space Specification](04-anp-did-wba-name-space-specification.md) | Released v1.2 | WNS Handles, name-to-DID resolution, WBA binding, and existing native Web compatibility |
| Meta-protocol | [ANP-06: Agent Communication Meta-Protocol](06-anp-agent-communication-meta-protocol-specification.md) | Draft; document version 1.2 | Optional semantic negotiation, `MetaProtocolInterface`, and interface / Profile / security profile / schema selection |
| Description | [ANP-07: Agent Description Protocol](07-anp-agent-description-protocol-specification.md) | Released v1.2 | Agent Description documents, interface descriptions, and capability publication |
| Discovery | [ANP-08: Agent Discovery Protocol](08-ANP-Agent-Discovery-Protocol-Specification.md) | Released v1.2 | Active `.well-known` discovery and passive registration with search agents |
| Messaging | [ANP-09: End-to-End Instant Messaging Overview](09-ANP-end-to-end-instant-messaging-protocol-specification.md) | Published v1.2 catalog; P6 candidate | Direct and group messaging, device-bound E2EE, attachments, federation, and mentions |
| Payments | [ANP-10: AP2 Payment Adaptation Draft](application/10-anp-agent-payment-protocol-specification.md) | Draft / not released; EN document v1.1, CN document v0.1 | Proposed ANP payment adaptation, mandates, receipts, and transaction flows; not a stable payment interoperability standard |

The [unified vNext workspace](vnext/README.md) contains the English and Chinese core and messaging snapshots as the starting point for the next iteration. No post-1.2 protocol changes are defined there yet. Current normative references use the release paths above. The historical deprecated did:all documents retain their original identity; the current ANP-02 number denotes DID authentication.

### Instant Messaging Profiles

The [ANP Messaging 1.2 Profile index](message/README.md) and its [Chinese mirror](chinese/message/README.md) include all nine documents:

| Profile | Wire identifier | Document |
| --- | --- | --- |
| P1 | `anp.core.binding.v1` | [Core Binding](message/01-core-binding.md) |
| P2 | `anp.identity.discovery.v1` | [Identity and Discovery](message/02-identity-and-discovery.md) |
| P3 | `anp.direct.base.v1` | [Direct Messaging Base Semantics](message/03-direct-messaging-base-semantics.md) |
| P4 | `anp.group.base.v2` | [Group Messaging Base Semantics](message/04-group-messaging-base-semantics.md) |
| P5 | `anp.direct.e2ee.v2` | [Direct End-to-End Encryption](message/05-direct-end-to-end-encryption.md) |
| P6 | `anp.group.e2ee.v2` — candidate, stable code point pending | [Group End-to-End Encryption](message/06-group-end-to-end-encryption.md) |
| P7 | `anp.attachment.v1` | [Attachments and Object Transfer](message/07-attachments-and-object-transfer.md) |
| P8 | `anp.federation.relay.v1` | [Federation and Cross-Domain](message/08-federation-and-cross-domain.md) |
| P9 | v1 binding extension; no independent `meta.profile` | [Message Mentions](message/09-message-mentions.md) |

Ordinary Direct, Group, Mention, and Attachment operations remain addressed by business DID or Group DID; device fan-out stays local to the receiving domain. P4 v2 introduces DID-only membership and Host-coordinated member DID updates. P5/P6 v2 use independent cryptographic device endpoints, including per-device-pair Direct sessions and multiple MLS leaves. Implementations **MUST NOT** reinterpret E2EE v1 state as v2 or silently downgrade E2EE v2 operations. P6's candidate status and registered-code-point gate remain in force.

### DID Compatibility Appendices

- [Appendix A: did:wba `k1_` Compatibility Extension](appendix-a-did-wba-k1-compatibility-extension.md)
- [Appendix B: Native `did:web` Integration](appendix-b-compatibility-with-native-did-web.md): ANP-02 authentication, existing WNS/Web compatibility, and messaging composition without conversion to WBA.

## Quick Start

- For method-independent ordinary API authentication, read [ANP-02](02-anp-did-authentication-protocol-specification.md). It does not require Messaging, Handles, or device Manifests.

- To understand ANP concepts and usage, read the [ANP Getting Started Guide](docs/anp-getting-started-guide.md) or the [Chinese guide](docs/chinese/ANP入门指南.md).
- To implement ANP 1.2 identity, start with ANP-02, then [ANP-03: did:wba](03-did-wba-method-design-specification.md) for WBA method validation or [Appendix B](appendix-b-compatibility-with-native-did-web.md) for native `did:web` integration.
- To publish an agent, read [ANP-07: Agent Description Protocol](07-anp-agent-description-protocol-specification.md) and [ANP-08: Agent Discovery Protocol](08-ANP-Agent-Discovery-Protocol-Specification.md).
- To build messaging, start from [ANP-09](09-ANP-end-to-end-instant-messaging-protocol-specification.md) and then choose the required messaging profiles.
- To run demos, see [ANP Sample Programs](docs/chinese/ANP示例程序.md).

## Protocol SDK

The open-source implementation of ANP is maintained in the AgentConnect repository:

- [https://github.com/agent-network-protocol/AgentConnect](https://github.com/agent-network-protocol/AgentConnect)

AgentConnect focuses on practical SDK support for `did:wba`, authentication, agent description, protocol negotiation, secure communication, and application protocols.

## Open-Source Implementation: AWiki

AWiki is an open-source implementation of agent identity and messaging based on ANP:

- [awiki-cli-rs2](https://github.com/AgentConnect/awiki-cli-rs2): Rust SDK and command-line client for agent identity and messaging.
- [awiki-me](https://github.com/AgentConnect/awiki-me): Cross-platform Flutter app for identity management and messaging.
- [awiki-open-server](https://github.com/AgentConnect/awiki-open-server): Open-source server implementation for agent identity and messaging.

## Repository Layout

- `01-*.md`, `02-*.md`, `03-*.md`, `04-*.md`, `06-*.md`, `07-*.md`, `08-*.md`, `09-*.md`: English core documents, with document version 1.2 and individual status markers.
- `message/`: the ANP Messaging 1.2 Profile suite and index; P6 retains candidate status.
- `chinese/`: Chinese mirrors of core and messaging specifications, plus related research notes.
- `vnext/`: unified next-version workspace, including `vnext/chinese/`, `vnext/message/`, and `vnext/chinese/message/`. Its initial contents are historical pre-release snapshots; the earlier scattered paths remain frozen copies for existing links.
- `application/`: independently versioned application-layer protocols such as AP2.
- `docs/`: guides, extended reading, and community operations documents.
- `blogs/`: articles and historical protocol analysis.
- `examples/`: ADP assets, API interfaces, [Messaging 1.2 examples](examples/message-vnext/README.md), and [ANP-02 vectors](examples/did-authentication-vnext/README.md). The example directory names retain `-vnext` for path compatibility.
- `images/` and `standard/`: shared figures and standardization references.

## Further Reading

- [Extended Reading](docs/links.md)
- [ANP Technical White Paper](01-agentnetworkprotocol-technical-white-paper.md)
- [AgentConnect Examples](https://github.com/agent-network-protocol/AgentConnect)

## Milestones

- [x] Define and implement the identity authentication and secure communication foundation.
- [x] Release `did:wba` v1.1 with default `e1_` Ed25519 path binding and compatibility guidance for `k1_` and native `did:web`.
- [x] Define WNS handles as a human-readable naming layer for DID-based agents.
- [x] Release the Agent Description Protocol and Agent Discovery Protocol.
- [ ] Release the meta-protocol after the draft is stabilized.
- [x] Split end-to-end instant messaging into an overview plus nine interoperable profiles.
- [x] Integrate ANP-02 authentication, ANP-03 identity continuity, ANP-04 naming, and native Web integration into the ANP 1.2 documents.
- [x] Integrate all nine messaging documents and their mixed-version Profile catalog into ANP 1.2.
- [ ] Complete the registered MLS ExtensionType release gate for stable P6 v2.
- [x] Add an AP2 payment adaptation draft to the application layer.
- [ ] Continue aligning SDK implementations and examples with the 1.2 specification set and validating actual interoperability.
- [ ] Continue standardization work and expand domain-specific application protocols.

## Contact Us

We have established an ANP open-source technical community to advance ANP development through an open-source community approach. We sincerely invite you to join our community.

- Email: chgaowei@gmail.com
- Additional contact emails: zynetzy1@aliyun.com, 2764433097@qq.com
- Discord: [https://discord.gg/sFjBKTY7sB](https://discord.gg/sFjBKTY7sB)
- Official website: [https://agent-network-protocol.com/](https://agent-network-protocol.com/)
- GitHub: [https://github.com/agent-network-protocol/AgentNetworkProtocol](https://github.com/agent-network-protocol/AgentNetworkProtocol)
- WeChat: flow10240

## Contributing

We welcome contributions in any form. Please refer to [CONTRIBUTING.md](CONTRIBUTING.md).

### Contributors

We extend our sincere gratitude to all contributors for their outstanding work and dedication to the Agent Network Protocol project.

<!-- contributors:start -->
<a href="https://github.com/chgaowei"><img src="https://avatars.githubusercontent.com/u/1315207?v=4" width="64" height="64" alt="@chgaowei" /></a>
<a href="https://github.com/yagi2018"><img src="https://avatars.githubusercontent.com/u/45328391?v=4" width="64" height="64" alt="@yagi2018" /></a>
<a href="https://github.com/Julian-Zhu-STD"><img src="https://avatars.githubusercontent.com/u/238634316?v=4" width="64" height="64" alt="@Julian-Zhu-STD" /></a>
<a href="https://github.com/amdoi7"><img src="https://avatars.githubusercontent.com/u/91404105?v=4" width="64" height="64" alt="@amdoi7" /></a>
<a href="https://github.com/claude"><img src="https://avatars.githubusercontent.com/u/81847?v=4" width="64" height="64" alt="@claude" /></a>
<a href="https://github.com/han188"><img src="https://avatars.githubusercontent.com/u/15783771?v=4" width="64" height="64" alt="@han188" /></a>
<a href="https://github.com/khyao78"><img src="https://avatars.githubusercontent.com/u/59645954?v=4" width="64" height="64" alt="@khyao78" /></a>
<a href="https://github.com/yumh1"><img src="https://avatars.githubusercontent.com/u/238633659?v=4" width="64" height="64" alt="@yumh1" /></a>
<a href="https://github.com/AlfredZuo"><img src="https://avatars.githubusercontent.com/u/22234543?v=4" width="64" height="64" alt="@AlfredZuo" /></a>
<a href="https://github.com/dreamsea656"><img src="https://avatars.githubusercontent.com/u/11325618?v=4" width="64" height="64" alt="@dreamsea656" /></a>
<a href="https://github.com/dzpzp"><img src="https://avatars.githubusercontent.com/u/116531432?v=4" width="64" height="64" alt="@dzpzp" /></a>
<a href="https://github.com/SeaOceanO"><img src="https://avatars.githubusercontent.com/u/287401010?v=4" width="64" height="64" alt="@SeaOceanO" /></a>
<a href="https://github.com/Aas-ee"><img src="https://avatars.githubusercontent.com/u/81606643?v=4" width="64" height="64" alt="@Aas-ee" /></a>
<a href="https://github.com/cocolin2016"><img src="https://avatars.githubusercontent.com/u/70193777?v=4" width="64" height="64" alt="@cocolin2016" /></a>
<a href="https://github.com/cursoragent"><img src="https://avatars.githubusercontent.com/u/199161495?v=4" width="64" height="64" alt="@cursoragent" /></a>
<a href="https://github.com/kylezhang"><img src="https://avatars.githubusercontent.com/u/3679798?v=4" width="64" height="64" alt="@kylezhang" /></a>
<a href="https://github.com/Math1987"><img src="https://avatars.githubusercontent.com/u/55652304?v=4" width="64" height="64" alt="@Math1987" /></a>
<a href="https://github.com/Pentiumtime"><img src="https://avatars.githubusercontent.com/u/129046354?v=4" width="64" height="64" alt="@Pentiumtime" /></a>
<a href="https://github.com/PreciousNwakama"><img src="https://avatars.githubusercontent.com/u/65106738?v=4" width="64" height="64" alt="@PreciousNwakama" /></a>
<a href="https://github.com/seanzhang9999"><img src="https://avatars.githubusercontent.com/u/25133739?v=4" width="64" height="64" alt="@seanzhang9999" /></a>
<a href="https://github.com/SunZhao2468"><img src="https://avatars.githubusercontent.com/u/238628622?v=4" width="64" height="64" alt="@SunZhao2468" /></a>
<a href="https://github.com/xfq"><img src="https://avatars.githubusercontent.com/u/2863444?v=4" width="64" height="64" alt="@xfq" /></a>
<!-- contributors:end -->

- [View the full contributors list](CONTRIBUTORS.md)

## License

The root project license is [Apache License 2.0 (Apache-2.0)](LICENSE). Retain the applicable license, copyright, and attribution notices. Repository copyright notices identify ANP Community; author and contributor credits remain in their own records.

This project-level statement does not replace separate notices in historical drafts, archived documents, or third-party reference material. Review those materials individually before redistribution or a project donation; updating a license label or copyright notice does not establish ownership or clear third-party rights.

## Copyright Notice

Copyright (c) 2024 ANP Community
This file is released under the [Apache License 2.0](./LICENSE). You are free to use and modify it, but must retain this copyright notice.
