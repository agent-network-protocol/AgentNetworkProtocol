# 基础智能体示例

这是一个最小可用的 ANP 智能体实现示例，展示如何创建一个支持 `did:wba` 认证的简单智能体服务。

## 项目结构

```
basic-agent/
├── package.json
├── tsconfig.json
├── src/
│   ├── server.ts           # 主服务器
│   ├── did.ts              # DID 生成和管理
│   ├── auth.ts             # 认证中间件
│   ├── handlers.ts         # 业务逻辑
│   └── config.ts           # 配置
├── public/
│   ├── .well-known/
│   │   └── agent-descriptions.json
│   ├── did.json
│   └── ad.json
└── README.md
```

## 安装依赖

```bash
npm init -y
npm install express @agent-network-protocol/anp
npm install -D typescript @types/express @types/node ts-node
```

## 配置文件

### package.json

```json
{
  "name": "anp-basic-agent",
  "version": "1.0.0",
  "description": "Basic ANP agent example",
  "main": "dist/server.js",
  "scripts": {
    "dev": "ts-node src/server.ts",
    "build": "tsc",
    "start": "node dist/server.js"
  },
  "dependencies": {
    "express": "^4.18.2",
    "@agent-network-protocol/anp": "^1.0.0"
  },
  "devDependencies": {
    "typescript": "^5.0.0",
    "@types/express": "^4.17.17",
    "@types/node": "^20.0.0",
    "ts-node": "^10.9.1"
  }
}
```

### tsconfig.json

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "commonjs",
    "lib": ["ES2020"],
    "outDir": "./dist",
    "rootDir": "./src",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist"]
}
```

## 源代码

### src/config.ts

```typescript
export const CONFIG = {
  port: 3000,
  domain: 'localhost:3000',
  agentName: 'greeting-agent',
  did: 'did:wba:localhost:3000:service:greeting-agent',
  timeWindow: 60, // 60秒时间窗口
  nonceExpiry: 120 // nonce缓存120秒
};
```

### src/did.ts

```typescript
import { generateKeyPair, exportPublicKeyJwk } from '@agent-network-protocol/anp';
import { CONFIG } from './config';
import fs from 'fs';
import path from 'path';

export interface DIDDocument {
  id: string;
  verificationMethod: Array<{
    id: string;
    type: string;
    controller: string;
    publicKeyJwk: any;
  }>;
  authentication: string[];
}

/**
 * 生成或加载 DID 密钥对
 */
export async function initializeDID(): Promise<{
  keyPair: CryptoKeyPair;
  didDocument: DIDDocument;
}> {
  const keyPath = path.join(__dirname, '../keys/private-key.json');

  let keyPair: CryptoKeyPair;

  // 尝试加载现有密钥
  if (fs.existsSync(keyPath)) {
    console.log('Loading existing key pair...');
    // 这里简化处理，实际应该从文件加载
    keyPair = await generateKeyPair();
  } else {
    console.log('Generating new key pair...');
    keyPair = await generateKeyPair();

    // 保存密钥（实际应该加密存储）
    const keysDir = path.dirname(keyPath);
    if (!fs.existsSync(keysDir)) {
      fs.mkdirSync(keysDir, { recursive: true });
    }
    // 注意：这里仅作示例，实际应使用 KMS 或安全存储
  }

  // 创建 DID 文档
  const publicKeyJwk = await exportPublicKeyJwk(keyPair.publicKey);

  const didDocument: DIDDocument = {
    id: CONFIG.did,
    verificationMethod: [{
      id: `${CONFIG.did}#key-1`,
      type: 'EcdsaSecp256r1VerificationKey2019',
      controller: CONFIG.did,
      publicKeyJwk
    }],
    authentication: [`${CONFIG.did}#key-1`]
  };

  // 保存 DID 文档到 public 目录
  const didDocPath = path.join(__dirname, '../public/did.json');
  fs.writeFileSync(didDocPath, JSON.stringify(didDocument, null, 2));

  console.log(`DID document saved to ${didDocPath}`);

  return { keyPair, didDocument };
}
```

### src/auth.ts

```typescript
import { Request, Response, NextFunction } from 'express';
import {
  parseAuthorizationHeader,
  verifySignature,
  fetchDIDDocument
} from '@agent-network-protocol/anp';
import { CONFIG } from './config';

// Nonce 缓存（生产环境应使用 Redis）
const nonceCache = new Set<string>();

// 清理过期 nonce
setInterval(() => {
  nonceCache.clear();
}, CONFIG.nonceExpiry * 1000);

/**
 * did:wba 认证中间件
 */
export async function didAuthMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('DIDWba ')) {
      res.status(401).json({
        error: 'Unauthorized',
        message: 'Missing or invalid Authorization header'
      });
      return;
    }

    // 解析认证头
    const authData = parseAuthorizationHeader(authHeader);

    // 1. 验证时间戳
    const timestamp = new Date(authData.timestamp);
    const now = new Date();
    const timeDiff = Math.abs(now.getTime() - timestamp.getTime()) / 1000;

    if (timeDiff > CONFIG.timeWindow) {
      res.status(401).json({
        error: 'Unauthorized',
        message: 'Timestamp out of valid time window'
      });
      return;
    }

    // 2. 验证 nonce（防重放）
    if (nonceCache.has(authData.nonce)) {
      res.status(401).json({
        error: 'Unauthorized',
        message: 'Nonce already used (replay attack detected)'
      });
      return;
    }

    // 3. 获取 DID 文档
    const didDocument = await fetchDIDDocument(authData.did);

    // 4. 验证签名
    const isValid = await verifySignature({
      did: authData.did,
      nonce: authData.nonce,
      timestamp: authData.timestamp,
      service: `http://${CONFIG.domain}${req.path}`,
      signature: authData.signature,
      verificationMethod: authData.verification_method,
      didDocument
    });

    if (!isValid) {
      res.status(401).json({
        error: 'Unauthorized',
        message: 'Invalid signature'
      });
      return;
    }

    // 5. 缓存 nonce
    nonceCache.add(authData.nonce);

    // 6. 将认证信息附加到请求
    (req as any).auth = {
      did: authData.did,
      verified: true
    };

    next();
  } catch (error) {
    console.error('Authentication error:', error);
    res.status(401).json({
      error: 'Unauthorized',
      message: error instanceof Error ? error.message : 'Authentication failed'
    });
  }
}
```

### src/handlers.ts

```typescript
import { Request, Response } from 'express';

/**
 * JSON-RPC 请求处理器
 */
export async function handleJsonRpc(req: Request, res: Response): Promise<void> {
  const { jsonrpc, id, method, params } = req.body;

  // 验证 JSON-RPC 格式
  if (jsonrpc !== '2.0') {
    res.status(400).json({
      jsonrpc: '2.0',
      id,
      error: {
        code: -32600,
        message: 'Invalid Request'
      }
    });
    return;
  }

  try {
    // 路由到具体方法
    let result;

    switch (method) {
      case 'greeting.hello':
        result = await handleHello(params, (req as any).auth);
        break;

      case 'greeting.echo':
        result = await handleEcho(params);
        break;

      default:
        res.status(404).json({
          jsonrpc: '2.0',
          id,
          error: {
            code: -32601,
            message: 'Method not found'
          }
        });
        return;
    }

    res.json({
      jsonrpc: '2.0',
      id,
      result
    });
  } catch (error) {
    res.status(500).json({
      jsonrpc: '2.0',
      id,
      error: {
        code: -32603,
        message: 'Internal error',
        data: error instanceof Error ? error.message : 'Unknown error'
      }
    });
  }
}

/**
 * greeting.hello 方法
 */
async function handleHello(
  params: any,
  auth: { did: string; verified: boolean }
): Promise<any> {
  const name = params?.name || auth.did;

  return {
    message: `Hello, ${name}!`,
    timestamp: new Date().toISOString(),
    authenticated: auth.verified
  };
}

/**
 * greeting.echo 方法
 */
async function handleEcho(params: any): Promise<any> {
  return {
    echo: params,
    timestamp: new Date().toISOString()
  };
}
```

### src/server.ts

```typescript
import express from 'express';
import path from 'path';
import { CONFIG } from './config';
import { initializeDID } from './did';
import { didAuthMiddleware } from './auth';
import { handleJsonRpc } from './handlers';

const app = express();

// 中间件
app.use(express.json());
app.use(express.static('public'));

// 初始化
let serverKeyPair: CryptoKeyPair;

async function initialize() {
  const { keyPair, didDocument } = await initializeDID();
  serverKeyPair = keyPair;

  console.log('✓ DID initialized:', CONFIG.did);
  console.log('✓ DID document:', didDocument);
}

// 路由

// 健康检查
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// DID 文档（也可以通过静态文件提供）
app.get('/did.json', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/did.json'));
});

// Agent Description
app.get('/ad.json', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/ad.json'));
});

// 发现入口
app.get('/.well-known/agent-descriptions', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/.well-known/agent-descriptions.json'));
});

// JSON-RPC API（需要认证）
app.post('/api/rpc', didAuthMiddleware, handleJsonRpc);

// 公开的 JSON-RPC API（无需认证，仅作演示）
app.post('/api/public', handleJsonRpc);

// 启动服务器
async function start() {
  await initialize();

  app.listen(CONFIG.port, () => {
    console.log(`\n🚀 ANP Basic Agent running on http://${CONFIG.domain}`);
    console.log(`\n📍 Endpoints:`);
    console.log(`   - DID Document:     http://${CONFIG.domain}/did.json`);
    console.log(`   - Agent Description: http://${CONFIG.domain}/ad.json`);
    console.log(`   - Discovery:        http://${CONFIG.domain}/.well-known/agent-descriptions`);
    console.log(`   - JSON-RPC (auth):  http://${CONFIG.domain}/api/rpc`);
    console.log(`   - JSON-RPC (public): http://${CONFIG.domain}/api/public`);
    console.log(`\n✨ Ready to accept requests!`);
  });
}

start().catch(console.error);
```

## 静态文件

### public/.well-known/agent-descriptions.json

```json
{
  "@context": {
    "@vocab": "https://schema.org/",
    "ad": "https://agent-network-protocol.com/ad#"
  },
  "@type": "CollectionPage",
  "url": "http://localhost:3000/.well-known/agent-descriptions",
  "items": [
    {
      "@type": "ad:AgentDescription",
      "name": "Greeting Agent",
      "@id": "http://localhost:3000/ad.json"
    }
  ]
}
```

### public/ad.json

```json
{
  "type": "AgentDescription",
  "protocolType": "ANP",
  "protocolVersion": "1.0.0",
  "did": "did:wba:localhost:3000:service:greeting-agent",
  "name": "Greeting Agent",
  "description": "A simple agent that provides greeting services",
  "owner": {
    "name": "Example Organization",
    "email": "support@example.com"
  },
  "securityDefinitions": {
    "didwba_auth": {
      "scheme": "didwba",
      "description": "DID-based authentication using did:wba method"
    }
  },
  "security": [
    {
      "didwba_auth": []
    }
  ],
  "interfaces": [
    {
      "type": "StructuredInterface",
      "protocol": "json-rpc",
      "url": "http://localhost:3000/api/rpc",
      "methods": [
        {
          "name": "greeting.hello",
          "description": "Returns a greeting message",
          "params": [
            {
              "name": "name",
              "type": "string",
              "required": false,
              "description": "Name to greet"
            }
          ],
          "result": {
            "type": "object",
            "properties": {
              "message": { "type": "string" },
              "timestamp": { "type": "string" },
              "authenticated": { "type": "boolean" }
            }
          }
        },
        {
          "name": "greeting.echo",
          "description": "Echoes back the input",
          "params": [
            {
              "name": "data",
              "type": "any",
              "required": true
            }
          ],
          "result": {
            "type": "object",
            "properties": {
              "echo": { "type": "any" },
              "timestamp": { "type": "string" }
            }
          }
        }
      ]
    }
  ]
}
```

## 运行示例

### 启动服务器

```bash
npm run dev
```

### 测试端点

#### 1. 检查健康状态

```bash
curl http://localhost:3000/health
```

#### 2. 获取 DID 文档

```bash
curl http://localhost:3000/did.json
```

#### 3. 获取 Agent Description

```bash
curl http://localhost:3000/ad.json
```

#### 4. 测试发现入口

```bash
curl http://localhost:3000/.well-known/agent-descriptions
```

#### 5. 调用公开 API（无需认证）

```bash
curl -X POST http://localhost:3000/api/public \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc": "2.0",
    "id": 1,
    "method": "greeting.echo",
    "params": {"message": "Hello, ANP!"}
  }'
```

#### 6. 调用认证 API（需要 did:wba 认证）

使用 SDK 创建认证请求：

```typescript
import {
  generateKeyPair,
  createAuthorizationHeader,
  callAgent
} from '@agent-network-protocol/anp';

// 生成客户端密钥对
const clientKeyPair = await generateKeyPair();
const clientDid = 'did:wba:client.com:user:alice';

// 创建认证头
const authHeader = await createAuthorizationHeader({
  did: clientDid,
  service: 'http://localhost:3000/api/rpc',
  verificationMethod: 'key-1',
  keyPair: clientKeyPair
});

// 调用智能体
const response = await fetch('http://localhost:3000/api/rpc', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': authHeader
  },
  body: JSON.stringify({
    jsonrpc: '2.0',
    id: 1,
    method: 'greeting.hello',
    params: { name: 'Alice' }
  })
});

const result = await response.json();
console.log(result);
// { jsonrpc: '2.0', id: 1, result: { message: 'Hello, Alice!', ... } }
```

## 安全注意事项

### 1. 私钥管理

⚠️ **示例中的密钥管理仅用于演示！**

生产环境**必须 (MUST)**：
- 使用 KMS（密钥管理服务）或 HSM（硬件安全模块）
- 加密存储私钥
- 实施密钥轮换机制
- 记录密钥访问日志

### 2. Nonce 缓存

示例使用内存缓存，生产环境**应该 (SHOULD)**：
- 使用 Redis 等持久化缓存
- 设置合理的过期时间
- 考虑分布式部署的缓存同步

### 3. HTTPS

示例使用 HTTP，生产环境**必须 (MUST)**：
- 使用 HTTPS
- 配置有效的 TLS 证书
- 启用 HSTS

### 4. 错误处理

生产环境**应该 (SHOULD)**：
- 不在错误消息中泄露敏感信息
- 记录详细的错误日志
- 实施速率限制

## 扩展示例

### 添加更多方法

在 `src/handlers.ts` 中添加新方法：

```typescript
case 'data.query':
  result = await handleDataQuery(params, auth);
  break;
```

### 添加数据库支持

```bash
npm install pg
```

```typescript
import { Pool } from 'pg';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});
```

### 添加日志

```bash
npm install winston
```

```typescript
import winston from 'winston';

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.json(),
  transports: [
    new winston.transports.File({ filename: 'error.log', level: 'error' }),
    new winston.transports.File({ filename: 'combined.log' })
  ]
});
```

## 下一步

完成基础智能体后，你可以：

1. [**添加支付功能**](../payment-integration/) - 集成 AP2 支付协议
2. [**部署到生产**](../../implementation/deployment.md) - 部署指南
3. [**安全加固**](../../security/best-practices.md) - 安全最佳实践
4. [**监控和日志**](../../implementation/troubleshooting.md) - 运维指南

## 参考资源

- [TypeScript SDK 文档](../../develop-with-anp/sdk/typescript-sdk.md)
- [身份认证详解](../../develop-with-anp/identity/authentication.md)
- [JSON-RPC 规范](https://www.jsonrpc.org/specification)
