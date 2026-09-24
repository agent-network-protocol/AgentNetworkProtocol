# Analysis of Anthropic MCP 2025H1 Milestones

Anthropic MCP has just released its Roadmap for the first half of 2025: [https://modelcontextprotocol.io/development/roadmap#roadmap](https://modelcontextprotocol.io/development/roadmap#roadmap).

We have been researching agent communication protocols and paying close attention to MCP, and we have also submitted some of our proposals to the community.

Today, based on our understanding of MCP, we'll analyze the official milestones and share our thoughts on MCP and agent communication protocols.

The main points of this article are:

- Support for remote servers. This is very important. Among the support for remote servers, the support for authentication schemes is the most crucial aspect.
- Lower the usage threshold. The current usage threshold for MCP is too high; generally, it requires a certain development background to be effectively used.
- Community and standards. In the future, MCP will strive to become an industry standard.


## Milestone Analysis

### Remote MCP Support

In my previous article , I mentioned that MCP's lack of remote data access support is due to a critical flaw - the absence of a comprehensive identity authentication scheme.

We can see that the community has recognized this issue, as the first milestone is to support remote MCP connections, with authentication and authorization being the primary focus.

Currently, there is a proposal under review for identity authentication using OAuth 2.0. We have communicated with the maintainers in the community, and this solution seems to be the most practical approach given OAuth 2.0's standardization and widespread adoption.

The best aspect of this proposal is that it treats OAuth 2.0 as a standard process while proposing a pluggable authentication scheme. This allows other authentication methods to be incorporated into the specification as experimental solutions, which greatly enhances the flexibility and openness of the specification.

Based on this proposal, we have developed a W3C DID-based authentication scheme (https://github.com/agent-network-protocol/AgentNetworkProtocol/blob/main/03-did%3Awba%20Method%20Design%20Specification.md), waiting for the pluggable scheme to be merged before submitting a PR. For differences between W3C DID authentication and OAuth 2.0, you can refer to this article: [The Most Suitable Identity Authentication Technology for Agents: Comparing OpenID Connect, API keys, and did:wba](https://github.com/agent-network-protocol/AgentNetworkProtocol/blob/main/blogs/Comparison%20of%20did%3Awba%20with%20OpenID%20Connect%20and%20API%20keys.md)

The other two items for remote MCP support are:

- Service discovery, which implicitly includes service description. They might develop a product similar to OpenAI's GPTs, where MCP clients can call interfaces to find their preferred servers.
- Stateless operations, mainly to reduce server development complexity.

### Distribution and Discovery

This is the third milestone, but I consider it more important than the second one.

MCP's biggest current issue is its poor usability. Compared to OpenAI's GPTs, while MCP's capabilities are arguably much stronger, providing developers with powerful means to interact with LLMs, its usability lags far behind GPTs. Currently, users are generally required to have some development or computer expertise and must install various software and services themselves. This significantly raises the barrier to entry for MCP usage.

The four components of this milestone - package management, installation tools, sandboxing, and server registration - can indeed make MCP more user-friendly.

In my vision, for MCP to become widespread, it must lower its usage barriers. While doing so, it should also interact with the community ecosystem, requiring a mechanism similar to browser plugins that allows users to easily load different MCP servers. These four components seem to be moving towards this goal.

Additionally, to improve usability, the proportion of remote MCP servers must increase. Whatever can be done remotely should not be done locally. This is another reason why remote servers are crucial.

### Agent Support

There are three items here: layered agent systems, interactive workflows, and streaming results. This area has seen less community discussion, and except for the last item, I don't fully understand the other two yet. We'll continue to monitor this, and if you have good insights into this area, please feel free to comment.

### More Official Ecosystem

MCP hopes for community-driven standard development, although the main maintainers are currently Anthropic developers. They aim to nurture a collaborative ecosystem where all AI providers can help shape MCP into an open standard through equal participation and shared governance, ensuring it meets the needs of various AI applications and use cases. They also hope to work with standardization bodies to advance standardization.

This is a good approach and a common practice in building industry standards. Currently, the MCP community is still primarily led by Anthropic, including proposal reviews. Bringing in more partners and diluting single-vendor dominance will help the specification gain broader adoption. We will continue to be deeply involved in this process.

## What Kind of Protocol Do We Need for the Future

Whether agents need a standard protocol for communication in the future seems no longer debatable. People have gradually seen its necessity, as mentioned in a recent Tencent Technology AI Future article ([When AI Helps Order Coffee, Do Apps Agree?](https://mp.weixin.qq.com/s/vRSn0jKRwGa-Ut6G5keD8w)). In our conversations with industry peers, we've found this becoming a consensus.

What remains uncertain is what kind of protocol we need for the future and how it will gain industry acceptance.

Regarding the outline of future protocols, we have our thoughts ([What Makes Agentic Web Different](https://github.com/agent-network-protocol/AgentNetworkProtocol/blob/main/blogs/What-Makes-Agentic-Web-Different.md)). We are also designing our ideal agent communication protocol, AgentNetworkProtocol (ANP), based on our thinking: [https://github.com/agent-network-protocol/AgentNetworkProtocol](https://github.com/agent-network-protocol/AgentNetworkProtocol).

We believe that future agents must be interconnected, communicate with the internet through underlying data (API or Protocol), and exist as equals. These are the core principles in our ANP design.

Returning to MCP, the biggest difference between our ANP and MCP lies in their worldviews:
- MCP is model-centric, with the entire internet serving as its context and tools
- We (Agent Network Protocol) are agent-centric, where each agent has equal status, forming a decentralized agent collaboration network.

We are taking a somewhat different path from MCP, and whether or not we succeed, we hope to explore a possibility for the industry.

Finally, if you're also interested in our protocol, please contact us. Especially if you're involved in AI phones, AI assistants, or agent framework products or development, I'd love to discuss our vision for the future.

Welcome to connect with me on WeChat: flow10240, email: chgaowei@gmail.com

## Copyright Notice
Copyright (c) 2024 ANP Community  
This file is released under the [MIT License](./LICENSE). You are free to use and modify it, but you must retain this copyright notice.
