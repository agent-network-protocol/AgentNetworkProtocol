# ANP 安全与隐私实践

本页提供 ANP 协议实现中的安全与隐私最佳实践,涵盖身份认证、数据保护、重放防护等核心安全要求。

## 核心安全原则 (Core Security Principles)

### 1. 零信任架构 (Zero Trust Architecture)

ANP 假设网络中所有通信都可能被窃听或篡改：

- 所有敏感接口**必须 (MUST)** 经过身份认证
- 所有关键数据**必须 (MUST)** 通过 HTTPS 加密传输
- 所有签名**必须 (MUST)** 在使用前验证
- **不应 (SHOULD NOT)** 信任未经验证的输入

### 2. 深度防御 (Defense in Depth)

实施多层安全控制：

- 身份认证层：`did:wba` 签名验证
- 传输层：HTTPS/TLS 加密
- 应用层：业务逻辑访问控制
- 数据层：敏感数据加密存储

### 3. 最小权限原则 (Principle of Least Privilege)

- 仅授予完成特定操作所需的最小权限
- 服务端**应该 (SHOULD)** 对不同 DID 实施细粒度的访问控制
- 敏感操作**应该 (SHOULD)** 要求额外的人类授权

### 4. 纵深隔离 (Isolation)

- 生产环境与测试环境**必须 (MUST)** 完全隔离
- 敏感智能体**应该 (SHOULD)** 使用独立的发现入口
- 内部 API **不应 (SHOULD NOT)** 暴露在公开 AD 中

## 1. 身份与授权安全

### 1.1 DID 身份验证

所有实现**必须 (MUST)** 遵循以下要求：

- **必须 (MUST)** 使用 `did:wba` 进行身份认证
- **必须 (MUST)** 验证请求签名的有效性
- **必须 (MUST)** 验证 timestamp 在合理时间窗口内（**建议 SHOULD** 60秒）
- **必须 (MUST)** 缓存 nonce 并拒绝重复请求

参见：[02-ANP-身份与认证-did-wba.md#安全考虑](./02-ANP-身份与认证-did-wba.md#10-安全考虑-security-considerations)

### 1.2 访问控制

- 服务端**应该 (SHOULD)** 实施基于 DID 的访问控制列表 (ACL)
- 高风险操作**应该 (SHOULD)** 启用 `humanAuthorization`
- **应该 (SHOULD)** 记录所有敏感操作的审计日志

### 1.3 密钥管理

- 私钥**必须 (MUST)** 安全存储（使用 KMS 或硬件安全模块）
- **应该 (SHOULD)** 支持密钥轮换机制
- **应该 (SHOULD)** 在检测到异常访问时撤销受损密钥
- **不得 (MUST NOT)** 在日志或错误消息中泄露私钥

## 2. 签名与完整性保护

### 2.1 数字签名要求

所有实现**必须 (MUST)** 遵循：

- 使用 JCS (JSON Canonicalization Scheme) 规范化 JSON
- 使用 SHA-256 或更强的哈希算法
- 使用 JWS (JSON Web Signature) 格式
- 包含完整的 JWT claims (`iss`, `sub`, `aud`, `iat`, `exp`, `jti`)

### 2.2 凭证链完整性

对于 AP2 支付协议：

- **必须 (MUST)** 验证凭证链的哈希完整性
- `PaymentMandate` **必须 (MUST)** 包含 `cart_hash`
- `PaymentReceipt` **必须 (MUST)** 包含 `pmt_hash`
- 任何哈希不匹配**必须 (MUST)** 立即终止交易

### 2.3 签名验证流程

```text
1. 获取签名者的公钥（从 DID 文档）
2. JCS 规范化待签名内容
3. SHA-256 哈希
4. 使用公钥验证签名
5. 验证 JWT claims（exp, iat, jti等）
6. 检查 jti 是否已使用（防重放）
```

## 3. 时间戳与重放防护

### 3.1 时间戳校验

服务端**必须 (MUST)** 实施以下检查：

- 验证 `timestamp` 格式为 ISO 8601 UTC
- 验证 `timestamp` 在合理时间窗口内（**建议 SHOULD** ±60秒）
- **不应 (SHOULD NOT)** 接受未来时间戳
- 使用 NTP 保持服务器时钟准确

### 3.2 Nonce 去重

- 每个请求**必须 (MUST)** 包含唯一的 `nonce`
- 服务端**必须 (MUST)** 缓存已使用的 `nonce`
- `nonce` 缓存时长**必须 (MUST)** 大于 timestamp 时间窗口
- **建议 (SHOULD)** 使用高熵随机值（至少 128 位）

### 3.3 JTI (JWT ID) 去重

- 所有 JWS 签名**应该 (SHOULD)** 包含唯一的 `jti`
- 服务端**必须 (MUST)** 缓存 `jti` 并拒绝重复
- 缓存时长**应该 (SHOULD)** 至少为 JWT 的 `exp` 时长

## 4. 传输安全

### 4.1 HTTPS 强制要求

- 所有 API 端点**必须 (MUST)** 使用 HTTPS
- **不得 (MUST NOT)** 在 HTTP 上传输敏感数据
- **应该 (SHOULD)** 使用 TLS 1.2 或更高版本
- **应该 (SHOULD)** 禁用弱加密套件

### 4.2 证书验证

- 客户端**必须 (MUST)** 验证服务器证书的有效性
- **应该 (SHOULD)** 验证证书颁发者和域名
- **可以 (MAY)** 实施证书固定 (Certificate Pinning)

### 4.3 Webhook 安全

- Webhook 端点**必须 (MUST)** 验证请求签名
- **应该 (SHOULD)** 使用 IP 白名单限制来源
- **应该 (SHOULD)** 使用 HTTPS 并验证证书
- **应该 (SHOULD)** 实施速率限制防止 DoS

## 5. 数据隐私保护

### 5.1 最小披露原则

- AD 文档**应该 (SHOULD)** 仅公开必要的接口和字段
- **必须不得 (MUST NOT)** 在 AD 中包含 API 密钥、私钥等敏感信息
- 内部接口**应该 (SHOULD)** 使用单独的 AD 文档并限制访问

### 5.2 用户隐私保护

- 收集用户数据**必须 (MUST)** 获得明确同意
- **应该 (SHOULD)** 实施数据最小化原则
- **应该 (SHOULD)** 提供用户数据访问和删除机制
- **必须 (MUST)** 遵守相关隐私法规（GDPR、CCPA等）

### 5.3 敏感数据处理

- 敏感数据**应该 (SHOULD)** 加密存储
- 日志中**不得 (MUST NOT)** 包含明文密码、私钥或支付信息
- **应该 (SHOULD)** 实施数据脱敏机制

## 6. 安全检查清单

### 6.1 身份认证检查

- [ ] `did:wba` 签名验证通过
- [ ] timestamp 在合理时间窗口内
- [ ] nonce 唯一且未被使用
- [ ] DID 文档通过 HTTPS 获取
- [ ] 公钥正确解析并验证

### 6.2 API 安全检查

- [ ] 所有端点使用 HTTPS
- [ ] 敏感操作需要认证
- [ ] 实施速率限制
- [ ] 错误消息不泄露敏感信息
- [ ] 支持幂等性（基于 messageId）

### 6.3 数据完整性检查

- [ ] 所有凭证包含有效签名
- [ ] 凭证链哈希完整性验证
- [ ] jti 去重防重放
- [ ] 金额等关键字段在签名范围内

### 6.4 隐私保护检查

- [ ] AD 文档不包含敏感信息
- [ ] 用户数据经过同意收集
- [ ] 实施数据最小化
- [ ] 日志脱敏处理

### 6.5 Webhook 安全检查

- [ ] 验证 merchant_authorization 签名
- [ ] IP 白名单限制
- [ ] HTTPS 传输
- [ ] 向支付提供商验证交易真实性
- [ ] 实施重试机制（幂等）

## 7. 常见攻击与防护

### 7.1 重放攻击 (Replay Attack)

**防护**：nonce + jti 去重 + timestamp 校验

### 7.2 中间人攻击 (MITM)

**防护**：强制 HTTPS + 证书验证 + 可选证书固定

### 7.3 DID 文档劫持 (DID Document Hijacking)

**防护**：HTTPS 获取 + 可选签名验证 + 缓存版本校验

### 7.4 凭证链篡改 (Credential Chain Tampering)

**防护**：JWS 签名 + 哈希链完整性验证

### 7.5 金额篡改 (Amount Tampering)

**防护**：签名覆盖所有金额字段 + 服务端为准

### 7.6 Webhook 伪造 (Webhook Forgery)

**防护**：签名验证 + IP 白名单 + 向支付提供商验证

### 7.7 拒绝服务攻击 (DoS)

**防护**：速率限制 + CDN + 客户端认证

### 7.8 侧信道攻击 (Side-Channel Attack)

**防护**：常数时间算法 + 错误消息不泄露详情

## 8. 实施建议

### 8.1 开发阶段

- 使用安全的开发框架和库
- 进行代码安全审查
- 使用静态代码分析工具
- 编写安全测试用例

### 8.2 部署阶段

- 使用强密码和密钥
- 启用防火墙和入侵检测
- 定期更新依赖和补丁
- 实施安全监控和告警

### 8.3 运维阶段

- 定期进行安全审计
- 监控异常访问模式
- 及时响应安全事件
- 定期备份关键数据

## 了解更多 (Learn More)

- **身份认证实践**：参见 [02-ANP-身份与认证-did-wba.md](./02-ANP-身份与认证-did-wba.md)
- **AD 文档安全**：参见 [03-ANP-智能体描述协议.md#安全考虑](./03-ANP-智能体描述协议.md#9-安全考虑-security-considerations)
- **发现协议安全**：参见 [04-ANP-智能体发现协议.md#安全考虑](./04-ANP-智能体发现协议.md#8-安全考虑-security-considerations)
- **支付协议安全**：参见 [05-ANP-智能体支付协议.md#安全考虑](./05-ANP-智能体支付协议.md#9-安全考虑-security-considerations)

## 参考规范

- RFC 2119: 关键词约定
- RFC 7515: JSON Web Signature (JWS)
- RFC 8785: JSON Canonicalization Scheme (JCS)
- W3C DID Core Specification
- OWASP Top 10 Web Application Security Risks
