# What Makes Agentic Web Different

Agents have essentially become a **consensus in the AI industry**. If there are any disagreements, they are likely about the timeline for implementation. Currently, the industry primarily focuses on how to build agents themselves, with less research on how agents collaborate and the characteristics of agent networks.

In this article, we attempt to explore the differences between the Agentic Web and the existing Internet from the perspective of the Internet's evolutionary essence: **unleashing the capabilities of new technologies**.

We believe that agents will not only bring significant changes to software itself but will also bring **profound changes** to the Internet.

Given the current global Internet market size, understanding what makes the Agentic Web different is at least a hundred-billion-dollar question.

Key points:

- The most fundamental question in Internet evolution is how to **maximize the potential of new technologies**. The next generation of the Internet will undoubtedly undergo profound changes due to AI technology development.
- To unleash AI's capabilities, we need to ensure AI can access complete contextual information, utilize all tools available on the Internet, interact with the Internet in its most proficient way, and efficiently collaborate with other AIs on the Internet.
- To achieve this, we need to solve three issues: **Interconnectivity**, **Native Interfaces**, and **Efficient Collaboration**.
- APIs or communication protocols are the optimal way for AI to interact with the Internet. We are not optimistic about Computer Use technology as it makes AI mimic humans; AI phones provide a solution for integrating various apps on terminals; Anthropic's MCP aligns most closely with our vision.
- **Personal assistants** will become the new gateway to the next generation Internet, with agents permeating every corner of the Internet. These agents can interconnect, self-organize, and self-negotiate to build an efficient collaborative network.
- We are developing an open-source protocol for agent communication: AgentNetworkProtocol (ANP), aiming to become the HTTP of the Agentic Web era.

## What is the Fundamental Driver of Internet Evolution?

We believe that the most fundamental issue, or the underlying force driving Internet evolution, is how to **unleash the capabilities of new technologies**.

Let's analyze a question: why were web-based products dominant in the PC Internet era, while apps dominated the mobile Internet era?

During the PC Internet period, new technologies primarily consisted of network communication technologies (TCP/IP, DNS, HTTP), Web technologies (HTML, CSS, JavaScript), database technologies, and information search technologies. Product forms mediated by browsers and Web technologies unleashed the power of open Internet access, allowing information to be widely accessed through a unified entry point.

Combined with the technical conditions at the time (limited bandwidth and hardware performance) and the cross-platform nature of web technology, this determined that Web was the most suitable product form for PC Internet.

In the mobile Internet era, new technologies included mobile devices and hardware (accelerometers, gyroscopes, GPS, touchscreens, cameras, chips), mobile networks (3G, 4G, 5G), and mobile operating systems (iOS, Android).

Compared to web technology, apps can deeply integrate hardware capabilities through operating system APIs, optimize running efficiency for device performance, and maintain continuous online presence with real-time interaction.

It was these factors that allowed new technological capabilities to be unleashed through apps, making their user experience far superior to web and becoming the mainstream product form of the mobile Internet era.

In the present and next decade, new technology is undoubtedly represented by generative artificial intelligence, large language models, and agents. How to unleash AI's capabilities will determine the direction of future Internet evolution.

## How Should the Next Generation Internet Unleash AI's Capabilities?

While current Internet infrastructure is quite comprehensive, there are still challenges in fully unleashing AI's capabilities given its characteristics.

### How to Provide AI with **Complete Contextual Information** and Access to **All Tool Capabilities**

AI can only make correct decisions with complete contextual information. It can only efficiently complete complex tasks with access to all tool capabilities.

However, the current Internet essentially consists of information silos, with difficult information flow between them.

<p align="center">
  <img src="/blogs/images/data-silos.png" width="50%" alt="data-silos"/>
</p>

Previously, humans played the role of connecting these information silos through browsers, apps, search engines, and social networks. In the future, this will be done more efficiently by AI.

Current technical solutions are attempting to address these issues, typically through AI phones and Computer Use technology, enabling AI to connect with the Internet through graphical interfaces, browsers, or app terminal interfaces. However, we believe these are not the most efficient solutions.

### How to Let AI Interface with the Internet in Its Most Proficient Way

Let's evaluate current solutions for AI's Internet access.

1. **Computer Use Technology**

Many model providers have launched similar solutions.

<p align="center">
  <img src="/blogs/images/computer-use-product.png" width="50%" alt="computer-use-product"/>
</p>

However, we are not optimistic about this technology. It emerged because existing Internet products were designed for human use, and before these products are restructured for AI, having AI learn and mimic humans is indeed the quickest path for AI to access the Internet. But it's not the most efficient path. It may have value in the short and medium term, but limited long-term value.

2. **AI Phone Solutions**

Such as Apple Intelligence, and many domestic phone manufacturers are also promoting heavily.

These technologies are characterized by accessing Internet data and capabilities through interfaces opened by app clients on terminals. This allows AI to obtain data from multiple apps and invoke capabilities from multiple apps.

This technology is a step further than Computer Use technology, as AI is naturally better at handling underlying data rather than graphical interfaces. However, in this solution, terminal apps are in an awkward position, being both competitive and cooperative with AI phones - wanting to gain traffic from AI phones while not wanting to open too much data to avoid being replaced by AI phones.

3. **Claude MCP**

This is currently the solution that best aligns with our vision.

We believe that **AI differs from humans in that it's better at handling underlying data rather than graphical interfaces**. AI should interact with the Internet in its most proficient way (**APIs or communication protocols**).

<p align="center">
  <img src="/blogs/images/agent-interview-Internet.png" width="50%" alt="agent-interview-Internet"/>
</p>

We have also been working on similar projects and research early on: [Agent Network Protocol Technical White Paper](https://mp.weixin.qq.com/s/17pNcvi1klEwuqDrEbLzJw).

Our main difference from MCP lies in our worldview:
- MCP is model-centric, with the entire Internet serving as its context and tools
- We (Agent Network Protocol) are agent-centric, where each agent has equal status, forming a decentralized agent collaboration network

### How to Enable Efficient Collaboration Between AIs on the Internet

Traditional network nodes often connect through hardcoded or manual methods. With AI, network connection and collaboration methods could become more efficient.

For example, two AI nodes could use natural language generation and understanding capabilities to first communicate their capabilities and interfaces in natural language, then use standard protocols or consensus protocols for communication and collaboration.

This will help build a more efficient, lower-cost collaboration network.

<p align="center">
  <img src="/blogs/images/meta-protocol-flow.png" width="50%" alt="meta-protocol"/>
</p>

Finally, to summarize, for the Internet to fully unleash AI's capabilities, three issues need to be solved:

- 🌐 **Interconnectivity**: Enable all agents to communicate with each other, break down data silos, allow AI to obtain complete contextual information, and access all tools on the Internet.
- 🖥️ **Native Interfaces**: AI shouldn't need to mimic humans to access the Internet; it should interact with the Internet in its most proficient way (APIs or communication protocols).
- 🤝 **Efficient Collaboration**: Using AI, agents can self-organize and self-negotiate to build a collaboration network that's more cost-effective and efficient than the existing Internet.

## What Does the Agentic Web Look Like?

Defining the Agentic Web is a significant proposition, and we can't provide an academically rigorous definition. However, we can explain our understanding from a common perspective. This is like blind men touching an elephant - we're describing the parts we've "touched."

1. **Agents Become the New Gateway**

The PC Internet era was about people using PCs to go online; the mobile Internet era was about people using mobile devices to go online; the Agentic Web era will be about agents going online on behalf of people and interacting with the digital world.

This gateway will likely be a special type of agent in the future: a super personal assistant. It will go online on behalf of humans and interact with humans through personalized UI on the client side. On the backend, it will interact with other agents through APIs or protocols.

<p align="center">
  <img src="/blogs/images/user-agent-internet.png" width="50%" alt="user-agent-internet"/>
</p>

2. **Agents Permeate Every Corner of the Internet**

Besides personal assistants, we believe there will be many agents on the Internet that don't directly interact with end users, such as hotel, restaurant, bank, and school agents. They provide services to humans indirectly through interaction with personal assistants.

3. **Agents Can Interconnect**

Whether they are personal assistants or backend service agents, regardless of which company or platform they belong to, they can all interconnect.

4. **A Flatter Network**

If agents can represent a person or entity as a node connecting and collaborating on the Internet, the role of centralized platforms (like WeChat, Taobao) will diminish. The future Internet will be more flat and decentralized.

5. **Self-Organizing and Self-Negotiating Efficient Collaboration Network**

Agents can self-organize and self-negotiate to build an efficient collaboration network.

## Summary

Ultimately, we believe it's technological development that drives Internet evolution, and how to unleash new technological capabilities determines the direction of Internet evolution.

While we're not yet certain if the Agentic Web will emerge, we can be certain that the future Internet will undergo profound changes due to AI technology development.

## Contact Us

We are not just dreamers.

Based on our vision, we are developing an open standard protocol for agent communication: **AgentNetworkProtocol (ANP)**. Project address: [https://github.com/agent-network-protocol/AgentNetworkProtocol](https://github.com/agent-network-protocol/AgentNetworkProtocol).

AgentNetworkProtocol aims to become the HTTP of the Agentic Web era. Our vision is to define how agents connect with each other, building an open, secure, and efficient collaboration network for billions of agents.

If you're also interested in agent communication protocols or the Agentic Web, feel free to contact us. We've been sharing and exchanging ideas with AI practitioners both domestically and internationally:

- WeChat: flow10240
- Email: chgaowei@gmail.com

**Finally**, I've always believed that, if we don't consider scalability, web3 is truly the most suitable Internet form for AI. If you're working on web3+AI, we welcome discussions with you as well. 
## Copyright Notice
Copyright (c) 2024 ANP Community  
This file is released under the [MIT License](./LICENSE). You are free to use and modify it, but you must retain this copyright notice.
