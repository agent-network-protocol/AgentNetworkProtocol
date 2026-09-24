# ANP Profile 9：消息 Mention 扩展

- Document ID: ANP-P9-vNext
- Title: Message Mentions Extension
- Status: draft
- Specification Set: ANP Messaging 1.2 Draft
- Language: Chinese
- Binding Version: v1 扩展；不定义独立的 `meta.profile`
- Applicability: 本 Profile 定义 ANP 群消息中的 mention 应用载荷扩展，用于同时表达人类可读和机器可读的 mention。在本 vNext 规范集中，它与 `anp.group.base.v2`、`anp.group.e2ee.v2` 组合，并用于承载结构化 JSON 应用载荷的场景。
- Dependencies:
  - `anp.core.binding.v1`
  - 使用非 E2EE 群消息时依赖 `anp.group.base.v2`
  - 使用群 E2EE 消息时依赖 `anp.group.e2ee.v2`

---

## 1. 目的

本 Profile 定义 ANP 群消息中 mention 的最小互操作表示。

Mention 是一个结构化应用层对象，用于把人类可见的界面表达：

```text
@alice
@product-agent
@all
@agents
@humans
```

绑定到机器可读的目标，例如 DID 或群选择器。

本 Profile 标准化：

1. 带 mention 的群消息应用载荷 JSON 结构；
2. mention 对象的最小字段；
3. 第一版支持的目标类型：`human`、`agent` 和 `group_selector`；
4. 第一版支持的群选择器：`all`、`agents` 和 `humans`；
5. `mentions` 的放置位置，确保它被外层 ANP 消息完整性机制覆盖；
6. 带 mention 群消息的发送者证明和校验模型。

本 Profile 不定义：

- 新的 JSON-RPC 方法；
- 用于 `group.send` 或 `group.e2ee.send` 的新外层 `meta.profile`；
- 仅用于区分 mention 消息的新 content type；
- 仅用于区分 mention 消息的新 payload `protocol` 标记；
- mention 专属 sender 字段；
- mention 专属 proof 或 signature；
- 服务端 mention 权限模型；
- 服务端展开 `@all`、`@agents` 或 `@humans`；
- 已读状态、送达回执、通知投递或用户免打扰设置；
- 类似“支持某协议的 agents”这样的能力选择器；
- 超出 `owner`、`admin`、`member` 的自定义群治理角色；
- 私聊消息中的 mention 语义。

---

本 Profile 适用于 `did:wba`、`did:web` 及其他已支持的 DID 方法；身份解析与验证遵循 [P2](02-身份与发现.md#method-validation)。

## 2. 术语和规范性约定

### 2.1 规范性关键词

本文中的 **MUST**、**MUST NOT**、**REQUIRED**、**SHALL**、**SHALL NOT**、**SHOULD**、**SHOULD NOT**、**RECOMMENDED**、**NOT RECOMMENDED**、**MAY**、**OPTIONAL** 按其大写形式解释为规范性要求。

### 2.2 术语

- **Mention**：用于标识消息中被提及目标的结构化应用层对象。
- **Mention-bearing Group Message**：结构化 JSON 载荷中包含符合本 Profile 的顶层 `mentions` 数组的群应用消息。
- **Surface Syntax**：人类可见的 mention 文本形式，例如 `@alice` 或 `@agents`。surface syntax 不是协议身份。
- **Mention Target**：mention 的机器可读目标。它可以是 human DID、agent DID 或群选择器。
- **Group Selector Mention**：目标为群范围选择器的 mention，例如 `all`、`agents` 或 `humans`。
- **Terminal-side Validation**：接收客户端、用户代理或 Agent runtime 在收到或解密应用载荷之后执行的本地校验和处理。该术语不引入设备级或终端级协议身份。
- **Group Host Service**：`anp.group.base.v2` 中定义的群服务。在本 Profile 中，它不校验 mention 语义。

---

## 3. 设计原则

### 3.1 `@` 是界面语法，不是身份

字符 `@` 及其后的文本只是人类界面语法。

单目标 mention 的协议身份是目标 DID：

```json
{
  "target": {
    "kind": "agent",
    "did": "did:wba:example.com:agent:product-assistant"
  }
}
```

群选择器 mention 的协议身份是作用于外层群消息上下文的 selector 值：

```json
{
  "target": {
    "kind": "group_selector",
    "selector": "agents"
  }
}
```

### 3.2 Mentions 不携带独立 sender

mention 对象 **MUST NOT** 包含 `sender`、`sender_did`、`from` 或 `actor_did` 等发送者字段。

带 mention 群消息的发送者始终是外层 ANP 群消息的发送者：

- Group Base 使用 `params.meta.sender_did`；
- Group E2EE 使用 `params.meta.sender_did` 以及 Group E2EE 消息认证上下文。

### 3.3 Mentions 不携带独立 proof

mention 对象 **MUST NOT** 包含 `proof`、`signature`、`auth`、`origin_proof` 或任何等价的 mention 本地证明字段。

对于非 E2EE Group Base，带 mention 的载荷 **MUST** 位于 `params.body` 内，从而被 `auth.origin_proof` 绑定的 `Signed Request Object` 覆盖。

对于 Group E2EE，带 mention 的载荷 **MUST** 位于加密前对应的 inner plaintext 对象内。

### 3.4 v1 不定义服务端 mention 授权

本 Profile v1 不定义 mention 专属权限策略。

如果发送者根据适用的基础 Profile 有权发送外层群消息，则在 mention 层默认允许发送者包含任意受支持的 mention 目标：

- 单个 human DID；
- 单个 agent DID；
- `@all`；
- `@agents`；
- `@humans`。

服务器、relay service、ingress service 和 Group Host Service **MUST NOT** 仅因为 mention target、mention selector 或 mention role 而拒绝消息。它们只继续执行外层 Profile 已经要求的校验，例如发送者认证、幂等性、target binding、content shape 和群发送权限。

该规则不限制普通运维管控，例如 payload 大小限制、明确记录的 mention 对象数量上限、速率限制、反滥用策略、反垃圾策略、畸形载荷拒绝或拒绝服务防护。此类管控属于运维策略，不属于 mention 专属授权。

### 3.5 群选择器不是群治理角色

selector 值 `all`、`agents` 和 `humans` **MUST NOT** 被解释为 P4 群治理角色。

P4 群治理角色仍然是：

```text
owner
admin
member
```

本 Profile 的 group selector 是 mention target，不是授权角色。

### 3.6 Mention target 不是设备 target

单目标 Mention 标识一个 human 或 Agent DID，group-selector Mention 标识一组 P4 业务成员。两种形式都不标识设备或 MLS Leaf。同一 DID 下的多个设备或 Leaf 仍是一个 Mention 主体。

P6 独占拥有承载 Group E2EE 消息中的发送或接收设备绑定。Mention 对象 **MUST NOT** 复制、推断或覆盖这些外层设备 selector。

### 3.7 历史 Mention 与 DID 迁移

历史 Mention target 保持消息被接受时携带的精确 DID。DID 变化后，Group Host、relay 或客户端 **MUST NOT** 改写已签名或已加密的历史 Mention payload。

接收产品 **MAY** 按 P2 验证从历史 DID 到当前 DID 的迁移，并在本地业务策略接受返回的 assurance 后，把历史展示或通知行为关联到当前身份。该关联只存在于本地，不改变 payload。新创建的 Mention **MUST** 使用目标当前完整 DID。

---

## 4. Profile 绑定模型

### 4.1 扩展标记

本 Profile 不要求专用的 payload protocol name。

当结构化 JSON payload 位于本 Profile 支持的群消息载荷位置，并且包含符合本 Profile 的顶层 `mentions` 数组时，该 payload 即为带 mention 的 payload。

接收方 **MUST NOT** 要求或依赖顶层 `protocol` 字段来识别 mention。

如果结构化 JSON payload 不包含顶层 `mentions` 数组，则本 Profile 不适用于该 payload。

### 4.2 与外层 `meta.profile` 的关系

本 Profile **MUST NOT** 替代外层群消息操作中的 `params.meta.profile`。

外层群消息操作保持原有 Profile 名称，例如：

- 非 Group E2EE 的 `group.send` 使用 `anp.group.base.v2`；
- `group.e2ee.send` 使用 `anp.group.e2ee.v2`。

### 4.3 Content type

带 mention 的结构化载荷 **MUST** 使用普通 JSON 载荷承载。

对于非 E2EE Group Base：

```text
"meta": {
  "content_type": "application/json"
}
```

对于 Group E2EE inner plaintext：

```json
{
  "application_content_type": "application/json"
}
```

实现 **MUST NOT** 仅为区分带 mention 的消息而定义新的 content type。

---

## 5. 带 Mention 的消息对象

### 5.1 推荐结构

带 mention 的消息载荷具有如下最小结构：

```json
{
  "text": "@agents please summarize this discussion.",
  "mentions": [
    {
      "id": "men_1",
      "range": {
        "start": 0,
        "end": 7,
        "unit": "unicode_code_point"
      },
      "target": {
        "kind": "group_selector",
        "selector": "agents"
      },
      "mention_role": "addressee"
    }
  ]
}
```

### 5.2 顶层字段

| 字段 | 要求 | 类型 | 语义 |
|---|---:|---|---|
| `text` | **MUST** | string | 包含 mention surface syntax 的人类可读消息文本。 |
| `mentions` | **MUST** | array | 本消息中的结构化 mention 对象。 |
| `annotations` | **MAY** | object | 应用扩展元数据。不用于路由、安全或授权。 |

如果消息没有结构化 mention 语义，发送者 **SHOULD NOT** 包含顶层 `mentions` 字段，而应使用外层 Profile 的普通内容模型。

mention 处理器 **MAY** 忽略无法识别的顶层字段。

### 5.3 `mentions` 数组

`mentions` **MUST** 是数组。

每个元素 **MUST** 是第 5.4 节定义的 mention 对象。

同一个消息载荷内，`mentions[*].id` 的值 **MUST** 唯一。

`mentions` 的顺序 **SHOULD** 与 mention surface 在 `text` 中出现的顺序一致。

---

### 5.4 Mention 对象

最小 mention 对象如下：

```json
{
  "id": "men_1",
  "range": {
    "start": 0,
    "end": 7,
    "unit": "unicode_code_point"
  },
  "target": {
    "kind": "group_selector",
    "selector": "agents"
  },
  "mention_role": "addressee"
}
```

字段要求：

| 字段 | 要求 | 类型 | 语义 |
|---|---:|---|---|
| `id` | **MUST** | string | 消息内局部 mention 标识符，没有全局语义。 |
| `range` | **MUST** | object | mention surface 在 `text` 中的范围。 |
| `target` | **MUST** | object | 机器可读 mention 目标。 |
| `mention_role` | **MAY** | string | mention 角色。如果省略，接收方 **MUST** 按 `addressee` 解释。 |

mention 对象 **MUST NOT** 包含：

- `sender`；
- `sender_did`；
- `from`；
- `actor_did`；
- `auth`；
- `origin_proof`；
- `proof`；
- `signature`；
- `sender_device_id`；
- `recipient_device_id`；
- `device_id` 或 MLS Leaf 标识符。

---

### 5.5 Mention range

range 对象如下：

```json
{
  "start": 0,
  "end": 7,
  "unit": "unicode_code_point"
}
```

字段要求：

| 字段 | 要求 | 类型 | 语义 |
|---|---:|---|---|
| `start` | **MUST** | non-negative integer | `text` 中的闭区间起始偏移。 |
| `end` | **MUST** | non-negative integer | `text` 中的开区间结束偏移。 |
| `unit` | **MUST** | string | v1 中 **MUST** 为 `unicode_code_point`。 |

规则：

1. `start` **MUST** 小于 `end`。
2. `end` **MUST NOT** 超过 `text` 中 Unicode code point 的数量。
3. range 基于 JSON 解析后的 `text` 字符串精确值计算，在任何 UI 归一化、转写或 Markdown 渲染之前计算。
4. `range` 标识的子串就是 mention surface。v1 中故意不在 mention 对象里重复 surface 字符串。
5. 如果终端无法校验 range，终端 **MUST** 在 mention 触发层面忽略该 mention 对象，但 **MAY** 继续展示原始 `text`。

---

### 5.6 Mention target

#### 5.6.1 单个 human target

```json
{
  "kind": "human",
  "did": "did:wba:example.com:user:alice",
  "display_name": "Alice"
}
```

规则：

- `kind` **MUST** 为 `human`。
- `did` **MUST** 存在且 **MUST** 是 DID。
- `display_name` **MAY** 作为发送端展示名快照存在。
- `display_name` **MUST NOT** 被用作身份或授权证据。

#### 5.6.2 单个 agent target

```json
{
  "kind": "agent",
  "did": "did:wba:example.com:agent:product-assistant",
  "display_name": "Product Assistant"
}
```

规则：

- `kind` **MUST** 为 `agent`。
- `did` **MUST** 存在且 **MUST** 是 DID。
- `display_name` **MAY** 作为发送端展示名快照存在。
- Agent 能力发现、Agent Description 解析和 profile 查询不属于本 Profile 范围。

#### 5.6.3 Group selector target

```json
{
  "kind": "group_selector",
  "selector": "agents"
}
```

规则：

- `kind` **MUST** 为 `group_selector`。
- `selector` **MUST** 是以下值之一：
  - `all`
  - `agents`
  - `humans`
- 当 `kind = "group_selector"` 时，`did` **MUST NOT** 出现。
- selector 的作用域是外层群消息上下文标识的群。
- selector **MUST NOT** 被解释为 P4 群治理角色。

---

### 5.7 Mention role

`mention_role` 字段是可选字段。

v1 允许的取值：

| 值 | 语义 |
|---|---|
| `addressee` | 被 mention 的目标是注意力接收者。默认值。 |
| `cc` | 被 mention 的目标只是被抄送或引用，不一定需要行动。 |

规则：

- 如果省略 `mention_role`，接收方 **MUST** 按 `addressee` 解释。
- 如果存在 `mention_role`，其值 **MUST** 是本节允许值之一。
- `mention_role` **MUST NOT** 被用作群治理角色。
- `mention_role` **MUST NOT** 用于覆盖群发送权限或任何外层 Profile 授权规则。

---

## 6. Group Selector 语义

### 6.1 `@all`

`@all` 表示为：

```json
{
  "target": {
    "kind": "group_selector",
    "selector": "all"
  }
}
```

终端侧解释：

```text
外层群上下文中的所有 active 群成员
```

### 6.2 `@agents`

`@agents` 表示为：

```json
{
  "target": {
    "kind": "group_selector",
    "selector": "agents"
  }
}
```

终端侧解释：

```text
本地应用 roster 或 profile 层分类为 agent 的 active 群成员
```

### 6.3 `@humans`

`@humans` 表示为：

```json
{
  "target": {
    "kind": "group_selector",
    "selector": "humans"
  }
}
```

终端侧解释：

```text
本地应用 roster 或 profile 层分类为 human 的 active 群成员
```

### 6.4 Selector 解析快照

对于群消息，终端 **SHOULD** 在可用时基于该消息被接受时关联的 group state snapshot 解析 group selector。

在 Group Base 和 Group E2EE 中，这通常是已接受消息上下文中返回或投递的 `group_state_version`。

如果终端没有对应的精确 group state snapshot，终端 **MAY** 基于本地可用的最佳群状态解析 selector，并将结果标记为 best-effort。

### 6.5 Member kind 来源

成员被分类为 `human` 或 `agent` 属于应用层 roster 或 profile 属性。

本 Profile 不为此定义新的 P4 `group_member` 字段。

实现 **MUST NOT** 仅根据 `owner`、`admin` 或 `member` 等 P4 治理角色推断 `human` 或 `agent`。

---

## 7. 放置规则

### 7.1 非 E2EE Group Base

对于 `anp.group.base.v2` 下的 `group.send`：

- `params.meta.content_type` **MUST** 为 `application/json`；
- `params.body.payload` **MUST** 承载带 mention 的消息对象；
- `params.auth.origin_proof` 是 Group Base 要求的发送者证明；
- `params.meta.sender_device_id` 与 `params.meta.recipient_device_id` **MUST NOT** 出现；
- Group Host 执行现有 Group Base 校验；
- Group Host **MUST NOT** 执行 mention 专属授权或 selector 展开。

示例：

```json
{
  "jsonrpc": "2.0",
  "id": "req-group-mention-001",
  "method": "group.send",
  "params": {
    "meta": {
      "profile": "anp.group.base.v2",
      "security_profile": "transport-protected",
      "sender_did": "did:wba:example.com:user:alice",
      "target": {
        "kind": "group",
        "did": "did:wba:groups.example.com:team:waic-demo"
      },
      "operation_id": "msg-group-mention-001",
      "message_id": "msg-group-mention-001",
      "created_at": "2026-06-14T12:00:00Z",
      "content_type": "application/json"
    },
    "auth": {
      "scheme": "anp-rfc9421-origin-proof-v1",
      "origin_proof": {
        "contentDigest": "sha-256=:BASE64_SHA256_DIGEST:",
        "signatureInput": "sig1=(\"@method\" \"@target-uri\" \"content-digest\");created=1781438400;expires=1781438460;nonce=\"n-002\";keyid=\"did:wba:example.com:user:alice#key-1\"",
        "signature": "sig1=:BASE64_SIGNATURE:"
      }
    },
    "body": {
      "payload": {
        "text": "@agents please summarize yesterday's meeting.",
        "mentions": [
          {
            "id": "men_1",
            "range": {
              "start": 0,
              "end": 7,
              "unit": "unicode_code_point"
            },
            "target": {
              "kind": "group_selector",
              "selector": "agents"
            },
            "mention_role": "addressee"
          }
        ]
      }
    }
  }
}
```

### 7.2 Group E2EE

对于 `anp.group.e2ee.v2` 下的 `group.e2ee.send`：

- 外层 `params.meta.content_type` 保持为 `application/anp-group-cipher+json`；
- 外层 `params.body` 承载 `group_cipher_object`；
- 带 mention 的对象 **MUST** 在 MLS `PrivateMessage` 加密前放入 inner `Group Application Plaintext.payload`；
- inner `application_content_type` **MUST** 为 `application/json`。

该加密投递所需的任何发送或接收设备字段都保留在 P6 外层 envelope 中，不属于 Mention payload。

加密前 inner plaintext 示例：

```json
{
  "application_content_type": "application/json",
  "thread_id": "thr-001",
  "payload": {
    "text": "@all please review the agenda.",
    "mentions": [
      {
        "id": "men_1",
        "range": {
          "start": 0,
          "end": 4,
          "unit": "unicode_code_point"
        },
        "target": {
          "kind": "group_selector",
          "selector": "all"
        }
      }
    ]
  }
}
```

Group Host 看到的是外层 ciphertext object。它按照 Group E2EE 和 Group Base 规则认证并排序 `group.e2ee.send` 请求，但不检查或校验加密的 `mentions` 数组。

### 7.3 Incoming notification

当 ANP service 使用 `group.incoming` 或对应 Group E2EE 投递路径推送带 mention 的群消息时：

- 推送载荷 **MUST** 与已接受的原始消息语义等价；
- 如果外层 Profile 允许把原始 `auth.origin_proof` 复制到 notification 中，service **SHOULD** 包含无损复制，以便终端侧把 mention 载荷绑定到原始发送者；
- 中间服务在转发或推送消息时 **MUST NOT** 重写 `mentions`。
- Group Base 投递仍以 DID 寻址，Group E2EE 设备投递仅遵循承载 P6 的 selector 字段。

---

## 8. 发送者证明和密码学绑定

### 8.1 非 E2EE Group Base

对于非 E2EE Group Base，带 mention 消息的发送者由外层 `auth.origin_proof` 证明。

校验主体是外层消息 sender：

```text
params.meta.sender_did
```

`mentions` 数组受到保护，因为它位于 `Signed Request Object` 的 `body` 成员内。

### 8.2 Group E2EE

对于 Group E2EE，`group.e2ee.send` 使用外层 Profile 的 origin proof 和 Group E2EE authenticated message 语义。

`mentions` 数组位于受 MLS 保护的 inner `Group Application Plaintext` 内。它对 Group Host 不可见，只在终端或 Agent runtime 解密之后校验。

### 8.3 无 mention 本地 proof

v1 中 verifier **MUST NOT** 要求 mention 本地 signature 或 proof。

接收方 **MUST** 将嵌入 mention 对象内的任何 `proof`、`signature`、`origin_proof` 或 `auth` 字段视为不符合本 Profile。

---

## 9. 校验与处理

### 9.1 服务端处理

服务器、relay service、ingress service 和 Group Host Service：

1. **MUST** 按外层 Profile 处理外层 ANP 群消息；
2. **MUST** 执行外层 Profile 要求的现有发送者认证、幂等性、target binding、security profile 和 payload carriage 校验；
3. 对群消息，**MUST** 按 Group Base / Group E2EE 要求执行群发送权限；
4. **MUST NOT** 执行 mention 专属授权；
5. **MUST NOT** 在消息接受阶段把 `@all`、`@agents` 或 `@humans` 展开为成员 DID 列表；
6. **MUST NOT** 仅因为服务端不知道某个 mention target DID 或 selector 覆盖面较大而拒绝消息；
7. **MUST** 保持带 mention 载荷不被未授权修改。

该规则不阻止服务器因普通外层 Profile 或运维原因拒绝消息，例如 JSON-RPC shape 无效、content type 不支持、origin proof 无效、群发送权限失败、ciphertext object 无效、幂等冲突、payload 大小限制、明确记录的 mention 对象数量上限、速率限制、反滥用策略、反垃圾策略或拒绝服务防护。

### 9.2 终端侧校验

支持本 Profile 的终端、客户端、用户代理或 Agent runtime **MUST** 在收到或解密应用载荷之后执行 mention 校验。

最小终端侧校验步骤如下：

1. 在触发 mention 行为前，验证或依赖外层 Profile 的 authenticated sender context。
2. 解析 JSON payload。
3. 在应用本 Profile 前，检查 payload 包含顶层 `mentions` 数组。
4. 检查 `text` 是 string。
5. 检查 `mentions` 是 array。
6. 检查每个 mention 对象具有唯一 `id`。
7. 检查每个 `range` 对 `text` 有效。
8. 检查 `target.kind` 是 `human`、`agent` 或 `group_selector` 之一。
9. 如果 `target.kind = "human"` 或 `target.kind = "agent"`，检查 `target.did` 存在。
10. 如果 `target.kind = "group_selector"`，检查 `target.selector` 是 `all`、`agents` 或 `humans` 之一。
11. 如果存在 `mention_role`，检查其值是 `addressee` 或 `cc` 之一。
12. 按本地策略执行渲染、通知或 Agent runtime 行为。

如果某个 mention 对象未通过终端侧校验，终端 **SHOULD** 在触发、通知或 Agent 激活层面忽略该 mention 对象，但 **MAY** 继续展示原始消息文本。

### 9.3 Mention 权限解释

v1 不存在 mention 专属权限策略。

如果满足以下条件，终端 **MUST** 在 wire-protocol 层把 mention 视为允许：

1. 外层群消息已经按照适用的 ANP Message Profile 被接受或投递；并且
2. mention 对象在本 Profile 下语法有效。

终端 **MAY** 应用本地用户偏好，例如免打扰、通知节流或反垃圾策略。这些本地偏好不是协议层 mention 授权，且 **MUST NOT** 表示为对 ANP 消息本身的拒绝。

---

## 10. 示例

### 10.1 在群中 mention 所有人类成员

```json
{
  "text": "@humans please confirm your attendance.",
  "mentions": [
    {
      "id": "men_1",
      "range": {
        "start": 0,
        "end": 7,
        "unit": "unicode_code_point"
      },
      "target": {
        "kind": "group_selector",
        "selector": "humans"
      }
    }
  ]
}
```

### 10.2 在群中 Mention 单个 human

```json
{
  "text": "@张三 please review this.",
  "mentions": [
    {
      "id": "men_1",
      "range": {
        "start": 0,
        "end": 3,
        "unit": "unicode_code_point"
      },
      "target": {
        "kind": "human",
        "did": "did:wba:example.com:user:zhangsan",
        "display_name": "张三"
      },
      "mention_role": "cc"
    }
  ]
}
```

### 10.3 在群中 Mention 单个 agent

```json
{
  "text": "@InvoiceBot extract the invoice fields.",
  "mentions": [
    {
      "id": "men_1",
      "range": {
        "start": 0,
        "end": 11,
        "unit": "unicode_code_point"
      },
      "target": {
        "kind": "agent",
        "did": "did:wba:example.com:agent:invoice-bot",
        "display_name": "InvoiceBot"
      },
      "mention_role": "addressee"
    }
  ]
}
```

---

## 11. 安全考虑

### 11.1 Mention spoofing

终端 **MUST NOT** 仅使用可见文本判断 mention 目标。

例如，文本 `@Alice` 不足以标识 Alice。终端必须使用对应的结构化 `mentions[*].target` 对象。

### 11.2 Display name 不是身份

`target.display_name` 只是展示名快照。

身份判断 **MUST** 基于单目标 mention 的 DID，或基于 group selector mention 的 selector 语义。

### 11.3 无服务端 mention 授权

由于 v1 的 mention 校验位于终端侧，服务器可能接受并投递一个后来无法通过终端侧 mention 校验的消息。

终端和 Agent runtime **MUST** 避免由无效 mention 对象触发特权行为。

### 11.4 E2EE 隐私

在 Group E2EE 模式中，mention 对象位于加密 plaintext 内。

服务器和 Group Host Service 不应期望检查或索引 mention target，除非未来扩展显式引入加密或隐私保护的通知 hint。

本 Profile v1 不定义此类 hint。

### 11.5 Replay 和重复处理

本 Profile 不定义 mention 专属 replay protection。

Replay 和重复处理继承自外层 ANP Message Profile，通过 `operation_id`、`message_id`、E2EE session state 或 group ordering semantics 完成。

---

## 12. 隐私考虑

### 12.1 最小元数据

Mention target 可能暴露社交注意力模式。

实现 **SHOULD** 将 `mentions` 保持在本 Profile 要求的受保护 payload 位置内，且 **SHOULD NOT** 把 mention target 复制到外层 metadata。

### 12.2 Group selector 隐私

`@agents` 或 `@humans` 等 group selector 可能暴露发送者的目标受众，但它避免在消息载荷中暴露展开后的成员 DID 列表。

实现 **SHOULD** 保留 selector，而不是在发送时将其展开为单个 DID。

---

## 13. 最小互操作要求

符合本 Profile 的实现至少 MUST 支持：

1. 结构化 JSON 群消息 payload 中作为扩展标记的顶层 `mentions`；
2. `text` 加 `mentions` 的消息对象结构；
3. `human`、`agent` 和 `group_selector` 三类 mention target；
4. `all`、`agents` 和 `humans` 三个 group selector 值；
5. `unicode_code_point` mention range；
6. mention 对象 shape 和 range 的终端侧校验；
7. 不使用 mention 本地 sender 字段；
8. 不使用 mention 本地 proof 字段；
9. 非 E2EE `application/json` 群消息中，带 mention 的载荷位于 `params.body.payload`；
10. Group E2EE 消息中，带 mention 的载荷位于 inner `Group Application Plaintext.payload`；
11. 保留外层 ANP Message Profile 的发送者证明和发送权限语义；
12. v1 不做服务端 mention 授权或 selector 展开；
13. Mention target 使用 DID 或 group selector，设备绑定交由承载 P6 消息。
14. 历史 Mention DID 保持不变；与当前 DID 的关联必须先完成 P2 迁移验证并由本地业务策略接受。

---

## 14. 未来扩展

未来版本可以定义：

- 私聊消息中的 mention 语义；
- E2EE 消息的 mention notification hint；
- mention 专属通知投递策略；
- 能力选择器 mention，例如支持某个协议的 agents；
- 高风险操作的 mention-level human authorization；
- 富文本或多 body 的 mention anchoring；
- 跨群或外部 mention 引用；
- human / agent 分类的标准 roster 字段。

这些能力都刻意不放入 v1。
