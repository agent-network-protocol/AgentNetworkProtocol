# ANP Messaging 1.2 Profile 索引

- 状态：已发布规范目录；P6 稳定版仍受发布门槛约束
- 规范集：ANP Messaging 1.2
- 范围：同一 Agent DID 下的 DID 定址 Base 消息与多设备密码学 Overlay
- 英文镜像：[ANP Messaging 1.2](../../message/README.md)

## 1. 版本边界

本目录中的文档组成 ANP Messaging 1.2 规范集，替代原有 1.1 文档基线。P6 全文纳入本目录，但在完成稳定 MLS ExtensionType 注册发布门槛前保留候选状态；纳入本目录不代表 P6 v2 已达到稳定互操作发布状态。

- **Profile 主版本**标识一个独立协商的 wire contract，例如 `anp.direct.base.v1` 或 `anp.direct.e2ee.v2`。
- **Messaging 规范集版本**标识一次协同发布的文档与目录。ANP Messaging 1.2 有意同时包含 v1 与 v2 Profile 标识。
- 各 Profile 拥有独立生命周期。依赖一个新 Profile，不要求依赖链中的其它 Profile 锁步升级主版本。
- P1、P2、P3、P7、P8 与 P9 Mention binding 保持 v1 contract。P4 使用 v2，因为删除 Handle-backed 成员模式和公开换绑方法，并增加由 Host 协调的 DID 更新，会改变其 wire contract 和状态机。
- P5 Direct E2EE 与 P6 Group E2EE 使用 v2，因为其多设备 wire contract 和密码学状态机与 v1 不兼容。
- Agent DID 仍是业务身份。Messaging 1.2 只在 Profile 要求该 DID 下的密码学设备端点时引入 `device_id`。
- 普通非 E2EE 私聊、群聊、Mention 和附件操作保持 DID 定址，不要求也不携带设备 selector。这些操作的设备 fan-out 由接收 DID 所属域在本地完成。
- 设备定址的安全操作要求其 Profile 声明的完整依赖集和有效当前 `deviceManifest`，即使 DID 只有一台设备也一样。Base 操作不要求 Manifest，也不合成设备。
- `meta.profile` 是请求解释和能力协商的唯一版本依据。已废弃的 `meta.anp_version` 不选择也不隐含任何 Profile 集。
- 实现不得（**MUST NOT**）从 v1 依赖推断支持 P5/P6 v2、为 v1 对端虚构设备，或把 v2 E2EE 请求/会话静默降级到 v1。

规范发布不代表 SDK、服务或产品已经实现。实现只能宣告实际支持的能力，并遵守各 Profile 的状态和发布限制。

## 2. Profile 集

| Profile | 标识 | 文档 | Messaging 1.2 主要职责 |
| --- | --- | --- | --- |
| P1 | `anp.core.binding.v1` | [核心绑定](01-核心绑定.md) | 通用 DID 元数据、条件式设备 selector、签名绑定、能力协商、幂等和共享错误 |
| P2 | `anp.identity.discovery.v1` | [身份与发现](02-身份与发现.md) | 面向设备定址安全 Profile 的经方法保护的 `deviceManifest`、key 引用、资格和发现 |
| P3 | `anp.direct.base.v1` | [私聊基础语义](03-私聊基础语义.md) | 一次 DID-to-DID 普通投递、DID 级接受和消息关联 |
| P4 | `anp.group.base.v2` | [群组基础语义](04-群组基础语义.md) | DID-only 成员关系、Host 协调的成员 DID 更新、治理、发送和 DID 定址通知 |
| P5 | `anp.direct.e2ee.v2` | [私聊端到端加密](05-私聊端到端加密.md) | 设备绑定 PreKey、Session、Ratchet、AAD、重放状态和 Mailbox |
| P6 | `anp.group.e2ee.v2` | [群组端到端加密](06-群组端到端加密.md) | 同一成员 DID 的多个独立设备 Leaf；候选状态，待完成 MLS code point 注册 |
| P7 | `anp.attachment.v1` | [附件与对象传输](07-附件与对象传输.md) | DID 定址的 manifest、对象控制与 Bearer Ticket 流程；加密 object key 分发继承 P5/P6 |
| P8 | `anp.federation.relay.v1` | [联邦与跨域](08-联邦与跨域.md) | 仅在外层 Profile 声明设备定址时保留 selector 并校验资格 |
| P9 | v1 binding 扩展 | [消息 Mention 扩展](09-消息Mention扩展.md) | 保持 Mention target 为 DID / group selector，并让不变的 payload 与 P4 v2 或 P6 v2 组合 |

实现可以通过 capability discovery 声明私有 Profile，但私有 Profile 不会因为承载 ANP
消息或使用 ANP discovery 方法而成为 ANP Messaging 规范集合的一部分。尤其是 `anp.*`
命名空间之外的标识符，仍由对应实现自行拥有和定义。

E2EE v2 有意采用混合版本依赖链：

```text
anp.direct.e2ee.v2
  -> anp.core.binding.v1
  -> anp.identity.discovery.v1
  -> anp.direct.base.v1

anp.group.e2ee.v2
  -> anp.core.binding.v1
  -> anp.identity.discovery.v1
  -> anp.group.base.v2
```

## 3. 混合版本能力声明

同时支持普通 v1 消息和多设备 E2EE v2 的服务可以声明：

```json
{
  "supported_profiles": [
    "anp.core.binding.v1",
    "anp.identity.discovery.v1",
    "anp.direct.base.v1",
    "anp.group.base.v2",
    "anp.attachment.v1",
    "anp.federation.relay.v1",
    "anp.direct.e2ee.v2",
    "anp.group.e2ee.v2"
  ]
}
```

这是一组合法能力，不要求存在 Direct Base、Attachment 或 Federation v2。每个具体请求仍只选择一个 Profile：普通私聊使用 Direct Base v1，加密私聊使用 Direct E2EE v2，普通群聊使用 Group Base v2，加密群聊使用 Group E2EE v2。

## 4. Profile 版本规则

只有旧实现无法安全处理新 contract 时才升级 Profile 主版本，包括新增必填 wire 字段，删除或重命名字段，改变字段含义，改变签名或 AAD 覆盖范围，改变幂等键或状态机，以及改变安全模式语义。

澄清既有语义、增加明确既有边界的禁止性说明、修复示例、增加与新 Overlay 的组合说明、增加向后兼容的可选扩展，以及修复文档内部不一致，都不改变 Profile 主版本。

Profile wire 标识只使用 `.v1`、`.v2` 这样的主版本。1.1、1.2 等小版本属于 Messaging 规范集，**MUST NOT** 出现在 Profile wire 标识中。

## 5. 共享决策

所有 Messaging 1.2 Profile 统一采用以下解释：

1. Agent DID 是 Base 消息的 wire 身份与地址。`device_id` 是由 Profile 自主声明的可选密码学端点 selector；它在出现时不透明，在所属 DID 的设备命名空间内唯一，且不是 Device DID、业务成员、角色、硬件标识或 `target.kind`。
2. `deviceManifest` 是宣告设备定址安全 Profile 的 DID 之完整当前公开设备集合，内嵌于经方法验证的 DID Document，不具有独立 endpoint、proof、epoch、hash 或 CAS 协议。仅 Base 发现不要求它。
3. Manifest 条目只包含 `device_id`、`signing_key_id`、`e2ee_key_id` 和 `profiles[]`；严禁包含产品域内角色、token、Registry 状态、恢复状态和私钥。
4. P3、P4、P7 普通流程与 P9 payload 语义只使用业务 DID 或 Group DID，**MUST NOT** 要求或携带 `sender_device_id`、`recipient_device_id` 或 `requester_device_id`。P5/P6 拥有 E2EE 所需的设备 selector，业务目标仍位于 `meta.target.did`。
5. 继续复用现有 `anp-rfc9421-origin-proof-v1` 和 Data Integrity proof scheme；P5/P6 的 `.v2` Profile ID 不会自动创建 proof v2。Base Profile 认证 sender DID。P5/P6 设备字段 **MUST** 受所属 Overlay 定义的 authenticated context 覆盖：当该操作使用 `auth.origin_proof` 时，proof key 必须匹配选中的 Manifest 条目；P5 MTI 密文发送则通过设备对 Session 和经认证 AAD 绑定 selector。
6. ANP 不公开部署私有的 `document_version`、`document_hash` 或 checkpoint 字段；资格可能变化时，调用方重新 resolve 当前经方法验证的 DID Document。
7. 在设备定址安全 Profile 中，每台设备分别持有签名/E2EE 私钥、PreKey、Direct Ratchet State、MLS 私有状态和重放状态，禁止在设备间复制。
8. 已从其 DID `deviceManifest` 移除的设备不得用原 `device_id` 或设备 key 原地恢复；重新注册必须使用新 ID 和新 key。这是身份作用域且永久的，**MUST NOT** 与 Overlay 作用域的端点变化混淆，例如 P6 把某台设备的 MLS leaf 从某个群移除：仍然是当前合格 Manifest 条目的设备保留其 `device_id`，并可用新的密码学材料重建该 Overlay 端点。
9. P6 保留候选状态，暂用私用 MLS ExtensionType `0xF0A1` 承载强制 LeafNode 设备绑定；该值不是 IANA 分配，取得稳定注册 code point 是发布 gate。
10. 新请求省略已废弃的 `meta.anp_version`。接收方只可为兼容或诊断保留该字段，且 **MUST NOT** 用它选择 Profile 或推断支持某个 Profile 集。
11. Messaging wire identity 只使用完整 DID。人类可读名称及名称解析位于 Messaging wire protocol 之外，不定义成员关系或授权连续性。
12. 对方法特定的 DID 迁移，调用方和服务从此前可信的 DID 出发验证已注册的迁移链，并由所属业务策略使用得到的 assurance。仅凭 `alsoKnownAs` 或相同路径不能授权连续性。
13. P4 v2 只保存成员当前 DID 和普通成员元数据。经验证或业务策略接受的 Agent DID 迁移更新同一内部成员记录并产生 `member-did-updated`，不会重写历史消息、回执、签名或 DID。
14. 通用 DID 请求认证遵循 [ANP-02](../02-ANP-基于DID的身份认证协议.md)，消息绑定遵循 P1，DID 方法验证遵循 P2。`did:wba` 与 `did:web` 使用相同的消息规则、字段和签名/AAD 格式。

## 6. 阅读与评审顺序

先读 ANP-02 通用身份与认证，再读 P1/P2、Direct 的 P3/P5、Group 的 P4/P6、P7/P8/P9，最后按需阅读不属于本 ANP 目录的独立实现扩展。评审时应同时检查中英文文件；任何字段、依赖、错误名或示例不一致都属于规范缺陷。

多设备示例集中在 [examples/message-vnext](../../examples/message-vnext/README.cn.md)。

## 版权声明

Copyright (c) 2024 ANP 开源社区
本文件依据 [Apache License 2.0](../../LICENSE) 发布，您可以自由使用和修改，但必须保留本版权声明。
