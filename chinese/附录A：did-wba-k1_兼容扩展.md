# 附录 A：did:wba `k1_` 兼容扩展

- 状态：已发布
- 版本：1.2
- 语言：中文

### A.1 适用范围

本附录定义 `k1_` 路径绑定 profile，用于兼容钱包生态和现有 secp256k1 实现。`k1_` 不属于主规范默认方案，新部署应当（SHOULD）优先使用主规范的 `e1_` profile。

### A.2 `k1_` 路径语法

当实现启用本附录时，路径型 DID 的最后一个 path segment 可以使用：

```plaintext
k1_<fingerprint>
```

附录 A 的 ABNF 扩展如下：

```abnf
k1-fingerprint = "k1_" 43base64url-char
wba-k1-path-did = "did:wba:" domain-name 1*(":" path-segment) ":" k1-fingerprint
```

示例：

```plaintext
did:wba:example.com:user:alice:k1_<fingerprint>
did:wba:example.com%3A3000:user:alice:k1_<fingerprint>
```

### A.3 `k1_` 指纹生成方法

`k1_` 指纹用于将路径型 DID 与 secp256k1 绑定公钥关联起来。其生成方法如下：

1. 选择 DID 绑定密钥。绑定密钥必须（MUST）同时满足以下条件：
   - 是一个 secp256k1 公钥；
   - 在 DID 文档中以 `publicKeyJwk` 形式表示；
   - 被 DID 文档的 `authentication` 关系授权。

2. 取该绑定密钥对应的 JWK 公钥对象，只保留 RFC 7638 要求的必要字段：

```json
{
  "crv": "secp256k1",
  "kty": "EC",
  "x": "...",
  "y": "..."
}
```

3. 按 [RFC 7638](https://www.rfc-editor.org/rfc/rfc7638) 的规则生成 JWK Thumbprint 输入：
   - 仅保留必要字段；
   - 字段名按字典序排序；
   - 使用无多余空白的 JSON 字符串；
   - 使用 UTF-8 编码。

4. 对第 3 步得到的 UTF-8 字节序列执行 SHA-256 哈希，得到 32 字节摘要值。

5. 对 32 字节摘要值进行 base64url 编码，并去掉尾部 `=` padding。编码结果长度固定为 43 个字符。

6. 在编码结果前面添加 `k1_` 前缀，得到最终路径段。

### A.4 `k1_` DID Document 约束

当 DID 使用 `k1_` profile 时，DID Document 至少必须满足：

1. `id` 与请求的 DID 完全一致；
2. `verificationMethod` 中至少存在一个 secp256k1 `publicKeyJwk` 作为绑定密钥；
3. 该绑定密钥必须（MUST）被 `authentication` 关系授权；
4. 该绑定密钥的 RFC 7638 thumbprint 必须（MUST）与 DID 路径最后的 `k1_` 指纹段完全一致。

推荐的 k1 绑定验证方法形状如下：

```json
{
  "id": "did:wba:example.com:user:alice:k1_<fingerprint>#key-1",
  "type": "EcdsaSecp256k1VerificationKey2019",
  "controller": "did:wba:example.com:user:alice:k1_<fingerprint>",
  "publicKeyJwk": {
    "crv": "secp256k1",
    "kty": "EC",
    "x": "...",
    "y": "...",
    "kid": "<fingerprint>"
  }
}
```

### A.5 `k1_` 的 DID Document proof（兼容扩展）

对于采用 `k1_` profile 的 DID，本附录定义一个**非标准、可选的 secp256k1 DID Document proof profile**，用于在钱包生态或现有 secp256k1 实现中提供 DID Document 完整性证明能力。

该 proof profile 不属于本规范主线定义的 W3C 标准互操作范围。实现方如果选择支持本节，则应按本节规则生成与验证 `k1_` DID Document proof；未支持本节的实现可以（MAY）忽略 `k1_` DID Document 中的 `proof` 字段。

#### A.5.1 proof 对象字段

当 `k1_` DID Document 包含顶层 `proof` 字段时，`proof` 对象包含以下字段：

- `type`：必须字段。固定为 `DataIntegrityProof`
- `cryptosuite`：必须字段。固定为 `didwba-jcs-ecdsa-secp256k1-2025`
- `created`：必须字段。proof 创建时间，采用 XML Schema datetime 格式
- `verificationMethod`：必须字段。完整 DID URL，指向 DID Document 中用于生成 proof 的 secp256k1 验证方法
- `proofPurpose`：必须字段。固定为 `assertionMethod`
- `proofValue`：必须字段。签名值，编码规则见本节后文
- `domain`：可选字段
- `challenge`：可选字段

额外约束：

1. 推荐（SHOULD）直接使用 `k1_` 绑定密钥作为 `proof.verificationMethod`，使 DID 绑定与文档完整性证明统一；
2. `proof.verificationMethod` 指向的验证方法，必须（MUST）与实际用于生成 `proofValue` 的私钥一一对应。

#### A.5.2 proof 生成流程

采用 `k1_` profile 且需要生成 DID Document proof 的实现，应按以下流程执行：

1. 复制待签名 DID Document，并移除顶层 `proof` 字段，得到 `unsecuredDocument`；
2. 构造 proof options 对象，包含：
   - `type`
   - `cryptosuite`
   - `created`
   - `verificationMethod`
   - `proofPurpose`
   - 可选 `domain`
   - 可选 `challenge`
3. 对 DID Document 和 proof options 分别进行 JCS 规范化；
4. 分别计算两者的 SHA-256 哈希值；
5. 将 `hash(proofOptions) || hash(document)` 进行拼接，得到待签名字节串；
6. 使用 `verificationMethod` 指向的 secp256k1 私钥对该字节串执行 ECDSA + SHA-256 签名，得到 DER 编码签名；
7. 将 DER 编码签名转换为固定长度 64 字节的 `R || S`；
8. 对 `R || S` 进行 base64url（无 padding）编码，写入 `proofValue`；
9. 将生成后的 `proof` 对象添加回 DID Document 顶层。

#### A.5.3 proof 验证流程

采用 `k1_` profile 且需要验证 DID Document proof 的实现，应按以下流程执行：

1. 读取 DID Document 顶层 `proof`；
2. 检查以下字段是否存在：
   - `type`
   - `cryptosuite`
   - `created`
   - `verificationMethod`
   - `proofPurpose`
   - `proofValue`
3. 检查：
   - `type` 是否为 `DataIntegrityProof`
   - `cryptosuite` 是否为 `didwba-jcs-ecdsa-secp256k1-2025`
   - `proofPurpose` 是否为 `assertionMethod`
4. 从 DID Document 中移除 `proof`，得到待验签文档；
5. 从 `proof` 中移除 `proofValue`，得到 proof options；
6. 对文档和 proof options 分别执行 JCS 规范化；
7. 分别计算 SHA-256 哈希，并拼接为：
   - `hash(proofOptions) || hash(document)`
8. 解析 `verificationMethod` 指向的 secp256k1 公钥；
9. 将 `proofValue` 做 base64url 解码，恢复 64 字节 `R || S`；
10. 将 `R || S` 转换为 ECDSA 验签可接受的签名表示；
11. 使用对应 secp256k1 公钥对拼接后的待验签字节串执行 ECDSA + SHA-256 验签；
12. 若验签成功，则 proof 验证通过；否则验证失败。

#### A.5.4 解析策略

对于 `k1_` DID，proof 校验默认是可选的增强完整性检查；但一旦本地策略启用 proof 校验，则必须（MUST）以 `proof.verificationMethod` 对应的 secp256k1 公钥同时完成 proof 校验与 DID 绑定校验。

实现可以（MAY）在以下两种模式中选择其一：

1. 宽松模式：若 DID Document 不含 `proof`，仍可继续解析；
2. 严格模式：若本地策略要求 `k1_` 文档必须携带 proof，则 DID Document 缺少 `proof` 时必须（MUST）视为验证失败。

如果实现启用了严格 proof 校验，则必须（MUST）额外检查：

1. `proof.verificationMethod` 指向的验证方法类型为 `EcdsaSecp256k1VerificationKey2019`；
2. 使用该验证方法对应的 secp256k1 公钥重新计算 RFC 7638 thumbprint，结果必须（MUST）与 DID 路径最后的 `k1_` 指纹段完全一致；
3. 不得以 DID Document 中其他未参与 proof 的 secp256k1 key 代替 `proof.verificationMethod` 完成绑定校验。

如果实现未声明支持 `didwba-jcs-ecdsa-secp256k1-2025`，则可以（MAY）忽略 `k1_` DID Document 中的该 proof。

说明：本附录定义的 `k1_` DID Document proof 是 did:wba 的兼容扩展，用于支持 secp256k1 绑定密钥场景下的文档完整性证明。该 proof profile 不属于 W3C 标准互操作 proof，主规范推荐的标准 proof 方案仍然是 `e1_` profile 下的 `DataIntegrityProof` + `eddsa-jcs-2022`。

### A.6 `k1_` 身份认证

当实现启用本附录时，`k1_` DID 可以用于 [ANP-02 第 3 章](02-ANP-基于DID的身份认证协议.md#http-binding)定义的跨平台 HTTP 身份认证流程，并遵守本附录的 WBA `k1_` 方法约束。

认证要求如下：

1. 默认情况下，客户端应当（SHOULD）使用 `k1_` 路径绑定的 secp256k1 绑定密钥进行签名；
2. `keyid` 必须（MUST）指向 DID 文档中的该 secp256k1 绑定验证方法；
3. 签名算法为 secp256k1 曲线上的 ECDSA + SHA-256；
4. 签名输出采用固定长度 `r || s` 字节串编码；
5. 服务端在验证时，必须（MUST）同时检查：
   - `keyid` 指向的验证方法存在；
   - 该验证方法位于 `authentication`；
   - 该验证方法的 thumbprint 与 `k1_` 指纹段一致。

### A.7 `k1_` DID Document proof 互操作性说明

本附录定义的是 did:wba 自身的 **`k1_` 兼容 proof profile**（见 A.5），用于在 secp256k1 绑定场景下提供可选的 DID Document 完整性证明能力。它不是 W3C 标准 `eddsa-jcs-2022` 主线 proof，而是 did:wba 的兼容扩展。

因此：

1. `k1_` DID Document 可以（MAY）不包含顶层 `proof`；
2. 如果实现启用了 proof 校验，则应按 A.5 的 `didwba-jcs-ecdsa-secp256k1-2025` 规则执行；
3. 如果实现未启用 proof 校验，则可以（MAY）忽略 `k1_` 文档中的该 proof；
4. 一旦启用 proof 校验，不得使用 DID Document 中其他未参与 proof 的 secp256k1 key 代替 `proof.verificationMethod` 完成绑定验证。

### A.8 `k1_` 创建、解析与更新

- 创建：生成 secp256k1 绑定密钥，计算 `k1_` 指纹段，并将 `did.json` 存储在对应路径下；
- 解析：除主规范通用解析流程外，额外按 A.3 和 A.4 验证 `k1_` 绑定关系；
- 更新：只要 `k1_` 绑定密钥不变，DID 本身保持不变；如果绑定密钥发生变化，则 DID 必须（MUST）变更；
- 停用：可通过停用旧 DID 并创建新 DID 的方式完成轮换；稳定引用关系由上层名称服务负责维护。
