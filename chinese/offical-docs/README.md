# ANP 官方文档

欢迎来到 Agent Network Protocol (ANP) 官方文档！

ANP 是面向智能体互联的开放通信协议，旨在成为智能体互联网时代的基础设施。

## 🚀 快速开始

- [**ANP 是什么?**](./getting-started/what-is-anp.md) - 了解 ANP 的核心价值和设计理念
- [**快速上手指南**](./getting-started/quickstart.md) - 5分钟搭建你的第一个 ANP 智能体
- [**核心概念**](./getting-started/core-concepts.md) - 理解 ANP 的关键概念和术语

## 📖 文档导航

### 关于 ANP

了解 ANP 的架构和核心组件：

- [架构与协议层次](./about-anp/architecture.md) - ANP 三层架构和角色说明
- [did:wba 身份系统](./about-anp/identity-system.md) - 去中心化身份体系
- [协议层次](./about-anp/protocol-layers.md) - 协议栈详解
- [版本管理](./about-anp/versioning.md) - 协议版本演进

### 使用 ANP 开发

学习如何使用 ANP 构建智能体应用：

#### 身份认证
- [did:wba 概述](./develop-with-anp/identity/did-wba-overview.md) - 去中心化身份方法
- [认证实现](./develop-with-anp/identity/authentication.md) - 完整的认证流程
- [DID 文档规范](./develop-with-anp/identity/did-document.md) - DID 文档详细说明

#### 智能体描述
- [ADP 概述](./develop-with-anp/agent-description/overview.md) - 智能体描述协议介绍
- [AD 文档规范](./develop-with-anp/agent-description/ad-document.md) - 完整的 AD 文档格式
- [接口定义](./develop-with-anp/agent-description/interfaces.md) - 结构化和自然语言接口
- [示例集合](./develop-with-anp/agent-description/examples.md) - 各种场景的 AD 示例

#### 智能体发现
- [发现协议概述](./develop-with-anp/discovery/overview.md) - 智能体发现机制
- [.well-known 机制](./develop-with-anp/discovery/well-known.md) - 标准化发现入口
- [被动发现](./develop-with-anp/discovery/passive-discovery.md) - 注册机制

#### 支付协议（可选）
- [AP2 概述](./develop-with-anp/payment/overview.md) - 智能体支付协议介绍
- [凭证规范](./develop-with-anp/payment/credentials.md) - 支付凭证详细说明
- [支付流程](./develop-with-anp/payment/workflows.md) - 完整的支付流程
- [支付安全](./develop-with-anp/payment/security.md) - 支付安全最佳实践

#### SDK 文档
- [TypeScript SDK](./develop-with-anp/sdk/typescript-sdk.md) - 官方 TypeScript SDK 使用指南
- [Python SDK](./develop-with-anp/sdk/python-sdk.md) - Python SDK（开发中）
- [SDK 参考](./develop-with-anp/sdk/sdk-reference.md) - 完整 API 参考

### 安全与隐私

确保你的智能体安全可靠：

- [安全概览](./security/overview.md) - ANP 安全架构和原则
- [最佳实践](./security/best-practices.md) - 安全开发指南
- [威胁模型](./security/threat-model.md) - 常见攻击和防护
- [安全检查清单](./security/checklist.md) - 上线前的安全检查

### 实现指南

将 ANP 智能体部署到生产环境：

- [兼容性清单](./implementation/compatibility-checklist.md) - 确保协议兼容性
- [测试指南](./implementation/testing.md) - 测试策略和工具
- [部署指南](./implementation/deployment.md) - 生产环境部署
- [问题排查](./implementation/troubleshooting.md) - 常见问题和解决方案

## 📚 技术规范

完整的技术规范文档：

- [基础协议](./specification/2025-01-17/base-protocol.md) - ANP 基础协议规范
- [身份规范](./specification/2025-01-17/identity.md) - did:wba 完整规范
- [智能体描述](./specification/2025-01-17/agent-description.md) - ADP 完整规范
- [发现协议](./specification/2025-01-17/discovery.md) - 发现协议完整规范
- [支付协议](./specification/2025-01-17/payment.md) - AP2 完整规范
- [模式参考](./specification/2025-01-17/schema-reference.md) - JSON Schema 定义

## 💡 示例代码

通过实例学习 ANP：

- [基础智能体](./examples/basic-agent/) - 最小可用的智能体实现
- [支付集成](./examples/payment-integration/) - AP2 支付完整示例
- [OpenRPC 示例](./examples/openrpc-example.json) - OpenRPC 接口描述
- [JSON-RPC 示例](./examples/jsonrpc-example.json) - JSON-RPC 请求响应

## 🤝 社区

加入 ANP 社区：

- [贡献指南](./community/contributing.md) - 如何为 ANP 做贡献
- [治理模型](./community/governance.md) - 协议治理机制
- [路线图](./community/roadmap.md) - ANP 发展规划
- [常见问题](./community/faq.md) - FAQ

## 🔗 相关资源

### 官方仓库

- **协议规范**: [agent-network-protocol/AgentNetworkProtocol](https://github.com/agent-network-protocol/AgentNetworkProtocol)
- **TypeScript SDK**: [agent-network-protocol/anp](https://github.com/agent-network-protocol/anp)

### 外部资源

- [W3C DID Core Specification](https://www.w3.org/TR/did-core/)
- [OpenRPC Specification](https://open-rpc.org/)
- [JSON-RPC 2.0 Specification](https://www.jsonrpc.org/specification)
- [RFC 2119: Key words for RFCs](https://www.rfc-editor.org/rfc/rfc2119)
- [RFC 8785: JSON Canonicalization Scheme](https://www.rfc-editor.org/rfc/rfc8785)

## 📝 文档版本

当前文档版本: **2025-01-17**

查看[历史版本](./specification/)

## 🆘 获取帮助

遇到问题？

- **文档问题**: [提交 Issue](https://github.com/agent-network-protocol/AgentNetworkProtocol/issues)
- **SDK 问题**: [SDK Issues](https://github.com/agent-network-protocol/anp/issues)
- **社区讨论**: [Discord 社区](https://discord.gg/agent-network-protocol)

## 📄 许可证

ANP 协议规范和文档基于 [MIT 许可证](../../LICENSE) 开源。

## 🙏 致谢

感谢所有为 ANP 做出贡献的开发者和组织！

---

**快速链接**:
[什么是 ANP?](./getting-started/what-is-anp.md) |
[快速开始](./getting-started/quickstart.md) |
[TypeScript SDK](./develop-with-anp/sdk/typescript-sdk.md) |
[基础示例](./examples/basic-agent/) |
[贡献指南](./community/contributing.md)
