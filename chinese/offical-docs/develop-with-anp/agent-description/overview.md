# 智能体描述协议 (ADP) 概述

智能体描述协议 (Agent Description Protocol, ADP) 定义了智能体如何描述自身的能力、接口和安全要求，是访问智能体的入口。

## 核心价值

### 1. 能力自描述

- 智能体通过 AD 文档声明自己提供的服务
- 客户端无需查阅额外文档即可理解如何交互
- 支持动态发现和适配

### 2. 协议复用

- 复用成熟的协议标准（OpenRPC、JSON-RPC、OpenAPI）
- 降低学习成本和实现难度
- 与现有生态系统无缝集成

### 3. 安全声明

- 明确声明认证要求（did:wba）
- 指定哪些接口需要认证
- 支持细粒度的权限控制

## AD 文档结构

### 最小可用文档

```json
{
  "type": "AgentDescription",
  "protocolType": "ANP",
  "protocolVersion": "1.0.0",
  "did": "did:wba:example.com:service:hotel-assistant",
  "name": "Hotel Assistant",
  "description": "A smart agent for hotel booking",
  "owner": {
    "name": "Grand Hotel",
    "email": "support@grand-hotel.com"
  },
  "interfaces": [{
    "type": "StructuredInterface",
    "protocol": "json-rpc",
    "url": "https://grand-hotel.com/api"
  }],
  "securityDefinitions": {
    "didwba_auth": {
      "scheme": "didwba"
    }
  },
  "security": [{"didwba_auth": []}]
}
```

### 核心字段说明

| 字段 | 要求级别 | 说明 |
| --- | --- | --- |
| type | **必须 MUST** | 固定值 `AgentDescription` |
| protocolType | **必须 MUST** | 固定值 `ANP` |
| protocolVersion | **必须 MUST** | 协议版本号（如 `1.0.0`） |
| did | **必须 MUST** | 智能体的 DID 标识 |
| name | **必须 MUST** | 智能体名称 |
| description | **应该 SHOULD** | 智能体描述 |
| owner | **应该 SHOULD** | 所有者信息 |
| interfaces | **必须 MUST** | 接口列表 |
| securityDefinitions | **必须 MUST** | 安全定义 |
| security | **必须 MUST** | 安全要求 |

## 接口类型

### 1. 结构化接口 (StructuredInterface)

适用于明确定义的 API 操作：

```json
{
  "type": "StructuredInterface",
  "protocol": "openrpc",
  "url": "https://example.com/openrpc.json"
}
```

支持的协议：
- **OpenRPC**: 完整的 RPC 接口描述
- **JSON-RPC**: 简化的 RPC 接口
- **OpenAPI**: REST API 描述

### 2. 自然语言接口 (NaturalLanguageInterface)

适用于灵活的对话场景：

```json
{
  "type": "NaturalLanguageInterface",
  "url": "https://example.com/chat",
  "model": "gpt-4",
  "supportedLanguages": ["zh-CN", "en-US"]
}
```

## 安全配置

### securityDefinitions

定义可用的安全方案：

```json
{
  "securityDefinitions": {
    "didwba_auth": {
      "scheme": "didwba",
      "description": "DID-based authentication using did:wba method"
    }
  }
}
```

### security

指定哪些安全方案必须使用：

```json
{
  "security": [
    {"didwba_auth": []}
  ]
}
```

### humanAuthorization

对于敏感操作，可以要求人类授权：

```json
{
  "security": [
    {
      "didwba_auth": [],
      "humanAuthorization": true
    }
  ]
}
```

## Information vs Interface

### Information（信息）

智能体提供的静态信息或数据源：

```json
{
  "information": [
    {
      "name": "room_list",
      "url": "https://example.com/rooms.json",
      "description": "Available rooms list",
      "format": "json"
    }
  ]
}
```

### Interface（接口）

智能体提供的可调用服务：

```json
{
  "interfaces": [
    {
      "type": "StructuredInterface",
      "protocol": "openrpc",
      "url": "https://example.com/openrpc.json"
    }
  ]
}
```

## 发布 AD 文档

### 托管位置

AD 文档**必须 (MUST)** 可通过 HTTPS 访问：

```
https://{domain}/agents/{name}/ad.json
```

示例：
```
https://grand-hotel.com/agents/hotel-assistant/ad.json
```

### MIME 类型

**必须 (MUST)** 设置正确的 Content-Type：

```
Content-Type: application/json
```

### CORS 配置

**应该 (SHOULD)** 启用 CORS 以支持跨域访问：

```
Access-Control-Allow-Origin: *
Access-Control-Allow-Methods: GET, OPTIONS
```

## 客户端使用流程

```
1. 获取 AD URL（通过发现或手动配置）
   ↓
2. 拉取 AD 文档
   ↓
3. 解析 interfaces 和 securityDefinitions
   ↓
4. 根据 protocol 获取接口描述（OpenRPC/OpenAPI）
   ↓
5. 构造认证头（did:wba）
   ↓
6. 调用接口
```

## 最佳实践

### 1. 最小披露原则

- 仅公开必要的接口和字段
- **不得 (MUST NOT)** 在 AD 中包含 API 密钥、私钥等敏感信息
- 内部接口使用单独的 AD 文档并限制访问

### 2. 版本管理

- 使用 `protocolVersion` 声明协议版本
- 接口更新时提供向后兼容性
- 重大变更时发布新版本 AD

### 3. 接口描述完整性

- 使用 OpenRPC 提供完整的方法签名
- 包含参数类型和返回值说明
- 提供示例请求和响应

### 4. 安全配置

- 敏感接口**必须 (MUST)** 启用认证
- 高风险操作**应该 (SHOULD)** 启用 `humanAuthorization`
- 定期审查安全配置

## 常见模式

### 混合接口

同时提供结构化和自然语言接口：

```json
{
  "interfaces": [
    {
      "type": "StructuredInterface",
      "protocol": "openrpc",
      "url": "https://example.com/openrpc.json"
    },
    {
      "type": "NaturalLanguageInterface",
      "url": "https://example.com/chat"
    }
  ]
}
```

### 多版本支持

支持多个协议版本：

```json
{
  "interfaces": [
    {
      "type": "StructuredInterface",
      "protocol": "openrpc",
      "url": "https://example.com/api/v1/openrpc.json",
      "version": "1.0"
    },
    {
      "type": "StructuredInterface",
      "protocol": "openrpc",
      "url": "https://example.com/api/v2/openrpc.json",
      "version": "2.0"
    }
  ]
}
```

## 了解更多

- [AD 文档规范](./ad-document.md) - 完整的 AD 文档规范
- [接口定义](./interfaces.md) - 接口类型详细说明
- [示例集合](./examples.md) - 各种场景的 AD 示例
- [TypeScript SDK](../sdk/typescript-sdk.md) - 使用 SDK 解析 AD

## 参考规范

- [完整 ADP 规范](../../../07-ANP-智能体描述协议规范.md)
- [OpenRPC Specification](https://open-rpc.org/)
- [JSON-RPC 2.0 Specification](https://www.jsonrpc.org/specification)
