# In-Depth Analysis of Google’s Agent Payments Protocol AP2: A Seriously Underestimated Protocol

From e-commerce infrastructure to Agent Commerce infrastructure

## Preface

After Google released AP2 (Agent Payments Protocol), it did not trigger a major reaction across Chinese online media. Our community studied and discussed AP2 immediately, and also compared it with the agent transaction design we had proposed earlier.

After taking a deeper look at AP2, I believe that **AP2 is a seriously underestimated protocol**. That is why I decided to write a systematic and comprehensive analysis of it.

I have worked in e-commerce myself. Our community has also developed the ANP protocol, and some time ago we designed an agent transaction scheme. This article combines those thoughts and practices to provide a deeper interpretation of AP2, with the hope that readers can see the design considerations behind the protocol.

Our previous agent transaction design: https://mp.weixin.qq.com/s/wFVUDs31e6CKLpu8F3LDWg

Google AP2 specification: https://ap2-protocol.org/specification/

## Core Takeaways

If you do not have time to read the full article, here are the key points:

- The core problem AP2 addresses is **trust in agent-mediated transactions**. The emergence of agents will restructure existing e-commerce transaction flows. AP2 calls this Agent Commerce. For example, when users and merchants transact through agents, how does the user establish trust with their shopping agent, and how does that shopping agent establish trust with the merchant’s agent? These are new problems that arise as agents enter the transaction process.
- The fundamental reason I believe **AP2 is seriously underestimated** is this: if agent-based transaction flows can work and have lower transaction costs than today’s e-commerce flows, such as lower human time cost, and if they provide a better experience, this new transaction paradigm could replace current e-commerce models at large scale. That would be a disruptive shift. **Agent payment protocols such as AP2 will become an important piece of the agent economy.**
- AP2 reminds me of Jack Ma’s greatest contribution to Chinese e-commerce: solving the trust problem in e-commerce, making people willing to pay an unfamiliar merchant through a computer screen. AP2 aims to solve the next trust problem: making you comfortable letting AI shop on your behalf, while still ensuring that if something goes wrong, responsibility can be reasonably assigned. This builds trust and reduces transaction friction.
- AP2’s concept of **Agent Commerce** is more native than “AI e-commerce.” It is not merely e-commerce plus AI; it reconstructs the commercial transaction chain around agents. If Agent Commerce truly disrupts e-commerce one day, AP2 will be a very important piece of infrastructure.
- In my view, AP2’s overall design is better than A2A’s, both in problem definition and in design principles. Of course, AP2 is still early, and there are still some ambiguous areas in the design that need refinement. By contrast, A2A’s task-centric design clearly made a mistake in defining the problem, unless it was originally designed only for internal enterprise scenarios.
- AP2 has two core design highlights. First, it separates the shopping agent, payment credential management, and user key management, reducing the chance that any single role can act maliciously. Second, it uses verifiable credentials, or VDCs (Verifiable Digital Credentials), to build trust. The underlying technology behind verifiable credentials is cryptography.
- Whether verifiable credentials have legal force is a separate issue, and one that requires joint discussion by industry and the legal community.
- Why was AP2 proposed by Google, rather than Amazon or Alibaba? Google has deep experience in protocols; QUIC and WebRTC, for example, were both led by Google. There must be people inside Google who understand that **protocols are the best carriers for transmitting context** and the most efficient way for agents to interact. Through AP2, Google may be able to disrupt existing e-commerce and capture a larger market.
- While Google was proposing AP2, what were domestic e-commerce companies doing? Fighting subsidy wars in food delivery. **If Agent Commerce truly disrupts traditional e-commerce in the future, the current state of China’s leading e-commerce companies abandoning innovation and relying on cash-burning subsidies will become one of the clearest historical footnotes to the rise of open agent protocols such as AP2.**
- Our community proposed an agent transaction scheme back in May this year. In terms of core flow and technologies used, AP2 has many similarities with our design. For example, our design is also based on verifiable credential technology. At the same time, our design has unique features, such as a VC hash chain that confirms every key step in the transaction process with VCs, ensuring the tamper resistance of the entire transaction process.
- From Google’s A2A and AP2, we can see that **our community has been highly forward-looking in agent protocol technology**. However, our community does not have Google’s influence or resources. From the AP2 protocol, it is clear that their investment in this protocol is much greater than ours. We hope to collaborate with Chinese industry on agent protocols. Today, China is not behind the United States in either technology or ideas. We need to be bold enough to stand at the forefront of the industry and make our voice heard.

## Detailed Introduction to AP2

Below, I will introduce and interpret AP2 from several angles: scenarios, problem definition, design principles, role design, trust establishment, and transaction flows. If you are a protocol developer, you can read the original specification directly.

### Protocol Scenario

AP2 envisions an agent transaction scenario in which people use shopping agents, or personal agents with shopping capabilities, to purchase goods. The shopping agent helps the user select products from the merchant side, which may itself be a merchant agent with sales capabilities, negotiate prices, and place and pay for orders.

In this scenario, the shopping agent and the merchant agent are developed and operated by different companies. The problem AP2 aims to solve is how agents from different companies establish trust and complete transactions at low cost.

In this scenario, agents are core transaction participants and important intermediaries connecting people and merchants.

### Problem Definition

When a transaction flow moves from humans directly interacting with trusted interfaces to humans delegating autonomous actions to agents, trust becomes much more complex. The trust foundation of existing e-commerce is broken.

I summarize the problems that emerge after agents are introduced into transactions as follows:

- How do people trust the shopping agents they use? If something goes wrong, how should responsibility be determined? For example, I ask the agent to buy a product worth 100 yuan, but it buys something worth 1,000 yuan. How can this be prevented? Or, after the fact, how can responsibility be assigned and losses recovered? This is essentially a problem of authorization and auditability: how can users define clear action boundaries for agents, and what evidence can prove that the user really authorized a particular action?

- How can merchants trust shopping agents that execute requests on behalf of humans? How can they confirm that a request sent by an agent truly reflects the consumer’s real and accurate intent, as well as clear and explicit authorization? This is especially important when AI may hallucinate and agents may misunderstand user intent.

- How can payments be handled more securely? How can we prevent a shopping agent from making payments without human authorization? How can existing payment infrastructure adapt to transactions initiated by agents?

- When a transaction problem occurs, who should bear responsibility? The user who delegated the task? The developer of the shopping agent? The merchant that accepted the order? Or the payment network that processed the transaction? How can a clear mechanism for assigning responsibility be established?

These trust problems are new problems that arise because agents become key participants in transactions. In essence, agents are new transaction intermediaries, and they break the trust assumption of existing payment infrastructure, which is based on “humans directly operating trusted interfaces.” If these problems cannot be solved, Agent Commerce will struggle to reach large-scale adoption.

Trust was the first problem e-commerce had to solve. It remains the first problem Agent Commerce must solve. Trust is the foundation of commerce.

### Design Principles

I think AP2’s design principles are quite thoughtful, mainly in the following areas:

**Openness and compatibility.** AP2 is not a payment protocol customized for one specific protocol, such as A2A. It is an open payment protocol that can be integrated by many kinds of protocols. This is a very good design direction, because it means ANP, MCP, and many other protocols can integrate with AP2. This openness ensures broad applicability and future extensibility.

**User control.** Users must always retain final decision-making power. I see this as central. Users must clearly know what the agent is doing and must be able to authorize the agent’s actions in a fine-grained way: what it can do and what it cannot do. More importantly, if an agent acts privately without explicit human authorization, responsibility should fall on the agent’s developers and operators. This protects user rights while also establishing clear liability boundaries for agent developers.

**Verifiable intent, not inferred behavior.** This principle is critical. AP2 emphasizes that transactions must be based on deterministic and non-repudiable proof of intent, not on guesses about ambiguous AI-agent output. In other words, an order cannot be placed simply because an AI says, “I think the user wants to buy this.” There must be explicit, verifiable authorization credentials from the user.

**Clear responsibility assignment.** In all kinds of exceptional situations, responsibility must be clearly attributable. This is essential for building trust in the entire agent payments ecosystem and is also a prerequisite for traditional payment systems to accept agent-mediated transactions.

These principles look simple, but implementing them in practice requires many technical details.

### Role Design

In AP2’s architecture, I think the most elegant part is the separation of responsibilities across roles. The current role design and responsibilities are as follows:

**User.** This needs little explanation: the person who wants to buy something.

**Shopping Agent (SA).** This is the user’s shopping agent, or a personal agent with shopping capabilities. It helps the user select products, negotiate with merchants, assemble carts, and so on.

**Credentials Provider (CP).** In the design, the Credentials Provider is treated as the user’s digital wallet. It stores all transaction-related credentials, manages the user’s payment methods, receives payment credentials generated during interactions with the shopping agent, and binds payment credentials to actual payment-process tokens. It plays the following roles:

1. Establishes an association between payment credentials and actual payment-process tokens, supporting traceability and audit.
2. The actual payment-process tokens in the payment flow are associated with real payment instruments, such as card numbers, account numbers, or wallet keys. However, transaction parties can only refer to them through tokens; only the clearing networks and institutions for the payment instruments hold the actual information.
3. Stores payment credentials. These credentials include all information from the transaction process, so they can be used as evidence by the user and for dispute handling.

**Merchant Endpoint (ME).** This may be a web page, an MCP server, or a merchant agent. It is responsible for displaying products, receiving orders, and completing transactions.

**Merchant Payment Processor (MPP).** Put simply, this is the merchant’s checkout system, dedicated to handling payment-related matters. In many cases, ME and MPP may be the same system.

**Networks and issuers.** These are traditional payment infrastructure providers, such as China UnionPay, China Merchants Bank, ICBC, and similar institutions. They provide payment networks and issue payment credentials.

![AP2 Role Design](/blogs/images/ap2/rules.png)

The specification includes a role that is not shown in the diagram: a hardware-like key manager. For example, when you confirm a cart, human biometrics may be required; at that point, a hardware device may be invoked to obtain a fingerprint and complete authorization. This does not seem to belong to any of the roles above; it may simply be built into your phone.

The philosophy behind this role separation is essentially one of checks and balances. No matter how smart your shopping agent is, it cannot touch your money. No matter how powerful your payment system is, it cannot decide what you buy. Each role has clear boundaries and responsibilities. Even if one part fails, the security of the entire system does not collapse.

### Establishing Trust

After role separation, the next question is: how do these roles establish trust with each other? AP2’s answer is Verifiable Digital Credentials (VDCs).

I think the easiest way to understand VDCs is through an analogy: when you buy something in a store, you receive a receipt. That receipt proves what you bought, how much you spent, and when you bought it. If something goes wrong, you can take the receipt back for a refund. In AP2, verifiable credentials are the “electronic receipts” of agent transactions.

These “electronic receipts” have several key characteristics:

**Tamper resistance.** Credentials are based on public-private key cryptography, the same family of cryptographic techniques used by Bitcoin and HTTPS websites. No one can modify credential contents without being detected.

**Verifiability.** As long as you can present the credential, you can prove that the information was signed and confirmed with the relevant party’s private key. The verifier can quickly validate it using public information.

**Non-repudiation.** The credential can technically establish that it was signed with the user’s private key.

However, one point deserves attention: **the technical properties of verifiable credentials and their legal force are two different things**. The fact that something is tamper-resistant and verifiable technically does not mean a court will necessarily accept it as evidence. Legal support is also needed, and this requires joint progress by industry and the legal community.

#### The Three Core Verifiable Credentials Designed by AP2

- **Cart Mandate**: the base credential for capturing user purchase authorization in a human-present transaction. It is generated by the merchant based on the user’s request and cryptographically signed by the user using a hardware-backed key on the device. The Cart Mandate contains information about the user and merchant identities, products, prices, payment methods, fulfillment method, and more.

- **Intent Mandate**: the key Verifiable Digital Credential in human-not-present transaction scenarios. It authorizes an agent to make a purchase while the user is absent. It is generated by the shopping agent based on the user’s request. Compared with a Cart Mandate, it adds information about the user’s intent and the authorization lifecycle.

- **Payment Mandate**: a Verifiable Digital Credential specifically designed to provide payment ecosystems, such as networks and issuers, with visibility into agent-mediated transactions. Its main purpose is to help networks and issuers establish trust in agent transactions. In other words, this mandate does not contain information that would allow the payment network to directly perform a payment.

### Core Payment Flow

With the above context, let us look at AP2’s payment flow. For a human-present transaction, the core flow is as follows:

**1. Setup phase**: the user configures a third-party Credentials Provider for their shopping agent, which may require identity verification on a trusted page of the Credentials Provider.

**2. Discovery and negotiation**: the user gives a shopping task to the shopping agent. The shopping agent interacts with one or more merchants and assembles a suitable cart based on the user’s preferences, price, brand, and other information.

**3. Merchant validates the cart**: this is a critical step. **The merchant must sign the created cart**, indicating that it can fulfill the goods and services in the cart. This provides a basis for assigning responsibility in later disputes.

**4. Provide payment methods**: the shopping agent provides payment context to the Credentials Provider and requests applicable payment methods, shared either by reference or in encrypted form. It may also obtain loyalty or discount information that could affect payment-method selection.

**5. Present the cart**: the shopping agent presents the final cart and applicable payment methods to the user through a trusted interface. The user approves through an authentication process.

**6. Signing and payment**: the user confirms the cart and then signs and authorizes the cart information. This authorization is shared with the merchant as evidence in case of dispute. At the same time, a Payment Mandate is created and may be shared with networks and issuers for transaction authorization.

**7. Payment execution**: the payment portion of the Cart Mandate must be communicated to the Credentials Provider and the merchant to complete the transaction. **This may happen in multiple ways**:
   - The Shopping Agent (SA) may ask the Credentials Provider to complete payment with the merchant, or
   - The cart may submit an order to the merchant, triggering a payment authorization flow in which the merchant or PSP requests the payment method from the Credentials Provider.

**8. Send the transaction to the issuer**: the merchant or PSP routes the transaction to the issuer or the network that operates the payment method. The transaction package may include a signal that an AI agent participated, ensuring that the network and issuer understand it is an agent-mediated transaction.

**9. Challenge mechanism**: any participant, such as the issuer, Credentials Provider, or merchant, can choose to challenge the transaction through existing mechanisms such as 3DS2. The challenge needs to be presented to the user by the user’s agent and may require redirection to a trusted interface.

**10. Resolve the challenge**: the user should have a way to resolve the challenge through a trusted interface, such as a banking app or website.

**11. Authorize the transaction**: the issuer approves the payment and confirms success. This is communicated to the user and the merchant so that the order can be fulfilled. The payment receipt is shared with the Credentials Provider to confirm the transaction result.

You can understand the above payment process more easily if you think of it as a credit card usage flow. It is similar to handing a credit card to a merchant and having the merchant swipe it through a POS machine. It differs from the escrow-based transaction method commonly used on Taobao.

The flow above is for a human-present payment. AP2 also supports human-not-present payments. For example, a user might tell a shopping agent: “Buy two tickets from this merchant for this concert in Las Vegas in July as soon as tickets become available. The budget is 1,000 dollars, and we want seats as close to the main stage as possible.” The shopping agent holds the user’s Intent Mandate, monitors merchant inventory in real time, and directly requests order creation when inventory becomes available. The subsequent payment flow is the same as a human-present transaction.

### Dispute Handling

Evidence and responsibility assignment in disputes:

- Malicious refund: the user initiates a refund while claiming the transaction was fraudulent. Responsibility can be assigned using the Cart Mandate and Payment Mandate.
- Shopping agent error: the shopping agent selected the wrong product. Responsibility can be determined based on the human intent and product information recorded in the Cart Mandate or Intent Mandate.
- Merchant failure to fulfill the order: responsibility can be determined based on the Cart Mandate, Payment Mandate, payment records, merchant commitments, and related evidence.

## Comparison Between the ANP Transaction Scheme and AP2

In May this year, we released a peer-to-peer agent transaction scheme. We call it agent transaction rather than payment because transactions involve the buying and selling of goods, while payment is only one part of the process.

Detailed design: https://mp.weixin.qq.com/s/wFVUDs31e6CKLpu8F3LDWg

Architecture diagram of our design:

![ANP Agent Transaction](/blogs/images/ap2/anp-transaction.png)

We made a simple comparison:

**Understanding of the scenario**: basically the same. The user’s agent and the merchant’s agent conduct cross-domain, cross-platform transactions in an open environment. This shows that our vision of the future is quite consistent with AP2’s.

**Problem solved**: similar. The core problem is still transaction trust.

**Participating roles**: most roles are the same, but we differ on the Credentials Provider. Our original design did not have this role. Instead, it introduced another role: a payment agent or payment system, used to escrow funds during the transaction process. Our thinking is very similar to the mainstream escrow logic currently used in China: when a user buys a product, they do not pay the merchant directly. Instead, the funds are held by a financial institution recognized by both parties, such as Alipay. After the goods are delivered and the user confirms receipt, the financial institution transfers the funds to the merchant. If a dispute occurs, an arbitration agent can decide how the funds should be handled.

**Trust establishment**: we also use verifiable credentials to establish trust between agents. The difference is that the verifiable credentials in our design are W3C-defined credentials, whereas AP2’s credentials are defined by AP2 itself.

**Transaction flow**: the basic process is similar. We use verifiable credentials to define each key step separately, and then connect these credentials together using hashes in a blockchain-like manner, preventing the intermediate process data from being tampered with.

![ANP VC Hash Chain](/blogs/images/ap2/anp-vc-hash.png)

**Dispute handling**: we introduce notary agents and arbitration agents to handle disputes between buyers and sellers.

### Analysis of the Differences Between the Two Designs

**ANP’s design**:

1. It does not separately define a user-side credential wallet for storing the user’s transaction credentials. Instead, this is included within the functional scope of the user agent.
2. User payment-method selection is included in the interaction between the payment agent and the user agent. Privacy-sensitive information about specific payment instruments, such as bank card numbers, is exposed only between the user and the payment agent, and is completely isolated from the merchant side.

**AP2’s design**:

1. It does not define an intermediary payment agent. Instead, it defines a user-side Credentials Provider, which generates a payment instrument token for a specific transaction. Transaction parties reference this token and use it to execute payment. This can happen either when the shopping agent instructs the credential wallet to pay, or when the merchant side pushes a payment request.
2. The user’s specific payment process occurs between the Credentials Provider and the clearing networks and institutions corresponding to the payment instrument.

The differences between the two designs reflect different design philosophies under the same design goal: implementing an auditable multi-party transaction process while protecting the user’s sensitive payment information.

1. ANP introduces the concept of a payment agent that works together with the user agent. The user agent is treated as a runtime entity fully controlled by the user. This is a design rooted in the agent-network philosophy.
2. AP2 extends the function of the user-side electronic wallet. Its design scenario assumes that the electronic wallet exists on the user’s device, while the agent that provides shopping services for the user may run on another server or as a general runtime entity on the user’s device. That agent does not possess the user’s payment method.

### What Is Unique About Our Design

**Agent identity and public-key distribution**: as everyone knows, ANP’s identity scheme is built on DID. The greatest advantage of DID is public-key distribution. Since verifiable credential verification requires securely obtaining the other party’s public key, DID and verifiable credentials naturally work well together as an agent identity scheme. This is very suitable for distributed and decentralized transaction processes.

**VC hash chain**: by generating verifiable credentials at key nodes and linking them into a tamper-resistant verifiable credential chain with a blockchain-like design, later detailed audit and dispute handling for the transaction process become easier.

**Transaction fund escrow**: the first version we designed did not use the credit-card-like payment method prioritized by AP2. Instead, it used the escrow model commonly seen in China. The escrow flow is relatively simple and convenient for dispute handling. At the same time, it can support our agent transaction scheme at low cost without major reconstruction of existing payment methods such as Alipay.

## Summary

The view we want to express has already been stated in the Core Takeaways section.

Here I will emphasize it again: **AP2 is an underestimated protocol. It is dedicated to solving the trust problems encountered in agent-mediated transactions, and it is an important part of the agent economy.**

Returning to our community, **from agent communication protocols to agent transaction/payment protocols, Google has in many ways been following the path we have been exploring.**

The two technical non-consensus positions we still insist on are: **DID-based agent identity and linked-data-based information organization**. We believe that in the near future, these two non-consensus positions will also become industry consensus.

Finally, ANP’s GitHub star count has exceeded 1K. For a niche project that has grown organically, crossing 1K stars is truly not easy. If you have not starred our project yet, please consider doing so:

https://github.com/agent-network-protocol/AgentNetworkProtocol

Please continue following our open-source project. If you are interested in any kind of collaboration, feel free to contact us.

## Copyright Notice
Copyright (c) 2024 ANP Community
This file is released under the [MIT License](../LICENSE). You are free to use and modify it, but you must retain this copyright notice.
