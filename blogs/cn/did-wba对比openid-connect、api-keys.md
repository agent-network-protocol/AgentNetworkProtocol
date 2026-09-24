# 最适合智能体的身份认证技术：对比OpenID Connect、API keys、did:wba

## 智能体需要新的身份认证技术

智能体对身份认证技术提出了新的需求，其中最重要的一个就是互联互通，特别是让任意两个智能体都能够互联互通。

其中的原理很简单：AI必须**具备获得完整上下文信息的能力，具备调用所有工具的能力**，才能够作出正确的决策，采取合适的行动。现在很多厂商试图使用Computer Use方案解决这个问题。

<p align="center">
  <img src="/blogs/images/computer-use-product.png" width="50%" alt="computer use product"/>
</p>

但是我们认为这不是AI与互联网交互最高效的方式。这是让AI模仿人的方式访问互联网，AI应该用它最擅长的方式（API或通信协议）与数字世界交互。

<p align="center">
  <img src="/blogs/images/agent-interview-Internet.png" width="50%" alt="agent-interview-Internet"/>
</p>

这就涉及一个互联互通的问题：在智能体使用API或协议，与互联网或者其他智能体交互的时候，如何进行身份验证？特别进行跨平台的身份验证，以让任何智能体之间都能够进行连接。

## 当前主流跨平台身份认证技术

我们在互联网上的身份账号，很多时候是不能跨平台使用的。比如你的微信账号，在钉钉系统中是无法识别的，反之亦然。

不过现在互联网也有很多跨平台的身份认证技术，比如我们常见的SSO（单点登录），你可以用你的谷歌账户登录很多网站。还有API keys，比如你可以使用OpenAI给你的key，访问OpenAI的API。下面我来简单的介绍下这两种技术，看看是否适合智能体的身份认证。

### OpenID Connect（OIDC）

OpenID Connect (OIDC) 是一种基于 OAuth 2.0 构建的身份验证协议，它允许客户端应用程序验证用户身份，并获取用户的基本信息（如姓名、邮箱）。OIDC 在 OAuth 2.0 的基础上增加了标准化的身份层，使其更适合于登录和单点登录（SSO）场景。

[OpenID Connect 官方规范](https://openid.net/specs/openid-connect-core-1_0.html)。

下面我们以使用谷歌账号登录三方网站为例来介绍下OIDC的流程。[谷歌OIDC官方文档地址。](https://developers.google.com/identity/protocols/oauth2/openid-connect)。

<p align="center">
  <img src="/blogs/images/openid-connect-fllow.png" width="50%" alt="openid-connect-fllow"/>
</p>

使用谷歌账号登录三方网站包括两部分，前置流程和Oauth2.0流程：
- 前置流程
  - 注册谷歌平台账号
  - 创建项目/应用
  - 配置项目/应用，包括重定向URI
  - 获取OAuth 2.0的client id和client secret
- Oauth2.0流程（以授权码流程为例）
  - 获取授权码
  - 使用授权码获取access token和id token，id token中包含用户信息
  - 使用access token和id token访问获取用户的详细信息（可选）。在OpenID Connect流程中，用户的详细信息可以认为是一种受保护的资源。

OpenID Connect的优点是：
- 能够简化用户的身份验证流程
- 使用非常广泛，相关基础设施也比较完善。
- 安全性较高

站在智能体互联互通的场景看，OpenID Connect有几个不足：
- OpenID Connect本质上是让三方应用能够使用身份服务器（比如谷歌）对用户进行身份验证。两个三方应用之间无法使用身份服务器实现他们之间的身份验证。
- OpenID Connect是一个中心化的方案，用户使用的时候需要去身份服务器进行注册等操作，前置操作流程复杂。
- 流程交互复杂，需要多次交互。

### API keys

API Keys（API 密钥）是用于验证应用程序或用户访问应用程序编程接口（API）的简单凭证。它是一种字符串形式的身份标识符，通常由随机生成的字母和数字组成，类似于密码的功能。它可以用于身份验证、访问控制、使用监控等场景。

<p align="center">
  <img src="/blogs/images/api-keys-flow.png" width="50%" alt="api-keys-flow"/>
</p>

使用API Keys验证用户身份的流程：
- 前置流程
  - 去平台注册账号
  - 获取API Keys
- API keys验证流程
  - 在类似https的安全协议请求头中添加API keys
  - 服务端验证客户端的API keys


API keys的优点是：
- 简单，易于实现，交互少
- 支持跨平台身份认证，两个应用只要相互有对方API keys，就可以验证身份
- 广泛用于API服务当中，比如OpenAI、国内的模型API等，大部分使用API keys进行身份验证。

站在智能体互联互通的场景看，API keys有几个不足：   
- 安全性较低。有很多使用API keys做身份验证的MCP server，往往要求用户将API keys写在配置文件中，存在泄漏风险。

<p align="center">
  <img src="/blogs/images/mcp-server-api-key-example.png" width="50%" alt="mcp-server-api-key-example"/>
</p>

- 仍然需要前置流程，需要用户登录注册等操作。

## 基于W3C DID的身份认证技术：did:wba

### W3C DID是什么

W3C DID（Decentralized Identifier，DID）是一种新的去中心化标识符标准，旨在解决传统中心化身份管理系统的依赖性。它与2022年发布为推荐标准。规范地址：[https://www.w3.org/TR/did-core/](https://www.w3.org/TR/did-core/)

目前已经有很多应用在使用W3C DID规范，比较知名的是最近比较火的bluesky，一个去中心化的推特应用。

### did:wba是什么

did:wba是[AgentNetworkProtocol（ANP）](https://github.com/agent-network-protocol/AgentNetworkProtocol)定义的一个did方法规范。它基于web基础设施，实现了去中心化的身份认证，专门针对agent之间的身份认证而设计。规范地址：[did:wba方法规范](https://github.com/agent-network-protocol/AgentNetworkProtocol/blob/main/chinese/03-did%3Awba%E6%96%B9%E6%B3%95%E8%A7%84%E8%8C%83.md)。

与did:wba非常类似的业务是email：各个平台有自己的账号，但是不同平台之间能够非常简单的进行身份认证与通信。同时他们都基于web基础设施，能够支持大规模用户的同时，实现去中心化。

假设智能体A要订阅并调用智能体B的服务，身份验证以及请求流程如下：

<p align="center">
  <img src="/blogs/images/did-wba-flow.png" width="75%" alt="did:wba-flow"/>
</p>

- 前置流程
  - 智能体A要订阅智能体B的服务，首先调用智能体B的服务订阅接口，并且携带智能体A的DID和签名，让B知道是智能体A发起的订阅。使用API订阅，可以去掉复杂的注册、登录、配置等强制流程，降低两个智能体之间的连接成本。
- 身份验证流程
  - 智能体A在首次http请求中，在http头中携带A的DID和签名。
  - 智能体B收到http请求后，从http头中提取A的DID和签名，然后根据A的DID，去A的DID server获取A的DID文档。
  - 智能体B获取到A的DID文档后，使用A的DID文档中的公钥对A的签名进行验证。
  - 验证通过后，智能体B处理A的业务请求，返回业务数据的同时，返回access token。
  - 智能体A在后续请求中携带access token，智能体B通过对access token的验证，完成对A的身份认证。

did:wba身份验证方案的优点：
- 安全性高
- 充分利用web基础设施，能够支持大规模用户，可实施性强
- 去中心化设计，能够让任意两个智能体体或应用之间进行身份认证
- 前置流程简单，无需用户人工注册，无需用户人工登录配置
- 身份验证流程简单，不增加交互次数

当然，did:wba也有一些缺点，最大的缺点是作为一个2022年发布的规范，基础设施不够完善，应用范围相对比较有限。不过我们也能够看到像bluesky这样的明星案例。

## 对比：did:wba vs OpenID Connect / API keys

站在智能体身份验证的角度，对比did:wba和OpenID Connect、API keys：
- 安全性：did:wba和OpenID Connect具备同等的安全性，都比API keys的安全性高。
- 复杂度：OpenID Connect的复杂度最高，API keys的复杂度最低，did:wba的复杂度介于两者之间。
- 交互次数：did:wba和API keys的交互最少，OpenID connect的交互最多.
- 前置流程：did:wba能够做到无需用户人工处理，OpenID connect和API keys都需要用户人工处理。
- 去中心化：did:wba和API keys都可以做到让任意智能体或应用互相通信。OpenID connect无法做到
- 应用范围：OpenID Connect和API keys应用范围都比较广泛，did:wba则是比较新的规范，应用范围有限。

总体对比如下：
| 对比项      | did:wba          | OpenID Connect | API keys      |
|:-------|:--------|:---------------|:---------|
| 安全性      | 高               | 高             | 中等          |
| 复杂度      | 中等             | 高             | 低            |
| 交互次数    | 少               | 多             | 少            |
| 前置流程    | 简单，无需人工     | 复杂，需要人工   | 中等，需要人工  |
| 去中心化    | 是               | 否             | 是            |
| 应用范围    | 有限             | 广泛           | 广泛          |


从上面的对比我们可以看到，did:wba不但能够支持所有的智能体互联互通，并且具备OpenID Connect的安全性以及API keys的简单性，同时也支持大规模用户使用。综合来看，did:wba是最适合智能体之间进行身份认证的方案。

当然，OpenID Connect和API keys仍然有他们自己的作用。比如，智能体在和原有互联网系统对接的时候，可能仍然需要使用OpenID Connect和API keys。
## 版权声明  
Copyright (c) 2024 ANP Community  
本文件依据 [MIT 许可证](./LICENSE) 发布，您可以自由使用和修改，但必须保留本版权声明。  
