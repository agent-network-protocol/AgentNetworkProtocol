# Agent Network Protocol Technical Blueprint


This document is outdated, please refer to [Agent Network Protocol Technical Whitepaper](01-AgentNetworkProtocol%20Technical%20White%20Paper.md).

## Vision

We are committed to making AgentNetworkProtocol(ANP) the **HTTP of the agentic web era**.

In this new era of rapid artificial intelligence development, we are entering a new epoch of agent networks. Imagine the future: your personal assistant agent seamlessly communicates with restaurant agents when ordering meals; your smart home agent collaborates with energy management agents to optimize power usage; your investment advisor agent exchanges real-time information with global market analysis agents... This is the upcoming era of agent networks.

However, as Bill Gates mentioned in [a blog post](https://www.gatesnotes.com/AI-agents), there is currently no standard protocol that allows agents to communicate with each other. This is the problem that Agent Network Protocol (ANP) aims to solve.

The vision of Agent Network Protocol (ANP) is to **define how agents connect with each other and build an open, secure, and efficient collaboration network for billions of agents**. Just as the development of Internet standard protocols has enabled the information age over the past three decades, we believe that in the near future, billions of agents will build unprecedented collaboration networks through ANP, creating greater value than the existing Internet. Empowered by AI technology and ANP, the agent network will eventually evolve into a **self-organizing, self-negotiating** efficient collaboration network - an incredibly exciting future.

## Challenges

Agent Network Protocol (ANP) aims to address three major challenges in connectivity:

- How agents authenticate each other to allow any two agents to connect
- How agents establish end-to-end encrypted communication to ensure communication security
- How agents efficiently exchange data to enhance collaboration efficiency

## Protocol Architecture

To address these three major challenges, Agent Network Protocol (ANP) is designed as a three-layer architecture, consisting of Identity and Encrypted Communication Layer, Meta-Protocol Layer, and Application Protocol Layer from bottom to top, as shown below:

<p align="center">
  <img src="/images/anp-architecture.png" width="50%" alt="Protocol Layer Design"/>
</p>

### Identity and Encrypted Communication Layer

This is the most fundamental part of the protocol, addressing two major challenges in agent communication: how agents authenticate each other and how to establish end-to-end encrypted communication.

Based on the W3C DID (Decentralized Identifiers) specification, integrating blockchain technology and end-to-end encryption, Agent Network Protocol (ANP) provides a breakthrough solution:

- **Fully Decentralized**: Agents have complete control over their identities without being restricted by any platform
- **Barrier-free Connection**: Supports agent authentication across any platforms, breaking down platform barriers
- **Ultimate Security**: End-to-end encryption ensures communication security, preventing intermediate nodes from decrypting content
- **Cost-effective and Efficient**: Based on existing Web infrastructure for rapid deployment at minimal cost

W3C DID is the cornerstone of ANP's identity and encrypted communication layer. Its decentralized nature and interoperability enable ANP's openness, allowing any two agents to establish connections and build an open agent collaboration network.

Detailed technical documentation: [GitHub](https://github.com/agent-network-protocol/AgentNetworkProtocol)

### Meta-Protocol Layer

With the empowerment of meta-protocols, the agent network has the potential to evolve into a **self-organizing, self-negotiating** efficient collaboration network - an exciting future.

Meta-protocol refers to the protocol for negotiating communication protocols. In the meta-protocol layer, we primarily reference and draw inspiration from the [Agora Protocol](https://arxiv.org/html/2410.11905v1).

In today's digital world, there exist massive data silos where data flow is concentrated within silos with limited flow between them. Besides business reasons, technical limitations are a major factor: enabling communication between heterogeneous networks (different architectures, functions, designs) through protocols often incurs enormous costs. The fundamental reason lies in the impossible triangle of heterogeneous network communication (Versatility, Efficiency, Portability) proposed in the Agora Protocol paper.

LLM-empowered agents combined with meta-protocols offer an excellent solution:

- Agents first communicate in natural language about their capabilities, data exchange formats, protocols used, etc., to determine protocol details for communication.
- Based on negotiation results, agents use LLMs to construct and process protocol messages, or generate code to handle protocols.
- Agents conduct protocol debugging, using LLMs to verify if protocol messages comply with negotiated specifications, resolving issues through natural language interaction if they don't.
- Finally, agents communicate using the finalized protocol.

We believe that driven by LLMs' natural language understanding and code generation capabilities, along with meta-protocol technology, the agent network will eventually evolve into a self-organizing, self-negotiating efficient collaboration network. This will give birth to numerous consensus communication protocols between agents, far exceeding the number of human-defined protocols.

### Application Protocol Layer

Application layer protocols fall into two categories: existing industry standards like email protocols, RTC specifications, W3C existing specifications, and consensus protocols automatically negotiated by the agent network. They all aim to enable agents to collaborate on specific business tasks.

In terms of data types transmitted by protocols, they can be broadly classified into three categories: text, files, and real-time multimedia streams. These three types can essentially cover all current business scenarios.

Agents can extend basic protocols based on their data or business characteristics. The role of standard specifications in the agent network is mainly to reduce negotiation complexity rather than enforce regulations. We believe that pairs of agents can negotiate personalized protocols best suited to their business scenarios.

## AgentConnect: Open Source Implementation of Agent Network Protocol (ANP)

We have open-sourced a project, AgentConnect (https://github.com/agent-network-protocol/AgentConnect), to implement Agent Network Protocol (ANP) functionality. The project architecture is shown below:

<p align="center">
  <img src="/images/agent-connect-architecture.png" width="50%" alt="Project Architecture"/>
</p>

Corresponding to ANP's three-layer architecture, AgentConnect primarily includes the following components:

1. **Authentication Module and End-to-End Encryption Module**
   Implements W3C DID-based authentication and end-to-end encrypted communication, including DID document generation, verification, retrieval, and implementation of end-to-end encryption based on DID and ECDHE (Elliptic Curve Diffie-Hellman Ephemeral).

2. **Meta-Protocol Module**
   Based on LLM (Large Language Model) and meta-protocol implementation, including application protocol negotiation, protocol code implementation, protocol debugging, and protocol processing.

3. **Application Protocol Integration Framework**
   Manages protocol specifications and code for communication with other agents, including protocol loading, unloading, configuration, and processing. Using this framework, agents can conveniently load and run needed protocols on demand, accelerating protocol negotiation.

Beyond these features, AgentConnect will also focus on performance and multi-platform support:

- **Performance**: As a fundamental codebase, we aim to provide ultimate performance and plan to rewrite core components in Rust.
- **Multi-platform**: Currently supporting macOS, Linux, Windows, with future support for mobile platforms and browsers.

## Milestones

For both protocol and open-source implementation, we are progressing step by step according to the following sequence:

- Build authentication and end-to-end encrypted communication protocol and implementation. This is our project's foundation and core, with current protocol design and code basically complete.
- Meta-protocol design and implementation. This will help the agent network evolve into a self-organizing, self-negotiating efficient collaboration network. This exciting feature is currently under development, with the first version expected to be released soon.
- Application protocol integration framework development. This will help Agent Network Protocol (ANP) serve agents in various scenarios.

Additionally, we follow the principle of prioritizing overall structure over details. In early stages, we focus on building the overall architecture, creating a complete outline for each major module to get it running quickly, rather than building perfect but non-functional modules.

To promote Agent Network Protocol (ANP) as an industry standard, we will establish an ANP standardization committee at an appropriate time, dedicated to promoting ANP as an industry standard recognized by international standardization organizations like W3C.

Finally, during the design process, we've increasingly felt that blockchain might be a more suitable network infrastructure for agents, and we may actively explore this direction in the future.

## Why Choose Agent Network Protocol (ANP)?

- **Open Interconnection**: Decentralized authentication based on W3C DID enables agents to break through platform limitations and achieve free, secure connections.
- **Technical Innovation**: Pioneering solution to cross-platform agent authentication through integration of blockchain and DID technologies.
- **Efficient Implementation**: Based on existing Web infrastructure for low-cost, rapid deployment, accelerating ecosystem development.
- **Future-oriented**: Building infrastructure for the agent network era, driving the evolution and innovation of self-organizing collaboration networks.
- **Professional Team**: Core team composed of senior engineers and researchers with rich experience in distributed systems, protocol design, and artificial intelligence.

## How to Contribute to Agent Network Protocol (ANP)

Whether you're a developer, researcher, enterprise, or anyone interested in Agent Network Protocol (ANP), we welcome you to join us and contribute to the development of ANP.

Contact us:

- Author: Chang Gaowei, chgaowei@gmail.com  
- Discord: [https://discord.gg/sFjBKTY7sB](https://discord.gg/sFjBKTY7sB)  
- Website: [https://agent-network-protocol.com/](https://agent-network-protocol.com/)  
- GitHub: [https://github.com/agent-network-protocol/AgentNetworkProtocol](https://github.com/agent-network-protocol/AgentNetworkProtocol)
## Copyright Notice
Copyright (c) 2024 ANP Community  
This file is released under the [MIT License](./LICENSE). You are free to use and modify it, but you must retain this copyright notice.
