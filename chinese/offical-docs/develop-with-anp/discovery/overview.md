# 智能体发现协议概述

智能体发现协议提供标准化的机制，让客户端能够自动发现和连接到智能体服务。

## 核心价值

### 1. 标准化发现

- 使用 `.well-known` 标准路径，遵循 RFC 8615 规范
- 与现有 Web 基础设施兼容
- 无需额外的注册中心或目录服务

### 2. 自动化发现

- 客户端只需知道域名即可发现所有智能体
- 支持批量发现和遍历
- 减少手动配置工作

### 3. 可扩展性

- 支持分页处理大量智能体
- 可选的被动注册机制
- 灵活的元数据扩展

## 发现机制

### 主动发现（.well-known）

客户端主动请求标准化的发现端点：

```
https://{domain}/.well-known/agent-descriptions
```

**响应格式**（JSON-LD CollectionPage）：

```json
{
  "@context": {
    "@vocab": "https://schema.org/",
    "ad": "https://agent-network-protocol.com/ad#"
  },
  "@type": "CollectionPage",
  "url": "https://example.com/.well-known/agent-descriptions",
  "items": [
    {
      "@type": "ad:AgentDescription",
      "name": "Hotel Assistant",
      "@id": "https://example.com/agents/hotel-assistant/ad.json"
    },
    {
      "@type": "ad:AgentDescription",
      "name": "Booking Service",
      "@id": "https://example.com/agents/booking/ad.json"
    }
  ]
}
```

### 被动发现（注册机制）

智能体主动向搜索服务注册（可选）：

```
POST /api/register
Content-Type: application/json

{
  "did": "did:wba:example.com:service:hotel-assistant",
  "ad_url": "https://example.com/agents/hotel-assistant/ad.json"
}
```

## 发现流程

### 客户端发现流程

```
1. 构造发现 URL
   ↓
2. 发送 GET 请求到 /.well-known/agent-descriptions
   ↓
3. 解析 CollectionPage 响应
   ↓
4. 提取 items[].@id（AD URL 列表）
   ↓
5. 遍历每个 AD URL
   ↓
6. 拉取 AD 文档
   ↓
7. 解析接口和安全配置
   ↓
8. 建立连接
```

### 分页处理

当智能体数量较多时，使用分页：

```json
{
  "@type": "CollectionPage",
  "url": "https://example.com/.well-known/agent-descriptions",
  "items": [/* 第一页的智能体 */],
  "next": "https://example.com/.well-known/agent-descriptions?page=2"
}
```

客户端**必须 (MUST)** 循环拉取直到 `next` 字段为空。

## CollectionPage 规范

### 必需字段

| 字段 | 要求级别 | 说明 |
| --- | --- | --- |
| @context | **必须 MUST** | JSON-LD 上下文 |
| @type | **必须 MUST** | 固定值 `CollectionPage` |
| url | **必须 MUST** | 当前页面的 URL |
| items | **必须 MUST** | 智能体列表 |

### items 项字段

| 字段 | 要求级别 | 说明 |
| --- | --- | --- |
| @type | **必须 MUST** | 固定值 `ad:AgentDescription` |
| name | **必须 MUST** | 智能体名称 |
| @id | **必须 MUST** | AD 文档的 URL |

### 可选字段

| 字段 | 要求级别 | 说明 |
| --- | --- | --- |
| next | **可以 MAY** | 下一页的 URL（分页时提供） |
| totalItems | **可以 MAY** | 智能体总数 |

## 服务端实现

### 静态文件方式

创建静态 JSON 文件：

```json
// /.well-known/agent-descriptions
{
  "@context": {
    "@vocab": "https://schema.org/",
    "ad": "https://agent-network-protocol.com/ad#"
  },
  "@type": "CollectionPage",
  "url": "https://example.com/.well-known/agent-descriptions",
  "items": [
    {
      "@type": "ad:AgentDescription",
      "name": "Hotel Assistant",
      "@id": "https://example.com/agents/hotel-assistant/ad.json"
    }
  ]
}
```

配置 Web 服务器提供此文件。

### 动态生成方式

使用后端服务动态生成（Node.js + Express 示例）：

```typescript
import express from 'express';

const app = express();

app.get('/.well-known/agent-descriptions', (req, res) => {
  const page = parseInt(req.query.page as string) || 1;
  const pageSize = 20;

  // 从数据库获取智能体列表
  const agents = getAgentsFromDB(page, pageSize);
  const hasMore = checkHasMore(page, pageSize);

  res.json({
    '@context': {
      '@vocab': 'https://schema.org/',
      'ad': 'https://agent-network-protocol.com/ad#'
    },
    '@type': 'CollectionPage',
    'url': `https://example.com/.well-known/agent-descriptions?page=${page}`,
    'items': agents.map(agent => ({
      '@type': 'ad:AgentDescription',
      'name': agent.name,
      '@id': agent.adUrl
    })),
    'next': hasMore ? `https://example.com/.well-known/agent-descriptions?page=${page + 1}` : undefined
  });
});
```

## 客户端实现

### 基础发现

```typescript
async function discoverAgents(domain: string): Promise<string[]> {
  const url = `https://${domain}/.well-known/agent-descriptions`;
  const adUrls: string[] = [];

  let currentUrl: string | undefined = url;

  while (currentUrl) {
    const response = await fetch(currentUrl);
    const page = await response.json();

    // 提取 AD URLs
    for (const item of page.items) {
      adUrls.push(item['@id']);
    }

    // 检查是否有下一页
    currentUrl = page.next;
  }

  return adUrls;
}
```

### 完整发现与解析

```typescript
import { discoverAgents, fetchAgentDescription } from '@agent-network-protocol/anp';

// 发现所有智能体
const adUrls = await discoverAgents('example.com');

// 拉取并解析每个 AD
for (const adUrl of adUrls) {
  const ad = await fetchAgentDescription(adUrl);

  console.log(`发现智能体: ${ad.name}`);
  console.log(`DID: ${ad.did}`);
  console.log(`接口: ${ad.interfaces.map(i => i.protocol).join(', ')}`);
}
```

## 安全考虑

### 1. HTTPS 强制要求

发现入口**必须 (MUST)** 通过 HTTPS 访问：

```typescript
if (!url.startsWith('https://')) {
  throw new Error('Discovery endpoint must use HTTPS');
}
```

### 2. 证书验证

客户端**应该 (SHOULD)** 验证 TLS 证书：

```typescript
const response = await fetch(url, {
  // 启用证书验证
  agent: new https.Agent({
    rejectUnauthorized: true
  })
});
```

### 3. 访问控制

对于内部智能体，**应该 (SHOULD)** 实施访问控制：

```typescript
app.get('/.well-known/agent-descriptions', requireAuth, (req, res) => {
  // 仅返回授权用户可见的智能体
  const agents = getAuthorizedAgents(req.user);
  // ...
});
```

### 4. 速率限制

防止滥用，**应该 (SHOULD)** 实施速率限制：

```typescript
import rateLimit from 'express-rate-limit';

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15分钟
  max: 100 // 最多100次请求
});

app.get('/.well-known/agent-descriptions', limiter, (req, res) => {
  // ...
});
```

## 最佳实践

### 1. 缓存策略

设置合理的缓存头：

```typescript
res.setHeader('Cache-Control', 'public, max-age=300'); // 5分钟
res.setHeader('ETag', generateETag(agents));
```

### 2. 分页大小

**建议 (SHOULD)** 每页返回 20-50 个智能体：

```typescript
const PAGE_SIZE = 20;
```

### 3. 错误处理

提供清晰的错误响应：

```typescript
app.get('/.well-known/agent-descriptions', (req, res) => {
  try {
    // ...
  } catch (error) {
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to retrieve agent descriptions'
    });
  }
});
```

### 4. 监控和日志

记录发现请求以便分析：

```typescript
logger.info('Discovery request', {
  ip: req.ip,
  page: req.query.page,
  userAgent: req.headers['user-agent']
});
```

## 与其他发现机制的比较

| 特性 | .well-known | DNS-SD | 注册中心 |
| --- | --- | --- | --- |
| 标准化 | 是（RFC 8615） | 是 | 否 |
| 基础设施 | HTTP/HTTPS | DNS | 自定义服务 |
| 实现难度 | 低 | 中 | 高 |
| 适用场景 | Web 服务 | 本地网络 | 大规模系统 |

## 了解更多

- [.well-known 机制详解](./well-known.md) - 完整的实现指南
- [被动发现](./passive-discovery.md) - 注册机制说明
- [TypeScript SDK](../sdk/typescript-sdk.md) - 使用 SDK 实现发现

## 参考规范

- [RFC 8615: Well-Known URIs](https://www.rfc-editor.org/rfc/rfc8615)
- [JSON-LD 1.1](https://www.w3.org/TR/json-ld11/)
- [Schema.org CollectionPage](https://schema.org/CollectionPage)
- [完整发现协议规范](../../../08-ANP-智能体发现协议规范.md)
