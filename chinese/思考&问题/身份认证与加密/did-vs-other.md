
# 与其他的身份认证方案对比


OAuth 2.0 和 OpenID Connect（OIDC）最大的问题是，它必须信任一个三方的中心化的服务器，这个服务器需要存储用户的身份信息。

无法解决小应用之间的通信。除了流程复杂外，应用无法掌握自己的账号。比如两个小的应用，他们要互相通信，如果他们要互相身份认证，自建oauth服务器成本高，使用第三方oauth服务器，他们无法掌握自己的账号。————只讲最要命的问题。

需要用户参与，不适合完全自动化的流程。比如，两个应用之间，获取一些信息服务。非购买。比如获取咨询、广告信息等。这个时候用户参与成本高。

Oauth2.0的流程之所以复杂，是**因为他要在浏览器上操作**，有用户的交互。如果没有用户，机器对机器，则API令牌是一个方法。我们不需要在浏览器操作。

要全部对比下。另外也要思考下我们在浏览器上怎么使用。

did的一个优点：能够让两个mcp client之间进行互相操作。而不用通过Oauth server。


openid connect和SAML，都是要在浏览器上做身份验证。我们不做浏览器上的身份认证。未来智能体网络下，不存在这种场景。有智能体的did，就可以获得智能体的描述信息，包括功能，以及接口。这个是新时代的网站。

将did:wba作为一个介于Oauth和api key之间的方案：
- 和oauth相比，具备同等的安全性，但是比oauth更简单。交互更少（前置配置简单，流程少）
- 和api key相比，接入成本差不多（高一点），但是更加的安全，不用将重要的信息，放到本地存储。比如api key。

did:wba作为一个去中心化的方案，可以去掉连接前的准备工作，比如，手动登录对我网站配置。在只使用对方能力的场景中，只要提供一个did，然后购买服务，就可以使用。

否则，使用者必须信令client开发商的安全性，如果开发商在代码无意间泄露了api（比如通过日志，或文件权限管理不善），那么使用者就面临风险。

怎么消除对APIkey的安全性担忧？比如，api key被放到client的目录下，client能够访问他，我必须要对client的代码保持信任才可以。这个是问题。

我们真正要替代的，不是oauth，而是API key。api的安全性是一个很大的问题。

## 从问题入手，解决什么问题

了解下当前Oauth怎么设计的。

了解下当下有哪些mcp  server，他们怎么运行。


对于大型的应用，比如google、github等，就用Oauth2.0。


我现在理解之前他们讨论的Oauth的方案了。MCP server的开发人员，去Google注册一个应用，client作为客户端代理的角色。这里需要研究下之前的讨论和提交的方案。

client和server是一家开发的吗？——这个我要看看代码，应该不是的。

### 对于大型的应用，比如google、github等，就用Oauth2.0。

mcp server作为代理

### 对于新的、小型的应用，没有必要使用Oauth，这里可以使用did的方案。

这个case，did为什么比api方案更好。

api令牌，安全性不好。并且还要手动的去申请。did的方案安全性高，并且可以自动生成。


# OAuth 2.0

     +--------+                               +---------------+
     |        |--(A)- Authorization Request ->|   Resource    |
     |        |                               |     Owner     |
     |        |<-(B)-- Authorization Grant ---|               |
     |        |                               +---------------+
     |        |
     |        |                               +---------------+
     |        |--(C)-- Authorization Grant -->| Authorization |
     | Client |                               |     Server    |
     |        |<-(D)----- Access Token -------|               |
     |        |                               +---------------+
     |        |
     |        |                               +---------------+
     |        |--(E)----- Access Token ------>|    Resource   |
     |        |                               |     Server    |
     |        |<-(F)--- Protected Resource ---|               |
     +--------+                               +---------------+

在A中，三方应用会携带自己的信息，然后将用户跳转到授权端点。

由于这两个是不同的浏览器页面，相互之间如果共享授权码或token，会有安全问题，所以，授权码流程设计了三方应用后台参与的流程，即让授权服务器将授权码通过redirect_uri返回给三方应用。这可以避免在浏览器中传递。



# OpenID Connect（OIDC）

规范地址：https://openid.net/specs/openid-connect-core-1_0.html
谷歌使用openID connect说明：https://developers.google.com/identity/openid-connect/openid-connect?hl=zh-cn

作为背景，OAuth 2.0 授权框架（Hardt，D. 主编，“OAuth 2.0 授权框架”，2012 年 10 月。） [RFC6749]和OAuth 2.0 承载令牌使用（Jones，M. 和 D. Hardt，“OAuth 2.0 授权框架：承载令牌使用”，2012 年 10 月。） [RFC6750]规范为第三方应用程序提供了获取和使用对 HTTP 资源的有限访问的通用框架。它们定义了获取和使用访问令牌以访问资源的机制，但没有定义提供身份信息的标准方法。值得注意的是，如果不对 OAuth 2.0 进行剖析，它就无法提供有关最终用户身份验证的信息。期望读者熟悉这些规范。————**授权过程是一样的，唯一不一样的是后面访问的资源是用户信息。并且token中增加了id_token**

ID Token 是JWT结构，包含用户信息，可以使用公钥进行验证。


在 OpenID Connect (OIDC) 规范中，用户信息的返回方式可以有以下两种：

通过 ID Token 直接返回部分用户信息
ID Token 是由身份提供者（IdP）生成并返回给客户端的 JWT（JSON Web Token）。其中，可能包含一些基本的用户信息，例如 sub（用户唯一标识）、name、email 等。具体包含哪些信息取决于身份提供者和客户端之间的约定，以及授权范围（Scopes）。例如，包含 profile 或 email 范围时，可能会在 ID Token 中返回用户的基本信息。

通过 UserInfo Endpoint 获取详细用户信息
如果需要更多用户信息（超出 ID Token 中包含的范围），客户端需要在收到 ID Token 后，通过访问 OpenID Connect 的 UserInfo Endpoint 来获取。这需要使用从授权服务器获得的访问令牌（Access Token）来进行认证。
+--------+                                   +--------+
|        |                                   |        |
|        |---------(1) AuthN Request-------->|        |
|        |                                   |        |
|        |  +--------+                       |        |
|        |  |        |                       |        |
|        |  |  End-  |<--(2) AuthN & AuthZ-->|        |
|        |  |  User  |                       |        |
|   RP   |  |        |                       |   OP   |
|        |  +--------+                       |        |
|        |                                   |        |
|        |<--------(3) AuthN Response--------|        |
|        |                                   |        |
|        |---------(4) UserInfo Request----->|        |
|        |                                   |        |
|        |<--------(5) UserInfo Response-----|        |
|        |                                   |        |
+--------+                                   +--------+

OpenID Connect（OIDC）是一种基于 OAuth 2.0 构建的身份认证协议。它将身份验证功能扩展到 OAuth 2.0 的授权功能之上，使客户端应用程序可以验证用户的身份，并获取用户的基本信息（如姓名、邮箱）等。

OIDC 简单、安全，并且支持跨平台和多种设备，是现代身份认证系统中使用最广泛的协议之一。

OIDC 的核心特性
身份认证（Authentication）：

OIDC 在 OAuth 2.0 的授权功能基础上增加了身份认证能力。
通过验证身份令牌（ID Token），客户端可以确认用户的身份。
基于 JSON Web Token (JWT)：

OIDC 的身份令牌（ID Token）使用 JWT 格式，具有自包含特性，包含用户信息和签名，可直接验证而无需调用服务器。
支持多种客户端类型：

Web 应用、移动应用、单页应用（SPA）、原生应用等。
用户信息获取（User Info Endpoint）：

提供了一个标准的用户信息端点（UserInfo Endpoint），应用程序可以通过访问此端点获取更多的用户信息。
兼容性和可扩展性：

作为 OAuth 2.0 的扩展，OIDC 完全兼容 OAuth 2.0，同时提供额外功能满足身份验证需求。

## 使用 OpenID Connect (OIDC) 接入 Google
使用 OpenID Connect (OIDC) 接入 Google，可以让用户使用他们的 Google 账号登录你的应用。这比传统的用户名/密码方式更安全、便捷。以下是详细的申请和技术接入流程：

**一、准备工作**

1.  **拥有一个 Google 账号：** 这是进行所有操作的基础。
2.  **在 Google Cloud Platform (GCP) 中创建一个项目（可选但推荐）：** 虽然不强制要求，但在 GCP 中创建项目可以更好地管理你的应用和凭据。如果你需要使用其他 Google Cloud 服务，这是必需的。
3.  **确定你的应用类型：** 你的应用是 Web 应用、移动应用（Android/iOS）还是桌面应用？这将影响你后续的配置。

**二、在 Google API 控制台中配置 OAuth 2.0 凭据**

1.  **访问 Google API 控制台：** 打开 [https://console.developers.google.com/](https://www.google.com/url?sa=E&source=gmail&q=https://console.developers.google.com/)。
2.  **选择或创建一个项目：** 如果你已经在 GCP 中创建了项目，选择它。否则，创建一个新项目。
3.  **导航到“凭据”页面：** 在左侧菜单中，选择“凭据”。
4.  **创建 OAuth 2.0 客户端 ID：** 点击“创建凭据”，然后选择“OAuth 客户端 ID”。
5.  **选择应用类型：** 根据你的应用类型选择“Web 应用”、“Android”、“iOS”等。
6.  **配置详细信息：**
      * **名称：** 为你的客户端 ID 指定一个名称。
      * **已授权的 JavaScript 来源（针对 Web 应用）：** 指定你的应用所在的域名或来源。例如：`http://localhost:8080` 或 `https://yourdomain.com`。
      * **已授权的重定向 URI（针对 Web 应用）：** 指定 Google 授权服务器重定向用户返回你的应用的 URI。例如：`http://localhost:8080/callback` 或 `https://yourdomain.com/callback`。
      * **软件包名称和 SHA-1 签名证书指纹（针对 Android 应用）：** 这些信息用于验证你的 Android 应用。
      * **Bundle ID（针对 iOS 应用）：** 这是你的 iOS 应用的唯一标识符。
7.  **创建：** 点击“创建”按钮。
8.  **获取客户端 ID 和客户端密钥：** 创建完成后，你将获得一个客户端 ID 和客户端密钥。请妥善保管这些信息，特别是客户端密钥，不要将其暴露在客户端代码中。

**三、技术接入流程（以 Web 应用为例）**

1.  **构建授权 URL：** 使用以下参数构建一个 URL，将用户重定向到 Google 的授权服务器：
      * `client_id`：你在 Google API 控制台中获得的客户端 ID。
      * `response_type`：设置为 `code`（用于授权代码流，这是推荐的方式）。
      * `scope`：指定你的应用需要访问的用户信息的范围。例如：`openid email profile`（请求用户的 OpenID、电子邮件地址和基本个人资料信息）。
      * `redirect_uri`：你在 Google API 控制台中配置的重定向 URI。
      * `state`：一个随机生成的字符串，用于防止跨站请求伪造 (CSRF) 攻击。
      * `nonce`：一个随机生成的字符串，用于防止重放攻击。
    <!-- end list -->
    ```
    https://accounts.google.com/o/oauth2/v2/auth?
    client_id=YOUR_CLIENT_ID&
    response_type=code&
    scope=openid%20email%20profile&
    redirect_uri=YOUR_REDIRECT_URI&
    state=YOUR_STATE&
    nonce=YOUR_NONCE
    ```
2.  **处理重定向：** 用户同意授权后，Google 会将用户重定向回你的应用，并在 URL 中包含一个授权代码 (`code`) 和 `state` 参数。
3.  **验证 `state` 参数：** 验证收到的 `state` 参数是否与你之前生成的 `state` 参数一致。
4.  **使用授权代码获取访问令牌和 ID 令牌：** 向 Google 的令牌端点发送一个 POST 请求，包含以下参数：
      * `code`：从重定向 URL 中获得的授权代码。
      * `client_id`：你的客户端 ID。
      * `client_secret`：你的客户端密钥。
      * `redirect_uri`：你的重定向 URI。
      * `grant_type`：设置为 `authorization_code`。
    <!-- end list -->
    ```
    https://oauth2.googleapis.com/token
    ```
5.  **验证 ID 令牌：** 验证从令牌端点获得的 ID 令牌的签名和声明。你需要使用 Google 提供的公钥来验证签名。确保 `aud` (受众) 声明与你的客户端 ID 匹配。
6.  **使用用户信息：** ID 令牌包含用户的基本信息，例如用户 ID、电子邮件地址和姓名。你可以使用这些信息来标识用户并提供个性化体验。

**四、其他重要事项**

  * **选择合适的 Scope：** 只请求你的应用真正需要的用户信息。
  * **安全最佳实践：** 始终使用 HTTPS，并妥善保管你的客户端密钥。
  * **使用 Google 提供的客户端库：** Google 提供了各种编程语言的客户端库，可以简化 OIDC 的集成过程。
  * **授权代码流（推荐）：** 始终使用授权代码流，而不是隐式流，以提高安全性。

以上步骤提供了一个全面的指南，帮助你使用 OpenID Connect 接入 Google。根据你的具体应用类型和需求，可能需要进行一些调整。建议参考 Google 官方文档以获取更详细和最新的信息。

## 使用 OpenID Connect (OIDC) 接入 微信

是的，微信也使用 OpenID 作为用户在其平台上的唯一标识符。微信的开放平台提供了一套完整的 OAuth 2.0 协议实现，用于第三方应用接入微信登录。虽然微信没有直接使用 "OpenID Connect" 这个术语，但其实现方式与 OIDC 的核心概念非常相似，都基于 OAuth 2.0 协议，并提供用户身份信息的验证和传递。

**微信登录第三方应用的基本流程如下：**

1.  **在微信开放平台注册开发者账号并创建移动应用/网站应用/公众号应用：** 你需要根据你的应用类型（移动应用 App、网站应用 Web、公众号应用）在微信开放平台（[https://open.weixin.qq.com/](https://www.google.com/url?sa=E&source=gmail&q=https://open.weixin.qq.com/)）注册账号，并创建相应的应用。创建应用后，你会获得 AppID 和 AppSecret，这是后续步骤中需要使用的重要凭据。

2.  **配置授权回调域：** 在微信开放平台的应用配置中，你需要设置授权回调域。这是用户同意授权后，微信将用户重定向回你的应用的 URL。这个 URL 必须与你在代码中使用的回调 URL 完全一致。

3.  **前端发起微信授权请求：**

      * **移动应用（App）：** 使用微信 SDK (Software Development Kit) 构建授权 URL，并拉起微信 App 进行授权。
      * **网站应用（Web）：** 构建授权 URL，将用户重定向到微信的授权页面。
      * **公众号应用：** 在微信网页授权页面内进行授权。

    授权 URL 的基本格式如下：

    ```
    https://open.weixin.qq.com/connect/oauth2/authorize?
    appid=YOUR_APPID&
    redirect_uri=YOUR_REDIRECT_URI&
    response_type=code&
    scope=snsapi_login&
    state=YOUR_STATE#wechat_redirect
    ```

      * `appid`：你的微信应用的 AppID。
      * `redirect_uri`：授权回调域，需要进行 URL 编码。
      * `response_type`：设置为 `code`。
      * `scope`：授权作用域，`snsapi_login` 表示使用 unionID 机制登录（推荐），还可以使用 `snsapi_userinfo` 获取用户基本信息，但需要用户手动确认授权。
      * `state`：一个随机字符串，用于防止 CSRF 攻击。

4.  **用户同意授权：** 用户在微信客户端或网页上确认授权后，微信会将用户重定向到你的回调 URL，并在 URL 中带上 `code` 和 `state` 参数。

5.  **后端通过 `code` 获取 access\_token 和 openid：** 你的服务器需要使用 `code` 向微信服务器发送请求，以获取 `access_token` 和 `openid`。请求 URL 如下：

    ```
    https://api.weixin.qq.com/sns/oauth2/access_token?
    appid=YOUR_APPID&
    secret=YOUR_APPSECRET&
    code=CODE&
    grant_type=authorization_code
    ```

      * `appid`：你的微信应用的 AppID。
      * `secret`：你的微信应用的 AppSecret。
      * `code`：从回调 URL 中获取的 `code`。

    微信服务器会返回一个 JSON 响应，包含 `access_token`、`openid` 等信息。

6.  **使用 access\_token 获取用户个人信息（可选）：** 如果你的应用需要获取用户的头像、昵称等信息，可以使用 `access_token` 和 `openid` 向微信服务器发送请求。

    ```
    https://api.weixin.qq.com/sns/userinfo?
    access_token=ACCESS_TOKEN&
    openid=OPENID&
    lang=zh_CN
    ```

7.  **验证 openid 并进行后续业务逻辑：** 你的服务器需要验证 `openid` 的有效性，并根据 `openid` 建立与你的应用用户的关联。由于 `openid` 在同一个微信开放平台账号下的不同应用是不一样的，如果需要跨应用的用户身份统一，可以使用 `unionid` (前提是在开放平台绑定了多个应用)。

**关键点：**

  * **AppID 和 AppSecret 的安全性：** 务必妥善保管你的 AppSecret，不要将其暴露在客户端代码中。所有的网络请求都应该在你的服务器端进行。
  * **回调 URL 的一致性：** 确保在微信开放平台配置的回调 URL 与你在代码中使用的回调 URL 完全一致，否则授权流程将无法完成。
  * **state 参数的重要性：** 使用 `state` 参数可以有效防止 CSRF 攻击。
  * **unionid 的使用：** 如果需要在同一个微信开放平台账号下的多个应用中识别同一用户，请使用 unionid。

总而言之，微信登录的实现方式虽然没有明确声明 "OpenID Connect"，但其核心机制和流程与 OIDC 非常相似，都基于 OAuth 2.0 协议，并使用 openid 作为用户的唯一标识。通过上述步骤，你可以将微信登录集成到你的第三方应用中，方便用户使用微信账号登录。

建议仔细阅读微信开放平台的官方文档，以获取最准确和最新的信息，并根据你的应用类型选择合适的接入方式。



# SAML
SAML（Security Assertion Markup Language，安全断言标记语言）是一种基于 XML 的开放标准，用于在不同实体（如身份提供商和服务提供商）之间安全地交换用户身份验证和授权数据。SAML 最常用于企业环境中的单点登录（Single Sign-On，SSO）场景。



# API 令牌

API 令牌是用于验证和授权对 API 的访问的唯一标识符。它们通常用于机器对机器的通信。API 令牌提供了一种简单有效的方式来保护 API 访问，尤其是在不需要用户交互的场景中。
















## 版权声明  
Copyright (c) 2024 ANP Community  
本文件依据 [MIT 许可证](./LICENSE) 发布，您可以自由使用和修改，但必须保留本版权声明。  
