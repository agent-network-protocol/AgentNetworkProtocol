# ANP 架构与角色

本页帮助你在编码前建立整体视图：谁和谁通信、需要哪些文档入口、最小实现需要部署哪些端点。

## 架构视图（最小实现）

本套文档聚焦**身份与应用协议**，用于快速落地 MVP：

1. **身份与认证**：`did:wba` 用于跨平台身份确认。
2. **应用协议**：ADP（描述）、发现、支付（AP2）。

## 核心角色

- **智能体（Agent）**：提供信息或能力的服务端/客户端实体。
- **拥有者（Owner）**：智能体的归属主体。
- **购物者智能体（SA）/商户智能体（MA）**：AP2 交易中最小必需角色。

## 最小通信链路

1. **发现入口**：客户端通过 `https://{domain}/.well-known/agent-descriptions` 获取 AD 文档列表（**应该 SHOULD** 提供）
2. **读取 AD 文档**：从 `ad.json` 中解析 `did`、`interfaces`、安全方案（**必须 MUST** 可访问）
3. **鉴权请求**：使用 `did:wba` 在 HTTP 头或 JSON 体中携带签名（**必须 MUST** 验证）
4. **调用应用协议**：按 AD 中声明的接口发起请求（如 AP2）

## 最小部署清单（服务端）

实现 ANP 智能体的服务端**必须 (MUST)** 提供以下端点：

- `/.well-known/agent-descriptions`（发现入口，**应该 SHOULD** 提供）
- `/agents/{name}/ad.json`（AD 文档，**必须 MUST** 提供）
- **必须 (MUST)** 支持 HTTPS 加密传输
- **必须 (MUST)** 实现 `did:wba` 身份验证

可选的应用协议端点（**可以 MAY** 提供）：

- `/ap2/merchant/create_cart_mandate`（AP2 支付协议）
- `/ap2/merchant/send_payment_mandate`（AP2 支付协议）
- `/{webhook}`（AP2 回调接收）

## 与文档的对应关系

- 身份认证：`./02-ANP-身份与认证-did-wba.md`
- 描述协议：`./03-ANP-智能体描述协议.md`
- 发现协议：`./04-ANP-智能体发现协议.md`
- 支付协议：`./05-ANP-智能体支付协议.md`
