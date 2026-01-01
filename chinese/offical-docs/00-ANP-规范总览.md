# ANP 规范总览

ANP（Agent Network Protocol）是面向智能体互联的开放通信协议。本套官网规范面向**可落地编码**的最小可用实现（MVP），聚焦于身份认证与应用层协议，内容结构参考 MCP 规范的"概览 → 架构 → 规范细节 → 安全 → 实现清单"的阅读路径。

![ANP 三层架构](/images/anp-architecture.png)

## 术语约定

本规范遵循 [RFC 2119](https://www.rfc-editor.org/rfc/rfc2119) 的关键词约定来表示要求级别：

- **必须 (MUST)** / **不得 (MUST NOT)**: 绝对要求，违反将导致协议不兼容
- **应该 (SHOULD)** / **不应 (SHOULD NOT)**: 强烈建议，除非有充分理由否则应遵循
- **可以 (MAY)** / **可选 (OPTIONAL)**: 完全可选，实现者可自行决定

## ANP 核心设计原则

### 1. 最小信任原则 (Zero Trust)

ANP 假设网络中所有通信都可能被窃听或篡改，因此：

- 所有敏感接口**必须 (MUST)** 经过身份认证
- 所有关键数据**必须 (MUST)** 通过 HTTPS 加密传输
- 所有签名**必须 (MUST)** 在使用前验证

### 2. 去中心化身份 (Decentralized Identity)

- 采用 `did:wba` 方法实现跨平台身份确认
- 智能体拥有自主控制的数字身份，无需中心化认证机构
- 支持基于公钥密码学的端到端认证

### 3. 最小披露原则 (Minimal Disclosure)

- 智能体描述文档 (AD) 中仅**应该 (SHOULD)** 公开完成交互所需的最小信息
- 敏感操作**应该 (SHOULD)** 启用 `humanAuthorization` 要求人类确认
- 用户数据**必须 (MUST)** 受适当访问控制保护

### 4. 协议兼容与复用 (Compatibility & Reusability)

- 复用成熟的标准协议（OpenRPC、JSON-RPC、JSON-LD 等）
- 兼容现有 Web 基础设施（HTTPS、`.well-known`、Webhook）
- 模块化设计，核心组件可独立使用或自由组合

### 5. AI 原生设计 (AI-Native Design)

- 为智能体之间的直接通信设计，而非人机交互
- 支持自然语言接口 (NaturalLanguageInterface) 与结构化接口 (StructuredInterface)
- 通过智能体描述协议 (ADP) 实现能力自描述与自发现

## 覆盖范围

- **身份与认证**：`did:wba` 身份体系与最小认证流程
- **应用协议**：智能体描述（ADP）、发现、支付（AP2）
- **安全与实现**：签名、时间戳、重放防护、最小兼容清单

> **说明**：本套文档聚焦 MVP 级别的身份认证与应用协议实现。如需完整协议，请参考仓库内对应规范文档。

## 快速上手路线（MVP）

1. 完成 `did:wba` 身份创建与请求鉴权（**必须 MUST**）
2. 发布智能体描述文档（AD）（**必须 MUST**）
3. 提供 `.well-known/agent-descriptions` 发现入口（**应该 SHOULD**）
4. 实现 AP2 最小支付流程（CartMandate、PaymentMandate、PaymentReceipt）（**可选 MAY**）
5. 按安全清单检查签名、时间戳与重放防护（**必须 MUST**）

## 文档导航

- `./01-ANP-架构与角色.md`
- `./02-ANP-身份与认证-did-wba.md`
- `./03-ANP-智能体描述协议.md`
- `./04-ANP-智能体发现协议.md`
- `./05-ANP-智能体支付协议.md`
- `./06-ANP-安全与隐私实践.md`
- `./07-ANP-实现与兼容性清单.md`

## 关联规范

- `../03-did-wba方法规范.md`
- `../07-ANP-智能体描述协议规范.md`
- `../08-ANP-智能体发现协议规范.md`
- `../application/10-ANP-智能体支付协议规范.md`
