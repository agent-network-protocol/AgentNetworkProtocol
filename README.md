<div align="center">

[English](README.md) | [中文](README.cn.md)

</div>

# Agent Network Protocol (ANP)

> ANP aims to become the HTTP of the Agentic Web era: a protocol suite for agent identity, naming, discovery, negotiation, secure messaging, and application-level collaboration.

**Current specification set:** the core protocol documents have been organized around the ANP 1.1 release line. The released suite covers `did:wba` identity, WNS handles, agent description, agent discovery, end-to-end instant messaging, and the AP2 agent payment protocol. The meta-protocol specification remains a draft and is not released yet.

**Messaging vNext draft:** the released v1.1 messaging Profiles remain unchanged. A separately versioned [vNext draft suite](message/vnext/README.md) defines multi-device cryptographic endpoints under one DID; P1–P8 use `.v2` Profile IDs, while P9 is only a vNext binding for the unchanged Mention payload. Draft presence does not imply implementation support or public capability advertisement.

**Versioning note:** `Version: 1.1` identifies the specification/document release version. It does not change the ANP payload field `protocolVersion`; examples and protocol fields that use `"protocolVersion": "1.0.0"` remain unchanged because this release does not change protocol fields, flows, or security requirements.

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
- 🔒 **Identity and Encrypted Communication Layer:** based on W3C DID and Web infrastructure. This layer provides agent identity, `did:wba` authentication, and end-to-end encrypted messaging foundations.
- 📡 **Application Protocol Layer:** includes Agent Description, Agent Discovery, and Agent Application Protocols. Domain protocols such as agent payment, authorization, authentication, and transaction protocols are built on top of this layer.
- 🧪 **Meta-protocol status:** ANP-06 remains a draft and is not part of the currently released architecture. The updated draft positions it as an Agent Description-driven semantic negotiation layer that uses `MetaProtocolInterface`, `anp.get_capabilities`, and `anp.negotiate` to select the subsequent interface, Profile, security profile, and schema.

## Protocol Specification Index

| Area | Document | Status | What it defines |
| --- | --- | --- | --- |
| Overview | [ANP Technical White Paper](01-agentnetworkprotocol-technical-white-paper.md) | White paper | Vision, design principles, and the three-layer architecture |
| Identity | [ANP-03: did:wba Method Specification](03-did-wba-method-design-specification.md) | Released v1.1 | Web-based DID method, cross-platform authentication, `e1_` Ed25519 binding, `k1_` compatibility extension |
| Naming | [ANP-04: ANP-DID:WBA Name Space Specification](04-anp-did-wba-name-space-specification.md) | Released v1.1 | WNS handles such as `alice.example.com`, Handle-to-DID resolution, DID rotation support |
| Meta-protocol | [ANP-06: Agent Communication Meta-Protocol](06-anp-agent-communication-meta-protocol-specification.md) | Draft / not released | Optional semantic meta-protocol negotiation, `MetaProtocolInterface` declaration, `anp.negotiate`, and interface / Profile / security profile / schema selection |
| Description | [ANP-07: Agent Description Protocol](07-anp-agent-description-protocol-specification.md) | Released v1.1 | Agent Description documents, interface descriptions, and capability publication |
| Discovery | [ANP-08: Agent Discovery Protocol](08-anp-agent-discovery-protocol-specification.md) | Released v1.1 | Active `.well-known` discovery and passive registration with search agents |
| Messaging | [ANP-09: End-to-End Instant Messaging Overview](09-ANP-end-to-end-instant-messaging-protocol-specification.md) | Released v1.1 + vNext Draft | Profile index for direct messaging, group messaging, E2EE, attachments, federation, mentions, and the separately versioned multi-device draft |
| Payments | [ANP-10: Agent Payment Protocol (AP2)](application/10-anp-agent-payment-protocol-specification.md) | Released v1.1 (EN); CN draft available | Agent-to-agent payments, mandates, receipts, DID-based signatures, and payment flows |

### Instant Messaging Profiles

The released ANP 1.1 end-to-end instant messaging suite is split into focused profiles:

1. [P1 Core Binding](message/01-core-binding.md): JSON-RPC 2.0 binding, request/response/error conventions.
2. [P2 Identity and Discovery](message/02-identity-and-discovery.md): DID-based service discovery and endpoint capability discovery.
3. [P3 Direct Messaging Base Semantics](message/03-direct-messaging-base-semantics.md): direct message sending and receipts.
4. [P4 Group Messaging Base Semantics](message/04-group-messaging-base-semantics.md): group lifecycle, membership, and group message semantics.
5. [P5 Direct End-to-End Encryption](message/05-direct-end-to-end-encryption.md): E2EE overlay for direct messaging.
6. [P6 Group End-to-End Encryption](message/06-group-end-to-end-encryption.md): E2EE overlay for group messaging.
7. [P7 Attachments and Object Transfer](message/07-attachments-and-object-transfer.md): manifests, object services, and large-object transfer.
8. [P8 Federation and Cross-Domain](message/08-federation-and-cross-domain.md): cross-domain routing, relaying, and result witnessing.
9. [P9 Message Mentions Extension](message/09-message-mentions.md): group-message mention payloads and selector semantics.

The [vNext draft index](message/vnext/README.md) and its [Chinese mirror](chinese/message/vnext/README.md) contain the P1–P8 `.v2` Profiles and the P9 vNext binding. vNext keeps ordinary Direct, Group, Mention, and Attachment operations addressed only by business DID or Group DID; their device fan-out remains local to the receiving domain. It adds `device_id` only where Direct E2EE or Group E2EE requires a cryptographic endpoint, including independent Direct sessions and multiple MLS leaves, and P8 preserves device selectors only for such enclosing Profiles. Implementations **MUST NOT** reinterpret a v1 Profile as v2 or silently downgrade a v2 operation to v1.

### DID Compatibility Appendices

- [Appendix A: did:wba `k1_` Compatibility Extension](appendix-a-did-wba-k1-compatibility-extension.md)
- [Appendix B: Compatibility with Native `did:web`](appendix-b-compatibility-with-native-did-web.md)

## Quick Start

- To understand ANP concepts and usage, read the [ANP Getting Started Guide](docs/anp-getting-started-guide.md) or the [Chinese guide](docs/chinese/ANP入门指南.md).
- To implement agent identity and authentication, start from [ANP-03: did:wba](03-did-wba-method-design-specification.md) and the two DID compatibility appendices.
- To publish an agent, read [ANP-07: Agent Description Protocol](07-anp-agent-description-protocol-specification.md) and [ANP-08: Agent Discovery Protocol](08-anp-agent-discovery-protocol-specification.md).
- To build messaging, start from [ANP-09](09-ANP-end-to-end-instant-messaging-protocol-specification.md) and then choose the required messaging profiles.
- To run demos, see [ANP Sample Programs](docs/chinese/ANP示例程序.md).

## Protocol SDK

The open-source implementation of ANP is maintained in the AgentConnect repository:

- [https://github.com/agent-network-protocol/AgentConnect](https://github.com/agent-network-protocol/AgentConnect)

AgentConnect focuses on practical SDK support for `did:wba`, authentication, agent description, protocol negotiation, secure communication, and application protocols.

## Repository Layout

- `01-*.md`, `03-*.md`, `04-*.md`, `06-*.md`, `07-*.md`, `08-*.md`, `09-*.md`: core English protocol documents.
- `application/`: application-layer protocols such as AP2.
- `message/`: the released ANP 1.1 end-to-end instant messaging Profile suite; `message/vnext/` contains separately versioned v2 drafts.
- `chinese/`: Chinese versions of core specifications and related research notes.
- `docs/`: guides, extended reading, and community operations documents.
- `blogs/`: articles and protocol analysis.
- `examples/`: sample ADP assets, API interface examples, and [messaging vNext multi-device JSON examples](examples/message-vnext/README.md).
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
- [ ] Stabilize and review the separately versioned multi-device messaging vNext draft.
- [x] Add the AP2 agent payment protocol to the application layer.
- [ ] Continue aligning SDK implementations and examples with the 1.1 specification set.
- [ ] Continue standardization work and expand domain-specific application protocols.

## Contact Us

We have established an ANP open-source technical community to advance ANP development through an open-source community approach. We sincerely invite you to join our community.

- Email: chgaowei@gmail.com
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
<a href="https://github.com/AlfredZuo"><img src="https://avatars.githubusercontent.com/u/22234543?v=4" width="64" height="64" alt="@AlfredZuo" /></a>
<a href="https://github.com/dzpzp"><img src="https://avatars.githubusercontent.com/u/116531432?v=4" width="64" height="64" alt="@dzpzp" /></a>
<a href="https://github.com/yumh1"><img src="https://avatars.githubusercontent.com/u/238633659?v=4" width="64" height="64" alt="@yumh1" /></a>
<a href="https://github.com/Aas-ee"><img src="https://avatars.githubusercontent.com/u/81606643?v=4" width="64" height="64" alt="@Aas-ee" /></a>
<a href="https://github.com/cocolin2016"><img src="https://avatars.githubusercontent.com/u/70193777?v=4" width="64" height="64" alt="@cocolin2016" /></a>
<a href="https://github.com/dreamsea656"><img src="https://avatars.githubusercontent.com/u/11325618?v=4" width="64" height="64" alt="@dreamsea656" /></a>
<a href="https://github.com/kylezhang"><img src="https://avatars.githubusercontent.com/u/3679798?v=4" width="64" height="64" alt="@kylezhang" /></a>
<a href="https://github.com/Pentiumtime"><img src="https://avatars.githubusercontent.com/u/129046354?v=4" width="64" height="64" alt="@Pentiumtime" /></a>
<a href="https://github.com/seanzhang9999"><img src="https://avatars.githubusercontent.com/u/25133739?v=4" width="64" height="64" alt="@seanzhang9999" /></a>
<a href="https://github.com/SeaOceanO"><img src="https://avatars.githubusercontent.com/u/287401010?v=4" width="64" height="64" alt="@SeaOceanO" /></a>
<a href="https://github.com/SunZhao2468"><img src="https://avatars.githubusercontent.com/u/238628622?v=4" width="64" height="64" alt="@SunZhao2468" /></a>
<a href="https://github.com/xfq"><img src="https://avatars.githubusercontent.com/u/2863444?v=4" width="64" height="64" alt="@xfq" /></a>
<!-- contributors:end -->

- [View the full contributors list](CONTRIBUTORS.md)

## License

This project is open-sourced under the MIT License. For details, please refer to [LICENSE](LICENSE). The copyright is held by GaoWei Chang. Any user of this project must retain the original copyright notice and license file.

## Copyright Notice

Copyright (c) 2024 GaoWei Chang
This file is released under the [MIT License](./LICENSE). You are free to use and modify it, but must retain this copyright notice.
