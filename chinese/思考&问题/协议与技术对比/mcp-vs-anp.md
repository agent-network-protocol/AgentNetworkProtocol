
最大的差异是世界观的差异。
# 概念的核心是model

这和anp不用，anp的核心是Agent。
mcp的目标是为了补齐模型无法获取上下文信息的问题。anp解决的是智能体之间的通信问题。

mcp在发展，会不会变成智能体之间的通信协议？有可能的。

MCP是一个应用层协议。而不是底层协议。我们应该对协议进行分层。

从其原则看，主机程序（host）是绝对的核心，服务器是垂直领域的资源或工具的提供者。

对模型公司来说，MCP更适合他们，现阶段就能够落地，并且是以模型为中心。

在互联互通上，我们是一样的。我们是去中心化的互操作性，MCP是以模型为中心的互操作性。

MCP当前更容易落地。


我们不做浏览器上的身份认证。未来智能体网络下，不存在这种场景。有智能体的did，就可以获得智能体的描述信息，包括功能，以及接口。这个是新时代的网站。

----------------------再次学习--------------------------------

# 协议的定义

模型上下文协议 （MCP） 是一种开放协议，可在 LLM 应用程序与**外部数据源和工具之间实现无缝集成**。无论您是构建 AI 驱动的 IDE、增强聊天界面还是创建自定义 AI 工作流，MCP 都提供了一种标准化的方式来**将 LLM 与它们所需的上下文连接起来**。

——本质上是为LLM提供上下文，它将整个互联网看做LLM的上下文。

MCP的作用：
- 与语言模型共享上下文信息
- 向 AI 系统公开工具和功能
- 构建可组合的集成和工作流程


## 鉴权

他们希望鉴权也是一个协商的过程。——把我们的方案做出一个可选的方案。

客户端和服务器可以协商他们自己的自定义身份验证和授权策略。

可以在初始化能力协商的时候，带上鉴权方式的协商。

初始化是第一个消息，里面协商鉴权方式。




---------------------------------end--------------------------------



# 服务器的功能

## 提示词

服务端可以向客户端发送提示词。还不清楚应用场景。

服务端可以发送提示以及提示相关的内容给客户端执行。这和mcp中的context非常的贴切，mcp就是为了完善模型的上下文的协议，而不是严格意义上的智能体之间的通信协议。

## 资源

模型上下文协议 （MCP） 为服务器提供了一种向客户端公开资源的标准化方法。资源允许服务器共享为语言模型提供上下文的数据，例如文件、数据库架构或特定于应用程序的信息。每个资源都由 URI 唯一标识。

## 工具



# 协议格式

使用了jsonrpc 2.0的格式，比较有意思，"method": "resources/list",类似http的url path。
```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "method": "resources/list",
  "params": {
    "cursor": "optional-cursor-value"
  }
}
```



# 元协议协商
也支持元协议协商：
服务端声明，客户端采样。MCP的原协议以声明为主，从0开始协商为副，需要人的参与。

MCP支持-服务器和客户端功能协商：https://spec.modelcontextprotocol.io/specification/architecture/#capability-negotiation   这个好好看看，整个过程类似元协议的能力。
Servers declare capabilities like resource subscriptions, tool support, and prompt templates
服务器声明资源订阅、工具支持和提示模板等功能
Clients declare capabilities like sampling support and notification handling
客户端声明采样支持和通知处理等功能
Both parties must respect declared capabilities throughout the session
双方必须在整个会话期间尊重声明的能力
Additional capabilities can be negotiated through extensions to the protocol
可以通过协议的扩展来协商其他功能


Each capability unlocks specific protocol features for use during the session. For example:
每项功能都会解锁特定的协议功能，以便在会话期间使用。例如：

    Implemented server features must be advertised in the server’s capabilities
    已实施的服务器功能必须在服务器的功能中公布
    Emitting resource subscription notifications requires the server to declare subscription support
    发出资源订阅通知需要服务器声明订阅支持
    Tool invocation requires the server to declare tool capabilities
    工具调用要求服务器声明工具功能
    Sampling requires the client to declare support in its capabilities
    采样要求客户端声明其功能中的 support
    This capability negotiation ensures clients and servers have a clear understanding of supported functionality while maintaining protocol extensibility.
    此功能协商可确保客户端和服务器清楚地了解支持的功能，同时保持协议可扩展性。

共享协议实现互操作性

# 设计原则

整体的原则是，服务原子化，主机（客户端或者AI助理的运行环境）负责编排工作流。

Design Principles 设计原则 
MCP is built on several key design principles that inform its architecture and implementation:
MCP 建立在几个关键设计原则之上，这些原则为其架构和实施提供了信息：

- Servers should be extremely easy to build
服务器应该非常易于构建

    Host applications handle complex orchestration responsibilities
    主机应用程序处理复杂的编排职责
    Servers focus on specific, well-defined capabilities
    服务器专注于特定的、定义明确的功能
    Simple interfaces minimize implementation overhead
    简单的接口可最大限度地减少实施开销
    Clear separation enables maintainable code
    清晰的分离使代码可维护
    Servers should be highly composable 服务器应具有高度可组合性

Each server provides focused functionality in isolation
每个服务器都单独提供集中的功能
    Multiple servers can be combined seamlessly
    多个服务器可以无缝组合
    Shared protocol enables interoperability
    共享协议实现互操作性
    Modular design supports extensibility
    模块化设计支持可扩展性
    Servers should not be able to read the whole conversation, nor “see into” other servers
    服务器不应能够读取整个对话，也不应 “看到” 其他服务器

Servers receive only necessary contextual information
服务器仅接收必要的上下文信息
    Full conversation history stays with the host
    完整的对话历史记录将保留在主持人那里
    Each server connection maintains isolation
    每个服务器连接都保持隔离
    Cross-server interactions are controlled by the host
    跨服务器交互由主机控制
    Host process enforces security boundaries
    主机进程强制实施安全边界
    Features can be added to servers and clients progressively
    功能可以逐步添加到服务器和客户端

Core protocol provides minimal required functionality
核心协议提供最少的所需功能
    Additional capabilities can be negotiated as needed
    可以根据需要协商其他功能
    Servers and clients evolve independently
    服务器和客户端独立发展
    Protocol designed for future extensibility
    为将来的可扩展性而设计的协议
    Backwards compatibility is maintained
    保持向后兼容性


# 消息类型

--总结：JSON-RPC 2.0是一个简单使用的协议，可以作为应用层协议的承载。

MCP defines three core message types based on JSON-RPC 2.0:
MCP 基于 JSON-RPC 2.0 定义了三种核心消息类型：

Requests: Bidirectional messages with method and parameters expecting a response
请求：具有需要响应的方法和参数的双向消息
Responses: Successful results or errors matching specific request IDs
响应：与特定请求 ID 匹配的成功结果或错误
Notifications: One-way messages requiring no response
通知：不需要响应的单向消息
Each message type follows the JSON-RPC 2.0 specification for structure and delivery semantics.
每种消息类型都遵循 JSON-RPC 2.0 的结构和传递语义规范。

# 安全问题：



# 底层连接




# auth的讨论：
The MCP ecosystem should be open by default—that is, we want to allow custom clients and servers to interoperate with the ones we build, even if we have no knowledge of those custom implementations.
MCP 生态系统在默认情况下应该是开放的，也就是说，我们希望允许自定义客户端和服务器与我们构建的客户端和服务器进行互操作，即使我们不知道这些自定义实现。
Relatedly, we would prefer to avoid a central trust authority. We want clients and servers to be able to determine whether they trust each other based on user consent, rather than delegating to any kind of registry of trusted implementations.
与此相关，我们更愿意避免使用中央信任机构。我们希望客户端和服务器能够根据用户同意来确定它们是否相互信任，而不是委托给任何类型的可信实现注册表。




我的DID方案：


大家目前讨论的都是基于OAuth的方案，它确实能够工作，也足够标准化以至于可以重复利用现有的基础设施，但是整体的流程还是有些复杂。
我想提出一个全新的基于W3C DID（Decentralized Identifiers）规范的方案。我们在这个方案上研究和探索了很长的时间，主要的目的解决智能体之间的身份认证和加密通信问题，我认为它也许也可以用于MCP客户端和MCP服务端的身份认证。

首先，我非常认同未来的AI的通信协议（比如MCP）应该是开放的，并且要避免使用中央信任机构。这正是W3C DID规范所倡导和擅长的，W3C DID的目的就是用户能够完全控制自己的身份信息，而不依赖于中心化的认证机构。

我们设计了一个DID方法all（alliance），我简单描述下使用DID all方法如何进行身份的生成与认证。下面以Alice和Bob之间通信为例说明身份认证过程：

- Alice和Bob各自生成自己的DID，DID的生成过程如下：
  - 生成非对称加密的私钥和公钥，私钥自己保存。
  - 对公钥使用hash算法生成DID，作为自己的身份标识。示例：did:all:14qQqsnEPZy2wcpRuLy2xeR737ptkE2Www@example.com，example.com是DID文档服务器。
  - 将DID和公钥信息制作成DID文档，并且使用私钥签名，然后保存到web服务器example.com上，第三方可以根据DID获取到DID文档，从而获取DID对应的公钥信息。

- 当Alice和Bob建立连接时，他们的身份认证流程如下：
  - Alice在连接请求中，提供自己的DID，使用自己私钥对消息进行签名。
  - Bob根据Alice的DID，从web服务器example.com上获取Alice的DID文档，然后通过DID文档中的公钥认证Alice的DID（DID是根据公钥hash生成的）以及签名。如果签名正确，则说明连接是Alice发起的。
  - 同样的方法，Bob在连接响应中提供自己的DID，使用私钥对连接消息进行签名。Alice使用同样的流程进行验证身份。
  - 至此，双方的身份认证结束，接下来进行加密通信。

- 由于Alice和Bob都有一对非对称加密的密钥对，他们后面可以使用ECDHE（Elliptic Curve Diffie-Hellman Ephemeral）进行加密密钥协商，然后就可以进行端到端加密通信。


列举两个**简单的示例**：
- 文件系统：
  - MCP客户端访问用户存储在MCP服务端文件系统中的文件。
  - MCP服务端记录了用户的DID，以及DID对应的文件。
  - 当MCP客户端访问文件时，MCP服务端按照上面的流程，对客户端提供的DID进行身份认证，如果认证通过，则返回文件或文件的访问token。
  - 客户端可以使用服务端的DID对服务端进行验证，或者使用域名对服务端进行验证。

- 预订披萨：
  - 用户通过MCP客户端向披萨店的MCP服务端预订披萨（假设用户通过可靠渠道获得了披萨店的DID和通信URL）。
  - MCP客户端和MCP服务端建立连接，客户端使用服务端的DID对服务端进行身份验证，确保对方是自己期望的披萨店。
  - MCP服务端也使用DID对MCP客户端进行身份验证，并记录订单信息，便于后续服务。


当然，基于DID的方案也有缺点，比如：它是W3C最新发布的标准，目前还没有被广泛使用，基础设施还不完善。不过，我认为DID是最适合智能体之间进行身份认证的方案，希望大家能够认证考虑一下。

这里是相关的资料：
- W3C DID规范：（https://www.w3.org/TR/did-core/）[https://www.w3.org/TR/did-core/]

- DID all方法设计规范：（https://github.com/agent-network-protocol/AgentNetworkProtocol/blob/main/02-did%3Aall%20Method%20Design%20Specification.md）[https://github.com/agent-network-protocol/AgentNetworkProtocol/blob/main/02-did%3Aall%20Method%20Design%20Specification.md]

- AgentNetworkProtocol（我们设计的用于智能体之间通信的协议）：（https://github.com/agent-network-protocol/AgentNetworkProtocol）[https://github.com/agent-network-protocol/AgentNetworkProtocol]

- AgentConnect（协议的开源实现，已经支持DID all方法，以及端到端加密通信，元协议协商）：（https://github.com/agent-network-protocol/AgentConnect）[https://github.com/agent-network-protocol/AgentConnect]




让我们首先明确下MCP客户端和MCP服务端的身份认证的用例。我认为它有两种类型的用例：
- MCP客户端需要访问用户在MCP服务器上的资源。比如，让MCP客户端操作用户github上的代码，这个时候MCP服务器（Github服务器）需要对用户进行身份认证，MCP服务端需要提供oauth server。
- 


# 点评：
简单说下Anthropic最新发布的MCP协议。我工作的大部分时间都在和通信协议打交道，现在也在开发一个智能体通信协议的开源项目，站在我角度简单的说下MCP。

1、先说结论：“MCP”是典型的短期被高估，长期被低估的技术。这里的“MCP”指的的是模型或智能体通过协议与外界通信的技术。MCP是否能够成为最终的标准，我判断不了，但是未来肯定有这样的一个标准协议，能够让智能体相互通信，连接成一个智能体网络。

2、短期来看，很难达到很多自媒体所说的革命性的改变，因为制定一个协议让各方都遵循这个协议去通信，本身就是一个缓慢的过程，很多时候面临不是技术问题，而是商业问题。比如openai会接入吗，苹果会接入吗，他们都有自己的考虑。

3、但是长期来看，MCP的技术路线是没有问题的，我一直认为，之前Anthropic提出的Computer Use技术是一个临时的、过渡的技术路线，因为这是让AI去模仿人和互联网数字世界交互，而不是用AI擅长的方式去和互联网交互。MCP才是AI更擅长的方式。如果未来MCP之类的技术逐渐发展成熟，智能体之间都能够通过协议连接成网络，并且由于AI的加持，他们可以自己组网、自己协商通信协议、自己编写协议处理代码，那这个网络肯定是和现在的互联网是大不相同的。

4、类似MCP的技术，现在开源社区、标准化组织也都有探索。比如我们提出的开源协议AgentNetworkProtocol（https://github.com/agent-network-protocol/AgentNetworkProtocol），剑桥一个研究团队提出的agora Protocol(元协议方向)，AutoGpt相关团队开源的agent-Protocol，还有标准化组织比如W3C的webagents工作组，IEEE下面也有一个工作组也在做类似的研究。大家的侧重点各有不同，MCP偏应用层，我们目前重点在身份验证和加密通信，未来会做成一个协议栈。总之，这块的研究和探索慢慢的多了起来。

5、协议的开放性最重要的，封闭的协议没有未来。在github上讨论MCP身份认证方案的时候，MCP技术同学提到过，他们希望MCP是一个开放的生态，他们更希望避免使用中央信任机构，更希望客户端和服务器能够根据用户同意来确定它们是否相互信任。在这一点上，MCP做的比较彻底，我们也非常的认同。

6、回到MCP本身，从名字上看，MCP的全称是Model Context Protocol，它解决的是模型上下文的问题。我们不知道他们怎么定位MCP，也许他们是将整个互联网都看出模型的上下文，这样也讲得通。我们更关注的是智能体之间的协作。

7、从MCP协议的结构上看，考虑的是比较全面的，像能力协商、能力发现、订阅/通知这些基本都是具备的。另外也建议看看他们的核心设计原则，里面有他们对MCP整体的思考。在数据格式上，他们使用了jsonrpc 2.0，这块可选的技术也非常多，后面准备单独整理下各自的优缺点。我认为选择使用什么格式传输数据，是可以根据场景，让AI决定的。

8、MCP还不支持远程调用，根本的原因应该在于他们还没有想好身份认证怎么做。在github也和他们做了交流，目前他们更加倾向于Oauth的方案，但是整体的过程有些拧巴，他们也没有想好最终方案。我给他们建议的方案是DID的方案，不过这个方案也有缺点：标准比较新，基础设施不完善。不过，DID是到目前为止，我看到的最适合智能体之间进行身份认证的方案。如果你有更好的方案，也欢迎和我交流。 （这是我提出的方案细节：https://mp.weixin.qq.com/s/r6k1zSHnC8sKA819x8O91Q）









## 版权声明  
Copyright (c) 2024 ANP Community  
本文件依据 [MIT 许可证](./LICENSE) 发布，您可以自由使用和修改，但必须保留本版权声明。  
