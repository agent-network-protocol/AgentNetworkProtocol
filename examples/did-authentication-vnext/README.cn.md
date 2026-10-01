# ANP 1.2：ANP-02 与混合 DID 方法向量

状态：离线夹具与协议场景设计；不宣称 SDK 或产品已符合规范。

[English](README.md)

这些产物支持 [ANP-02](../../chinese/02-ANP-基于DID的身份认证协议.md)、WBA/Web 绑定和方法无关的[Messaging 1.2 规范集](../../chinese/message/README.md)。身份均使用保留的示例域名。密钥是确定性派生的公开测试材料，不是运行凭据。没有注册身份，也没有向后端发送请求。

| 产物 | 内容与证据边界 |
|---|---|
| [identities.json](identities.json) | 十份公开 DID 夹具：每种方法分别有普通 API、两名具备设备能力的 Agent、服务和群身份。活动 E1 文档有真实 proof 字节，原生 Web 文档没有 WBA Document proof。HTTPS 解析是受控前提，不是测试结果。 |
| [byte-vectors.json](byte-vectors.json) | 精确请求组件、payload/JCS 字节、签名基串、Ed25519 签名、E1/Object Proof 哈希与签名，以及 P5 ChaCha20-Poly1305 AAD/密文，附显式篡改输入。 |
| [scenario-vectors.json](scenario-vectors.json) | 阶段 A/B 的 setup/action/expected-outcome 输入，覆盖认证、WNS、消息/E2EE、扩展、连续性与准入。每个场景都明确标为尚未在 SDK 或产品上执行。 |
| [manifest.json](manifest.json) | 文件哈希、生成/检查命令与数量。数量表示产物数量，不是 SDK 测试通过数。 |
| [验证职责](../../chinese/message/02-身份与发现.md#method-validation) | DID 方法验证与消息 Profile 的身份、密钥用途和设备资格规则。 |

## 1. 复现与检查

在协议 worktree 根目录，使用 Node.js 22 或更新版本执行：

```sh
node scripts/generate-anp02-vectors.mjs
node scripts/check-anp02-vectors.mjs
```

第一条命令比较确定性重建与已保存文件，不写入文件。第二条检查哈希、夹具引用、选定的基础算法已知答案、签名/摘要/Object Proof/AEAD 字节、篡改拒绝和场景目录覆盖；SDK 与产品场景执行数报告为零。

有意修改向量并完成审阅后，可重新生成这些自有夹具：

```sh
node scripts/generate-anp02-vectors.mjs --write
```

固定时钟为 `2026-09-07T08:00:00Z`；测试使用场景时钟，不使用墙上时钟。密钥派生标签以 `ANP02-PUBLIC-TEST-ONLY:` 开头，生成的密钥不得用于测试之外。P5 消息密钥/nonce 是已建 Session 的受控输入：向量检查 AAD/AEAD 字节，不验证 X3DH、Ratchet 推进或设备准入。P6 绑定 proof 有真实签名，但不是完整编码的 MLS KeyPackage，也不是已执行的 MLS 群。

## 2. 认证与传输边界

`HTTP-*` 使用实际 HTTP 方法/目标/内容组件；`JSON-*` 使用已声明的 HTTP JSON 元数据绑定，摘要覆盖不含 `auth` 的 JCS payload；`ORIGIN-*` 使用未改变的 P1 Signed Request Object 与 `anp://` 目标映射。这些签名不能互换。

字节负向向量改变已准备的签名输入或签名，并验证密码学完整性失败。协议场景独立检查字段解析、方法证据、用途授权、时间/重放状态和业务权限。字节检查不建立这些有状态条件。原生 Web 没有 Document proof 时，仍必须完成必需的 Bundle、控制 origin proof、MLS 和消息认证。

## 3. 场景适配器合同

本组夹具有意选用 Ed25519、Multikey 和 JWK，以演示相应能力下的互操作；这不新增 ANP-02 的通用最低算法或表示要求。按实现已声明支持的能力选择适用场景。JWT 的 issuer/audience/scope 场景明确选择了示例 Token 策略及错误映射；只有实现采用该策略时才适用，不要求所有 ANP-02 实现使用这些字段或策略。WBA E1 与所选 E2EE Profile 的既有密码学要求仍有效。

认证相关场景已标注 `applicability: illustrative-implementation-policy-not-additional-anp02-conformance`。其中的重放边界、缓存、Resolver、凭据选择、错误映射、摘要及 Token 策略是示例选择，不补充 ANP-02 的规范要求，也不要求现有实现改变行为。存在未被原文规定的具体条件时，应按ANP-02 1.2 和实现既有策略解释，不用场景预期结果反推协议。正文原样提取也保留原 JWT 日期字符串示例；本目录 NumericDate 夹具属于选定 JWT 示例，不通过测试向量强制修改现有 Token。

每个场景包含：

- `input`：引用的身份/字节夹具与受控初始状态；
- `actions`：要执行的精确修改或所属 Profile 流程；
- `expected`：在该场景适用范围和所选策略下的拒绝、接受、可信度或状态副作用边界；
- `normative_refs`：拥有这些要求的规范；
- `execution_status`：本阶段 P 目录始终为 `design-only-not-run-against-sdk-or-product`。

适配器必须在施加负向修改前建立合法基线。若测试后续验证层而修改了 WBA 文档，应使用测试根密钥重新生成 E1 proof，以隔离目标验证层。专门测试 E1 无效证据时不得修复它。MLS 场景先用给定精确绑定构造合法套件 KeyPackage/Leaf 和群状态，再执行指定修改；离线绑定字节本身不提供该状态。

WNS 场景分别沿用原方案：WBA 保留同域限制、公开精确 Handle 和私密 Provider 确认；Web 保留正向 DID 与 HTTPS Provider 域声明检查，不强制反向端点解引用或弱绑定迁移。示例中的 `legacy-domain-binding-accepted` 只是测试预期标签，不是新增 wire 结果，也不表示精确 Handle 已验证。普通 API 夹具有意省略 Handle、service 和设备 Manifest。完整消息场景覆盖 WBA→WBA、WBA→Web、Web→WBA、Web→Web 的私聊、群聊、P5/P6、普通/加密私聊及群聊附件、普通/加密 Mention，并独立改变服务身份与 caller anchor 的方法。

SDK/产品 runner 应在其自有证据中记录真实结果，不把本目录的设计状态改写为运行通过。方法解析、TLS/缓存、并发、持久化、撤销、MLS、对象存储和用户可见行为仍由阶段 A/B 执行。未启用方法负例有意拒绝 WebVH，不代表已有 WebVH 实现。

> 目录保留 `-vnext` 名称以兼容既有路径。引用已指向 1.2 文档；P6 仍为候选，稳定版仍待完成 MLS ExtensionType 注册发布门槛。

## 版权声明

Copyright (c) 2024 ANP 开源社区
本文件依据 [Apache License 2.0](../../LICENSE) 发布，您可以自由使用和修改，但必须保留本版权声明。
