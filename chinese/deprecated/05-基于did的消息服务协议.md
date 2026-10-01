# 基于did的消息服务协议

## 1. 背景

在一种基于DID的跨平台身份认证和端到端加密通信技术一文中，我们介绍了如何基于DID进行身份认证和端到端加密通信。在进行短期秘钥协商和加密通信时，两个DID用户需要能够找到彼此，并且将握手消息或加密消息发送给对方。本文就是介绍连接DID用户如何找到对方并发送消息。

## 1. 流程与架构

整体结构如下图：

![基于DID的消息通信整体架构图](/images/message-flow-architecture.png)

上图是基于DID的消息通信整体架构图，图中有三个主要参与方：

- User Server：用户的后端服务，负责管理用的DID文档、帮助用户收发消息。
- DID Server：DID文档托管服务，负责DID的创建、查询等服务。
- Message Proxy：消息代理，负责为用户提供消息收发服务。

在我们的DID all方法设计规范中有提到，DID托管服务（DID server）和消息服务（Message Proxy）是可选，用户可以使用自建服务，但是流程基本一致。

## 2. User Server与Message Proxy连接

User Server可以自行选择Message服务提供商。选定后，在服务提供商网站申请API key，以及服务端点。API key用于User Server和Message Proxy的连接鉴权，服务端点可以写入DID文档中，表示这个DID使用这个端点的消息服务。

消息服务一般采用WSS长连接，需要User Server主动连接Message Proxy，并保持心跳。

User Server连接到Message Proxy后，需要提供这个连接的路由信息（DID文档中的router，也是一个DID），以及相关签名，表示对路由的所有权。router用来告知Message proxy这个连接承载的路由信息。Proxy会将路由信息、WSS链接、DID绑定，后面所有这个DID的消息，会通过这个WSS链接发送Server。这样设计的好处是，Server连接到Proxy后只需要注册少量router即可，不用将所有DID发送给Proxy。这在DID量特别大的时候非常有用。

一个路由信息，可以绑定多个WSS链接，由Proxy发送时进行负载均衡。

router注册、绑定、根据DID发送消息流程如下：

![router注册、绑定、根据DID发送消息流程](/images/message-did-register-flow.png)

## 3. Message Proxy鉴权机制

Message Proxy使用API key对User Server进行鉴权。整体过程和User Server接入DID Server的鉴权过程类似（DID all方法设计规范）。

### 3.1 WSS HTTP 请求参数

请求头：
- Content-Type: application/json
- Authorization: 支持 API Key 和 token 两种鉴权方式

### 3.2 WSS HTTP 用户鉴权

在调用接口时，支持两种鉴权方式：
1. 传 API Key 进行认证
2. 传鉴权 token 进行认证

#### 3.2.1 获取 API Key

登录服务商 API Keys 页面获取最新版生成的用户 API Key。 API Key 同时包含 "用户标识 id" 和 "签名密钥 secret"，即格式为 {id}.{secret}。

#### 3.2.2 使用 API Key 进行请求

用户需要将 API Key 放入 HTTP 的 Authorization header 头中。

#### 3.2.3 使用 JWT 组装 Token 后进行请求

用户端需引入对应 JWT 相关工具类，并按以下方式组装 JWT 中 header、payload 部分。

1. header 示例

```
{
  "alg": "HS256",
  "sign_type": "SIGN"
}
- alg: 属性表示签名使用的算法，默认为 HMAC SHA256（写为HS256）。
- sign_type: 属性表示令牌的类型，JWT 令牌统一写为 SIGN 。

2. payload 示例


```
{
  "api_key": "{ApiKey.id}",
  "exp": 1682503829130,
  "timestamp": 1682503820130
}
- api_key: 属性表示用户标识 id，即用户API Key的 {id} 部分。
- exp: 属性表示生成的JWT的过期时间，客户端控制，单位为毫秒。
- timestamp: 属性表示当前时间戳，单位为毫秒。

Example: Python 语言中的鉴权 token 组装过程

```python
import time
import jwt
 
def generate_token(apikey: str, exp_seconds: int):try:id, secret = apikey.split(".")except Exception as e:raise Exception("invalid apikey", e)
    payload = {"api_key": id,"exp": int(round(time.time() * 1000)) + exp_seconds * 1000,"timestamp": int(round(time.time() * 1000)),
    }
 return jwt.encode(
        payload,
        secret,
        algorithm="HS256",
        headers={"alg": "HS256", "sign_type": "SIGN"},
    )
```

3. 将鉴权 token 放入 HTTP 请求的 header 中 用户需要将生成的鉴权 token 放入 HTTP 的 Authorization header 头中：
  - Authorization: Bearer <你的token>

## 4. Message Proxy和Message Proxy连接
服务Proxy之间也需要互相连接，特别是不同平台用的不同服务。服务之间可以通过wss互相连接，连接后通知对方各自的服务端点，以便在路由的时候能够找到彼此。

## 5. 消息发送与接收流程

本节描述的是，一个用户A怎么根据用户B的DID，成功的将消息发送给B。
整体流程如下图所示：

![消息发送与接收流程](/images/message-send-receive-flow.png)

流程说明：
1. 用户A通过微信、短信、线下等渠道获得用户B的DID，向B发送消息，首先向A的服务端发起请求。
2. 用户A服务端收到发送给B的消息发送请求，向A Server的Message proxy发送请求，携带B的DID。
3. A的Message Proxy收到消息发送请求，根据B的DID，去DID Serve查询B的DID文档，获得B的消息服务端点，并缓存B的DID文档，后面可以快速连接。
4. A的Message Proxy向B的消息服务端点（B的Message Proxy）发起连接，并且将消息发送过去。
5. B的Message Proxy收到请求，根据B的DID查找B的DID文档，获得B的消息路由信息（DID文档中的router字段）。根据消息路由，查询B Server的WSS连接，并且转发消息。
6. B的Server收到消息后，进行验证、处理，发送给B。
7. B后续发送给A的消息流程，同A发送给B的过程。

备注：首次访问一个新的DID，系统可能没有缓存，查询过程耗时较大，但是后面的访问可以直接访问缓存，则耗时较低。

## 6. 协议定义

如基于DID的端到端加密通信技术描述，我们的协议使用WSS传输，json格式。

### 6.1 消息服务注册消息

用于用户Server向Message Proxy注册。注册时可以携带多个router。每个router包含router DID、创建时间、nonce（用于防止重放攻击）以及签名（签名是对该router的JSON子对象进行签名）。

备注：这是一个全量接口，需要携带全量的router，不在注册消息中的router会被删除掉

示例：

```json
{
  "version": "1.0",
  "type": "register",
  "timestamp": "2024-05-27T12:00:00.123Z",
  "messageId": "randomstring",
  "routers": [
    {
      "router": "did:all:14qQqsnEPZy2wcpRuLy2xeR737ptkE2Www",
      "nonce": "randomNonceValue1",
      "proof": {
        "type": "EcdsaSecp256r1Signature2019",
        "created": "2024-05-27T10:51:55Z",
        "verificationMethod": "did:example:14qQqsnEPZy2wcpRuLy2xeR737ptkE2Www#keys-1",
        "proofValue": "z58DAdFfa9SkqZMVPxAQpic7ndSayn1PzZs6ZjWp1CktyGesjuTSwRdoWhAfGFCF5bppETSTojQCrfFPP2oumHKtz"
      }
    },
    {
      "router": "did:all:14qQqsnEPZy2wcpRuLy2xeR737ptkE2Www",
      "nonce": "randomNonceValue1",
      "proof": {
        "type": "EcdsaSecp256r1Signature2019",
        "created": "2024-05-27T10:51:55Z",
        "verificationMethod": "did:example:14qQqsnEPZy2wcpRuLy2xeR737ptkE2Www#keys-1",
        "proofValue": "z58DAdFfa9SkqZMVPxAQpic7ndSayn1PzZs6ZjWp1CktyGesjuTSwRdoWhAfGFCF5bppETSTojQCrfFPP2oumHKtz"
      }
    }
  ]
}
```

#### 6.1.1 字段说明

- version：协议版本
- type: 请求类型，表明这是一个注册router的请求，值为"register"。
- timestamp: 请求的时间戳，表明请求发送的时间，ISO 8601格式的UTC时间字符串，精确到毫秒
- messageId: 消息唯一id，16位随机字符串
- routers: 一个包含多个router对象的数组，每个router对象包含以下字段：
  - router: router的DID，用于标识router。
  - nonce: 随机值，32字节字符串，用于防止重放攻击，确保每次请求的唯一性。
  - proof: 同基于DID的端到端加密通信技术中SourceHello的proof字段。仅对当前router进行签名。

#### 6.1.2 proof签名生成步骤

流程和基于DID的端到端加密通信技术中sourceHello消息签名方法基本一致。区别是这里的签名仅对单个router进行保护。

- 将待签名的router对象转换为JSON字符串（proofValue字段除外），使用逗号和冒号作为分隔符，并按键排序。
- 将JSON字符串编码为UTF-8字节。
- 使用椭圆曲线数字签名算法（EcdsaSecp256r1Signature2019）和SHA-256哈希算法，对字节数据进行签名。
- 将生成的签名值 proofValue 添加到消息json中proof字典的proofValue字段中。

```python
# 1. 创建json消息的所有字段，排除proofValue字段
router = {
    # 其他必要的字段
    "proof": {
        "type": "EcdsaSecp256r1Signature2019",
        "created": "2024-05-27T10:51:55Z",
        "verificationMethod": "did:example:123456789abcdefghi#keys-1"
        # proofValue 字段除外
    }
}

# 2. 转换为JSON字符串，按键排序，并使用逗号和冒号作为分隔符
router_str = JSON.stringify(router, separators=(',', ':'), sort_keys=True)

# 3. 将JSON字符串编码为UTF-8字节
router_bytes = UTF8.encode(router_str)

# 4. 使用私钥和ECDSA算法对字节数据进行签名
signature = ECDSA.sign(router_bytes, private_key, algorithm=SHA-256)

# 5. 将签名值添加到json消息的proof字段中
router["proof"]["proofValue"] = Base64.urlsafe_encode(signature)
```

#### 6.1.3 proof签名校验过程
根据router的DID获取DID文档，根据verificationMethod从文档中获取对应公钥，根据公钥以及上面的签名过程，对签名进行校验。

#### 6.1.4 Nonce的生成和验证步骤：

Nonce的目的是为了防止重放攻击。

1. 生成Nonce：客户端生成一个随机数或唯一标识符（nonce），每次请求都应使用新的nonce。
2. 记录Nonce：服务器在处理请求时，记录该nonce。
3. 验证Nonce：服务器验证该nonce在一定时间内容是否已被使用过。如果已经使用过，则拒绝该请求。

#### 6.1.5 时间戳校验：

- 时间戳（timestamp）：在请求中包含一个时间戳，表明请求的生成时间。
- 有效期检查：服务器检查时间戳是否在一个合理的时间范围内（例如，5分钟内）。超过这个时间范围的请求将被拒绝。

### 6.2 Message proxy之间连接

一个Proxy A在解析出目标DID的消息服务端点B后，可以发起对这个端点B的WSS连接，之后可以直接发送消息，可以不需要注册，但是需要心跳保活。
B发送给A消息是可以建立新的WSS连接，不用之前A连接B的消息。
这样一个连接仅用于连接发起者发送消息。

### 6.3 心跳保持消息

心跳消息由接入方主动发起。服务端会定期（60秒）清理没有保活消息的连接。

示例：
```json
{
  "version": "1.0",
  "type": "heartbeat",
  "timestamp": "2024-06-04T12:34:56Z",
  "messageId": "randomstring",
  "message": "ping"
}
```

#### 6.3.1 字段说明

- version：协议版本
- type: 请求类型，表明这是一个注册router的请求，值为"heartbeat"。
- timestamp: 请求的时间戳，表明请求发送的时间，ISO 8601格式的UTC时间字符串，精确到毫秒
-  messageId: 消息唯一id，16位随机字符串
- message：请求发送的心跳消息是 "ping"，响应消息是 "pong"。

### 6.4 加密通信消息

两个用户通过DID协商完短期加密密钥后，可以通过message消息发送加密后的消息。

示例：
```json
{
  "version": "1.0",
  "type": "message",
  "timestamp": "2024-06-04T12:34:56.123Z",
  "messageId": "randomstring",
  "sourceDid": "did:example:987654321abcdefghi",
  "destinationDid": "did:example:123456789abcdefghi",
  "secretKeyId": "abc123session",
  "encryptedData": {
    "iv": "iv_encoded_base64",
    "tag": "tag_encoded_base64",
    "ciphertext": "ciphertext_encoded_base64"
  }
}
```

#### 6.4.1 协议字段

- version：字符串，当前协议使用的版本号。
- type：字符串，消息类型。
- timestamp：消息发送时间，ISO 8601格式的UTC时间字符串，精确到毫秒。
- messageId: 消息唯一id，16位随机字符串
- sourceDid：字符串，消息源也就是发送者的DID，这里永远填写消息发送者自己的DID。
- destinationDid：字符串，目的端也就是消息接收者的DID，这里永远填写消息接受者的DID。
- secretKeyId：短期加密密钥的ID，通过该ID可以找到之前协商的对称加密密钥算法、加密密钥等信息，类型: 字符串。详细见基于DID的端到端加密通信技术
- encryptedData: 加密数据，根据加密算法不同，可能包括不同的数据。下面是TLS_AES_128_GCM_SHA256加密套件所需要的数据：包括 iv（初始化向量）、 tag（认证标签，视加密算法而定）。ciphertext（加密后的文本）在所有的加密算法中都存在。
  - iv：Initialization Vector，初始化向量，一个随机或伪随机的字节序列，长度通常为12字节（96位）对于AES-GCM模式。
  - tag：AES-GCM模式生成的一个认证码，用于验证数据的完整性和真实性。标签通常为16字节（128位）
  - ciphertext：加密数据，加密后的密文（ciphertext）会进行Base64编码，并将编码结果转换为UTF-8字符串。
  - encryptedData的生成方法同finished 消息verifyData生成方法：基于DID的端到端加密通信技术

### 6.5 响应消息

针对所有的WSS消息，有一个通用的响应消息，这个响应消息的主要目的是通知消息处理过程中的异常，包括短期秘钥协商消息、wss注册消息、加密通信消息等。这个消息不用做WSS json消息层面的接受确认。如果应用层发送了一个消息，需要确认这个消息对方是否正确收到，需要在应用层协议中设计保障机制。

```json
{
  "version": "1.0",
  "type": "response",
  "timestamp": "2024-06-04T12:34:56.123Z",
  "messageId": "randomstring",
  "sourceDid": "did:example:987654321abcdefghi",
  "destinationDid": "did:example:123456789abcdefghi",
  "originalType": "register",
  "originalMessageId": "randomstring",
  "code": 200,
  "detail": "invalid json"
}
```

#### 6.5.1 字段说明

- originalType：原始消息类型
- originalMessageId：原始消息message id
- code：错误code码，基本设计同HTTP错误码，以下是常用错误：
  - 200：正常
  - 404：找不到DID
  - 403：鉴权失败
  - 4000： ENCRYPTION_ERROR：加密过程中发生错误。
  - 4001： DECRYPTION_ERROR：解密过程中发生错误。
  - 4002 ：INVALID_ENCRYPTION_KEY：加密密钥无效或不匹配。
  - 4003： INVALID_DECRYPTION_KEY：解密密钥无效或不匹配。
  - 4004 ：ENCRYPTION_KEY_EXPIRED：加密密钥已过期。
  - 4005 ：DECRYPTION_KEY_EXPIRED：解密密钥已过期。
- detail：错误具体信息的描述

### 6.6 DID更新通知

当DID内部字段发生修改，或者DID对应的私钥发生泄漏，需要废弃原有的DID文档时，需要发送DID通知消息，以通知和自己关联的其他DID及时重新查询DID文档。
为了抵御可能的恶意攻击，DID更新通知会配合DID文档的多重签名机制一起上线，计划下个版本支持。这样的话即便一个密钥泄漏，我们仍然可以安全的通知关联方。









## 版权声明  
Copyright (c) 2024 ANP Community  
本文件依据 [MIT 许可证](./LICENSE) 发布，您可以自由使用和修改，但必须保留本版权声明。  
