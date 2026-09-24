# The Most Suitable Identity Authentication Technology for Agents: Comparing OpenID Connect, API Keys, and did:wba

## Agents Need New Identity Authentication Technology

Agents have introduced new requirements for identity authentication technology, with interoperability being one of the most crucial - specifically, enabling any two agents to connect and communicate with each other.

The principle is simple: AI must **have the ability to obtain complete context information and access all tools** to make correct decisions and take appropriate actions. Many vendors are currently attempting to solve this problem using Computer Use solutions.

<p align="center">
  <img src="/blogs/images/computer-use-product.png" width="50%" alt="computer use product"/>
</p>

However, we believe this is not the most efficient way for AI to interact with the internet. This approach makes AI mimic human methods of accessing the internet, whereas AI should interact with the digital world using its most proficient methods (APIs or communication protocols).

<p align="center">
  <img src="/blogs/images/agent-interview-Internet.png" width="50%" alt="agent-interview-Internet"/>
</p>

This raises an interoperability question: when agents use APIs or protocols to interact with the internet or other agents, how should identity verification be performed? Particularly, how can cross-platform identity verification be implemented to enable connections between any agents?

## Current Mainstream Cross-Platform Identity Authentication Technologies

Our identity accounts on the internet are often not cross-platform compatible. For example, your WeChat account cannot be recognized in the DingTalk system, and vice versa.

However, there are many cross-platform identity authentication technologies on the internet today, such as the common SSO (Single Sign-On), where you can use your Google account to log into many websites. There are also API keys, like the key OpenAI provides you to access their API. Let's briefly introduce these two technologies and examine whether they are suitable for agent identity authentication.

### OpenID Connect (OIDC)

OpenID Connect (OIDC) is an authentication protocol built on OAuth 2.0 that allows client applications to verify user identity and obtain basic user information (such as name, email). OIDC adds a standardized identity layer on top of OAuth 2.0, making it more suitable for login and single sign-on (SSO) scenarios.

[OpenID Connect Official Specification](https://openid.net/specs/openid-connect-core-1_0.html)

Let's use logging into a third-party website with a Google account as an example to explain the OIDC process. [Google OIDC Official Documentation](https://developers.google.com/identity/protocols/oauth2/openid-connect).

<p align="center">
  <img src="/blogs/images/openid-connect-fllow.png" width="50%" alt="openid-connect-fllow"/>
</p>

Using a Google account to log into third-party websites involves two parts, the preliminary process and the OAuth 2.0 process:
- Preliminary Process
  - Register a Google platform account
  - Create a project/application
  - Configure the project/application, including redirect URIs
  - Obtain OAuth 2.0 client ID and client secret
- OAuth 2.0 Process (using authorization code flow as an example)
  - Obtain authorization code
  - Use authorization code to get access token and ID token, which contains user information
  - Use access token and ID token to access detailed user information (optional). In the OpenID Connect process, detailed user information can be considered a protected resource.

Advantages of OpenID Connect:
- Simplifies user authentication process
- Widely used with well-established infrastructure
- High security

From the perspective of agent interoperability, OpenID Connect has several limitations:
- OpenID Connect essentially allows third-party applications to use an identity server (like Google) for user authentication. Two third-party applications cannot use the identity server to authenticate between themselves.
- OpenID Connect is a centralized solution requiring users to register with the identity server, making the preliminary process complex.
- The interaction process is complex, requiring multiple exchanges.

### API Keys

API Keys are simple credentials used to authenticate applications or users accessing Application Programming Interfaces (APIs). They are string-based identity identifiers, typically composed of randomly generated letters and numbers, functioning similarly to passwords. They can be used for authentication, access control, usage monitoring, and other scenarios.

<p align="center">
  <img src="/blogs/images/api-keys-flow.png" width="50%" alt="api-keys-flow"/>
</p>

The process of using API Keys for user authentication:
- Preliminary Process
  - Register an account on the platform
  - Obtain API Keys
- API Keys Authentication Process
  - Add API keys in the request header of secure protocols like HTTPS
  - Server validates the client's API keys

Advantages of API keys:
- Simple, easy to implement, minimal interaction
- Supports cross-platform authentication; two applications can verify identity with each other's API keys
- Widely used in API services, such as OpenAI and domestic model APIs, most using API keys for authentication

From the perspective of agent interoperability, API keys have several limitations:
- Lower security. Many MCP servers using API keys for authentication often require users to write API keys in configuration files, risking exposure.

<p align="center">
  <img src="/blogs/images/mcp-server-api-key-example.png" width="50%" alt="mcp-server-api-key-example"/>
</p>

- Still requires preliminary processes, including user registration and login.

## W3C DID-Based Authentication Technology: did:wba

### What is W3C DID

W3C DID (Decentralized Identifier) is a new decentralized identifier standard designed to address the dependencies of traditional centralized identity management systems. It became a recommended standard in 2022. Specification: [https://www.w3.org/TR/did-core/](https://www.w3.org/TR/did-core/)

Many applications are currently using the W3C DID specification, with a notable example being the recently popular Bluesky, a decentralized Twitter-like application.

### What is did:wba

did:wba is a DID method specification defined by [AgentNetworkProtocol (ANP)](https://github.com/agent-network-protocol/AgentNetworkProtocol). It implements decentralized authentication based on web infrastructure, specifically designed for authentication between agents. Specification: [did:wba Method Specification](https://github.com/agent-network-protocol/AgentNetworkProtocol/blob/main/03-did%3Awba%20Method%20Design%20Specification.md).

did:wba is very similar to email in functionality: different platforms have their own accounts, but can easily authenticate and communicate between different platforms. Both are based on web infrastructure, supporting large-scale users while achieving decentralization.

Suppose Agent A wants to subscribe to and call Agent B's services, the authentication and request process is as follows:

<p align="center">
  <img src="/blogs/images/did-wba-flow.png" width="75%" alt="did:wba-flow"/>
</p>

- Preliminary Process
  - Agent A wants to subscribe to Agent B's service, first calls Agent B's service subscription interface with Agent A's DID and signature, letting B know the subscription is from Agent A. Using API subscription, it can remove the complex registration, login, and configuration processes, reducing the connection cost between two agents.
- Authentication Process
  - Agent A includes its DID and signature in the HTTP header in the first HTTP request.
  - When Agent B receives the HTTP request, it extracts A's DID and signature from the HTTP header, then retrieves A's DID document from A's DID server using A's DID.
  - After obtaining A's DID document, Agent B verifies A's signature using the public key in A's DID document.
  - After verification, Agent B processes A's business request, returning business data along with an access token.
  - Agent A carries the access token in subsequent requests, and Agent B authenticates A by verifying the access token.

Advantages of did:wba authentication:
- High security
- Effectively utilizes web infrastructure, supporting large-scale users with strong implementability
- Decentralized design enabling authentication between any two agents or applications
- Simple preliminary process, no manual user registration or login configuration required
- Simple authentication process without increasing interaction frequency

Of course, did:wba has some limitations, the main one being that as a specification released in 2022, its infrastructure is not yet fully developed and its application scope is relatively limited. However, we can see star cases like Bluesky emerging.

## Comparison: did:wba vs OpenID Connect / API Keys

From the perspective of agent authentication, comparing did:wba with OpenID Connect and API keys:
- Security: did:wba and OpenID Connect have equivalent security levels, both higher than API keys.
- Complexity: OpenID Connect has the highest complexity, API keys the lowest, with did:wba in between.
- Interaction frequency: did:wba and API keys require minimal interaction, OpenID Connect requires the most.
- Preliminary process: did:wba can operate without manual user intervention, while OpenID Connect and API keys require manual user handling.
- Decentralization: did:wba and API keys can enable communication between any agents or applications. OpenID Connect cannot.
- Application scope: OpenID Connect and API keys are widely applied, while did:wba is a newer specification with limited application scope.

Overall comparison:
| Comparison Item | did:wba | OpenID Connect | API keys |
|:-------|:--------|:---------------|:---------|
| Security | High | High | Medium |
| Complexity | Medium | High | Low |
| Interaction Frequency | Low | High | Low |
| Preliminary Process | Simple, no manual work | Complex, requires manual work | Medium, requires manual work |
| Decentralization | Yes | No | Yes |
| Application Scope | Limited | Wide | Wide |

From the above comparison, we can see that did:wba not only supports interconnection between all agents but also possesses the security of OpenID Connect and the simplicity of API keys, while supporting large-scale user adoption. Overall, did:wba is the most suitable solution for authentication between agents.

Of course, OpenID Connect and API keys still have their roles. For instance, when agents interface with existing internet systems, they may still need to use OpenID Connect and API keys.

## Copyright Notice
Copyright (c) 2024 ANP Community  
This file is released under the [MIT License](./LICENSE). You are free to use and modify it, but you must retain this copyright notice.
