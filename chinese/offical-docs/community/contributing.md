# ANP 贡献指南

感谢你对 Agent Network Protocol (ANP) 的关注！我们欢迎各种形式的贡献。

## 贡献方式

### 1. 报告问题

如果你发现了 bug 或有功能建议：

1. 在 [GitHub Issues](https://github.com/agent-network-protocol/AgentNetworkProtocol/issues) 中搜索是否已存在类似问题
2. 如果没有，创建新 Issue 并提供：
   - 清晰的标题和描述
   - 复现步骤（如果是 bug）
   - 预期行为 vs 实际行为
   - 环境信息（操作系统、版本等）

### 2. 改进文档

文档贡献非常重要：

- 修正错别字、语法错误
- 改进现有文档的清晰度
- 添加示例和教程
- 翻译文档到其他语言

### 3. 提交代码

代码贡献流程：

1. Fork 仓库
2. 创建特性分支 (`git checkout -b feature/amazing-feature`)
3. 提交更改 (`git commit -m 'Add amazing feature'`)
4. 推送到分支 (`git push origin feature/amazing-feature`)
5. 开启 Pull Request

### 4. 参与讨论

加入社区讨论：

- [Discord 社区](https://discord.gg/agent-network-protocol)
- [GitHub Discussions](https://github.com/agent-network-protocol/AgentNetworkProtocol/discussions)

## 开发指南

### 环境准备

```bash
# 克隆仓库
git clone https://github.com/agent-network-protocol/AgentNetworkProtocol.git
cd AgentNetworkProtocol

# 安装依赖（如果需要）
npm install
```

### 文档编写规范

#### 文件命名

- 使用小写字母和连字符
- 英文文档：`what-is-anp.md`
- 中文文档：`ANP是什么.md`

#### Markdown 格式

- 使用标准 Markdown 语法
- 代码块指定语言：` ```typescript `
- 图片使用相对路径：`![描述](../../images/example.png)`

#### RFC 2119 术语

使用标准化术语表示要求级别：

- **必须 (MUST)**: 绝对要求
- **应该 (SHOULD)**: 强烈建议
- **可以 (MAY)**: 完全可选
- **不得 (MUST NOT)**: 绝对禁止
- **不应 (SHOULD NOT)**: 强烈不建议

#### 代码示例

提供完整、可运行的代码示例：

```typescript
// ✓ 好的示例：完整且可运行
import { generateDID } from '@agent-network-protocol/anp';

const { did, keyPair } = await generateDID(
  'example.com',
  'service',
  'my-agent'
);
console.log(did);

// ✗ 不好的示例：不完整
const did = generateDID(...);
```

### 提交规范

使用语义化提交消息：

```
<type>(<scope>): <subject>

<body>

<footer>
```

**Type** 类型：
- `feat`: 新功能
- `fix`: Bug 修复
- `docs`: 文档更新
- `style`: 格式调整（不影响代码逻辑）
- `refactor`: 重构
- `test`: 测试相关
- `chore`: 构建/工具相关

**示例**:
```
docs(getting-started): add quickstart guide

添加快速上手指南，帮助新用户在5分钟内搭建第一个ANP智能体。

Closes #123
```

### Pull Request 检查清单

提交 PR 前请确认：

- [ ] 代码遵循项目编码规范
- [ ] 添加了必要的测试
- [ ] 所有测试通过
- [ ] 更新了相关文档
- [ ] 提交消息清晰且符合规范
- [ ] PR 描述清楚说明了更改内容

## 文档结构

ANP 文档采用三层架构：

```
codex-official-docs/
├── getting-started/     # 快速开始
├── about-anp/          # 关于 ANP
├── develop-with-anp/   # 开发指南
├── security/           # 安全与隐私
├── implementation/     # 实现指南
├── specification/      # 技术规范
├── examples/           # 示例代码
└── community/          # 社区文档
```

### 添加新文档

1. 确定文档应放置的位置
2. 参考现有文档的格式
3. 添加到相应的 README 导航中
4. 更新主 README.md

### 文档版本管理

技术规范使用版本化目录：

```
specification/
├── 2025-01-17/     # 特定版本
│   └── *.md
└── latest/         # 符号链接到最新版本
```

## 协议规范贡献

### 提出新规范

1. 在 GitHub Issues 中创建 RFC (Request for Comments)
2. 说明问题和提议的解决方案
3. 收集社区反馈
4. 形成正式提案
5. 提交 Pull Request

### 修改现有规范

1. 确保向后兼容，或清晰标注为破坏性变更
2. 更新版本号
3. 提供迁移指南
4. 更新所有相关文档和示例

## SDK 贡献

SDK 仓库：[agent-network-protocol/anp](https://github.com/agent-network-protocol/anp)

### 添加新功能

1. 先在协议规范中定义
2. 编写测试用例
3. 实现功能
4. 更新文档和示例

### Bug 修复

1. 添加复现测试
2. 修复 bug
3. 确保所有测试通过
4. 更新 CHANGELOG

## 代码审查

所有 Pull Request 都需要经过代码审查：

### 审查关注点

- **正确性**: 代码是否正确实现了功能
- **清晰度**: 代码是否易于理解
- **测试**: 是否有充分的测试覆盖
- **文档**: 是否更新了相关文档
- **安全**: 是否存在安全隐患
- **性能**: 是否有性能问题

### 审查礼仪

- 保持建设性和尊重
- 提供具体的改进建议
- 认可好的代码
- 快速响应审查请求

## 行为准则

### 我们的承诺

为建设开放友好的环境，我们承诺：

- 尊重不同观点和经验
- 接受建设性批评
- 关注对社区最有利的事情
- 对其他社区成员表示同理心

### 不可接受的行为

- 骚扰性言论或行为
- 公开或私下的人身攻击
- 未经许可发布他人隐私信息
- 其他不专业或不受欢迎的行为

## 许可证

贡献的代码将基于 [MIT 许可证](../../LICENSE) 开源。

提交贡献即表示你同意：

1. 你拥有贡献的知识产权
2. 同意将贡献基于 MIT 许可证发布

## 获得帮助

需要帮助？

- **技术问题**: [GitHub Discussions](https://github.com/agent-network-protocol/AgentNetworkProtocol/discussions)
- **实时聊天**: [Discord 社区](https://discord.gg/agent-network-protocol)
- **邮件**: support@agent-network-protocol.com

## 致谢

感谢所有贡献者！你的努力让 ANP 变得更好。

查看[贡献者列表](https://github.com/agent-network-protocol/AgentNetworkProtocol/graphs/contributors)

---

**快速链接**:
[报告 Issue](https://github.com/agent-network-protocol/AgentNetworkProtocol/issues/new) |
[开启 PR](https://github.com/agent-network-protocol/AgentNetworkProtocol/compare) |
[加入 Discord](https://discord.gg/agent-network-protocol)
