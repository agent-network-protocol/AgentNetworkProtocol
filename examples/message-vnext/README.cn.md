# ANP Messaging 1.2 多设备示例

状态：说明性示例，不是密码学一致性向量。

[English](README.md) | [中文](README.cn.md)

这些文件配套[混合版本的 ANP Messaging 1.2 规范](../../chinese/message/README.md)。JSON 可用于 schema 与流程评审；其中公钥、digest、签名、密文和 proof value 都是明确的占位符，绝不能（**MUST NOT**）作为密码学测试向量使用。

| 文件 | 用途 |
| --- | --- |
| [`01-did-document-two-devices.json`](01-did-document-two-devices.json) | 一个 Agent DID 下两个使用独立 key 的合法设备端点 |
| [`02-direct-two-device-deliveries.json`](02-direct-two-device-deliveries.json) | 同一逻辑 Direct E2EE 消息的两次独立加密、独立幂等 P5 设备投递 |
| [`03-device-prekey-bundle.json`](03-device-prekey-bundle.json) | 绑定一个 owner DID/device 及 Manifest key 引用的 PreKey Bundle |
| [`04-mls-two-device-leaves.json`](04-mls-two-device-leaves.json) | 同一个 DID 级业务成员的两个设备绑定 MLS Leaf |
| [`05-device-revocation.json`](05-device-revocation.json) | 移除一个设备及其 key 引用前后的公开 DID Document 片段 |
| [`06-device-state-changed-error.json`](06-device-state-changed-error.json) | 要求重新解析当前 DID、但不泄露内部 checkpoint 的可重试 P5/P6 设备状态错误；Base 消息不使用该错误 |
| [`07-did-transition-retry.json`](07-did-transition-retry.json) | 最小 P3 superseded-DID 流程：把 `current_did` 仅当作提示，验证直接后继，再保留逻辑 message/operation ID 并重建 digest 和签名 |

中英文 Profile 规范仍是权威来源。未来的一致性向量任务必须用可复现输入和预期字节替换所有密码学占位值。

transition 示例特意不是密码学向量。尤其是 `alsoKnownAs` 和 1019 `current_did` 都不能建立连续性；示例中的 `verified` 结果依赖独立验证两个 E1 文档和 predecessor 的旧 binding-key proof。

> 目录保留 `-vnext` 名称以兼容既有路径。引用已指向 1.2 文档；P6 仍为候选，稳定版仍待完成 MLS ExtensionType 注册发布门槛。

## 版权声明

Copyright (c) 2024 ANP 开源社区
本文件依据 [Apache License 2.0](../../LICENSE) 发布，您可以自由使用和修改，但必须保留本版权声明。
