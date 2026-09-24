# Three Technical Approaches to AI-Internet Interaction: Insights from OpenAI's Operator

The release of OpenAI's Operator has reignited discussions about AI agents. 

While there are numerous articles explaining what Operator is, you can also refer to the official introduction at https://openai.com/index/computer-using-agent/.

In essence, Operator can control your browser or computer to help complete various daily tasks. Its greatest significance lies in its ability to bridge AI with the current internet ecosystem.

This article compares and summarizes four emerging technical approaches for AI-internet interaction. Here are the key points:

- The current technical approaches for AI-internet interaction include: Computer Use Agent, Headless Browser, Client-side API, and Remote API/Protocol.
- Computer Use Agent (CUA): Enables AI to quickly gain internet access capabilities without requiring modifications to existing applications. However, this technology has high operational costs and cannot achieve task asynchronization.
- Headless Browser: Supports asynchronous task execution with lower operational costs but is limited to web applications and requires significant maintenance effort for web integration.
- Client-side API: The mainstream solution for AI on mobile devices, where apps expose APIs to AI assistants (like Siri) on the phone. This approach enables asynchronous task execution and provides good user experience but is limited to mobile and app scenarios and depends on app openness.
- Remote API/Protocol: This is AI's most efficient way to access the internet, supporting asynchronous execution, low operational costs, and automated authentication. However, it requires application upgrades and has high integration costs.
- Short-term perspective: Despite various limitations, both CUA and headless browser technologies can quickly deliver business value in appropriate scenarios.
- Long-term perspective: We strongly believe in the API/Protocol approach, as it offers the best user experience and lowest operational costs. While system modification costs are currently high, we expect them to decrease as AI programming capabilities improve. We also believe that standard protocols will emerge.
- Additionally, we are actively exploring Protocol implementation possibilities and have made significant progress.

## Computer Use Agent (CUA)

CUA technology works by capturing screen images and using the model's visual capabilities to recognize GUI elements like buttons, menus, and text fields, simulating human visual comprehension of screens.

It then interacts with interfaces through virtual cursor and keyboard inputs, performing actions like clicking, text input, and scrolling to enable AI interaction with applications and the internet.

This technology has several advantages:

1. **Immediate Internet Interaction Capability**

The most significant advantage is that AI can immediately interact with the internet and complete various tasks.

Since the current internet is designed for human access, having AI simulate human behavior is the fastest way to integrate AI with the internet.

Once AI gains internet access, it can address the current limitations of AI tools and help people complete many valuable tasks, accelerating commercial implementation.

2. **Breaking Data Silos**

CUA technology essentially adds a personal assistant between humans and the internet, breaking existing data silos by accessing all user information, thus enabling more intelligent decision-making.

3. **Low Application Modification Cost**

Applications require virtually no modifications to be AI-accessible.

However, this technology also has several notable disadvantages:

1. **High Operational Costs**

CUA technology relies on visual capabilities, and image processing leads to relatively high operational costs. While this might work for high-value scenarios, implementing it for general consumer applications poses significant challenges.

2. **Lack of Asynchronous Execution**

CUA technology requires computer control to be handed over to AI during screen capture, preventing human use during this time.

The ideal experience would be asynchronous task execution, where AI assistants process tasks in the background and notify humans only when intervention is needed.

3. **Frequent Manual Login Requirements**

In consumer scenarios, CUA still requires users to log in manually when accessing applications, unable to automate authentication.

4. **Short-term Accuracy Challenges**

While CUA performs excellently in simple web tasks (87%), it shows significant limitations in complex local operations (38.1%) and dynamic web interactions (58.1%).

Regarding application scenarios, I believe **CUA is most likely to first succeed in B2B scenarios, particularly in high-value cases with some personalization requirements**. For purely repetitive operations, RPA might be more suitable.

In consumer scenarios, professional users (such as video editors) might be a good implementation case.

For general consumer scenarios, CUA may not be very competitive due to operational costs, user experience limitations, and competition from other technical approaches.

## Headless Browser

A headless browser is a browser without a graphical user interface (GUI) that runs in the background through command-line or programming interfaces. It can perform the same operations as traditional browsers (like loading web pages, executing JavaScript, rendering pages) but without a visual interface.

How do headless browsers help AI connect to the internet?
- Using headless browser frameworks like Puppeteer to retrieve complete web application page data (content only, without rendering)
- Using AI to process page data and identify required page elements for specific operations
- Using AI or manually written code to operate page elements through headless browser framework APIs
- Making these code tools available to AI for internet access

**Advantages of the Headless Browser Approach**:

1. **Asynchronous Task Processing**

Since headless browsers run in the background without requiring computer control, tasks can be executed asynchronously, with human intervention only when necessary.

2. **Web Application Friendly, No Modifications Required**

Enables quick AI integration with web applications.

3. **Lower Operational Costs Compared to CUA**

By processing text and pre-writing code, the headless browser approach has lower operational costs than vision-dependent CUA technology.

**Disadvantages of the Headless Browser Approach**:

1. **Limited to Web Applications**

Cannot integrate with applications that don't run on the web, such as local computer applications. CUA doesn't have this limitation.

2. **High Page Adaptation Costs**

Requires generating substantial code for page adaptation, and page upgrades or modifications may invalidate existing code, necessitating regeneration, testing, and deployment, resulting in high maintenance costs.

3. **Frequent Manual Login Requirements**

Like CUA, still requires users to log in manually, unable to automate authentication.

Another approach with headless browsers is feeding complete page data into LLMs for processing, but this method is inefficient and costly. Training a specialized vertical model for this scenario might be a better solution.

Mini-program platforms might be a good implementation scenario for headless browsers. Mini-programs are essentially web applications. If the platform can solve account interconnection issues, it could build an AI assistant that directly uses user accounts to interact with mini-programs through headless browsers without human intervention.

## Client-side API

Client-side API technology enables AI to interact with the internet through standardized device capability interfaces exposed by the operating system, allowing direct access to sensors, application data, and hardware functions. Its core principle is establishing system-level intent interaction protocols that enable AI to interact precisely with applications without simulating human operations.

**Technical Implementation Principles**

1. Intent Registration Mechanism

Applications declare "skill intents" (like "send message", "create schedule") to the operating system, defining parameter formats and permission scopes to form a global capability directory. iOS 18's App Intents framework already supports 200+ core function interface registrations.

2. Semantic Mapping Engine

The system's built-in Natural Language Understanding (NLU) module converts user instructions ("send the photo I just took to the work group") into structured API call chains, automatically linking Photo API, Contacts API, and Instant Messaging API.

3. Security Sandbox Mechanism

Cross-application data transfer is implemented through Trusted Execution Environment (TEE). After obtaining one-time user authorization, AI can combine multiple API calls (such as accessing location services and notes simultaneously), but raw data never leaves the device.

**Advantages**

1. Zero Interface Modification Cost

Applications only need to register and implement standard interfaces without modifying existing UI; most changes are internal functionality modifications.

2. True Asynchronous Task Processing

AI can combine multiple API calls in the background (like booking flights, hotels, car rentals), and users can interrupt at any time.

3. Lower Operational Costs Than Computer Use Agent

No need for AI visual capabilities, resulting in lower operational costs compared to the Computer Use Agent approach.

**Disadvantages**

1. Severe Ecosystem Fragmentation

Interface standards vary across platforms and manufacturers (Android vs iOS App Intents vs HarmonyOS Atomic Services).

2. Application Openness Issues

Applications have competitive relationships with phone manufacturers, making it difficult for apps to open core data to mobile platforms.

3. Scenario Limitations

Currently more applications are on mobile phones, and Chatbots without mobile platform access cannot use this approach.

## Remote API/Protocol

This approach allows AI to interact directly with the internet through APIs or protocols. For example, if a system provides external APIs, AI can use function calls or tools capabilities to retrieve information or perform interactive operations.

Existing system APIs aren't specifically designed for AI, and their use might require manual code writing and pre-configuration of keys for authentication and access control.

There are now some protocols specifically designed for AI or agents, such as Anthropic's MCP and our ANP. Their common goal is to enable AI to access the internet in its most efficient way.

MCP (Model Context Protocol) aims to standardize communication between Large Language Models (LLMs) and external data sources and tools, helping AI systems more efficiently access and utilize context information to improve response quality and practicality.

ANP (Agent Network Protocol), https://github.com/agent-network-protocol/AgentNetworkProtocol, is the industry's first open-source communication protocol designed for agents. Unlike MCP, ANP is agent-centric, treating all agents as equals, aiming to build an efficient agent collaboration network.

**Advantages of this Approach**:

1. **Data-Centric Interaction**

Unlike CUA technology or headless browsers that simulate human internet usage, this approach allows AI to process underlying data directly, which is its most efficient method.

2. **Asynchronous Task Execution**

AI can process tasks in the background through APIs or protocols without occupying computer control.

3. **Low Operational Costs**

Compared to CUA and headless browsers, API/Protocol has lower operational costs, requiring neither screen capture processing nor page data code maintenance.

4. **Automated Authentication**

Using decentralized authentication technologies like DID enables cross-platform, automated authentication, requiring user intervention only for critical operations (like payments). Our ANP currently supports DID, while MCP doesn't yet.

**Disadvantages of this Approach**:

1. **High Modification Costs**

Requires existing systems to be modified to support relevant protocols, which is this approach's biggest drawback. However, modification costs should decrease as AI programming technology advances.

2. **Early Stage Domain, Unclear Standards**

The agent communication protocol domain is still in its very early stages, with few existing solutions and no established standards. The main research in this field comes from Anthropic's MCP and our ANP.

However, both international and domestic standardization organizations like W3C and IIFAA are investing in related research.

## Conclusion

Looking at these four technical approaches holistically:

In the short term, despite various limitations, Computer Use Agent (CUA) and headless browser technologies can quickly deliver business value in appropriate scenarios.

In the long term, we firmly believe in the API/Protocol approach, as it offers the best user experience and lowest operational costs. While system modification costs are currently high, we expect them to decrease as AI programming capabilities improve. Regarding protocol standardization, we believe standard protocols will emerge, and we aim to be significant contributors to protocol standardization.

## About Us

We are developing an open-source standard protocol for agent communication: **AgentNetworkProtocol (ANP)**, available at [https://github.com/agent-network-protocol/AgentNetworkProtocol](https://github.com/agent-network-protocol/AgentNetworkProtocol).

AgentNetworkProtocol aims to become the HTTP of the agent internet era. Our vision is to define how agents connect, building an open, secure, and efficient collaboration network for billions of agents.

We are also developing infrastructure for agent connectivity, enabling decentralized authentication, efficient data communication, and collaboration between agents.

If you're interested in agent communication protocols or have similar needs, feel free to contact us:

- WeChat: flow10240
- Email: chgaowei@gmail.com

Welcome to join our agent communication protocol discussion group, possibly the first dedicated group for discussing agent communication protocols:

## Copyright Notice
Copyright (c) 2024 ANP Community  
This file is released under the [MIT License](./LICENSE). You are free to use and modify it, but you must retain this copyright notice.
