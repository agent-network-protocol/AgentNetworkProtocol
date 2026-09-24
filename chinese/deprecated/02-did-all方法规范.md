# did:all方法设计规范

> !!!**注意：** 此规范暂时停止支持，请使用最新的DID方法[did:wba](/chinese/03-did:wba方法规范.md)。

## 背景
在一种基于DID的跨平台身份认证和端到端加密通信技术一文中，为了解决跨平台身份认证问题，我们提出了一个新的DID方法all(Alliance，联盟)，类似区块链中的联盟链，即所有支持此方法标准的服务提供商，都可以对外提供DID的相关服务。  

本文将基于W3C DID规范，详细描述all方法设计，包括DID生成、解析、DID文档特殊修改。  

本文假设你已经了解W3C DID相关背景知识，如果没有可以阅读下相关文章或本文参考文献。  

本文提出的all方法对W3C标准进行了一些扩充和修改，以适应我们要解决的问题。

## 1. DID方法all（Alliance）

DID方法（DID Method）是去中心化标识符（Decentralized Identifier, DID）的一种实现方式，规定了如何创建、解析、更新和撤销DID。每个DID方法都与特定的区块链或去中心化网络关联，并且定义了与该网络交互的具体规则。  

现有已经定义的DID方法大部分基于区块链设计，受限于区块链技术阶段，在扩展性、商业化落地上存在非常大的问题。基于web的DID方法则和域名深度绑定，需要web服务提供者支持DID的相关操作，对web服务提供者带来一定的复杂度。  

我们提出了一个新的DID方法all（Alliance，联盟），类似区块链中的联盟链，即所有支持此方法标准的服务提供商，都可以对外提供DID的相关服务。DID的使用者可以根据所有服务提供商的价格、服务水平、口碑等，选择一个或多个提供服务。所有支持此方法的服务提供商可以将自己的服务域名写入到区块链一个特定内存上，以保证所有all方法的使用者能够得到完整的服务提供商列表。  

同时，DID的创建者也可以在DID中指定DID文档的托管服务域名，以告知DID查询者去特定服务商或者用户自己搭建的服务器中获取DID文档。  

最后，all方法的操作全部使用https等标准的web协议，以让all方法能够利用已有的web基础设施。

## 2. all方法核心设计思路

all方法设计的核心是用密码学技术来保证DID文档的不可篡改性，用联盟节点来保证系统的分布式。

### 2.1 用密码学保证DID文档不可篡改性

如果底层技术使用区块链或者分布式账本技术，则可以基于共识机制、加密技术和分布式存储，让DID文档不可篡改。我们采用“联盟”的技术思路，单个节点其实可以看做一个中心节点，除了信任中心节点，在技术上无法验证DID文档的未被篡改。  

我们通过设计DID的生成规范，让DID和DID持有者的公钥一一对应，再用公钥来对文档进行签名。这样，即便是将这个DID文档发送给任何一个中心化的节点，我们也有技术手段保证文档的不可篡改性。  

DID创建、托管流程如下：

- 首先生成非对称加密的私钥和公钥，目前我们使用secp256r1算法。

- 根据公钥生成DID中的唯一标识符，生成过程和比特币的地址的生成保持一致。

- 用户根据DID、公钥等信息创建DID文档，然后使用私钥进行签名。

- 最后将签名信息也存入DID文档中，并且托管给三方的服务节点。

其他用户解析、验证DID过程：

- 向三方服务节点发起DID解析请求，下载DID文档。

- 根据DID生成规范验证DID和公钥的对应关系，如果一一对应，则说明公钥正确。

- 再用公钥去验证DID文档中的签名，如果签名正确，则说明文档未被篡改。  

至此，DID文档的创建和验证过程完成。


### 2.2 DID服务的分布式保证
all方法的DID服务采用了一种更加灵活的方式。首先，为了避免当前区块链等技术扩展性的问题，我们单个节点都是中心化的，以提供最优的服务体验。其次，用户有多种选择，即可以自己搭建DID服务，也可以使用三方的DID服务，或者同时使用多个DID服务，并且能够在多个服务之间进行切换。

### 2.3 核心流程
all方法的创建、解析、更新和撤销DID等操作全部使用https方法，核心流程如下：

![all方法核心流程](/images/did-all-core-flow.png)

1. 用户A首先从区块链等分布式存储中读取all方法三方服务域名列表，或者使用自建DID服务。

2. 创建DID和DID文档，选择其中一个或多个节点，发起HTTP请求，托管DID文档。

3. 用户B也从区块链等分布式存储中读取all方法服务域名列表。

4. 使用轮询或并发查询的方式，从服务域名节点中，查询DID文档。


## 3. DID文档设计
当前版本的DID文档并没有用到W3C所有的字段，我们的DID文档目前是W3C规范的一个子集。  

DID文档示例：
```json
{
  "@context": "https://www.w3.org/ns/did/v1",
  "id": "did:all:14qQqsnEPZy2wcpRuLy2xeR737ptkE2Www@example.com:443",
  "verificationMethod": [
    {
      "id": "did:all:14qQqsnEPZy2wcpRuLy2xeR737ptkE2Www@example.com:443#keys-1",
      "type": "EcdsaSecp256r1VerificationKey2019",
      "controller": "did:all:14qQqsnEPZy2wcpRuLy2xeR737ptkE2Www@example.com:443",
      "publicKeyHex": "04b11e73474896ad9e4b1a2d5a1190d5b25a916eb62f3d1db155bb64dc046bfb3868457a1912c8f9fcd603ff5b1078f883f6bf6b9f0dee60bad9e57e7fec9b439d"
    }
  ],
  "authentication": [
    "did:all:14qQqsnEPZy2wcpRuLy2xeR737ptkE2Www@example.com:443#keys-1"
  ],
  "service": [
    {
      "id": "did:all:14qQqsnEPZy2wcpRuLy2xeR737ptkE2Www@example.com:443#communication",
      "type": "messageService",
      "router": "did:all:14qQqsnEPZy2wcpRuLy2xeR737ptkE2Www@example.com:443",
      "serviceEndpoint": "wss://example.com/endpoint"
    },
    {
      "id": "did:all:14qQqsnEPZy2wcpRuLy2xeR737ptkE2Www@example.com:443#didservice",
      "type": "didDocumentService",
      "serviceEndpoint": ["https://example.com/endpoint","https://example.com/endpoint"]
    }
  ],
  "proof": {
    "type": "EcdsaSecp256r1Signature2019",
    "created": "2024-05-27T10:51:55Z",
    "proofPurpose": "assertionMethod",
    "verificationMethod": "did:all:14qQqsnEPZy2wcpRuLy2xeR737ptkE2Www@example.com:443#keys-1",
    "proofValue": "z58DAdFfa9SkqZMVPxAQpic7ndSayn1PzZs6ZjWp1CktyGesjuTSwRdoWhAfGFCF5bppETSTojQCrfFPP2oumHKtz"
  },
  "deprecation": {
    "status": "deactivated",
    "newDid": "did:example:new123456789"
  }
}
```

下面重点介绍下在all方法中各个字段的用法。

### 3.1 Id
示例："did:all:14qQqsnEPZy2wcpRuLy2xeR737ptkE2Www@example.com:443"

- did：是DID前缀，表示去中心化标识符（Decentralized Identifier）；

- all：是did方法，指定了DID的解析和操作规则；

- 14qQqsnEPZy2wcpRuLy2xeR737ptkE2Www：是唯一标识符，生成方式类似比特币地址生成。

- @example.com:443：可选字段，表示这个为此DID提供文档托管服务的域名和端口。DID持有者可以选择自建服务、或者一个三方服务来托管文档，也可以不填写此字段，表示使用区块链中记录的三方服务。端口可选，如果端口不携带，则使用默认端口http与https端口。

did唯一标识符根据公钥（即verificationMethod中的publicKeyHex）生成，可以保证文档不可篡改性。生成过程如下：

1. 生成私钥

   使用安全的随机数生成器生成一个256位（32字节）的私钥。

2. 生成公钥

   使用椭圆曲线数字签名算法（ECDSA）和Secp256r1曲线对私钥进行加密，生成公钥。公钥采用未压缩格式（前缀为0x04，后跟x和y坐标）。

3. 计算公钥哈希

   对公钥进行以下两步哈希运算：

   - 使用SHA-256算法对公钥进行哈希，生成SHA-256哈希值。

   - 使用RIPEMD-160算法对SHA-256哈希值进行哈希，生成公钥哈希。

4. 添加网络前缀

   在公钥哈希前面添加一个字节的版本号，表示地址类型。使用0x00。

5. 计算校验和

   对上述结果进行以下两步SHA-256哈希运算，取前4个字节作为校验和。

6. 生成id

   将版本号+公钥哈希+校验和连接起来，然后使用Base58Check编码生成最终的id。

### 3.2 verificationMethod
verificationMethod包含用于验证签名的公钥信息，在W3C标准中，这个字段可以由多个，我们暂时只有一个，且controller字段就是自身。

- id: 公钥的唯一标识符。

- type: 公钥类型，这里使用的是EcdsaSecp256r1VerificationKey2019。暂时支持这一个方法。

- controller: 控制该公钥的DID，目前填写DID文档的did。

- publicKeyHex: 公钥的十六进制编码。

### 3.3 authentication
authentication表示鉴权使用的verificationMethod方法id，在我们的方法中暂时只填写上面的verificationMethod字段id。

### 3.4 service
service在DID文档中用于表达与DID主体或关联实体进行通信的方式。服务可以是DID主体想要宣传的任何类型的服务，包括去中心化身份管理服务，以便进一步发现、身份验证、授权或交互。

我们目前有两个核心的service定义：

- messageService

  - 消息服务，如果另外一个用户想和这个用户通信，可以使用service中的serviceEndpoint发送消息。

  - serviceEndpoint目前是一个WSS链接，暂时不支持其他协议。WSS通信协议设计详细将端到端加密设计文档。

  - router是我们自定义的字段，它的值是一个DID。这个字段对于高并发系统非常重要，用于表示一个DID所属的router DID。当一个系统向一个三方消息服务发起WSS连接时，它有可能在这个连接上同时接受多个用户的消息，这个时候如果把所有用户一次注册，可能会导致整个过程耗时过长。这个时候可以指注册router，消息服务会自动将router对应的DID和WSS连接关联起来。

- didDocumentService

  - 可选字段，表示这个DID文档所托管的服务端点，可以用多个。

  - 作用让DID验证者校验DID文档和DID服务商是否匹配，比如检测DID服务商是否通过非法手段获取未被授权的DID文档。

### 3.5 proof
proof保存对DID文档的签名信息，用于进行DID文档完整性校验。详细定义：https://www.w3.org/TR/vc-data-integrity/#defn-domain

- type: 签名类型，这里使用的是EcdsaSecp256r1Signature2019。定义在文档 https://www.w3.org/TR/vc-data-model/ 中。

- created: 签名的创建时间，ISO 8601格式的UTC时间字符串。

- proofPurpose: 签名的用途，这里指定为assertionMethod。

- verificationMethod: 用于验证签名的验证方法id，对应verificationMethod字段中的id。

- proofValue: 签名值。

签名值生成过程:

- 构造DID文档的所有字段，proof中的proofValue字段除外。

- 将待签名的DID文档转换为JSON字符串，使用逗号和冒号作为分隔符，并按键排序。

- 将JSON字符串编码为UTF-8字节。

- 使用椭圆曲线数字签名算法（EcdsaSecp256r1Signature2019）和SHA-256哈希算法，对字节数据进行签名。

- 将生成的签名值 proofValue 添加到DID文档proof字典的proofValue字段中。
```python
# 1. 创建DID文档的所有字段，排除proofValue字段
did_document = {
    "id": "did:example:123456789abcdefghi",
    # 其他必要的字段
    "proof": {
        "type": "EcdsaSecp256r1Signature2019",
        "created": "2024-05-27T10:51:55Z",
        "proofPurpose": "assertionMethod",
        "verificationMethod": "did:example:123456789abcdefghi#keys-1"
        # proofValue 字段除外
    }
}

# 2. 将DID文档转换为JSON字符串，按键排序，并使用逗号和冒号作为分隔符
did_document_str = JSON.stringify(did_document, separators=(',', ':'), sort_keys=True)

# 3. 将JSON字符串编码为UTF-8字节
did_document_bytes = UTF8.encode(did_document_str)

# 4. 使用私钥和ECDSA算法对字节数据进行签名
signature = ECDSA.sign(did_document_bytes, private_key, algorithm=SHA-256)

# 5. 将签名值添加到DID文档的proof字段中
did_document["proof"]["proofValue"] = Base64.urlsafe_encode(signature)
```

### 3.6 deprecation
这个是自定义字段，用于表示DID是否被废弃。  
如果DID文档存在该字段，且status值为deactivated，则说明此DID文档被废弃。如果newDid存在，则是此DID对应的新的DID。

## 4. DID文档验证
根据DID文档生成过程，DID文档验证过程如下：

1. 确认DID的正确性。

2. 提取公钥：从DID文档中提取与verificationMethod字段匹配的公钥。目前仅有一个值。

3. 根据DID生成过程，验证DID与公钥对应关系。

4. 根据签名的生成过程，验证签名的正确性。  
由此，只要DID正确，就可以校验DID文档是否完整，是否被篡改。

## 5. DID http接口

### 5.1 鉴权过程
如果一个用户使用的是自己搭建的DID server，可以选择不对请求鉴权，否则调用者需要向多个平台申请API key。

#### 5.1.1 HTTP 请求参数
服务支持标准的 HTTP 调用。  
请求头

- Content-Type: application/json

- Authorization: 支持 API Key 和 token 两种鉴权方式

#### 5.1.2 HTTP 用户鉴权
在调用接口时，支持两种鉴权方式：

1. 传 API Key 进行认证

2. 传鉴权 token 进行认证

##### 5.1.2.1 获取 API Key
登录DID服务商 API Keys 页面获取最新版生成的用户 API Key。 API Key 同时包含 “用户标识 id” 和 “签名密钥 secret”，即格式为 {id}.{secret}。

##### 5.1.2.2 使用 API Key 进行请求
用户需要将 API Key 放入 HTTP 的 Authorization header 头中。  
Example：curl请求中的API key参数示例
```bash
curl --location 'https://open.bigmodel.cn/api/paas/v4/chat/completions' \
--header 'Authorization: Bearer <你的apikey>' \
--header 'Content-Type: application/text' \
--data '{
  "@context": "https://www.w3.org/ns/did/v1",
  "id": "did:all:14qQqsnEPZy2wcpRuLy2xeR737ptkE2Www@example.com:443",
  ......
}'
```

##### 5.1.2.3 使用 JWT 组装 Token 后进行请求
用户端需引入对应 JWT 相关工具类，并按以下方式组装 JWT 中 header、payload 部分。

1. **header 示例**

   ```json
   {"alg": "HS256","sign_type": "SIGN"}
   ```
   - **alg**: 属性表示签名使用的算法，默认为 HMAC SHA256（写为HS256）。
   - **sign_type**: 属性表示令牌的类型，JWT 令牌统一写为 SIGN 。

2. **payload 示例**

   ```json
   {"api_key": "{ApiKey.id}","exp": 1682503829130,"timestamp": 1682503820130}
   ```
   - **api_key**: 属性表示用户标识 id，即用户API Key的 {id} 部分。
   - **exp**: 属性表示生成的JWT的过期时间，客户端控制，单位为毫秒。
   - **timestamp**: 属性表示当前时间戳，单位为毫秒。

**Example**: Python 语言中的鉴权 token 组装过程

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

3. **将鉴权 token 放入 HTTP 请求的 header 中**
用户需要将生成的鉴权 token 放入 HTTP 的 Authorization header 头中：
- Authorization: Bearer <你的token>
Example：curl请求中的token参数示例
```bash
curl --location 'https://open.bigmodel.cn/api/paas/v4/chat/completions' \
--header 'Authorization: Bearer <你的token>' \
--header 'Content-Type: application/json' \
--data '{
  "@context": "https://www.w3.org/ns/did/v1",
  "id": "did:all:14qQqsnEPZy2wcpRuLy2xeR737ptkE2Www@example.com:443",
  ......
}'
```

### 5.2 创建DID文档
- 请求方法：POST
- 请求URL：https://example.com/v1/did
- 请求头：
  - Content-Type: application/text
- 请求体：包含DID文档的JSON表示
请求体示例  
```json
{
  "@context": "https://www.w3.org/ns/did/v1",
  "id": "did:all:14qQqsnEPZy2wcpRuLy2xeR737ptkE2Www@example.com:443",
  ......
}
```

### 5.3 更新DID文档
- 请求方法：PUT
- 请求URL：https://example.com/v1/did
- 请求头：
  - Content-Type: application/text
- 请求体：包含需要更新的完整DID文档的JSON表示
备注：更新DID文档的特定字段，可以废弃DID文档

### 5.4 查询DID文档
- 请求方法：GET
- 请求URL：https://example.com/v1/did/{did}
- 请求头：
  - Accept: application/text
### 5.5 删除DID文档
- 请求方法：DELETE
- 请求URL：https://example.com/v1/did/{did}
- 请求头：
  - Authorization: Bearer <token>

## 6. 异常流程
DID文档对应的私钥至关重要，如果私钥发生泄漏，会导致DID文档不安全、伪造DID文档、端到端加密安全性降低等严重问题。虽然后面我们可以慢慢添加保护机制比如多重签名等，但是整个系统能够支持DID更新至关重要。

如果用户发现did私钥发生泄漏，可以向DID服务商发送修改DID请求，将DID文档状态更改为废弃，并且设置新申请的DID。同时，通过DID消息服务，通知和此DID有关联的其他DID更新DID文档。

同时，在下个版本我们计划增加多重签名机制，让DID文档安全性更加强大。

## 参考文献
[1] W3C DID(Decentralized Identifier)规范，[https://www.w3.org/TR/did-core/](https://www.w3.org/TR/did-core/)

[2] TLS(Transport Layer Security)1.3规范，[https://www.rfc-editor.org/info/rfc8446](https://www.rfc-editor.org/info/rfc8446)

[3] W3C DIDs：拆解权力结构的数字身份标准，[https://yurenju.blog/posts/2024-01-01_w3c-dids-redefining-identity-authority/](https://yurenju.blog/posts/2024-01-01_w3c-dids-redefining-identity-authority/)

## 版权声明  
Copyright (c) 2024 ANP Community  
本文件依据 [MIT 许可证](./LICENSE) 发布，您可以自由使用和修改，但必须保留本版权声明。  
