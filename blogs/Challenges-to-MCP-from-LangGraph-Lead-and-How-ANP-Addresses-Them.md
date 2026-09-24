# Challenges to MCP from LangGraph Lead and How ANP Addresses Them

Recently, MCP (Model Context Protocol) has been gaining popularity online. I came across a blog post on the LangChain website, which was also reposted by FounderPark:

Original link: https://blog.langchain.dev/mcp-fad-or-fixture/
Chinese link: https://mp.weixin.qq.com/s/etvDsU422z8uiknCn6fw4A

The content features a debate between LangChain co-founder and CEO Harrison Chase and LangGraph lead Nuno Campos about MCP, discussing whether it's just a passing trend or destined to become a future standard.

While I may not agree with all their viewpoints, including their definition and use of the MCP protocol, the issues raised by Nuno Campos do hit the mark.

Since we've been working on agent communication protocols for some time, and our ANP (Agent Network Protocol) is likely the world's first communication protocol specifically designed for agents, we immediately studied MCP when it was released and identified the same issues that Nuno Campos pointed out.

In fact, ANP had already considered these issues during its initial design. Today, I'd like to discuss how ANP addresses these challenges.

## What Are the Core Issues Raised by Nuno Campos About MCP?

In his debate with Harrison Chase, Nuno Campos highlighted several core issues with MCP:

- **Protocol Complexity**: MCP is not just a tool calling protocol; it also provides prompts and LLM completion services. This design significantly increases the protocol's complexity.
- **Implementation Difficulty**: MCP adopts a bidirectional communication mechanism, which increases implementation complexity, especially for developers, adding an extra burden.
- **Server-Side Scaling Challenges**: MCP's current design is not a stateless protocol, making it difficult to scale on the server side, particularly in distributed environments where authentication and state management issues become prominent.
- **Tool Quality and Model Adaptation Issues**: Inserting random tools into an agent that knows nothing about them will inevitably lead to a decline in tool calling quality, affecting user experience.

## ANP's Solutions

ANP has given deep thought to these issues from its inception and offers corresponding solutions:

### Agent Identity Issue

We believe this is the most critical issue for the protocol. When MCP was first released, it only supported local servers, primarily because they hadn't figured out how to solve the identity problem. We communicated with the MCP community officially, but they didn't adopt our suggestions.

<p align="center">
    <img src="/blogs/images/mcp-wba-did-proposal.png" width="50%" alt="mcp-did-proposal"/>
</p>

Later, they chose OpenID Connect as their authentication solution. However, OpenID Connect is a centralized approach that cannot provide decentralized, distributed authentication, creating an inherent limitation for agent collaboration.

From day one of designing ANP, we've been trying to solve the decentralized identity problem for agents. Our final solution achieves an effect similar to email: centralized within each platform but forming a decentralized network overall. Different platforms can communicate with each other.

For a detailed comparison, see: [did:wba vs OpenID Connect and API keys](/blogs/en/did_wba_vs_OpenID_Connect_API_keys.md).

We understand why they chose OpenID Connect: to solve the integration problem between chatbot applications and the existing internet. However, we believe that as the agent internet evolves, ANP's decentralized, agent-centric design philosophy will be more suitable for future agent network requirements.

### Protocol Complexity Issue

ANP has clearly defined its position: focusing on communication protocols between agents rather than model context protocols. ANP doesn't provide model completion services or prompts; instead, it concentrates on defining how agents authenticate, exchange information, and collaborate.

ANP's design philosophy is "Agent-Centric," where each agent is an equal node in the network. The protocol itself only defines communication rules and data formats between agents, greatly reducing protocol complexity.

We've added ANP protocol support to the open-source OpenManus project. You can check our code (app/tool/anp_tool.py) at: https://github.com/agent-network-protocol/OpenManus-ANP. (Currently in community beta testing; feedback is welcome)

Integrating ANP into an agent requires only 200 lines of code, with the core being a prompt and an HTTP function. The model drives everything else.

The HTTP function serves as the model's browser, allowing it to easily access and traverse the data network connected through the ANP protocol. **Building a data network that's convenient for AI access has always been ANP's goal.**

The connection method based on ANP is truly the AI-native way of connecting.

### Server-Side Scaling Issue

ANP itself doesn't define internal protocol states because the agent description protocol based on ANP is self-descriptive. This self-description means the model can declare interface calling methods in the document, which can be either stateful or stateless—ANP supports both.

Agents can freely decide what type of interface they expose externally, whether stateful or stateless.

### Tool Quality and Model Adaptation Issue

I believe this is a problem for models to solve, unrelated to the protocol. What the protocol can provide is better description information and ways to use tools. I think his understanding is biased on this point, or perhaps he's questioning this protocol model altogether.

## Differences in Core Concepts

There are significant differences in core concepts between ANP and MCP. In MCP, tools, resources, and prompts are the core of the protocol. In ANP, these don't exist.

ANP provides descriptions of an agent's public information, which can be basic information (like what coffee a coffee shop sells) or API interface descriptions (through which coffee can be purchased).

Information is ANP's only concept and its most core concept. There are no resources, tools, or prompts—everything is determined by the model and the agent developer. 


## Copyright Notice
Copyright (c) 2024 ANP Community  
This file is released under the [MIT License](./LICENSE). You are free to use and modify it, but you must retain this copyright notice.

