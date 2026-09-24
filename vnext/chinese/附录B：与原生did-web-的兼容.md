# 附录 B：原生 did:web 集成

- 状态：草案 / 未发布
- 英文镜像：[Native did:web Integration](../appendix-b-compatibility-with-native-did-web.md)
- 历史基线：[已发布兼容附录](../../chinese/附录B：与原生did-web-的兼容.md)，保留原文

## B.1 范围与归属

本候选附录是原生 Web 身份接入 DID 方法无关 ANP 合同的入口，不定义另一套认证或消息协议。主体保留 `did:web` 身份，无需转换为 WBA。

| 合同 | 规范性拥有者 |
|---|---|
| Web 身份输入与请求认证 | [ANP-02 Web 绑定](02-ANP-基于DID的身份认证协议.md#web-binding)及通用认证 |
| WBA 特有 Document 验证 | [ANP-03 方法规则](03-did-wba方法规范.md) |
| Handle 正反向绑定与状态 | [ANP-04 WNS](04-ANP-基于DID-WBA的命名空间规范.md#binding-verification) |
| 消息身份、设备与服务 | [消息 P2](message/02-身份与发现.md) |
| 原发者与对象证明绑定 | [消息 P1](message/01-核心绑定.md) |
| 私聊/群聊 E2EE 与扩展 | 所选 P5/P6/P7/P9 Profile 及其依赖 |

## B.2 方法验证

消费 Web 身份材料前，验证者 MUST 执行 ANP-02 的 Web 绑定。WBA E1/K1 指纹和 WBA 特有的 Document proof 要求不适用于原生 Web。该方法差异不免除所选 ANP Profile 要求的任何用途授权、对象签名、设备资格或消息认证。

## B.3 认证集成

Web 和 WBA 调用方使用 ANP-02 相同的 HTTP 组件、摘要、签名、挑战、重放和可选 Token 规则。普通 API 不要求 Handle 或 `deviceManifest`。消息 P1 增加应用原发者上下文，P8 使用实际 HTTP 服务跳认证。服务跳签名成功不建立业务发送者的 origin proof。

<a id="legacy-web-handle"></a>
## B.4 Handle / WNS 集成（沿用原方案）

以下保留原兼容附录 B.4 的正文。该方案确认 Handle 的正向 DID 映射与 DID 对 Provider 域的声明，不要求精确端点解引用，也不自动得到 WBA 主线的 `exact-handle` 或私密端点 `provider-confirmed` 结果。本次不新增 Web 弱绑定迁移、WBA 跨域 Handle 或 Provider 管理要求。

原生 `did:web` 可以兼容 did:wba 的 Handle / WNS 体系。

当 `did:web` DID Document 在 `service` 中声明 `ANPHandleService` 时，验证者可以（MAY）按 [04-ANP-基于DID-WBA的命名空间规范](../../chinese/04-ANP-基于DID-WBA的命名空间规范.md) 的 v1 规则，对其执行双向绑定验证：

1. 通过 Handle Resolution Endpoint 解析 Handle，获得 DID；
2. 解析该 DID；
3. 在 DID Document 中查找 `ANPHandleService`；
4. 提取 `ANPHandleService.serviceEndpoint` 的 scheme 与 domain；
5. 验证 `serviceEndpoint` 使用 `https`，且其 domain 与输入 Handle 的 domain 一致。

在兼容模式下，`ANPHandleService.serviceEndpoint` 的作用与 WNS v1 保持一致：它主要用于声明该 DID 主体所使用的 Handle Provider domain，而不是要求声明某个精确的 Handle Resolution Endpoint。

因此，对原生 `did:web` 的反向绑定校验：

- 只比较 `ANPHandleService.serviceEndpoint` 的 domain 与输入 Handle 的 domain；
- 不要求 `serviceEndpoint` 的 path 与某个具体 Resolution Endpoint 完全一致；
- 不要求 `serviceEndpoint` 必须精确等于 `https://{domain}/.well-known/handle/{local-part}`；
- 可以使用对应 Handle 的 Resolution Endpoint，也可以使用同一 domain 下其他稳定 HTTPS URL。

对于原生 `did:web`，双向绑定验证只依赖：

- Handle → DID 的解析结果；
- DID Document 中 `ANPHandleService` 对 Name Service domain 的声明；

而**不需要**执行 did:wba 的 `e1_` / `k1_` 指纹绑定检查。

## B.5 E2EE 集成

Web 设备使用经方法验证的 Document 和当前 P2 Manifest，再执行与 WBA 设备相同的 P5/P6 验证。仅有 `keyAgreement` 条目不表示支持多设备 E2EE。所选套件、完整 Profile 依赖集、精确设备/密钥引用及当前资格 MUST 齐备。

P5 Bundle Object Proof、X3DH-like 输入、Session/AAD/AEAD 认证及重放检查仍按 P5 要求执行。P5 MTI 密文不增加额外 origin signature 要求。P6 `did_wba_binding` 保留为方法无关的 DID/设备与 MLS 绑定的现有 wire 字段名；其 Object Proof、嵌入扩展、KeyPackage/Leaf 签名、credential 身份、套件与群状态检查仍分别必需。没有 WBA 专属 Document proof 从来不是省略这些对象或 MLS 检查的理由。

## B.6 服务、附件与 Mention

服务选择遵循 P2 的已验证 `ANPMessageService`、声明 Profile 和安全能力。联邦需要认证服务时，独立于 Agent DID，按服务 DID 的方法解析并验证声明的 `serviceDid`。主体不能通过填写他人的端点获得托管权威或本域账号权限。

P7 普通/加密附件和 P9 Mention payload 对 WBA/Web 使用相同组合规则。完整 payload 的签名/AEAD 覆盖、对象授权、未知扩展处理和禁止降级规则仍归所选 Profile，不增加 Web 专属附件或 Mention wire 格式。

## B.7 连续性与证据

当前 Handle 解析和当前 DID 认证不建立跨 DID 权限迁移。本候选规范的 P2 没有注册 Web 自动迁移验证 Profile。同 DID 密钥更新与跨 DID 变化 MUST 分开处理；群角色、附件授权和 E2EE 状态需要各自有效的连续性与迁移合同。

[混合方法草案向量](../../examples/did-authentication-vnext/README.cn.md)覆盖合同边界，并标明哪些用例仍是 SDK/产品执行的设计输入。候选规范发布不等于实现符合性或生产上线。

## 版权声明

Copyright (c) 2024 ANP 开源社区
本文件依据 [Apache License 2.0](../../LICENSE) 发布，您可以自由使用和修改，但必须保留本版权声明。
