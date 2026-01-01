# ANP TypeScript SDK 使用指南

## 摘要

本文档介绍 ANP TypeScript SDK 的使用方法，帮助开发者在 TypeScript/JavaScript 环境中实现智能体通信。SDK 涵盖身份认证（did:wba）、智能体描述解析、请求签名与验证、支付协议（AP2）等核心功能。

## 概述

ANP TypeScript SDK 是 Agent Network Protocol 的 JavaScript 运行时实现，提供以下核心能力：

1. **身份与认证（DID-WBA）**：去中心化身份生成、签名、验证
2. **HTTP 请求认证**：自动生成认证头，支持请求签名验证
3. **智能体发现与描述**：解析和验证智能体描述文档
4. **支付协议（AP2）**：支持 ECDSA secp256k1 签名的支付授权
5. **工具调用**：自动解析智能体接口，生成可调用工具

## 安装

### NPM/Yarn 安装

```bash
npm install @anp/sdk
# 或
yarn add @anp/sdk
```

### Pnpm 安装

```bash
pnpm add @anp/sdk
```

### 从源代码安装（开发）

```bash
git clone https://github.com/agent-network-protocol/anp.git
cd anp/sdk/typescript
npm install
npm run build
```

## 快速开始

### 1. 生成 DID 与密钥对

```typescript
import { DIDWba, KeyPair } from '@anp/sdk';

// 生成新的密钥对（P-256）
const keyPair = KeyPair.generate();

// 创建 DID
const did = DIDWba.create({
  domain: 'my-agent.example.com',
  path: 'agent/alice',
  publicKey: keyPair.publicKey,
});

console.log('DID:', did.toString());
// 输出：did:wba:my-agent.example.com:agent:alice
console.log('Private Key (保管好！):', keyPair.privateKey.toPem());
```

### 2. 创建认证请求头

```typescript
import { AuthorizationHeader } from '@anp/sdk';

const authHeader = AuthorizationHeader.create({
  did: did.toString(),
  privateKey: keyPair.privateKey,
  verificationMethod: 'key-1',
  service: 'target-service.com',
});

// 获取 Authorization 头值
const headerValue = authHeader.toString();
// Authorization: DIDWba did="...", nonce="...", timestamp="...", signature="..."

// 在 HTTP 请求中使用
const response = await fetch('https://target-service.com/api/endpoint', {
  method: 'GET',
  headers: {
    'Authorization': headerValue,
  },
});
```

### 3. 验证请求签名（服务端）

```typescript
import { AuthorizationHeader, DIDResolver } from '@anp/sdk';

// 从请求头解析认证信息
const authHeader = AuthorizationHeader.fromString(
  request.headers.get('Authorization')
);

// 创建 DID 解析器
const resolver = new DIDResolver();

// 验证签名
try {
  const verified = await authHeader.verify(resolver, {
    service: 'my-service.com',
    timestampWindow: 60, // 60 秒时间窗口
  });

  if (verified) {
    console.log('请求有效，DID:', authHeader.did);
  }
} catch (error) {
  console.error('验证失败:', error.message);
  // 返回 401 Unauthorized
}
```

## API 参考

### 核心类

#### DIDWba

表示 Agent Network Protocol 的 DID:WBA 标识符。

```typescript
class DIDWba {
  // 创建 DID
  static create(options: {
    domain: string;           // 域名
    path: string;             // 路径（可选，多段用 / 分隔）
    publicKey: PublicKey;      // 公钥
  }): DIDWba;

  // 解析 DID 字符串
  static parse(didString: string): DIDWba;

  // 属性
  domain: string;
  path: string;
  publicKey: PublicKey;

  // 方法
  toString(): string;                    // 返回 DID 字符串
  toJSON(): object;                      // 返回 JSON 对象
  equals(other: DIDWba): boolean;        // 比较是否相同
  getFragment(fragmentId: string): string; // 获取带 fragment 的 DID
}
```

示例：

```typescript
const did = DIDWba.parse('did:wba:example.com:agent:alice');
console.log(did.domain);  // "example.com"
console.log(did.path);    // "agent/alice"
console.log(did.getFragment('key-1'));
// "did:wba:example.com:agent:alice#key-1"
```

#### KeyPair

椭圆曲线密钥对（P-256）。

```typescript
class KeyPair {
  // 生成新密钥对
  static generate(): KeyPair;

  // 从 PEM 格式导入
  static fromPem(privateKeyPem: string): KeyPair;

  // 属性
  privateKey: PrivateKey;
  publicKey: PublicKey;

  // 方法
  export(): { privateKeyPem: string; publicKeyJwk: object };
}
```

示例：

```typescript
// 生成密钥对
const keyPair = KeyPair.generate();

// 导出
const exported = keyPair.export();
console.log('Private Key PEM:', exported.privateKeyPem);
console.log('Public Key JWK:', exported.publicKeyJwk);

// 导入
const importedKeyPair = KeyPair.fromPem(exported.privateKeyPem);
```

#### AuthorizationHeader

HTTP Authorization 头的 DIDWba 实现。

```typescript
class AuthorizationHeader {
  // 创建新的授权头
  static create(options: {
    did: string;                    // DID 字符串
    privateKey: PrivateKey;         // 私钥（用于签名）
    verificationMethod: string;     // DID 文档中的 key fragment
    service: string;                // 服务域名
    nonce?: string;                 // 随机值（可选，自动生成）
    timestamp?: string;             // 时间戳（可选，自动使用当前时间）
  }): AuthorizationHeader;

  // 从字符串解析（服务端）
  static fromString(headerValue: string): AuthorizationHeader;

  // 属性
  did: string;
  nonce: string;
  timestamp: string;
  verificationMethod: string;
  signature: string;

  // 方法
  toString(): string;               // 返回 HTTP 头值
  toJSON(): object;                 // 返回 JSON 对象
  verify(resolver: DIDResolver, options?: VerifyOptions): Promise<boolean>;
}
```

示例：

```typescript
// 客户端：创建认证头
const authHeader = AuthorizationHeader.create({
  did: 'did:wba:client.com:agent:alice',
  privateKey: keyPair.privateKey,
  verificationMethod: 'key-1',
  service: 'server.com',
});

const headerValue = authHeader.toString();
// 结果：DIDWba did="did:wba:client.com:agent:alice", nonce="...", timestamp="...", signature="..."

// 服务端：解析和验证
const parsed = AuthorizationHeader.fromString(headerValue);
const isValid = await parsed.verify(resolver, {
  service: 'server.com',
  timestampWindow: 60,
});
```

#### DIDDocument

W3C DID 文档。

```typescript
class DIDDocument {
  // 属性
  id: string;
  verificationMethod: VerificationMethod[];
  authentication: string[];
  assertionMethod?: string[];
  keyAgreement?: string[];

  // 方法
  static create(options: {
    did: string;
    publicKey: PublicKey;
    keyFragment?: string;  // 默认 'key-1'
  }): DIDDocument;

  getVerificationMethod(fragment: string): VerificationMethod | null;
  addVerificationMethod(method: VerificationMethod): void;
  toJSON(): object;
}
```

示例：

```typescript
const didDoc = DIDDocument.create({
  did: 'did:wba:example.com:agent:alice',
  publicKey: keyPair.publicKey,
  keyFragment: 'key-1',
});

console.log(JSON.stringify(didDoc, null, 2));
```

#### DIDResolver

解析和验证 DID 文档的解析器。

```typescript
class DIDResolver {
  // 创建解析器（可选配置缓存）
  constructor(options?: {
    cache?: boolean;
    cacheTTL?: number;  // 秒
  });

  // 方法
  resolve(did: string): Promise<DIDDocument>;
  resolvePublicKey(did: string, fragment?: string): Promise<PublicKey>;

  // 清除缓存
  clearCache(did?: string): void;
}
```

示例：

```typescript
const resolver = new DIDResolver({ cache: true, cacheTTL: 300 });

// 解析 DID 文档
const didDoc = await resolver.resolve('did:wba:example.com:agent:alice');

// 获取特定公钥
const publicKey = await resolver.resolvePublicKey(
  'did:wba:example.com:agent:alice',
  'key-1'
);
```

### 签名和验证

#### JcsSignature

JSON Canonicalization Scheme (JCS) 签名实现。

```typescript
class JcsSignature {
  // 对数据签名
  static sign(data: object, privateKey: PrivateKey): string;

  // 验证签名
  static verify(data: object, signature: string, publicKey: PublicKey): boolean;

  // 获取规范化 JSON
  static canonicalize(data: object): string;
}
```

示例：

```typescript
import { JcsSignature } from '@anp/sdk';

const data = {
  nonce: 'abc123',
  timestamp: '2024-12-05T12:34:56Z',
  service: 'example.com',
  did: 'did:wba:example.com:user:alice',
};

// 签名
const signature = JcsSignature.sign(data, keyPair.privateKey);

// 验证
const isValid = JcsSignature.verify(data, signature, keyPair.publicKey);
console.log('签名有效:', isValid);
```

### 智能体描述

#### AgentDescription

智能体描述文档的解析和操作。

```typescript
interface AgentDescription {
  // 基本信息
  id: string;                    // 智能体 DID 或标识
  name: string;                  // 智能体名称
  description?: string;          // 描述
  owner?: string;                // 所有者 DID

  // 支持的接口
  interfaces: Interface[];

  // 安全定义
  securityDefinitions?: SecurityDefinition[];
}

interface Interface {
  id: string;                    // 接口标识
  type: 'StructuredInterface' | 'NaturalLanguageInterface';
  methods?: Method[];            // 结构化接口的方法
  url?: string;                  // NLI 的服务 URL
}

interface Method {
  id: string;
  name: string;
  description?: string;
  parameters: Parameter[];
  returns?: ReturnType;
}

class AgentDescriptionParser {
  // 解析 JSON 为 AgentDescription
  static parse(json: object): AgentDescription;

  // 验证接口签名
  static verifyInterface(
    agentDesc: AgentDescription,
    resolver: DIDResolver
  ): Promise<boolean>;

  // 获取方法
  getMethod(interfaceId: string, methodName: string): Method | null;
}
```

示例：

```typescript
import { AgentDescriptionParser } from '@anp/sdk';

const agentDescJson = {
  id: 'did:wba:hotel.com:service:booking',
  name: 'Hotel Booking Agent',
  interfaces: [
    {
      id: 'booking-api',
      type: 'StructuredInterface',
      methods: [
        {
          id: 'search-rooms',
          name: 'search',
          description: '搜索可用房间',
          parameters: [
            {
              name: 'checkIn',
              type: 'string',
              format: 'date',
            },
          ],
        },
      ],
    },
  ],
};

const agentDesc = AgentDescriptionParser.parse(agentDescJson);
console.log('智能体:', agentDesc.name);
```

### 支付协议（AP2）

#### PaymentAuthorization

支付授权（AP2 协议）。

```typescript
interface PaymentMandate {
  version: string;               // "1.0"
  id: string;                    // 唯一标识
  payee: string;                 // 收款人 DID
  amount: string;                // 金额（精确字符串）
  currency: string;              // 货币代码（如 'USD', 'CNY'）
  description?: string;          // 描述
  timestamp: string;             // ISO 8601 时间戳
}

interface PaymentAuthorization {
  mandate: PaymentMandate;
  signature: string;             // secp256k1 ECDSA 签名
  signatureAlgorithm: 'ES256K';
}

class PaymentProcessor {
  // 创建支付授权
  static createAuthorization(
    mandate: PaymentMandate,
    privateKey: PrivateKey
  ): PaymentAuthorization;

  // 验证支付授权
  static verifyAuthorization(
    authorization: PaymentAuthorization,
    publicKey: PublicKey
  ): boolean;

  // 创建支付请求（AP2）
  static createPaymentRequest(
    mandate: PaymentMandate,
    sellerDid: string
  ): object;
}
```

示例：

```typescript
import { PaymentProcessor } from '@anp/sdk';

const mandate = {
  version: '1.0',
  id: 'payment-001',
  payee: 'did:wba:merchant.com:agent:seller',
  amount: '100.00',
  currency: 'USD',
  timestamp: new Date().toISOString(),
};

// 创建支付授权
const auth = PaymentProcessor.createAuthorization(mandate, keyPair.privateKey);

// 验证支付授权
const isValid = PaymentProcessor.verifyAuthorization(auth, keyPair.publicKey);
console.log('支付授权有效:', isValid);
```

## 常用示例

### 示例 1：生成 DID 和 DID 文档

```typescript
import { DIDWba, KeyPair, DIDDocument } from '@anp/sdk';

async function generateAgent() {
  // 1. 生成密钥对
  const keyPair = KeyPair.generate();

  // 2. 创建 DID
  const did = DIDWba.create({
    domain: 'my-agent.io',
    path: 'agent/alice',
    publicKey: keyPair.publicKey,
  });

  // 3. 生成 DID 文档
  const didDoc = DIDDocument.create({
    did: did.toString(),
    publicKey: keyPair.publicKey,
    keyFragment: 'key-1',
  });

  // 4. 导出配置
  const config = {
    did: did.toString(),
    ...keyPair.export(),
    didDocument: didDoc.toJSON(),
  };

  // 保存到配置文件（安全地存储！）
  console.log(JSON.stringify(config, null, 2));

  return config;
}

// 使用
const agentConfig = await generateAgent();
```

### 示例 2：客户端发送认证请求

```typescript
import { AuthorizationHeader, KeyPair, DIDWba } from '@anp/sdk';

async function callAgentAPI() {
  // 从配置加载
  const keyPair = KeyPair.fromPem(process.env.PRIVATE_KEY!);
  const didString = process.env.DID!;

  // 创建认证头
  const authHeader = AuthorizationHeader.create({
    did: didString,
    privateKey: keyPair.privateKey,
    verificationMethod: 'key-1',
    service: 'target-agent.io',
  });

  // 发送请求
  const response = await fetch(
    'https://target-agent.io/api/agent-description',
    {
      method: 'GET',
      headers: {
        'Authorization': authHeader.toString(),
        'Content-Type': 'application/json',
      },
    }
  );

  if (!response.ok) {
    throw new Error(`API error: ${response.status}`);
  }

  return response.json();
}
```

### 示例 3：服务端验证请求

```typescript
import { AuthorizationHeader, DIDResolver } from '@anp/sdk';

async function verifyIncomingRequest(request: Request) {
  // 提取 Authorization 头
  const authHeaderValue = request.headers.get('Authorization');
  if (!authHeaderValue) {
    return { valid: false, error: '缺少 Authorization 头' };
  }

  try {
    // 解析认证头
    const authHeader = AuthorizationHeader.fromString(authHeaderValue);

    // 创建 DID 解析器（可启用缓存）
    const resolver = new DIDResolver({ cache: true, cacheTTL: 300 });

    // 验证签名
    const verified = await authHeader.verify(resolver, {
      service: 'my-agent.io',
      timestampWindow: 60,  // 60 秒窗口
    });

    if (!verified) {
      return { valid: false, error: '签名验证失败' };
    }

    // 检查访问权限
    const clientDid = authHeader.did;
    const hasAccess = await checkDIDAccess(clientDid);

    if (!hasAccess) {
      return {
        valid: false,
        error: '无访问权限',
        statusCode: 403
      };
    }

    return { valid: true, clientDid };
  } catch (error) {
    return { valid: false, error: error.message };
  }
}

// 在 Express 或 Fastify 中使用
app.use(async (req, res, next) => {
  const result = await verifyIncomingRequest(req);

  if (!result.valid) {
    return res.status(result.statusCode || 401).json({
      error: result.error,
    });
  }

  // 存储到上下文供后续路由使用
  req.clientDid = result.clientDid;
  next();
});
```

### 示例 4：解析和使用智能体描述

```typescript
import { AgentDescriptionParser, DIDResolver } from '@anp/sdk';

async function discoveryAgent() {
  // 1. 获取智能体描述
  const response = await fetch(
    'https://hotel.example.com/.well-known/agent-description'
  );
  const agentDescJson = await response.json();

  // 2. 解析描述
  const agentDesc = AgentDescriptionParser.parse(agentDescJson);
  console.log(`发现智能体: ${agentDesc.name}`);

  // 3. 验证接口签名（可选）
  const resolver = new DIDResolver();
  const verified = await AgentDescriptionParser.verifyInterface(
    agentDesc,
    resolver
  );
  console.log(`接口签名有效: ${verified}`);

  // 4. 列出所有接口方法
  agentDesc.interfaces.forEach((iface) => {
    console.log(`接口: ${iface.id} (${iface.type})`);

    if (iface.methods) {
      iface.methods.forEach((method) => {
        console.log(`  - ${method.name}: ${method.description}`);
      });
    }
  });

  return agentDesc;
}
```

### 示例 5：生成和验证支付授权

```typescript
import { PaymentProcessor, KeyPair } from '@anp/sdk';

async function processPayment() {
  // 1. 生成买方密钥
  const buyerKeyPair = KeyPair.generate();

  // 2. 创建支付授权
  const mandate = {
    version: '1.0',
    id: `payment-${Date.now()}`,
    payee: 'did:wba:merchant.com:agent:seller',
    amount: '99.99',
    currency: 'USD',
    description: '购买商品',
    timestamp: new Date().toISOString(),
  };

  // 3. 使用买方私钥签署
  const authorization = PaymentProcessor.createAuthorization(
    mandate,
    buyerKeyPair.privateKey
  );

  // 4. 卖方接收并验证
  const isValid = PaymentProcessor.verifyAuthorization(
    authorization,
    buyerKeyPair.publicKey
  );

  if (!isValid) {
    throw new Error('支付授权签名无效');
  }

  console.log('支付授权已验证，可以处理');

  return authorization;
}
```

### 示例 6：构建智能体服务器（Express）

```typescript
import express, { Request, Response } from 'express';
import { AuthorizationHeader, DIDResolver, AgentDescriptionParser } from '@anp/sdk';

interface AuthenticatedRequest extends Request {
  clientDid?: string;
  resolver?: DIDResolver;
}

const app = express();
app.use(express.json());

// 中间件：验证 DIDWba 认证
app.use(async (req: AuthenticatedRequest, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    return res.status(401).json({ error: '缺少授权' });
  }

  try {
    const header = AuthorizationHeader.fromString(authHeader);
    const resolver = new DIDResolver({ cache: true });

    const verified = await header.verify(resolver, {
      service: 'my-agent.io',
      timestampWindow: 60,
    });

    if (!verified) {
      return res.status(401).json({ error: '授权失败' });
    }

    req.clientDid = header.did;
    req.resolver = resolver;
    next();
  } catch (error) {
    res.status(401).json({ error: error.message });
  }
});

// 路由：返回智能体描述
app.get('/.well-known/agent-description', (req: AuthenticatedRequest, res) => {
  const agentDesc = {
    id: 'did:wba:my-agent.io:service:main',
    name: 'My Agent',
    interfaces: [
      {
        id: 'main-api',
        type: 'StructuredInterface',
        methods: [
          {
            id: 'hello',
            name: 'greet',
            description: '问候用户',
            parameters: [
              { name: 'name', type: 'string' },
            ],
          },
        ],
      },
    ],
  };

  res.json(agentDesc);
});

// 路由：处理方法调用
app.post('/api/call', (req: AuthenticatedRequest, res) => {
  const { method, params } = req.body;

  console.log(`${req.clientDid} 调用方法: ${method}`);

  if (method === 'greet') {
    const name = params.name || 'Guest';
    res.json({ result: `Hello, ${name}!` });
  } else {
    res.status(404).json({ error: '方法未找到' });
  }
});

app.listen(3000, () => {
  console.log('Agent server running on :3000');
});
```

## 高级用法

### 缓存 DID 文档

```typescript
import { DIDResolver } from '@anp/sdk';

// 创建启用缓存的解析器
const resolver = new DIDResolver({
  cache: true,
  cacheTTL: 3600,  // 1 小时缓存
});

// 首次调用会从网络获取
const didDoc1 = await resolver.resolve('did:wba:example.com:agent:alice');

// 第二次调用会使用缓存（更快）
const didDoc2 = await resolver.resolve('did:wba:example.com:agent:alice');

// 清除特定 DID 的缓存
resolver.clearCache('did:wba:example.com:agent:alice');

// 清除所有缓存
resolver.clearCache();
```

### 自定义 nonce 和时间戳

```typescript
import { AuthorizationHeader, crypto } from '@anp/sdk';

// 使用自定义 nonce 和时间戳
const authHeader = AuthorizationHeader.create({
  did: 'did:wba:example.com:agent:alice',
  privateKey: keyPair.privateKey,
  verificationMethod: 'key-1',
  service: 'target.com',

  // 自定义值（通常不需要）
  nonce: crypto.randomBytes(16).toString('hex'),
  timestamp: new Date().toISOString(),
});
```

### 批量验证多个签名

```typescript
import { AuthorizationHeader, DIDResolver } from '@anp/sdk';

async function verifyMultiple(headers: string[], service: string) {
  const resolver = new DIDResolver({ cache: true });
  const results = [];

  for (const headerValue of headers) {
    try {
      const header = AuthorizationHeader.fromString(headerValue);
      const verified = await header.verify(resolver, { service });

      results.push({
        did: header.did,
        verified,
      });
    } catch (error) {
      results.push({
        error: error.message,
      });
    }
  }

  return results;
}
```

### 实现自定义 DID 解析器

```typescript
import { DIDResolver, DIDDocument } from '@anp/sdk';

class CustomDIDResolver extends DIDResolver {
  private database: Map<string, DIDDocument> = new Map();

  // 覆盖 resolve 方法使用本地数据库
  async resolve(did: string): Promise<DIDDocument> {
    // 先检查缓存
    const cached = this.getFromCache(did);
    if (cached) return cached;

    // 然后检查本地数据库
    const localDoc = this.database.get(did);
    if (localDoc) {
      this.setCache(did, localDoc);
      return localDoc;
    }

    // 最后调用默认实现（从网络获取）
    return super.resolve(did);
  }

  // 添加本地 DID 文档
  registerDID(did: string, doc: DIDDocument) {
    this.database.set(did, doc);
  }
}
```

### 支持多密钥

```typescript
import { DIDDocument, KeyPair } from '@anp/sdk';

// 创建带多个公钥的 DID 文档
const didDoc = DIDDocument.create({
  did: 'did:wba:example.com:agent:alice',
  publicKey: keyPair1.publicKey,
  keyFragment: 'key-1',
});

// 添加第二个密钥
didDoc.addVerificationMethod({
  id: 'did:wba:example.com:agent:alice#key-2',
  type: 'EcdsaSecp256r1VerificationKey2019',
  controller: 'did:wba:example.com:agent:alice',
  publicKeyJwk: keyPair2.publicKey.toJwk(),
});

// 现在可以用 key-1 或 key-2 签署请求
const authHeader = AuthorizationHeader.create({
  did: 'did:wba:example.com:agent:alice',
  privateKey: keyPair2.privateKey,
  verificationMethod: 'key-2',  // 使用第二个密钥
  service: 'target.com',
});
```

## 最佳实践

### 1. 安全存储私钥

不要在代码中硬编码私钥。使用环境变量或密钥管理服务：

```typescript
// 不好：硬编码
const privateKey = 'private_key_here';

// 好：使用环境变量
const privateKey = process.env.AGENT_PRIVATE_KEY;

// 更好：使用密钥管理服务
import { SecretsManager } from 'aws-sdk';
const sm = new SecretsManager();
const { AGENT_PRIVATE_KEY } = await sm.getSecretValue({
  SecretId: 'agent-credentials',
}).promise();
```

### 2. 实施时间戳验证

始终验证时间戳以防止重放攻击：

```typescript
const verified = await authHeader.verify(resolver, {
  service: 'my-agent.io',
  timestampWindow: 60,  // 60 秒窗口
});
```

### 3. 缓存 DID 文档

启用 DIDResolver 缓存以提高性能：

```typescript
const resolver = new DIDResolver({
  cache: true,
  cacheTTL: 3600,  // 1 小时
});
```

### 4. 实施 nonce 去重

服务端**必须 (MUST)** 维护已使用 nonce 列表：

```typescript
const usedNonces = new Set<string>();

function isNonceValid(nonce: string): boolean {
  if (usedNonces.has(nonce)) {
    return false;
  }
  usedNonces.add(nonce);
  return true;
}

// 定期清理过期 nonce
setInterval(() => {
  usedNonces.clear();
}, 60 * 1000);  // 每 60 秒清理
```

### 5. 日志和监控

记录所有认证事件用于审计：

```typescript
async function verifyRequest(req: Request) {
  try {
    const authHeader = AuthorizationHeader.fromString(
      req.headers.authorization
    );
    const verified = await authHeader.verify(resolver, {
      service: 'my-agent.io',
      timestampWindow: 60,
    });

    if (verified) {
      console.log(`✓ Authenticated: ${authHeader.did}`);
    } else {
      console.warn(`✗ Failed verification: ${authHeader.did}`);
    }
  } catch (error) {
    console.error(`✗ Auth error: ${error.message}`);
  }
}
```

### 6. 优雅的错误处理

```typescript
import { AuthenticationError, SignatureError } from '@anp/sdk';

try {
  await authHeader.verify(resolver, { service: 'my-agent.io' });
} catch (error) {
  if (error instanceof AuthenticationError) {
    // 处理认证错误
    res.status(401).json({ error: error.message });
  } else if (error instanceof SignatureError) {
    // 处理签名错误
    res.status(401).json({ error: '签名验证失败' });
  } else {
    // 处理其他错误
    res.status(500).json({ error: '内部错误' });
  }
}
```

## 迁移指南

### 从 Python SDK 迁移

如果你已经使用 Python SDK，以下是主要的 API 映射：

| Python SDK | TypeScript SDK |
| --- | --- |
| `DIDWba.create()` | `DIDWba.create()` |
| `KeyPair.generate()` | `KeyPair.generate()` |
| `DIDDocument.from_keypair()` | `DIDDocument.create()` |
| `AuthorizationHeader.create()` | `AuthorizationHeader.create()` |
| `DIDResolver()` | `DIDResolver()` |
| `JcsSignature.sign()` | `JcsSignature.sign()` |

## 常见问题

### Q: 如何生成 secp256k1 密钥用于支付？

```typescript
import { KeyPair, CurveType } from '@anp/sdk';

const keyPair = KeyPair.generate(CurveType.SECP256K1);
```

### Q: 如何实现访问控制？

```typescript
const allowedDids = [
  'did:wba:trusted-agent.com:agent:alice',
  'did:wba:trusted-agent.com:agent:bob',
];

const hasAccess = allowedDids.includes(authHeader.did);
if (!hasAccess) {
  return res.status(403).json({ error: '无访问权限' });
}
```

### Q: 如何处理密钥轮换？

```typescript
// 1. 生成新密钥对
const newKeyPair = KeyPair.generate();

// 2. 将新公钥添加到 DID 文档
didDoc.addVerificationMethod({
  id: 'did:wba:example.com:agent:alice#key-2',
  type: 'EcdsaSecp256r1VerificationKey2019',
  controller: 'did:wba:example.com:agent:alice',
  publicKeyJwk: newKeyPair.publicKey.toJwk(),
});

// 3. 发布更新的 DID 文档

// 4. 切换到新密钥
// 现在所有新请求都使用 key-2

// 5. 一段时间后撤销旧密钥
```

### Q: SDK 支持哪些 Node.js 版本？

TypeScript SDK 需要 Node.js 16 或更高版本。

## 故障排除

### 问题：签名验证失败

**原因**：可能是以下之一：
- 私钥和公钥不匹配
- 请求被篡改
- 签名算法不一致

**解决**：
```typescript
// 验证密钥对匹配
const testData = { test: 'data' };
const signature = JcsSignature.sign(testData, keyPair.privateKey);
const valid = JcsSignature.verify(testData, signature, keyPair.publicKey);
console.log('密钥对有效:', valid);
```

### 问题：时间戳验证失败

**原因**：客户端和服务器时间差异过大。

**解决**：
- 确保系统时间已同步（使用 NTP）
- 增加时间窗口（但不超过 300 秒）

```typescript
const verified = await authHeader.verify(resolver, {
  service: 'my-agent.io',
  timestampWindow: 120,  // 增加到 120 秒
});
```

### 问题：DID 文档解析失败

**原因**：DID 文档格式不正确或网络连接问题。

**解决**：
```typescript
try {
  const didDoc = await resolver.resolve(didString);
} catch (error) {
  console.error('DID 解析失败:', error.message);

  // 检查网络连接
  // 验证 DID 格式
  // 检查 DID 文档可用性
}
```

## 参考资源

- **ANP 协议规范**：[https://github.com/agent-network-protocol/anp](https://github.com/agent-network-protocol/anp)
- **DID:WBA 规范**：参见 `02-ANP-身份与认证-did-wba.md`
- **智能体描述协议**：参见 `03-ANP-智能体描述协议.md`
- **支付协议（AP2）**：参见 `05-ANP-智能体支付协议.md`
- **GitHub 仓库**：https://github.com/agent-network-protocol/anp
- **官方文档**：https://agent-network-protocol.com

## 获取帮助

- **GitHub Issues**：提交 bug 和功能请求
- **Discord**：加入社区讨论
- **邮件**：chgaowei@gmail.com

---

## 版权声明

Copyright (c) 2024 GaoWei Chang

本文件依据 [MIT 许可证](../../LICENSE) 发布，您可以自由使用和修改，但必须保留本版权声明。
