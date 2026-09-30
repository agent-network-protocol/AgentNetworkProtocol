# Agent Network Protocol Technical White Paper

## Identity, Communication, and Capability Connections for an Open Agentic Web

- Document ID: ANP-01
- Status: Draft / not released
- Version: 1.2
- Released baseline: [ANP-01 v1.2](../01-agentnetworkprotocol-technical-white-paper.md)
- Revision date: 2026-09-24
- Language: English
- Chinese version: [Agent Network Protocol 技术白皮书](chinese/01-AgentNetworkProtocol技术白皮书.md)

> This paper explains ANP's vision, architecture, and design trade-offs. It introduces no normative requirements. Wire formats, algorithms, verification procedures, and interoperability requirements remain defined by their owning specifications. The baseline is the ANP 1.2 specification set: ANP-06 remains a draft, P6 Group E2EE remains a candidate, and ANP-10 is a payment adaptation draft. Appendix A records specification status and versioning. This document revision does not establish SDK, product, or third-party integration support.

## Abstract

Agent Network Protocol (ANP) aims to build an open internet of agents, allowing agents from different organizations, platforms, and technical implementations to connect and collaborate. We believe that realizing agents' potential requires more than understanding information. Subject to authorization, agents also need to obtain context across domains, use services from different providers, and maintain ongoing collaborative relationships. Openness does not require making all data public; it means that these connections need not be confined to one platform's identity and interface system.

Built on existing Internet infrastructure, ANP organizes common capabilities for identity, encrypted communication, description, and discovery, while leaving domain application protocols room to evolve independently. ANP combines the common identity model of W3C DIDs with Web publication and resolution to support federated authentication. Method-independent ANP-02 authentication enables `did:wba`, native `did:web`, and future adapted methods to share a request-verification flow. The default fingerprint binding and document proof of path-type `did:wba` further distinguish identity control from document hosting.

For communication, ANP provides cross-domain messaging, groups, attachments, and optional end-to-end encryption. Natural-language messages carry flexible requirements and negotiations; structured interfaces constrain execution that needs predictable semantics. For description, ANP makes Information and Interface first-class concepts and connects resources and interfaces through URLs into a navigable network. Callers can retrieve information selectively, make decisions in their own environment, and choose an appropriate interaction path. The meta-protocol provides an optional direction for dynamic negotiation, while payments, authorization, and vertical applications favor integration with existing protocols and domain ecosystems.

ANP is not another closed platform. It is a set of common connection rules through which identity can be verified, communication protected, and capabilities discovered and composed, while users and service providers retain responsibility for business permissions.

## Reading Guide

[1. Open-network vision](#vision) · [2. Architecture](#architecture) · [3. Agent identity](#identity) · [4. Agent messaging](#messaging) · [5. Agent discovery](#discovery) · [6. Agent description](#description) · [7. Meta-protocol](#meta-protocol) · [8. Application protocols](#applications) · [9. Security boundaries](#security) · [10. Collaboration and adoption](#adoption) · [Appendix A: Specifications](#specifications) · [Appendix B: Terminology](#terminology)

<a id="vision"></a>
## 1. Core Vision: Building an Open Internet of Agents

### 1.1 From people operating software to agents acting on their behalf

The Internet has largely organized information and services around human reading, selection, and operation. Users open different applications, interpret interfaces, move information between systems, and then decide and act. An important change introduced by agents is their ability to undertake some of this work within user-defined goals and permissions: gathering information, comparing options, invoking services, following up on results, and requesting human confirmation when necessary.

This does not require all traditional software to disappear. It does require an additional way to connect services for agents. People still need interfaces, and business systems still provide computation and services, but agents should not be limited to imitating clicks. Protocols should make capabilities machine-readable, callable, and composable. This is the Agentic Web we envision: a network in which agents are important participants and open protocols connect information with action.[^vision3]

### 1.2 Platforms reduce effort, but their boundaries can constrain collaboration

Platforms can organize search, relationships, transactions, and services to help users manage information overload and operational complexity. The first article in *Agentic Web: Ten Talks* interprets this as a way of reducing coordination costs in the traditional software era. Recognizing platforms' value, rather than treating closure simply as a matter of principle, helps identify what new connection infrastructure needs to accomplish.[^vision1]

When a task spans platforms, platform boundaries can also become task boundaries. Internal procurement requirements, supplier information, logistics status, and payment services reside in different systems. Without relevant context, an agent's judgment may be incomplete. Without access to the necessary services, even a well-developed plan returns execution to the human user.

The problem is not that every platform needs every capability. It is whether capabilities distributed across systems can be connected safely.

### 1.3 The drivers of openness: experience, cost, and efficiency

Our central proposition is that open connections offer long-term value through more complete task experiences, lower repeated integration costs, and a broader space for composing services. The second article develops this argument around the relationship between context for decisions and services for action.[^vision2]

For users, the benefit is not another entry point but fewer application switches, repeated explanations, and manual transfers. For providers, open interfaces allow specialized capabilities to be used by different agents without requiring a single platform to package them. For developers, shared identity, messaging, and description mechanisms can reduce the work of reinventing a connection arrangement for every pair of systems.

Natural-language understanding and machine-readable descriptions create an opportunity to change this cost structure. Open collaboration need not begin with an exhaustive data model for every possible business. Common protocols handle identity, communication, and necessary structure; agents use semantic understanding to address different requirements. Actual benefits still depend on model capability, service quality, network conditions, and implementation. They cannot be inferred from the existence of a protocol alone.

### 1.4 Openness is a condition for broad interconnection, not a prediction that platforms vanish

For agents from arbitrary organizations to have the opportunity to collaborate across platforms, the underlying connection rules cannot be determined solely inside one platform. This is why ANP chooses openness: it is an architectural condition for broad interconnection, not a certain prediction about every company's future behavior.

An open network can include enterprise systems, private services, and commercial platforms. It does not require every node to publish all its data or every participant to trust every other participant. ANP seeks public protocols, independent implementation and deployment, interoperability across providers, and participants' freedom to choose what they publish, which identities they accept, and what permissions they grant.

**Open connections do not imply unconditional access, and identity recognition does not imply shared permissions.** A federated network allows service domains to operate independently while collaborating through common protocols.

<a id="architecture"></a>
## 2. ANP Architecture and Design Principles

### 2.1 Reusing the Internet rather than rebuilding it

ANP follows the architecture in the current README: two core protocol layers built on open Internet infrastructure, with domain-specific application protocols above them. The figure below uses the same asset as the README.[^readme]

<p align="center">
  <img src="../images/anp-architecture2.png" width="760" alt="ANP architecture: open Internet infrastructure, identity and encrypted communication, the application protocol layer, and domain application protocols" />
</p>

*Figure 1: ANP architecture. The meta-protocol is an optional draft, not a mandatory layer of the currently released architecture. Domain capabilities shown in the figure do not imply that all corresponding standards have been released or integrated.*

**Open Internet infrastructure.** Existing facilities such as HTTP, DNS, TLS, certificate authorities, CDNs, and search provide addressing, transport, hosting, and distribution. These are reusable capabilities, not a requirement for every deployment to use a CDN or search service, and they do not all perform the same trust function.

**Identity and encrypted communication layer.** W3C DIDs and the Web provide the identity foundation, while ANP-02 defines common request authentication. Messaging specifications define DID addressing, cross-domain interaction, business-message semantics, and optional device-bound E2EE. Authentication and messaging can be adopted independently; combinations follow the dependencies of the relevant specifications.

**Application protocol layer.** Description and discovery make capabilities publishable, locatable, and understandable. Agent application protocols use these connection mechanisms to organize business interactions. Payment, authorization, transaction, and vertical protocols can evolve independently rather than all becoming part of the ANP core.

### 2.2 How the modules work together

Identity establishes which subject is participating. Messaging exchanges intent, information, and results. Discovery locates candidate collaborators and their entry points. Description explains what information is available and how to interact. Domain protocols define business objects, operations, and rules. The meta-protocol is optional when participants need an additional agreement about the interaction method.

These responsibilities do not define a fixed execution sequence. A caller may discover and read public material before authenticating for a protected interface. Existing contacts can use messaging directly. A known interface can be called without search or meta-protocol negotiation. Layering also does not require all application data to pass through an ANP messaging service.

### 2.3 Shared design principles

**Open interoperability.** External connections are not tied to a particular model, product, or operating platform. Participants use common specifications and identify their actual support scope.

**Web reuse.** Existing infrastructure and standard interfaces are preferred, avoiding unnecessary deployment prerequisites for ordinary connections.

**Composability.** Identity, messaging, description, discovery, and domain semantics retain distinct responsibilities so that adoption can be incremental.

**Natural language alongside structured expression.** Natural language handles open-ended intent and individualized requirements; structured protocols constrain verifiable and repeatable execution.

**Minimum trust and minimum disclosure.** Authentication, authorization, content validation, and business judgment remain separate. Only the information and permissions necessary for the task should be exposed or granted.

The purpose is not to remove every source of complexity, but to assign it to the appropriate module.

<a id="identity"></a>
## 3. Agent Identity: The Starting Point for Cross-Platform Connections

### 3.1 Why identity is foundational

Understanding a sentence does not tell an agent who said it. When receiving a quote, file, or operation request, participants first need to determine which identity the other party uses, whether an authorized key produced the request, and whether that identity is consistent with an existing relationship. Without this foundation, permissions, contacts, group membership, messaging keys, and audit records cannot retain clear meaning across systems.

ANP distinguishes subject identity, service address, and business permission. A DID identifies a subject, a URL locates a resource or service, and authorization policy determines permitted actions. Names and avatars support presentation but do not replace cryptographic identity verification. A platform forwarding a request is not necessarily its business initiator.[^anp02][^anp09]

Reusable identity means that an agent can use the same DID to authenticate to multiple services that support its DID method and ANP authentication, rather than establishing a new proprietary authentication mechanism for every connection. Services may still require business enrollment, subscription, approval, or other admission conditions. Reusing an identity neither means reusing one access token nor grants Internet-wide access.

### 3.2 Why W3C DIDs

W3C DID provides common identifier syntax, a DID Document model, and verification relationships, allowing different identity systems to organize interoperability around consistent identity material. DID methods specify how that material is created, resolved, updated, and deactivated. DID Core does not require all methods to depend on the same infrastructure or on a blockchain.[^didcore]

ANP chooses DID because this model suits a common representation of cross-platform identity. Organizations can retain their internal account systems while providing DIDs for subjects participating externally. Users can also hold private keys, separating identity control from a particular application's interface. This follows the interoperability goal of ANP's early identity articles, while current specifications remain the authority for authentication and security rules.[^identity-rationale]

DID is not, by itself, a complete login, authorization, or reputation system. Common syntax produces practical interoperability only when combined with consistent resolution, verification, algorithm support, and request authentication. ANP-02 separates the shared request-authentication mechanism from individual DID methods.[^anp02]

### 3.3 DID and the Web as a basis for federation

ANP's Web-based approach publishes identity material at HTTPS-accessible locations operated by independent organizations. A counterpart retrieves and validates that material under the DID method, then verifies requests. Domains can retain their own accounts and management arrangements without a single network-wide identity-account center.

Operationally, this resembles federated email: internal administration can be centralized while external protocols interoperate. The analogy concerns federation only; ANP uses its own authentication and messaging rules, not email wire formats.

ANP does not make on-chain identity a common prerequisite. This avoids making ordinary identity publication and cross-domain authentication depend on a shared ledger, transaction fees, or consensus confirmation, while using established Web deployment and distribution capabilities. It is a trade-off about dependencies, deployment at scale, and operations, not a blanket performance judgment about blockchain identity. Ledger-based methods can still enter the common authentication framework through separate adaptation.

The Web approach retains dependencies on DNS, HTTPS, certificates, and hosting availability. Federation does not automatically remove a domain operator's or identity provider's control. ANP therefore distinguishes the trust models of different DID methods.[^anp02][^web]

### 3.4 did:wba: Separating identity control from document hosting

`did:wba` targets agent identity on the Web. Its default path-type `e1_` scheme places the fingerprint of an Ed25519 binding public key in the DID's final path segment. The following illustrates structure only: `<fingerprint>` is a placeholder, not a directly usable DID.[^anp03]

```text
did:wba:example.com:user:alice:e1_<fingerprint>
```

The verification model connects three distinct steps.

**Binding the DID to a public key.** The verifier recomputes the binding key's fingerprint and checks it against the expected DID. Replacing the key changes its fingerprint; the binding identity cannot be silently replaced while retaining the same DID.

**Binding the public key to the document.** An active default `e1_` DID requires a valid document-wide `DataIntegrityProof`, produced with the binding key using `eddsa-jcs-2022`. The verifier checks the proof and fingerprint relationship, rather than merely finding a plausible public key. Document contents, including service endpoints, authorized keys, and device declarations, are therefore subject to the corresponding integrity verification.

**Binding a request to private-key control.** A requester must also sign using an authentication key authorized by the document. The fingerprint identifies the expected public key; the document proof establishes its authorized signing; the request signature establishes use of the relevant private key for that request. None substitutes for the others.

Given an established expected DID, uncompromised private keys, valid cryptographic assumptions, and correct verification, a hosting provider cannot make an unauthorized modification to an active `e1_` document pass verification. This adds protection compared with a model relying only on the hosting location to publish keys. It does not mean that the server cannot edit a file.

The host can still withhold service, return old state, or influence initial identity presentation. Bare-domain WBA, historical non-fingerprint forms, and compatibility extensions have their own rules; the full default `e1_` guarantee must not be generalized to them.[^anp03]

### 3.5 Supporting methods rather than requiring migration to WBA

`did:web` suits deployments in which an organization's domain and Web administration provide the identity trust basis. Its path is not bound to a particular public key, so keys can normally be updated in the document without changing the DID; protection of document updates is a deployment responsibility. Default path-type WBA adds fingerprint binding and mandatory document proofs, with the corresponding need to handle DID changes when the binding key changes. These are different control and lifecycle trade-offs.[^web][^anp03]

ANP 1.2 defines common-authentication integration for `did:wba` and native `did:web`. Native Web need not be converted to WBA and must not be forced to adopt WBA fingerprint, document-proof, or transition requirements.[^anp02]

`did:webvh`, which adds verifiable history to a Web-based method, is a direction for further adaptation. The existence of its upstream specification does not mean ANP adaptation is complete: ANP-02 currently provides an informative integration description only.[^webvh][^anp02]

ANP remains open to methods such as BID. Further adaptations need to identify the method revision, resolution and state verification, verification-method types, algorithms, and supported ANP capabilities. DID Core conformance is a common foundation, not a guarantee that every implementation automatically supports every method. Connecting with an existing DID also does not make different DIDs equivalent subjects.

### 3.6 ANP-02: Common request authentication and separate authorization

ANP-02 uses HTTP Message Signatures to authenticate requests and binds request-body contents through a digest when a body is present. A verifier validates the DID Document under its method, then checks authentication-key purpose, signature coverage, time, and replay conditions. Business access permissions are evaluated separately. The specification also defines JSON authentication-metadata carriage and optional access tokens.[^anp02]

An ordinary HTTP API can adopt this mechanism independently of Messaging, WNS, or a Device Manifest. Authentication material can accompany a business request, but document retrieval, challenges, or cache refreshes can still add network interactions. The design does not promise zero additional requests in every situation.

In the current common HTTP flow, the client authenticates the server's domain through TLS, while the server authenticates the client through its DID request signature. This does not automatically provide a server DID response proof to the client. Mutual DID authentication is a further extension direction, not a released capability introduced by this paper.

DID authentication and OAuth authorization can perform complementary roles. ANP does not replace OAuth. Binding DID-control proofs to OAuth clients, authorization flows, tokens, and resource access requires separate design and validation. Simply using both technologies is not evidence of completed interoperability.[^oauth]

### 3.7 Naming, key changes, and lasting relationships

Identity needs to be verifiable and usable. WNS/Handles provide human-readable name-to-DID resolution, while complete DIDs serve authentication and business addressing. These are different responsibilities.[^anp04]

Changing a default WBA binding key creates a new complete DID. The stable subject path preceding the fingerprint supports continuity assessment, but matching paths do not prove equivalence. Verifiers start from a previously trusted DID and validate direct-successor relationships and evidence according to the method.

Current rules distinguish original-binding-key proofs, proofs from previously authorized recovery keys, authenticated provider assertions, and unverified hints. These have different assurance. A provider assertion cannot be relabeled as cryptographic transition proof from the previous key holder. Name mappings, `alsoKnownAs`, or HTTP hints cannot independently authorize permission inheritance.[^anp03]

The business system uses the actual assurance to decide which relationships may continue. Even where a relationship is allowed to continue, an old DID's encrypted sessions and private state cannot simply be copied into sessions for the new DID.[^p5]

<a id="messaging"></a>
## 4. Agent Messaging: A General Communication Basis for Open Collaboration

### 4.1 Why messaging matters

Open collaboration cannot consist only of predefined standard requests. Clarifying requirements, discussing options, changing conditions, reporting progress, and handling exceptions require participants to exchange context. Messaging provides a persistent carrier for this interaction, and natural language supplies a common medium for expressing requirements across domains.

ANP treats messaging as a core capability because agents can use natural language for many open-ended communications without jointly implementing a specialized interface for every business detail before first contact. This is a design motivation, not an unmeasured percentage of tasks covered.

Messages support more than a single invocation. They can maintain ongoing contacts, multi-party collaboration, and asynchronous working relationships. Completion of one task need not terminate the relationship between its participants.

### 4.2 Flexible communication alongside predictable execution

Natural language can express conditions such as split deliveries or a constrained budget with a fixed deadline. It does not by itself guarantee agreement about quantities, prices, or the scope of execution. ANP therefore does not require messaging to replace every API.

A natural combination is to discuss through messages, confirm through structured parameters, execute through the applicable business interface, and report progress or exceptions through messages. Existing structured interfaces are often preferable for repeated, high-frequency, or strictly validated operations. Natural-language interfaces complement them for individualized requirements and uncovered cases. ADP describes both kinds.[^anp07]

Receiving a message does not mean the receiver has completed the business operation, nor that a user approved a payment or disclosure. Messaging transport and acceptance semantics remain distinct from domain-specific completion conditions.[^anp09]

### 4.3 Federated messaging capabilities

ANP Messaging defines cross-domain direct messaging, groups, mentions, attachments, and object transfer. Profiles combine base semantics with security mechanisms. The business subject remains an Agent DID or Group DID, rather than a device number.[^anp09]

Different service domains can host their respective agents. For direct messages, cross-domain success is anchored in acceptance by the target agent's ingress service. For groups, the Group Host organizes membership and event order. A relay does not become a universal business authority or reinterpret application content.

Attachments use a manifest carried in a message, with object contents retrieved through a separate HTTP(S) channel. Large objects need not traverse the messaging relay path. Where confidentiality is required, object-level encryption can be used and its key conveyed through protected messages. Group membership, attachment access control, and content encryption retain separate responsibilities.[^anp09]

Base messaging may use transport protection alone or an E2EE overlay. Service advertisement and runtime selection must reflect actual support; encryption failure must not silently switch the interaction to plaintext or a weaker mode.

### 4.4 From verifiable identity to verifiable communication keys

End-to-end encryption concerns not only how content is encrypted, but to whom. Without verification of the communication public key, an intermediary could try to substitute its own key for the recipient's.

ANP connects verification of identity material, device eligibility, and communication keys. For an active default WBA `e1_` identity, the conceptual chain is:

```text
Expected DID
  → fingerprint-matched binding public key
  → verified DID Document
  → document-authorized devices and communication keys
  → establishment material and sessions verified under the E2EE Profile
  → authenticated encrypted messages
```

Fingerprint binding and document proofs reduce the scope for silent key substitution by a host. Device and E2EE rules verify the concrete cryptographic endpoints participating in a session. The complete mechanism is jointly defined by the DID method, P2 Identity and Discovery, and the relevant E2EE Profile. Checking only one link is insufficient.[^anp03][^p2][^p5]

Direct E2EE uses X3DH-like asynchronous establishment and Double Ratchet-like message protection. Group E2EE uses MLS and connects DID, device, and application-group state to cryptographic state. These choices do not establish independent security audits of every ANP implementation or wire compatibility with other products using similar algorithms. P6 retains candidate status.[^anp09][^mls]

Native `did:web` can also compose with the corresponding E2EE Profiles, but its identity material is validated under Web method rules and retains that hosting trust boundary. WBA's fingerprint-based guarantees do not automatically transfer to every method.

### 4.5 Multiple devices and the limits of encryption

One business DID can correspond to several cryptographic device endpoints. For device-addressed E2EE, the DID Document's Device Manifest declares current endpoints and key references. Direct messaging establishes separate sessions for concrete device pairs; groups can maintain distinct MLS leaves for several devices belonging to one member DID. Devices do not share private keys, Ratchet state, or other private session state.[^p2][^anp09]

Ordinary non-E2EE messaging remains DID-addressed and does not require a Device Manifest. The number of devices does not change the number of business group members. Separating business identity from cryptographic endpoints avoids turning multi-device support into multiple sets of contacts or membership relationships.

E2EE confidentiality depends on verification, private-key custody, state updates, and secure endpoints. It cannot stop a recipient from forwarding plaintext, protect an already compromised endpoint, or automatically hide metadata such as communication relationships. If an agent submits decrypted content to a remote model service, that subsequent plaintext processing lies across a separate data-protection boundary.

<a id="discovery"></a>
## 5. Agent Discovery: Finding Collaborators on the Network

### 5.1 Common entry points without a single directory

An open network allows organizations to publish agents independently. It needs common discovery conventions, not mandatory registration of every node with one platform. ANP-08 helps callers and search services locate public Agent Description documents.[^anp08]

Searching for a suitable agent, obtaining its description, and resolving a messaging service from a known DID are related but different operations. Discovery returns entry points; DID resolution supplies identity and associated service material; runtime capability confirmation determines what is currently available.

### 5.2 Active and passive discovery

**Active discovery** starts with a known domain and reads its public description catalog through the following conventional entry point:

```text
https://{domain}/.well-known/agent-descriptions
```

The discovery document uses a JSON-LD collection page, lists description URLs, and links additional pages through `next`. This distributes catalogs across domains and supports pagination. Knowing one domain does not automatically discover the entire Internet.[^anp08]

**Passive discovery** allows agents to submit their description URLs to search services. A search service exposes a registration interface in its own description, then manages indexing and retrieval. ANP does not require one global search provider or define a common ranking, charging, or quality-assessment algorithm.

Callers can also obtain description URLs from existing contacts, organizational directories, or other trusted channels. A restricted network is not required to expose a public discovery entry point.

### 5.3 Discovery does not replace verification

Indexing does not prove capability claims, a search result does not establish business trust, and a URL in a description is not an access grant. Callers separately assess identity, resource provenance, interface security conditions, and actual capabilities.

Deployments should distinguish public from private information and consider stale indexes, malicious registration, and request rates. ANP supplies shared discovery mechanisms, not a promise that every search service indexes every agent or a universal reputation endorsement for results.[^anp08]

<a id="description"></a>
## 6. Agent Description: A Linked Network of Information and Interfaces

### 6.1 An AD is an entry point, not the whole context

An Agent Description (AD) is the agent's external description entry point, analogous to a website home page. It explains the subject, capabilities, information resources, interfaces, and security requirements so a caller can choose what to visit next. It does not require downloading everything about the agent at once.[^anp07]

A supplier may have many products, technical documents, and business interfaces. The root description needs to provide a useful overview for further exploration. Callers can follow relevant links without placing unrelated material into model context. This organizes a resource network rather than merely presenting a single capability card.

### 6.2 Two first-class concepts

**Information** means externally available information resources, including text, structured material, images, audio, video, and other data. It answers what information can be retrieved.

**Interface** means an interaction entry point, whether structured or natural-language based. It answers how interaction can take place. An interface definition can itself be retrieved as a linked resource before the applicable protocol is used to invoke it.[^anp07]

This separation preserves a boundary between reading and acting. Reading a product specification is not placing an order. Finding a booking interface grants no permission to call it. A natural-language description also does not replace parameter, error, or state contracts.

### 6.3 Linked Data ideas with lightweight representation

ANP draws on Linked Data's approach to organizing information through identifiable resources and links. Resources can be published independently, descriptions help explain link purposes, and callers follow links to relevant material.[^linkeddata]

A URL is therefore more than a string in a list: it connects an overview to detailed material and interface definitions. The network can be hierarchical while also allowing several entry points to reference the same resource. It does not require copying all data into a central directory.

Current ANP-07 defines AD using ordinary JSON, with natural-language descriptions inside structured fields. It does not require a complete RDF or OWL reasoning system. ANP-08 discovery collections still use JSON-LD. Adopting linked-resource ideas and requiring one serialization for every document are different choices. Exact field names and formats remain defined by the owning specifications.[^anp07][^anp08]

### 6.4 Selective retrieval, local decisions, and interface execution

A caller starts from an AD, selects Information or interface definitions relevant to its task, obtains enough material to decide, and then chooses whether to act. This illustrates information organization, not new AD fields or wire formats:

```text
Supplier AD
  ├─ Information: product-catalog URL
  │    └─ relevant product → technical specifications and delivery links
  ├─ Information: service and support information URL
  └─ Interface: definition URL for quotation, ordering, or conversation
```

A procurement agent can read only relevant product and delivery details, combine them with budget, preferences, and internal constraints in its own trusted environment, and send only necessary information to the supplier. ANP does not require disclosure of all internal context or delegation of the complete task to a remote agent.

“Local” means the processing environment selected by the caller, not necessarily a physical device owned by the user. This pattern can reduce disclosure to a business counterpart, but it does not eliminate privacy risks from remote models, access logs, or other processors. Task delegation remains an available interaction option.[^anp07]

### 6.5 Benefits and costs of the linked network

Selective retrieval can reduce irrelevant transfer and context use. Hierarchical descriptions can organize many resources, and sharing a resource link across entry points can reduce duplication and update effort. Independently published public resources can also use appropriate HTTP caching, CDNs, and indexing rather than being regenerated in every conversation.

More importantly, the caller retains a choice of interaction path: read before deciding whether to delegate, use an existing structured interface, or discuss an uncovered requirement through natural language. Links place these paths in the same capability network without prescribing a single workflow.[^anp07]

These benefits must be balanced against additional requests, latency, freshness, and navigation costs. Clients should bound retrieval depth, size, and time, inspect resource types and provenance, and treat external material as data rather than trusted commands that override their own instructions. A link neither proves resource integrity nor guarantees permanent availability.

### 6.6 Relationship to task-centered models

ANP's description model organizes retrievable resources and interaction entry points around Information and Interface. A2A uses objects such as Task, Message, and Artifact to organize task execution and result exchange. These are differences in modeling emphasis, not mutually exclusive capabilities. Current A2A permits a direct Message response for simple interactions without creating a Task.[^a2a]

ANP can also expose task delegation or another protocol through an Interface. Its distinct emphasis is on following links, obtaining information, retaining the caller's decision process, and selecting a subsequent execution path. Listing a third-party interface in a description does not establish tested end-to-end interoperability with that protocol.

<a id="meta-protocol"></a>
## 7. Meta-Protocol: Optional Dynamic Interaction Negotiation

### 7.1 Why some interactions need additional negotiation

Identity, messaging, discovery, and description support many ordinary interactions. However, an intent can correspond to multiple interfaces, and runtime conditions can differ from static descriptions. An interface may be unavailable, participants may support different security modes, or a caller may impose special input or execution constraints.

The meta-protocol addresses how this interaction should take place, rather than performing the business task. When needed, it helps select an interface, Profile, security mode, schema, or other explicit execution conditions. ANP-06 remains an optional draft, not a prerequisite for every call.[^anp06]

### 7.2 From description to a negotiated result

The current draft uses a `MetaProtocolInterface` in the AD to identify the negotiation entry point, `anp.get_capabilities` to confirm runtime capabilities, and `anp.negotiate` to select the subsequent interaction:

```text
Discovery and description → capability confirmation when needed
  → negotiation when needed → selected interface, Profile, security mode,
    or schema → business interaction
```

The draft reuses existing binding and authentication mechanisms. It does not create a new transport layer, encrypted format, or identity system. It draws on Agora's research direction of combining natural-language flexibility with structured-protocol efficiency, adapted to ANP's description and communication architecture.[^anp06][^agora]

### 7.3 Negotiation does not replace authorization or implementation

Natural-language discussion expresses intent; meta-protocol negotiation selects an interaction method; authorization determines permitted conduct. Successful negotiation does not issue an access token, prove human approval, or make an unimplemented capability available.

Suitable results can be reused while their validity conditions hold. Capability, policy, or security changes require renewed checks. The draft does not mandate code generation, remote code loading, or executable exchange, and does not make global protocol consensus or incentives part of current interoperability requirements.[^anp06]

<a id="applications"></a>
## 8. Application Protocols and Ecosystem Extensions

### 8.1 Common foundations do not mean one model for every business

ANP seeks clear common connection capabilities, rather than placing every industry's objects and workflows in its core. Payments, orders, authorization, transactions, and other domains have their own business rules that belong to their specialized protocols and ecosystems.

Domain protocols can authenticate participants with ANP, publish interfaces through AD, discover services, and optionally use messaging. These choices can be adopted separately. An interface using ANP authentication need not wrap all its data as ANP messages.

### 8.2 Payments and authorization: Integration with explicit boundaries

Payment involves more than identifying the parties. It includes orders, approval to pay, payment processing, and business outcomes. ANP's direction is to work with domain protocols such as AP2 rather than claim a complete payment system merely because participants can authenticate and exchange messages. Upstream AP2 and the ANP adaptation document are separate artifacts.[^ap2]

ANP-10 in this repository is a payment adaptation draft, not a stable payment interoperability standard. Its fields and flows do not establish complete compatibility with all current upstream AP2 capabilities, and its presence in the specification catalog does not imply production readiness.[^anp10]

Authorization should likewise remain separate from identity. Combining DID and OAuth is a direction for connecting reusable identity to established authorization mechanisms. The applicable authorization protocol should define delegation scope, validity, revocation, human approval, and token use. This paper defines neither a new OAuth binding nor a universal authorization credential.[^anp02][^oauth]

### 8.3 Vertical protocols can evolve independently

A domain may require common data objects, state transitions, delivery evidence, or operation constraints. Natural language can help explain requirements, but domain rules that need predictable semantics still benefit from dedicated protocols.

Domain participants can independently design, govern, and version protocols on ANP's foundations. ANP provides underlying authentication and other optional connection capabilities. It does not require all industry specifications to become ANP specifications or automatically classify a product's internal protocol as a common standard.

**Using ANP is different from belonging to the ANP specification set.** Third-party extensions should identify ownership, versions, dependencies, and interoperability evidence. Product-specific roles, storage limits, and scheduling behavior should not be mistaken for network-wide semantics.

<a id="security"></a>
## 9. Security, Trust, and User-Control Boundaries

### 9.1 Verification starts with a trusted entry point

Cryptographic verification establishes whether a key signed content. It does not automatically establish that a DID corresponds to a particular real-world organization or person. Callers need an appropriate trusted channel to establish the expected identity and must distinguish display names, search results, domain associations, and cryptographic subjects.[^didcore]

WBA fingerprint verification specifically depends on verifying the expected DID. If an attacker replaces the entire DID at first contact, correctly checking the attacker's own key does not expose business-identity impersonation. A trusted directory, previously verified relationship, or other business evidence can help establish this initial association, with their respective trust boundaries.

### 9.2 Authentication, business authorization, and human approval are separate

A request signature proves use of the relevant private key, not that a user saw and approved that particular operation. AD's `humanAuthorization: true` is an interface requirement; the meta-protocol's `requiresHumanAuthorization: true` is a negotiation constraint. Neither is evidence of completed human approval.[^anp02][^anp07][^anp06]

High-risk operations need the applicable business protocol to verify the object, scope, and validity of approval. This does not add a generic `humanAuthorization` verification relationship to DID Documents, and ordinary `authentication` signatures do not replace necessary approval evidence.

Identity recovery must not conceal a change in trust. Business policy may accept a provider assertion, but it should retain that actual assurance rather than upgrading it to a transition signed by the original key holder. Inheriting contacts or permissions is also a different decision from establishing new encrypted sessions.[^anp03][^p5]

### 9.3 Keys, endpoints, and messaging state

Key-based control requires genuine key protection and constrained signing operations. A deployment in which a hosting provider also holds private keys cannot claim the same protection against that provider signing on the user's behalf.

DID Documents and device state need correct updates and verification; cached data cannot stand in for current state indefinitely. Integrity proofs alone do not establish freshness or availability, and WBA currently does not require a complete independently verifiable history log. Clients follow the method and Profile rules for old state, conflicting transitions, and recovery evidence.[^anp03][^p2]

End-to-end protection also depends on session and replay-state management and on avoiding silent security downgrades. A specification describes a cryptographic design; it does not prove every implementation correct or substitute for auditing and deployment validation.[^p5]

### 9.4 Minimum disclosure and safe handling of external information

Reusable identity has a privacy trade-off. One DID across services helps preserve relationships but can increase activity correlation. Separate DIDs and keys can reduce linkage across contexts, while public mappings, network characteristics, and business data can still reconnect them. The protocol does not guarantee anonymity or automatically establish permission inheritance between multiple DIDs.[^anp02]

Retrieving Information selectively can reduce private context submitted to business counterparts. E2EE protects content, but routing services may still observe DIDs, timing, and traffic metadata. Secure implementations treat external descriptions, messages, and linked content as untrusted input, addressing prompt injection, unauthorized operations, and unrestricted access to internal networks.

Openness means being able to connect with different participants, not promoting each new connection into a trusted source of executable instructions.

<a id="adoption"></a>
## 10. From Connection to Collaboration: An Example and Incremental Adoption

### 10.1 A cross-organization procurement example

This is an architectural illustration, not a report of completed third-party integration or production deployment.

An enterprise procurement agent needs equipment meeting specific technical requirements. It obtains AD URLs from known supplier domains and search services, reads relevant product material, and combines it with budget, destination, and internal standards in its own trusted environment. Unrelated products and internal budget information need not all be sent to every supplier.

Where published material is insufficient, it messages a supplier agent about lead times and customization. The parties establish identity relationships through their supported DID methods and authentication mechanisms. Where confidentiality is required, they select an E2EE mode they actually support rather than treating transport protection as end-to-end protection.

Once terms are clear, the procurement agent invokes the described quotation or ordering interface. It can use the same DID with different suppliers, but each supplier independently evaluates admission and permissions. Where an order or payment requires human approval, that approval is completed under the applicable business protocol before execution. A messaging negotiation result does not serve as payment authorization.

The parties continue to track progress through messages and exchange necessary documents as attachments. Multi-party work can use appropriate group capabilities and security modes. Existing interfaces need no meta-protocol negotiation. Additional negotiation is used only where dynamic selection is necessary and both parties implement the relevant draft. Payment and delivery outcomes remain defined by their domain protocols.

### 10.2 Identity and device changes during ongoing collaboration

Relationships can last for months or longer. Device additions and removals require current endpoint eligibility to be updated and verified, but do not change DID-level business membership. When a WBA binding-key change creates a new DID, participants verify transition evidence from the previously trusted identity and decide continuity under business policy.

Even if the contact relationship continues, historical signatures, DIDs, and ciphertext are not rewritten, and the new DID does not inherit old private session state. Business continuity and cryptographic isolation therefore retain distinct meanings.[^p2][^p5]

### 10.3 Adopt what is needed rather than everything at once

| Adoption goal | Capabilities to consider | Not automatically required |
| --- | --- | --- |
| Add cross-platform identity to an existing API | ANP-02 and supported DID methods | Messaging, WNS, Device Manifest, meta-protocol |
| Publish discoverable information and interfaces | ANP-07 and ANP-08, with suitable authentication for protected interfaces | Direct messaging, groups, or payments |
| Establish ongoing cross-domain collaboration | Messaging Profiles composed according to dependencies and required security modes | Every unrelated domain protocol |

These are capability combinations, not new conformance levels. Implementations accurately advertise supported DID methods, interfaces, and Profiles. Specification status, algorithm constraints, and version requirements continue to apply.[^anp02][^catalog]

### 10.4 Evolution and conclusion

ANP's identity and authorization work will continue exploring authentication for streaming interactions, mutual DID proofs, and DID–OAuth integration, alongside adaptation of methods such as WebVH and BID. These directions require separate specification, review, and interoperability validation; this paper does not declare them released. Messaging and domain protocols likewise need implementation feedback and their own release conditions.

ANP's goal is to **make identity a common basis for cross-platform connections, messaging a general medium for open collaboration, and Information and Interface a navigable, callable capability network.**

Agents should be able to select appropriate collaborators within users' goals and permission boundaries, rather than operate only inside one platform's predefined scope. Open protocols do not replace every product; they allow more products and specialized capabilities to connect. ANP invites developers, researchers, and service providers to improve specifications, implementations, and interoperability validation together, building an open internet of agents.

<a id="specifications"></a>
## Appendix A: Specification Index and Status

The following records the ANP 1.2 specification set read for this revision. Document versions are not wire versions, and an informative white paper does not change the release status of its references.[^readme][^catalog]

| Document | Responsibility | Status at this revision |
| --- | --- | --- |
| ANP-01 | Vision, architecture, and trade-offs | Informative white paper; document version 1.2 |
| [ANP-02](../02-anp-did-authentication-protocol-specification.md) | DID-method-independent authentication | Released 1.2; WBA and native Web bindings defined |
| [ANP-03](../03-did-wba-method-design-specification.md) | WBA method, document proofs, and continuity | Released 1.2 |
| [ANP-04](../04-anp-did-wba-name-space-specification.md) | WNS naming and resolution | Released 1.2 |
| [ANP-06](../06-anp-agent-communication-meta-protocol-specification.md) | Optional semantic negotiation | Draft; document version 1.2 |
| [ANP-07](../07-anp-agent-description-protocol-specification.md) | AD, Information, and Interface | Released 1.2 |
| [ANP-08](../08-ANP-Agent-Discovery-Protocol-Specification.md) | Active and passive discovery | Released 1.2 |
| [ANP-09](../09-ANP-end-to-end-instant-messaging-protocol-specification.md) | Messaging overview and Profile index | Published 1.2 catalog; P6 remains a candidate |
| [ANP-10](../application/10-anp-agent-payment-protocol-specification.md) | AP2 payment adaptation | Independently versioned draft; English and Chinese revisions are not synchronized normative translations |

Messaging 1.2 is a mixed-version suite: P1, P2, P3, P7, P8, and the P9 binding retain v1; P4, P5, and P6 use v2. P9 is a binding extension without an independent `meta.profile`. Stable P6 release still requires a registered MLS `ExtensionType`; provisional value `0xF0A1` is not a completed registration.

Informative integration guidance for WebVH and other methods does not constitute an enabled authentication binding. Specification publication, implementation support, interoperability validation, and production security are different kinds of evidence.

<a id="terminology"></a>
## Appendix B: Terminology

| Term | Meaning in this paper |
| --- | --- |
| DID | A subject identifier resolved and validated under its method |
| DID Document | Identity material describing verification methods, purpose relationships, and associated services |
| DID method | Rules for creating, resolving, updating, and deactivating that kind of DID |
| Federated network | Independently operated service domains interoperating through common protocols |
| Handle / WNS | User-facing naming and resolution, not a substitute for DID verification |
| Stable subject path | A continuity reference preceding the default WBA fingerprint segment, not another DID |
| AD / ADP | Agent Description document and its protocol |
| Information | Externally provided information resources that can be retrieved |
| Interface | A structured or natural-language interaction entry point |
| Profile | A specification of particular capabilities, bindings, and interoperability rules |
| E2EE | End-to-end encryption between designated cryptographic endpoints |
| Device Manifest | Current device-endpoint and key declarations for device-addressed E2EE |
| MLS Leaf | An endpoint in cryptographic group state, not a business group member |
| Meta-protocol | An optional mechanism for negotiating the subsequent interaction method |

## References

Vision articles explain design motivations and are not normative sources for wire formats or security requirements. External references were checked for this revision; implementers should confirm the exact versions they adopt.

[^vision1]: [Agentic Web: Ten Talks, Day 1 — The Past and Present of the Web](../blogs/cn/Agentic-Web十日谈/01day-Web的前世今生.md). Chinese source used for this revision.
[^vision2]: [Agentic Web: Ten Talks, Day 2 — Why Agents Need an Open Internet](../blogs/cn/Agentic-Web十日谈/02day-第一性原理.md). Chinese source used for this revision.
[^vision3]: [Agentic Web: Ten Talks, Day 3 — What Is the Agentic Web?](../blogs/cn/Agentic-Web十日谈/03day-什么是Agentic-Web.md). Chinese source used for this revision.
[^identity-rationale]: [Three Key Issues of Agent Identity: Interoperability, Human Authorization, and Privacy Protection](../blogs/three-key-issues-of-agent-identity-interoperability-human-authorization-and-privacy-protection.md). Historical protocol fields are not current implementation guidance.
[^readme]: [ANP README](../README.md).
[^anp02]: [ANP-02: DID Authentication Protocol](../02-anp-did-authentication-protocol-specification.md).
[^anp03]: [ANP-03: did:wba Method Specification](../03-did-wba-method-design-specification.md).
[^anp04]: [ANP-04: DID-WBA Name Space Specification](../04-anp-did-wba-name-space-specification.md).
[^anp06]: [ANP-06: Agent Communication Meta-Protocol Specification (Draft)](../06-anp-agent-communication-meta-protocol-specification.md).
[^anp07]: [ANP-07: Agent Description Protocol](../07-anp-agent-description-protocol-specification.md).
[^anp08]: [ANP-08: Agent Discovery Protocol](../08-ANP-Agent-Discovery-Protocol-Specification.md).
[^anp09]: [ANP-09: End-to-End Instant Messaging Overview](../09-ANP-end-to-end-instant-messaging-protocol-specification.md).
[^anp10]: [ANP-10: Agent Payment Adaptation Draft](../application/10-anp-agent-payment-protocol-specification.md).
[^catalog]: [ANP Messaging 1.2 Profile Index](../message/README.md).
[^p2]: [P2: Identity and Discovery](../message/02-identity-and-discovery.md).
[^p5]: [P5: Direct End-to-End Encryption](../message/05-direct-end-to-end-encryption.md).
[^didcore]: W3C, [Decentralized Identifiers (DIDs) v1.0](https://www.w3.org/TR/2022/REC-did-core-20220719/).
[^web]: [did:web Method Specification](https://w3c-ccg.github.io/did-method-web/).
[^webvh]: DIF, [The did:webvh DID Method v1.0](https://identity.foundation/didwebvh/v1.0/). An upstream release does not establish completed ANP adaptation.
[^linkeddata]: Tim Berners-Lee, [Linked Data — Design Issues](https://www.w3.org/DesignIssues/LinkedData.html). This paper draws on resource-linking ideas without making the full Semantic Web stack an ANP prerequisite.
[^a2a]: [Agent2Agent Protocol Specification](https://a2a-protocol.org/latest/specification/), especially Core Concepts and Send Message; checked 2026-09-24.
[^oauth]: IETF, [RFC 6749: The OAuth 2.0 Authorization Framework](https://www.rfc-editor.org/rfc/rfc6749). This reference identifies responsibilities, not an ANP OAuth integration profile.
[^mls]: IETF, [RFC 9420: The Messaging Layer Security (MLS) Protocol](https://www.rfc-editor.org/rfc/rfc9420). P6 defines ANP-specific bindings.
[^ap2]: [Agent Payments Protocol (AP2)](https://ap2-protocol.org/).
[^agora]: [A Scalable Communication Protocol for Networks of Large Language Models](https://arxiv.org/html/2410.11905v1). Research inspiration for ANP's meta-protocol; concrete interfaces remain defined by the ANP-06 draft.

## Copyright Notice

Copyright (c) 2024 ANP Community

This file is released under the [Apache License 2.0](../LICENSE). You are free to use and modify it, but must retain this copyright notice.
