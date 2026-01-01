# ANP 实现与兼容性清单

本清单用于验证"最小可用实现"(MVP)是否符合 ANP 协议要求,确保与其他 ANP 智能体互通。

## 1. 身份与认证 (did:wba)

### 1.1 服务端实现要求

- [ ] **必须 (MUST)** 能解析 `did:wba` DID 文档
- [ ] **必须 (MUST)** 支持 `Authorization: DIDWba ...` 请求头解析
- [ ] **必须 (MUST)** 验证请求签名 (JCS + SHA-256)
- [ ] **必须 (MUST)** 验证 `timestamp` 在合理时间窗口内 (建议60秒)
- [ ] **必须 (MUST)** 缓存 `nonce` 并拒绝重复请求
- [ ] **必须 (MUST)** 支持基于 DID 的访问控制 (返回403拒绝无权限)

### 1.2 客户端实现要求

- [ ] **必须 (MUST)** 能生成和管理 DID 密钥对
- [ ] **必须 (MUST)** 能构造符合规范的签名输入并签名
- [ ] **必须 (MUST)** 能生成唯一的 `nonce` 值
- [ ] **必须 (MUST)** 能设置正确的 `timestamp` (ISO 8601 UTC)

**参考**: [02-ANP-身份与认证-did-wba.md](./02-ANP-身份与认证-did-wba.md)

## 2. 智能体描述协议 (ADP)

### 2.1 服务端实现要求

- [ ] **必须 (MUST)** 发布可访问的 `ad.json` 文档
- [ ] **必须 (MUST)** `protocolType` 设置为 `ANP`
- [ ] **必须 (MUST)** `type` 设置为 `AgentDescription`
- [ ] **必须 (MUST)** 包含 `securityDefinitions` 并与 `security` 对齐
- [ ] **应该 (SHOULD)** 在 `interfaces` 中提供清晰的接口描述
- [ ] **必须 (MUST)** 通过 HTTPS 提供 AD 文档

### 2.2 客户端实现要求

- [ ] **必须 (MUST)** 能解析 AD 文档的 JSON 格式
- [ ] **必须 (MUST)** 能验证 AD 文档的必需字段
- [ ] **应该 (SHOULD)** 能解析 `interfaces.url` 指向的接口描述
- [ ] **应该 (SHOULD)** 能处理 OpenRPC、JSON-RPC 等标准协议

**参考**: [03-ANP-智能体描述协议.md](./03-ANP-智能体描述协议.md)

## 3. 智能体发现协议

### 3.1 服务端实现要求

- [ ] **应该 (SHOULD)** 提供 `/.well-known/agent-descriptions` 端点
- [ ] **必须 (MUST)** 返回符合 `CollectionPage` 格式的响应
- [ ] **必须 (MUST)** 在 `items` 中提供有效的 AD URL
- [ ] **应该 (SHOULD)** 支持分页 (通过 `next` 字段)
- [ ] **应该 (SHOULD)** 通过 HTTPS 提供发现入口

### 3.2 客户端实现要求

- [ ] **应该 (SHOULD)** 能请求并解析 `/.well-known/agent-descriptions`
- [ ] **必须 (MUST)** 能解析 JSON-LD 格式的 `CollectionPage`
- [ ] **必须 (MUST)** 能提取 `items[].@id` 获取 AD URL
- [ ] **应该 (SHOULD)** 能处理分页响应 (循环拉取直到 `next` 为空)

**参考**: [04-ANP-智能体发现协议.md](./04-ANP-智能体发现协议.md)

## 4. 智能体支付协议 (AP2)

### 4.1 服务端实现要求 (商户端)

- [ ] **必须 (MUST)** 实现 `POST /ap2/merchant/create_cart_mandate`
- [ ] **必须 (MUST)** 实现 `POST /ap2/merchant/send_payment_mandate`
- [ ] **必须 (MUST)** 生成并签名 `CartMandate`
- [ ] **必须 (MUST)** 验证 `PaymentMandate` 签名和哈希链
- [ ] **必须 (MUST)** 实现 Webhook 接收 `PaymentReceipt`
- [ ] **必须 (MUST)** 验证所有 JWS 签名的 JWT claims

### 4.2 客户端实现要求 (用户端)

- [ ] **必须 (MUST)** 能请求 `create_cart_mandate` 并解析响应
- [ ] **必须 (MUST)** 能构造并签名 `PaymentMandate`
- [ ] **必须 (MUST)** 验证 `CartMandate` 的 `merchant_authorization`
- [ ] **必须 (MUST)** 维护凭证链的哈希完整性
- [ ] **应该 (SHOULD)** 实现 Webhook 端点接收 `PaymentReceipt`

**参考**: [05-ANP-智能体支付协议.md](./05-ANP-智能体支付协议.md)

## 5. 安全要求

### 5.1 传输安全

- [ ] **必须 (MUST)** 所有 API 端点使用 HTTPS
- [ ] **必须 (MUST)** 使用 TLS 1.2 或更高版本
- [ ] **应该 (SHOULD)** 禁用弱加密套件
- [ ] **应该 (SHOULD)** 验证 TLS 证书有效性

### 5.2 签名与完整性

- [ ] **必须 (MUST)** 使用 JCS 规范化 JSON
- [ ] **必须 (MUST)** 使用 SHA-256 或更强的哈希算法
- [ ] **必须 (MUST)** 使用 JWS 格式签名
- [ ] **必须 (MUST)** 包含完整的 JWT claims (`iss`, `sub`, `aud`, `iat`, `exp`, `jti`)
- [ ] **必须 (MUST)** 验证所有凭证的签名

### 5.3 重放防护

- [ ] **必须 (MUST)** 验证 `timestamp` 在时间窗口内
- [ ] **必须 (MUST)** 缓存 `nonce` 并拒绝重复
- [ ] **必须 (MUST)** 缓存 `jti` 并拒绝重复 (针对 JWS)
- [ ] **必须 (MUST)** `nonce`/`jti` 缓存时长大于时间窗口

### 5.4 访问控制

- [ ] **必须 (MUST)** 对敏感接口实施 `did:wba` 认证
- [ ] **应该 (SHOULD)** 对高风险操作启用 `humanAuthorization`
- [ ] **应该 (SHOULD)** 实施基于 DID 的访问控制列表
- [ ] **应该 (SHOULD)** 记录敏感操作的审计日志

### 5.5 数据隐私

- [ ] **必须不得 (MUST NOT)** 在 AD 文档中包含敏感信息
- [ ] **必须不得 (MUST NOT)** 在日志中记录私钥或支付信息
- [ ] **应该 (SHOULD)** 实施数据最小化原则
- [ ] **应该 (SHOULD)** 对敏感数据加密存储

**参考**: [06-ANP-安全与隐私实践.md](./06-ANP-安全与隐私实践.md)

## 6. 互操作性验收测试

### 6.1 基础互通测试

- [ ] 能通过发现入口拉取其他智能体的 AD 文档
- [ ] 能完成一次 `did:wba` 鉴权请求并获得200响应
- [ ] 能调用其他智能体的结构化接口 (如 OpenRPC)

### 6.2 支付流程测试 (可选)

- [ ] 能完成一次完整的 AP2 支付流程
- [ ] 能接收 Webhook 并验证 `PaymentReceipt`
- [ ] 凭证链哈希验证通过

### 6.3 安全测试

- [ ] 重复的 `nonce` 请求被拒绝 (返回401)
- [ ] 过期的 `timestamp` 请求被拒绝 (返回401)
- [ ] 无效签名的请求被拒绝 (返回401)
- [ ] 未授权的 DID 请求被拒绝 (返回403)

## 7. 常见问题排查

### 7.1 签名验证失败

**可能原因**:
- JCS 规范化不正确
- 哈希算法不匹配
- 公钥获取错误
- 签名格式不正确

**排查步骤**:
1. 检查签名输入的 JSON 是否 JCS 规范化
2. 验证 SHA-256 哈希结果
3. 确认公钥从正确的 `verification_method` 获取
4. 检查签名是否 Base64URL 编码

### 7.2 时间戳验证失败

**可能原因**:
- 服务器时钟不同步
- 时间窗口设置过小
- 时区设置错误

**排查步骤**:
1. 使用 NTP 同步服务器时钟
2. 检查时间窗口设置 (建议60秒)
3. 确认使用 ISO 8601 UTC 格式

### 7.3 AD 文档解析失败

**可能原因**:
- JSON 格式错误
- 必需字段缺失
- MIME 类型不正确

**排查步骤**:
1. 验证 JSON 格式正确性
2. 检查所有必需字段是否存在
3. 确认 MIME 类型为 `application/json`
4. 确认通过 HTTPS 提供

### 7.4 凭证链验证失败

**可能原因**:
- 哈希计算不正确
- JCS 规范化不一致
- 凭证顺序错误

**排查步骤**:
1. 确认使用 JCS 规范化后再哈希
2. 验证 `cart_hash` 与 `pmt_hash` 的计算
3. 检查凭证的时间顺序

## 8. 版本兼容性

### 8.1 当前版本

- **协议版本**: `1.0.0`
- **文档版本**: MVP (最小可用实现)

### 8.2 版本检查

- [ ] AD 文档中 `protocolVersion` 设置为 `1.0.0`
- [ ] 客户端能识别并处理 `protocolVersion` 字段
- [ ] 遇到不兼容版本时提供明确错误提示

## 9. 实施建议

### 9.1 开发优先级

**第一阶段 (核心功能)**:
1. 实现 `did:wba` 身份认证
2. 发布 AD 文档
3. 实现基础安全检查 (签名、时间戳、nonce)

**第二阶段 (发现与互通)**:
4. 实现 `.well-known` 发现入口
5. 测试与其他智能体的互通性

**第三阶段 (应用协议)**:
6. 实现 AP2 支付协议 (如需要)
7. 完善错误处理和日志

### 9.2 测试策略

- **单元测试**: 签名验证、哈希计算、字段校验
- **集成测试**: 完整的 API 调用流程
- **互操作测试**: 与其他 ANP 智能体交互
- **安全测试**: 重放攻击、签名伪造、权限绕过

### 9.3 性能考虑

- **缓存**: nonce/jti 使用高效的缓存 (Redis、Memcached)
- **并发**: 支持高并发的签名验证
- **限流**: 实施合理的速率限制防止滥用

## 了解更多 (Learn More)

- **协议总览**: 参见 [00-ANP-规范总览.md](./00-ANP-规范总览.md)
- **架构说明**: 参见 [01-ANP-架构与角色.md](./01-ANP-架构与角色.md)
- **完整规范**: 参见仓库内 `chinese/` 目录下的完整协议文档

## 参考规范

- `../03-did-wba方法规范.md`
- `../07-ANP-智能体描述协议规范.md`
- `../08-ANP-智能体发现协议规范.md`
- `../application/10-ANP-智能体支付协议规范.md`
