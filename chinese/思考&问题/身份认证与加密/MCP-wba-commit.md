[proposal]Support for authentication methods based on the W3C DID specification `did:wba`

## Motivation and Context

We have added an experimental authentication scheme, `did:wba`, to MCP.  

We believe `did:wba` can serve as an excellent complement to OAuth 2.0 for the following reasons:  
1. `did:wba` provides security equivalent to OAuth 2.0.  
2. `did:wba` supports decentralized identity authentication, offering better interoperability.  
3. `did:wba` requires fewer interactions and has a simpler process.  

Using did:wba can lower the barrier for users to access MCP servers. Taking API services like exa as an example, if exa also supports did:wba and provides an API subscription interface, users won't need to log in to exa for registration, configuration, and subscription operations. The MCP client can directly use the API and the user's DID to subscribe to exa's services, then send requests with authentication information to exa's MCP server for identity verification and API calls. This makes it much more convenient for users to utilize various MCP servers.


The changes in this code are based on a branch that has not yet been merged into the main branch (PR link: [https://github.com/modelcontextprotocol/specification/pull/101](https://github.com/modelcontextprotocol/specification/pull/101)). We will update our code accordingly if there are any changes to this branch.

## How Has This Been Tested?
This proposal has not yet been implemented in a client/server.

## Breaking Changes
Users do not need to update their code or configuration. As an experimental scheme, the server or client can choose not to support it.

## Types of changes
- [ ] Bug fix (non-breaking change which fixes an issue)
- [x] New feature (non-breaking change which adds functionality)
- [ ] Breaking change (fix or feature that would cause existing functionality to change)
- [ ] Documentation update

## Checklist
<!-- Go over all the following points, and put an `x` in all the boxes that apply. -->
- [x] I have read the [MCP Documentation](https://modelcontextprotocol.io)
- [x] My code follows the repository's style guidelines
- [x] New and existing tests pass locally
- [x] I have added appropriate error handling
- [x] I have added or updated documentation as needed

## Additional context
<!-- Add any other context, implementation notes, or design decisions -->

Relevant documentation links:  
1. [did:wba Method Design Specification](https://github.com/agent-network-protocol/AgentNetworkProtocol/blob/main/03-did%3Awba%20Method%20Design%20Specification.md)

2. blogs：
  - [did:wba - A Web-based Decentralized Identifier](https://github.com/agent-network-protocol/AgentNetworkProtocol/blob/main/blogs/did%3Awba%2C%20a%20Web-based%20Decentralized%20Identifier.md)
  - [Security Principles of did:wba](https://github.com/agent-network-protocol/AgentNetworkProtocol/blob/main/blogs/did%3Awba-security-principles.md)
  - [The Most Suitable Identity Authentication Technology for Agents: Comparing OpenID Connect, API Keys, and did:wba](https://github.com/agent-network-protocol/AgentNetworkProtocol/blob/main/blogs/Comparison%20of%20did%3Awba%20with%20OpenID%20Connect%20and%20API%20keys.md)


## 版权声明  
Copyright (c) 2024 ANP Community  
本文件依据 [MIT 许可证](./LICENSE) 发布，您可以自由使用和修改，但必须保留本版权声明。  
