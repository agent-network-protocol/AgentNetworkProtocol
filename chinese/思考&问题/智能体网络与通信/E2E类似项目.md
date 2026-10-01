
didcomm
规范地址：https://identity.foundation/didcomm-messaging/spec/v2.1/  

# 对比
我们的didall，要求对方必须在线，如果不在线，则无法通信。

didcomm没有此要求，对方不在线也可以发送加密消息。并且didcomm支持匿名加密，支持保护发送人和接收人信息。


# 现有端到端加密项目

当前流行的端到端加密（End-to-End Encryption，E2EE）协议有很多，涵盖即时通讯、电子邮件、文件共享、视频会议等多个场景。下面列出几种常见的 E2EE 协议和方案：

1. Signal Protocol
- 应用场景：即时通讯（如 Signal、WhatsApp、Facebook Messenger）
- 核心特点：
  - 双重 Ratchet 算法：结合了 Diffie-Hellman 密钥交换和双 Ratchet 算法（包含密钥派生和对话状态同步）
  - 前向安全性和后向安全性：即使某个密钥被泄露，也不会影响其他消息的安全性
  - 使用 X3DH（Extended Triple Diffie-Hellman）和 Double Ratchet 算法实现密钥交换和消息加密
- 优势：Signal Protocol 是目前安全性最高、实现最广泛的端到端加密协议之一

2. Matrix / Olm 和 Megolm Protocol
- 应用场景：即时通讯（如 Element 客户端，Matrix 网络）
- 核心特点：
  - Olm：用于单人对单人聊天，基于 Double Ratchet 算法，类似 Signal Protocol
  - Megolm：用于群组聊天，采用对称密钥加密，优化性能以支持大型群聊
  - 支持前向安全性，但由于群聊性能优化，部分后向安全性有所折中
- 优势：适合大规模群聊，并支持分布式服务器架构

3. Double Ratchet Algorithm
- 应用场景：作为一种广泛使用的加密算法，应用于 Signal Protocol 和 Matrix Olm
- 核心特点：
  - 结合对称密钥和非对称密钥加密，提供前向安全性和后向安全性
  - 使用 Ratchet 算法不断更新加密密钥，使每一条消息都有独立的加密密钥

4. OMEMO（XMPP Extension Protocol XEP-0384）
- 应用场景：基于 XMPP 协议的即时通讯（如 Conversations、Dino 等 XMPP 客户端）
- 核心特点：
  - 使用 Signal Protocol 的 Double Ratchet 算法，支持端到端加密和多设备同步
  - 允许在不同设备上同时发送和接收加密消息
- 优势：在 XMPP 协议中实现端到端加密，提供了强大的安全性

5. PGP / GPG（Pretty Good Privacy / GNU Privacy Guard）
- 应用场景：电子邮件、文件加密
- 核心特点：
  - 使用非对称加密算法（RSA、DSA、ECC 等）进行密钥交换和签名
  - 对称加密算法（AES、3DES 等）用于加密消息内容
  - PGP 主要依赖于用户生成和交换公钥，难以自动化管理
- 优势：具有高安全性，但密钥管理复杂，用户体验较差

6. MLS (Messaging Layer Security)
- 应用场景：即时通讯、群组聊天
- 核心特点：
  - 由 IETF 开发的新标准，旨在提供高效的端到端加密，特别针对大规模群聊
  - 使用 TreeKEM 算法进行密钥交换，提供前向安全性和后向安全性
- 优势：解决了传统协议在群组通信中的性能问题，适合用于大型分布式系统

7. WireGuard (用于 VPN)
- 应用场景：VPN、网络通信加密
- 核心特点：
  - 基于 Noise Protocol Framework 实现，提供高效、轻量级的端到端加密
  - 使用 Curve25519、ChaCha20、Poly1305 等现代加密算法
- 优势：速度快、性能高，配置简单

8. Noise Protocol Framework
- 应用场景：广泛用于加密通信协议（如 WireGuard、WhatsApp 中的一部分）
- 核心特点：
  - 提供灵活的密钥交换模式，支持多种非对称和对称加密算法
  - 可定制化，适用于各种加密通信场景
- 优势：安全性强，适合构建自定义的端到端加密协议

9. DIDComm (Decentralized Identifier Communication Protocol)
- 应用场景：去中心化身份、跨平台通信
- 核心特点：
  - 基于去中心化身份（DID），支持点对点的端到端加密消息传递
  - 使用 JSON 或 JWE 格式，支持多种加密算法
- 优势：与去中心化身份标准结合，适合 Web3 和去中心化应用场景

10. ZRTP（Zimmermann Real-time Transport Protocol）
- 应用场景：语音和视频通话加密
- 核心特点：
  - 通过 Diffie-Hellman 密钥交换实现端到端加密，无需预共享密钥
  - 使用 SAS（Short Authentication String）进行通话双方的身份验证
- 优势：不依赖于 PKI，适用于 VoIP 等实时通信

总结：
- 即时通讯：Signal Protocol、Matrix Olm/Megolm、OMEMO、MLS
- 文件和邮件加密：PGP/GPG
- VPN/网络通信：WireGuard、Noise Protocol Framework
- 去中心化身份：DIDComm
- 语音/视频通话：ZRTP

这些协议都各有优缺点，选择时需考虑应用场景、安全需求和性能要求。如果你正在设计自己的端到端加密方案，可以参考这些协议的核心设计思想，并结合实际需求进行优化。


## 版权声明  
Copyright (c) 2024 ANP Community  
本文件依据 [MIT 许可证](./LICENSE) 发布，您可以自由使用和修改，但必须保留本版权声明。  
