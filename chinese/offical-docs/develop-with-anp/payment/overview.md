# 智能体支付协议 (AP2) 概述

智能体支付协议 (Agent Payment Protocol v2, AP2) 提供智能体之间安全、可验证的支付交易机制。

## 核心价值

### 1. 凭证链完整性

- 完整的凭证链：CartMandate → PaymentMandate → PaymentReceipt
- 每个凭证通过哈希值引用前序凭证
- 任何一环断裂都会被检测到

### 2. 双向授权

- 商户签名 CartMandate（购物车凭证）
- 用户签名 PaymentMandate（支付凭证）
- 商户签名 PaymentReceipt（支付凭据）
- 所有签名使用 JWS 格式

### 3. 防重放与幂等性

- 每个凭证包含唯一的 `jti` (JWT ID)
- 服务端缓存 `jti` 并拒绝重复请求
- 所有 API 支持幂等性（基于 `messageId`）

### 4. 支付方式灵活性

- 支持二维码支付（支付宝、微信）
- 支持银行卡支付
- 支持数字货币支付
- 可扩展到其他支付方式

## 适用场景

### M1: 二维码支付（最小实现）

最简单的支付场景，适合快速实现：

- 商户生成二维码
- 用户扫码支付
- 支付完成后接收回执

### M2: 银行卡支付

适合传统电商场景：

- 用户提供银行卡信息
- 系统进行支付验证
- 返回支付结果

### M3: 数字货币支付

适合去中心化场景：

- 用户使用加密货币支付
- 智能合约验证交易
- 链上记录凭证

## 支付流程

### 完整流程图

```
商户智能体 (MA)                用户智能体 (SA)                支付提供商
      |                              |                              |
      | 1. 创建购物车                 |                              |
      |----------------------------->|                              |
      |    CartMandate (JWS签名)     |                              |
      |                              |                              |
      |                              | 2. 确认并支付                 |
      |<-----------------------------|                              |
      |    PaymentMandate (JWS签名)  |                              |
      |                              |                              |
      | 3. 提交到支付提供商            |                              |
      |------------------------------------------------------------->|
      |                              |                              |
      |                              |    4. 支付处理                |
      |                              |<-----------------------------|
      |                              |       qr_url / redirect      |
      |                              |                              |
      |                              | 5. 完成支付                   |
      |                              |----------------------------->|
      |                              |                              |
      | 6. 接收支付回执                |                              |
      |<-------------------------------------------------------------|
      |    PaymentReceipt (JWS签名)  |                              |
      |                              |                              |
      | 7. 转发回执                   |                              |
      |----------------------------->|                              |
      |    PaymentReceipt            |                              |
```

### 步骤说明

1. **创建购物车**
   - 商户创建 CartMandate
   - 包含商品信息和金额
   - 商户签名并提供给用户

2. **确认并支付**
   - 用户审核 CartMandate
   - 创建 PaymentMandate（引用 cart_hash）
   - 用户签名并提交给商户

3. **提交到支付提供商**
   - 商户将 PaymentMandate 提交给支付提供商
   - 获取支付链接（qr_url）或重定向 URL

4. **支付处理**
   - 用户通过 qr_url 完成支付
   - 支付提供商处理交易

5. **完成支付**
   - 用户在支付提供商页面确认支付
   - 支付提供商处理扣款

6. **接收支付回执**
   - 支付提供商通过 Webhook 发送 PaymentReceipt
   - 商户验证签名和哈希链

7. **转发回执**
   - 商户将 PaymentReceipt 转发给用户
   - 用户验证并保存回执

## 凭证类型

### 1. CartMandate (购物车凭证)

商户创建并签名的购物车凭证：

```json
{
  "cart_id": "cart_12345",
  "items": [{
    "name": "豪华双人房",
    "quantity": 2,
    "unit_price": {"amount": "500.00", "currency": "CNY"}
  }],
  "total_amount": {"amount": "1000.00", "currency": "CNY"},
  "merchant_did": "did:wba:hotel.com:merchant",
  "timestamp": "2024-12-27T10:00:00Z",
  "expires_at": "2024-12-27T10:15:00Z"
}
```

**merchant_authorization** (JWS 签名):
```json
{
  "protected": "eyJ...",
  "payload": "eyJ...",
  "signature": "abc..."
}
```

### 2. PaymentMandate (支付凭证)

用户确认并签名的支付凭证：

```json
{
  "payment_id": "pmt_67890",
  "cart_hash": "sha256(...)",
  "shopper_did": "did:wba:user.com:alice",
  "payment_method": "ALIPAY",
  "timestamp": "2024-12-27T10:01:00Z"
}
```

**shopper_authorization** (JWS 签名):
```json
{
  "protected": "eyJ...",
  "payload": "eyJ...",
  "signature": "xyz..."
}
```

### 3. PaymentReceipt (支付凭据)

支付成功后商户签名的凭据：

```json
{
  "receipt_id": "rcpt_11111",
  "pmt_hash": "sha256(...)",
  "status": "COMPLETED",
  "transaction_id": "txn_99999",
  "timestamp": "2024-12-27T10:05:00Z"
}
```

**merchant_authorization** (JWS 签名):
```json
{
  "protected": "eyJ...",
  "payload": "eyJ...",
  "signature": "def..."
}
```

## 哈希链验证

### 凭证链完整性

```
CartMandate
   ↓ (JCS → SHA-256)
cart_hash
   ↓ (包含在 PaymentMandate 中)
PaymentMandate
   ↓ (JCS → SHA-256)
pmt_hash
   ↓ (包含在 PaymentReceipt 中)
PaymentReceipt
```

### 验证步骤

1. **验证 cart_hash**:
```typescript
const cartJson = JSON.stringify(cartMandate, jcsCanonicalizer);
const computedCartHash = sha256(cartJson);
assert(computedCartHash === paymentMandate.cart_hash);
```

2. **验证 pmt_hash**:
```typescript
const pmtJson = JSON.stringify(paymentMandate, jcsCanonicalizer);
const computedPmtHash = sha256(pmtJson);
assert(computedPmtHash === paymentReceipt.pmt_hash);
```

## API 端点

### 商户端 API

#### POST /ap2/merchant/create_cart_mandate

创建购物车凭证：

**请求**:
```json
{
  "messageId": "msg_123",
  "items": [...],
  "total_amount": {...},
  "shopper_did": "did:wba:user.com:alice"
}
```

**响应**:
```json
{
  "messageId": "msg_123",
  "cartMandate": {...},
  "merchant_authorization": {...}
}
```

#### POST /ap2/merchant/send_payment_mandate

提交支付凭证：

**请求**:
```json
{
  "messageId": "msg_456",
  "paymentMandate": {...},
  "shopper_authorization": {...},
  "method_data": [{
    "method": "ALIPAY",
    "return_url": "https://user.com/return"
  }]
}
```

**响应**:
```json
{
  "messageId": "msg_456",
  "payment_id": "pmt_67890",
  "qr_url": "https://qr.alipay.com/...",
  "expires_at": "2024-12-27T10:15:00Z"
}
```

### Webhook

#### POST {webhook_url}

接收支付回执：

**请求**:
```json
{
  "messageId": "msg_789",
  "paymentReceipt": {...},
  "merchant_authorization": {...}
}
```

**响应**:
```json
{
  "messageId": "msg_789",
  "status": "received"
}
```

## 安全考虑

### 1. 凭证链篡改防护

- 所有凭证**必须 (MUST)** 使用 JWS 签名
- **必须 (MUST)** 验证凭证链的哈希完整性
- 任何哈希不匹配**必须 (MUST)** 立即终止交易

### 2. 重放攻击防护

- 每个凭证**必须 (MUST)** 包含唯一的 `jti`
- 服务端**必须 (MUST)** 缓存所有 `jti` 并拒绝重复
- `jti` 缓存时长**应该 (SHOULD)** 至少为订单有效期

### 3. 金额篡改防护

- 所有金额字段**必须 (MUST)** 包含在签名范围内
- 商户**必须 (MUST)** 验证 PaymentMandate 中的金额与 CartMandate 一致
- **不应 (SHOULD NOT)** 信任客户端提供的金额

### 4. Webhook 伪造防护

- Webhook **必须 (MUST)** 验证 `merchant_authorization` 签名
- **应该 (SHOULD)** 使用 HTTPS 并验证来源 IP 白名单
- **应该 (SHOULD)** 向支付提供商的 API 验证交易真实性

### 5. 二维码劫持防护

- `qr_url` **必须 (MUST)** 使用 HTTPS
- **应该 (SHOULD)** 验证 `qr_url` 的域名在可信列表中
- **应该 (SHOULD)** 在 QR 码中包含订单摘要供用户确认

## 支付方式

### 二维码支付

```json
{
  "method": "ALIPAY",
  "method_data": {
    "return_url": "https://user.com/return",
    "notify_url": "https://merchant.com/webhook"
  }
}
```

支持的方法：
- `ALIPAY` - 支付宝
- `WECHAT` - 微信支付

### 银行卡支付

```json
{
  "method": "CARD",
  "method_data": {
    "card_number": "encrypted(...)",
    "cvv": "encrypted(...)",
    "expiry": "encrypted(...)"
  }
}
```

### 数字货币支付

```json
{
  "method": "CRYPTO",
  "method_data": {
    "currency": "BTC",
    "wallet_address": "bc1q..."
  }
}
```

## 状态管理

### 订单状态流转

```
Created → CartIssued → PaymentReceived → ReceiptSent → Done
                ↓
              Failed
```

### 状态说明

- **Created**: 订单已创建
- **CartIssued**: CartMandate 已发送
- **PaymentReceived**: PaymentMandate 已接收
- **ReceiptSent**: PaymentReceipt 已发送
- **Done**: 交易完成
- **Failed**: 交易失败

## 最佳实践

### 1. 幂等性设计

所有 API **必须 (MUST)** 支持幂等性：

```typescript
// 使用 messageId 确保幂等性
const existingResponse = cache.get(messageId);
if (existingResponse) {
  return existingResponse;
}

// 处理请求
const response = processPayment(request);

// 缓存响应
cache.set(messageId, response, ttl);
return response;
```

### 2. 超时处理

设置合理的超时时间：

```json
{
  "expires_at": "2024-12-27T10:15:00Z"  // 15分钟有效期
}
```

### 3. 错误处理

提供清晰的错误响应：

```json
{
  "error": {
    "code": "INVALID_CART_HASH",
    "message": "Cart hash mismatch",
    "details": {
      "expected": "sha256(...)",
      "received": "sha256(...)"
    }
  }
}
```

### 4. 审计日志

记录所有关键操作：

```typescript
logger.info('Payment received', {
  payment_id: paymentMandate.payment_id,
  shopper_did: paymentMandate.shopper_did,
  amount: cartMandate.total_amount,
  timestamp: new Date().toISOString()
});
```

## 了解更多

- [凭证规范](./credentials.md) - 完整的凭证格式说明
- [支付流程](./workflows.md) - 详细的流程步骤
- [支付安全](./security.md) - 安全最佳实践
- [TypeScript SDK](../sdk/typescript-sdk.md) - 使用 SDK 实现支付

## 参考规范

- [完整 AP2 规范](../../../application/10-ANP-智能体支付协议规范.md)
- [RFC 7515: JSON Web Signature (JWS)](https://www.rfc-editor.org/rfc/rfc7515)
- [RFC 8785: JSON Canonicalization Scheme (JCS)](https://www.rfc-editor.org/rfc/rfc8785)
