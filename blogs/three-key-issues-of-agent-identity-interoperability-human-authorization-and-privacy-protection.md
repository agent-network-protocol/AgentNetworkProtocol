# Three Key Issues of Agent Identity: Interoperability, Human Authorization, and Privacy Protection

We can be fairly certain that agents will participate in our digital lives in unprecedented ways, from personal assistants to various professional service agents. They require a comprehensive identity system to ensure secure and efficient interactions between agents.

This article will delve into three key issues facing agent identity:
- **Interoperability**: How can we enable all agents to communicate and collaborate? This is the core issue of agent identity. It can break down digital silos, allowing AI to truly gain complete context and provide a more intelligent interactive experience.
- **Human Authorization**: In sensitive and important requests, how do we determine whether a request is manually authorized by a human or autonomously initiated by an agent? We must be able to allow agents to access the internet on behalf of humans while also restricting the agents' permissions.
- **Privacy Protection**: How can we prevent agents from leaking users' private information during interactions?

We introduce the Agent Network Protocol (ANP) and its considerations and designs regarding these three issues.

## Why Agent Identity Is Crucial

Since the birth of the internet, identity authentication has been a core issue in the digital world. From the initial username and password, to later two-factor authentication and biometric recognition, identity verification technology has continuously evolved. Today, with the advent of the agent era, identity authentication faces new challenges.

Intelligent agents differ from traditional software in that they possess autonomy, learning ability, and decision-making capability. In the agentic web, intelligent agents need to:

- **Act as digital citizens**: Have their own identities that can be recognized and trusted by other agents and systems
- **Act on behalf of users**: Obtain appropriate authorization to perform various tasks and transactions on behalf of users
- **Cross-platform collaboration**: Seamlessly interact with agents and services on different platforms to form collaborative networks
- **Protect user privacy**: Protect users' privacy and security while acting on their behalf

As we discussed in "What Makes Agentic Web Different," to unleash the power of AI, we need to allow AI to obtain complete contextual information, access all tools on the internet, interact with the internet in the way it excels at, and collaborate efficiently with other AIs. The prerequisite for all of this is a powerful and flexible agent identity system.

## Key Issue One: Interoperability—Breaking Down Identity Silos

This is the most critical and challenging issue for agent identity.

In the current internet environment, identity systems are mostly platform silos. Your WeChat account cannot be used in DingTalk, and your Alipay account cannot be directly used for shopping on JD.com.

This identity fragmentation will become a serious obstacle in the agent era, as agents need to move freely between various services to gather information and perform tasks.

If one agent needs to call the service of another agent, but they belong to different platforms with different identity systems, collaboration becomes extremely complex and may require multiple manual interventions from users, which clearly contradicts the original intention of agents to reduce user burden.

### Analysis of Existing Solutions

In the search for solutions, we have compared various identity authentication technologies existing on the internet:

- **OpenID Connect**: Although widely used for single sign-on, its centralized nature and complex processes are not suitable for efficient interactions between agents. Fundamentally, OpenID Connect was not designed to solve identity interoperability for the future.
- **API Keys**: Widely used for API integration, they are simple and direct but have limited security, and still require manual registration and configuration by users, which reduces the efficiency of agent interactions.
- **Blockchain Identity Solutions**: High degree of decentralization, but face challenges in scalability and performance. With current technology, supporting billions of users presents significant challenges.
- **Email Protocol**: Simple and decentralized, and this decentralization aligns with our ideal. However, the email protocol was designed specifically for electronic mail business and does not use HTTP at its core, making it unable to leverage existing mature web infrastructure.
- **Nostr and AT Protocols**: Emerging decentralized protocols, but not yet widely adopted. AT Protocols is a protocol I am very optimistic about; it also uses W3C DID for identity authentication, and its application Bluesky could very well be the future equivalent of WeChat.
- **W3C DID**: The W3C Decentralized Identifier (DID) specification was designed to address various problems brought by centralized identity and was published as a recommended standard in 2022. However, it has not been widely used on the internet.

### W3C DID Is the Best Solution for Agent Identity

After its release, W3C DID has not been widely applied. However, after analyzing all available technologies, we firmly believe that W3C DID is absolutely the most suitable identity technology for intelligent agents, and designing a new one would be hard-pressed to improve upon it.

There are several reasons:
- W3C DID was born for decentralization and identity interoperability, perfectly aligning with the need for agent interoperability.
- W3C DID implementation is more flexible; it does not currently mandate a specific decentralized implementation, such as requiring blockchain for DID. This gives developers more choices.
- We have designed a new method implementation for agents based on the did:web method. This method can achieve decentralization while repeatedly leveraging existing mature web infrastructure, capable of supporting billions of agents.

The original W3C DID specification combined with our method implementation is, in my opinion, the most suitable identity solution for intelligent agents currently available.

For a detailed introduction to the solution, see: [did:wba, a Web-based Decentralized Identifier](/blogs/did:wba,%20a%20Web-based%20Decentralized%20Identifier.md)

## Key Issue Two: Human Authorization—Ensuring Security for Critical Operations

As intelligent agents increasingly perform tasks on behalf of humans, a key issue becomes more important: whether requests sent by agents have received manual authorization from humans.

For example, an agent can autonomously browse hotel information on behalf of a user, but when it comes to actual booking and payment, it should obtain manual authorization from the human.

The lack of such a distinction mechanism can lead to two risks: first, agents being overly cautious, frequently interrupting users to confirm simple operations; second, agents being overly autonomous, lacking necessary human supervision for key decisions, potentially causing financial losses for humans.

### Human Authorization Mechanism in did:wba

The ANP protocol proposes an elegant solution through the did:wba specification: a clear distinction mechanism between human authorization and agent automatic authorization.

In the did:wba document, we introduced the `humanAuthorization` field to store public key information specifically for human authorization:

```json
"humanAuthorization": [
  "did:wba:example.com%3A8800:user:alice#WjKgJV7VRw3hmgU6--4v15c0Aewbcvat1BsRFTIqa5Q",
  {
    "id": "did:wba:example.com%3A8800:user:alice#key-3",
    "type": "Ed25519VerificationKey2020",
    "controller": "did:wba:example.com%3A8800:user:alice",
    "publicKeyMultibase": "z9XK2BVwLNv6gmMNbm4uVAjZpfkcJDwDwnZn6z3wweKLo"
  }
]
```

The working principle of this mechanism is:

1. **Default Authorization**: For non-sensitive operations, agents can use regular verification methods for signing and authorization without human intervention.
2. **Human Authorization**: For important operations (such as purchases, payments, access to private data), signatures using the keys defined in `humanAuthorization` are required, which typically need explicit, manual authorization from humans through biometric recognition or similar methods.

In the agent description protocol, service providers can clearly specify which interfaces require manual human authorization:

```json
{
  "@type": "ad:StructuredInterface",
  "protocol": "YAML",
  "humanAuthorization": true,
  "url": "https://agent-network-protocol.com/api/purchase-interface.yaml",
  "description": "A YAML file for interacting with the intelligent agent through purchase."
}
```

Through this mechanism, we achieve a balance between agent autonomy and security: agents can freely perform daily tasks, while critical operations remain strictly controlled, ensuring the financial security and data privacy of users.

Agent developers need to securely store the private keys corresponding to humanAuthorization and implement permission isolation. For example, humanAuthorization signatures should only be used after verifying the user through biometric recognition (fingerprint, facial recognition, etc.).

## Issue Three: Privacy Protection—Preventing Behavior Tracking and Profiling

As agents act on behalf of users across various platforms, a more subtle but equally important issue emerges: how to prevent user behavior from being tracked and analyzed? If a user uses the same identifier to access different services, these services might collaborate to build a detailed behavioral profile of the user, infringing on user privacy.

### Multi-Identity Strategy in did:wba

To address this issue, the ANP protocol proposes a multi-identity strategy in the did:wba specification:

1. **Primary DID**: Users have a primary DID that typically remains relatively stable, used for maintaining social relationships and other scenarios requiring persistent identity.
2. **Sub-DIDs**: Users simultaneously possess multiple sub-DIDs subordinate to the primary DID, used for different interaction scenarios such as shopping, restaurant reservations, content subscriptions, etc.
3. **Periodic Updates**: Sub-DIDs can be updated periodically; old DIDs can be deactivated and new DIDs requested, increasing the difficulty of tracking.

This multi-level identity architecture allows users to use different identities in different scenarios, preventing cross-platform behavior correlation while maintaining subordinate relationships between DIDs for easy user management.

Most importantly, this design gives users control over their digital identities, enabling them to decide when, where, and how to present their identity information, truly realizing the vision of "user data controlled by users."

## Copyright Notice  
Copyright (c) 2024 ANP Community  
This document is released under the [MIT License](./LICENSE), you are free to use and modify it, but you must retain this copyright notice.
