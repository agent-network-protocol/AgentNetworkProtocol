# did:wba Method Specification

- Document ID: ANP-03-vNext
- Title: did:wba Method Specification
- Status: Draft / not released
- Released Baseline: [ANP-03 v1.1](../03-did-wba-method-design-specification.md)
- Language: English
- Applicability: This specification applies to web-based decentralized identity, cross-platform authentication, and agent communication scenarios in ANP.

> Draft notice: this is a candidate method revision of ANP 1.1; common authentication is now owned by ANP-02. It MUST NOT be treated as the published protocol until this draft is released. The Chinese mirror is [did:wba方法规范](chinese/03-did-wba方法规范.md).

## Abstract

The did:wba DID method is a web-based decentralized identifier (DID) specification designed to meet the needs of cross-platform identity authentication and agent communication. This method is extended and optimized based on did:web, named did:wba, to retain its compatibility and enhance its adaptability to agent scenarios.

In this specification, the default scheme of path type did:wba will carry the bound public key fingerprint in the DID path to enhance the binding relationship between the DID and the user's own private key. The current version of the **default profile** is:

- `e1_`: Binds the Ed25519 public key, recommended for new deployments, and can directly integrate the W3C standard Data Integrity EdDSA proof.

In order to be compatible with the wallet ecosystem and existing secp256k1 implementation, this specification defines an additional **non-default compatible extension profile** in Appendix A:

- `k1_`: Binds the secp256k1 public key, mainly used for compatibility with the wallet ecosystem and the existing Web3 key system.

Common HTTP/JSON authentication is now defined by [ANP-02](02-anp-did-authentication-protocol-specification.md); this specification supplies WBA method rules. Native Web binding, naming, and messaging composition are described in [candidate Appendix B](appendix-b-compatibility-with-native-did-web.md).

## 1. Introduction

### 1.1 Preface

The did:wba DID method specification complies with the requirements specified in Decentralized Identifiers V1.0 [[DID-CORE](https://www.w3.org/TR/did-core/)].

This specification builds on did:web to define WBA document, binding, and lifecycle rules, and connects to common authentication through ANP-02.

Considering that the did:web method is designed for native web-based DID use cases and may evolve in ways that do not fully fit agent communication scenarios, and that this specification introduces targeted modifications, reaching consensus with the original author on those modifications would be a long-term process. Therefore, we decided to use a new method name.

In the future, we do not rule out the possibility of merging the did:wba specification into the did:web specification, and we will promote the realization of this goal.

The did:web method specification referenced by did:wba is available at [https://w3c-ccg.github.io/did-method-web](https://w3c-ccg.github.io/did-method-web), version dated July 31, 2024. For ease of management, we have also archived the copy of the did:web method specification currently used by did:wba: [did:web Method Specification](/references/did_web-method-specification.html).

### 1.2 Design principles

When designing the did:wba approach, our core principle was to make full use of existing mature technologies and complete Web infrastructure while achieving decentralization. Using did:wba, you can achieve email-like features. Each platform implements its own account system in a centralized manner. At the same time, each platform can be interconnected.

For path-type DIDs, this specification defines "carrying the bound public key fingerprint in the DID path" as the default scheme. The main purpose of this is to allow users to truly control their own private keys, and to form a stable and independently verifiable binding relationship between DID and the public key actually controlled by the user. Even if the platform maintains an escrow service for the DID document, the user or verifier can still verify that it corresponds to the expected public key against the DID itself, thereby reducing the risk of the platform silently replacing the identity public key.

In order to strike a balance between standard interoperability and ecological compatibility, the current version adopts the structure of "**main specification defaults to e1_, compatible extensions support k1_**":

- `e1_`: Binds Ed25519 public key, recommended for new deployments. This profile can be directly integrated with the W3C Data Integrity EdDSA standard and is suitable as the long-term standardization mainline of did:wba.
- `k1_`: Binds the secp256k1 public key, not as the default scheme of the main specification, but in Appendix A as an extensibility compatible with the wallet ecosystem, existing Web3 key system, and implementations that rely on secp256k1.

A natural consequence of the public key fingerprint path scheme is that when the binding key changes, the path-type DID also changes. Therefore, did:wba does not press "stable user-readable identity" directly on the DID string, but solves the stable reference problem through a name service scheme (such as WNS/Handle): DID is responsible for "verifiable cryptographic identity", and the name service is responsible for "stable human-readable name".

For path-type DIDs that need to preserve subject continuity after the binding key changes, the path before the final binding-fingerprint segment is called the **stable subject path**. For example, the stable subject path of `did:wba:example.com:user:alice:e1_<fingerprint>` is `example.com:user:alice`. A stable subject path is not another DID and cannot be resolved independently; once it is used to identify a continuing subject, it MUST remain permanently immutable, non-recyclable, and non-reassignable.

Two complete DIDs with the same stable subject path are still two distinct DIDs. A matching path is only a necessary condition for determining subject continuity; a verifier may treat the DIDs as the same continuing subject only after validating the `successorDid` document chain and the corresponding DID Document `proof` according to this specification.

In addition, various types of identifier systems can add support for DID, creating an interoperable bridge between centralized, federated, and decentralized identifier systems. This means that the existing centralized identifier system does not need to be completely reconstructed, and DID can only be created on its basis to achieve cross-system interoperability, thus greatly reducing the difficulty of technical implementation.

<a id="wba-method-rules"></a>
## 2. did:wba DID method specification

### 2.1 Method name

The name string used to identify this DID method is `wba`. DIDs using this method must start with the following prefix: `did:wba`. According to the DID specification, this string must be lowercase. The remainder of the DID (after the prefix) is specified below.

### 2.2 Method-specific identifiers

The method-specific identifier is a fully qualified domain name (FQDN) protected by TLS and optionally contains the path to the DID document. The formal rules describing the syntax of valid domain names are described in [(RFC1035)](https://www.rfc-editor.org/rfc/rfc1035), [(RFC1123)](https://www.rfc-editor.org/rfc/rfc1123), and [(RFC2181)](https://www.rfc-editor.org/rfc/rfc2181).

The method-specific identifier must match the server certificate according to modern TLS service authentication rules. Domain name matching MUST be based on the DNS identifier (`dNSName`) in the certificate's `subjectAltName` extension; implementations MUST NOT rely on Common Name (CN) as the basis for service identity matching. Method-specific identifiers must not contain IP addresses. Port numbers can be included, but the colon between the host and port must be percent-encoded to prevent conflicts with paths. Directories and subdirectories can be optionally included, using colons instead of slashes as separators.

did:wba supports two forms:

1. Naked domain name DID: used to identify the entire domain name subject, and can also be used for domain-level service identity, such as cross-domain service-to-service HTTP identity authentication;
2. Path-type DID: used to identify specific users, agents or sub-identities under a domain name.

For newly created path-type did:wba, this specification defines "the last segment of the path carries the binding public key fingerprint" as the default scheme. The path segments before the fingerprint segment are defined by the implementer, such as `user:alice`, `agents:billing`, etc.

ABNF is defined as follows:

```abnf
base64url-char = ALPHA / DIGIT / "-" / "_"
path-segment   = 1*(ALPHA / DIGIT / "-" / "_" / ".")
e1-fingerprint = "e1_" 43base64url-char

wba-root-did = "did:wba:" domain-name
wba-path-did = "did:wba:" domain-name 1*(":" path-segment) ":" e1-fingerprint
wba-did      = wba-root-did / wba-path-did
```

> Description:
> 1. The main specification default path profile only defines `e1_`.  
> 2. If the implementation needs to be compatible with secp256k1 path binding, please see the `k1_` compatible extension in Appendix A.

#### How to use naked domain name DID

The usage of `did:wba:{domain}` is similar to `did:web:{domain}`. The main rules are as follows:

1. The resolution method is consistent with the naked domain name entry of did:web:
   `did:wba:example.com` corresponds to `https://example.com/.well-known/did.json`
2. Naked domain name DID is mainly used to express "the entire domain name subject" or "domain-level service identity", rather than a specific user or sub-identity;
3. In ANP's cross-domain service-to-service calls, if an `ANPMessageService` needs to declare its own DID for outer HTTP identity authentication, it **SHOULD** prefer the naked domain name DID;
4. The naked domain name DID does not carry the `e1_` path binding fingerprint, so the path binding verification rules of this specification for the `e1_` path type DID do not apply;
5. Request authentication follows [ANP-02 common HTTP authentication and the WBA binding](02-anp-did-authentication-protocol-specification.md#wba-binding). Bare-domain form does not waive its digest, signature-coverage, authentication-purpose, time, or replay requirements. Native Web uses the ANP-02 Web binding.

See Appendix B for details on how native `did:web` participates in the above process in the same way in ANP.

### 2.2.1 Default path scheme: `e1_` binds public key fingerprint

For newly created path type did:wba, the last path segment MUST be the `e1_` binding public key fingerprint segment. `e1_` indicates that the binding key is the Ed25519 public key, and the DID adopts the main specification default profile.

The recommended structure is as follows:

```plaintext
did:wba:{domain}:{namespace...}:{e1-fingerprint}
```

Example:

```plaintext
did:wba:example.com
did:wba:example.com:user:alice:e1_<fingerprint>
did:wba:example.com%3A3000:user:alice:e1_<fingerprint>
```

To be compatible with existing deployments, the parser MAY support the parsing of historical path-type DIDs without fingerprint segments; however, newly created path-type DIDs SHOULD adopt the default scheme defined in this specification.

### 2.2.2 `e1_` fingerprint generation method (recommended)

The `e1_` fingerprint is used to associate a path-type DID with the Ed25519 binding public key. The generation method is as follows:

1. Select a DID binding key. The binding key MUST meet the following conditions:
   - is an Ed25519 public key;
   - Represented by `Multikey` / `publicKeyMultibase` in DID documents;
   - Authorized by the `authentication` relationship of the DID document.

2. Convert the Ed25519 `publicKeyMultibase` to the equivalent public key JWK. The equivalent JWK retains only the necessary fields required by RFC 7638:

```json
{
  "crv": "Ed25519",
  "kty": "OKP",
  "x": "..."
}
```

Specifically:

- `publicKeyMultibase` must be Multibase base58-btc encoded Ed25519 `Multikey`;
- After decoding, the original 32 bytes of the Ed25519 public key are obtained;
- `x` is the base64url (without padding) representation of this 32-byte public key.

3. Generate JWK Thumbprint input according to the rules of [RFC 7638](https://www.rfc-editor.org/rfc/rfc7638):
   - Only keep necessary fields;
   - Field names are sorted lexicographically;
   - Use JSON strings without extra whitespace;
   - Use UTF-8 encoding.

4. Perform a SHA-256 hash on the UTF-8 byte sequence obtained in step 3 to obtain a 32-byte digest value.

5. Base64url encode the 32-byte digest value and remove the trailing `=` padding. The encoding result length is fixed at 43 characters.

6. Add the `e1_` prefix in front of the encoding result to get the final path segment.

Notes:

1. The `e1_` prefix is not part of the hash output, but the profile prefix;
2. It is recommended to use the thumbprint value without the `e1_` prefix as the `kid` or fragment of the verification method to facilitate the intuitive correspondence between the DID path and the verification method identification;
3. New deployments SHOULD preferentially use the `e1_` profile.

### 2.2.3 Stable Subject Path

For a path-type DID using the binding-fingerprint path scheme, the stable subject path consists of the domain name and every path segment before the final binding-fingerprint segment:

```text
did:wba:example.com:user:alice:e1_<fingerprint>
        └──── stable subject path: example.com:user:alice ────┘
```

The stable subject path MUST satisfy the following requirements:

1. Once assigned to a continuing subject, it MUST NOT be modified, recycled, or reassigned to another subject;
2. When a root binding-key change produces a new DID, the stable subject paths of the old and new DIDs MUST be identical;
3. A verifier MUST NOT conclude that two DIDs belong to the same subject solely because they have the same stable subject path;
4. Subject continuity MUST be verified according to Sections 2.5.2 through 2.5.5 by validating the old DID Document's `successorDid`, the document-wide `proof`, and the new DID's binding fingerprint.

### 2.4 Key material and document processing

Due to the way most web servers render content, it is likely that a particular did:wba document will be served with the media type application/json. If a document named did.json is retrieved, the following processing rules should be followed:

1. If @context exists at the root of the JSON document, the document should be processed according to JSON-LD rules. If it cannot be processed, or the document processing fails, it should be rejected as a did:wba document.

2. If `@context` exists at the root of the JSON document, the document is successfully processed through JSON-LD, and the context contains `https://www.w3.org/ns/did/v1`, it can be further processed into a DID Document according to [[Section 6.3.2 of the DID Core specification](https://www.w3.org/TR/did-core/#consumption-0)].

3. If @context is not present, DID processing shall be performed according to the normal JSON rules specified in [[did-core specification section 6.2.2](https://www.w3.org/TR/did-core/#consumption)].

4. References to external resources, external DIDs, or `serviceEndpoint` MUST use absolute URIs.

5. References to internal validation methods of the same DID Document MAY use relative DID URLs (such as `#key-1`); when the parser processes such references, it must expand based on the document root DID.

> NOTE: This includes external URLs embedded in key material and other metadata, which prevents key obfuscation attacks.

### 2.5 DID Document Description

Apart from DID Core, related specifications may evolve over time. This section shows a subset of DID Documents used for authentication. To improve interoperability between systems, all fields marked as required must be supported by all systems, while fields marked as optional may be supported selectively. Fields defined in other standards but not listed here may also be supported selectively.

**The recommended e1 path-type DID document example is as follows:**

```json
{
  "@context": [
    "https://www.w3.org/ns/did/v1",
    "https://w3id.org/security/data-integrity/v2",
    "https://w3id.org/security/multikey/v1",
    "https://w3id.org/security/suites/x25519-2019/v1"
  ],
  "id": "did:wba:example.com%3A8800:user:alice:e1_<fingerprint>",
  "verificationMethod": [
    {
      "id": "did:wba:example.com%3A8800:user:alice:e1_<fingerprint>#key-1",
      "type": "Multikey",
      "controller": "did:wba:example.com%3A8800:user:alice:e1_<fingerprint>",
      "publicKeyMultibase": "z6Mk..."
    },
    {
      "id": "did:wba:example.com%3A8800:user:alice:e1_<fingerprint>#key-x25519-1",
      "type": "X25519KeyAgreementKey2019",
      "controller": "did:wba:example.com%3A8800:user:alice:e1_<fingerprint>",
      "publicKeyMultibase": "z9hFgmPVfmBZwRvFEyniQDBkz9LmV7gDEqytWyGZLmDXE"
    }
  ],
  "authentication": [
    "did:wba:example.com%3A8800:user:alice:e1_<fingerprint>#key-1"
  ],
  "assertionMethod": [
    "did:wba:example.com%3A8800:user:alice:e1_<fingerprint>#key-1"
  ],
  "keyAgreement": [
    "did:wba:example.com%3A8800:user:alice:e1_<fingerprint>#key-x25519-1"
  ],
  "service": [
    {
      "id": "did:wba:example.com%3A8800:user:alice:e1_<fingerprint>#ad",
      "type": "AgentDescription",
      "serviceEndpoint": "https://agent-network-protocol.com/agents/example/ad.json"
    },
    {
      "id": "did:wba:example.com%3A8800:user:alice:e1_<fingerprint>#handle",
      "type": "ANPHandleService",
      "serviceEndpoint": "https://example.com/.well-known/handle/alice"
    },
    {
      "id": "did:wba:example.com%3A8800:user:alice:e1_<fingerprint>#anp",
      "type": "ANPMessageService",
      "serviceEndpoint": "https://example.com/anp",
      "serviceDid": "did:wba:example.com%3A8800"
    }
  ],
  "proof": {
    "type": "DataIntegrityProof",
    "cryptosuite": "eddsa-jcs-2022",
    "created": "2025-01-01T00:00:00Z",
    "verificationMethod": "did:wba:example.com%3A8800:user:alice:e1_<fingerprint>#key-1",
    "proofPurpose": "assertionMethod",
    "proofValue": "z..."
  }
}
```

**Field explanation**:

- **@context**: required field, JSON-LD context defines the semantics and data model used in DID documents to ensure the understandability and interoperability of the document. `https://www.w3.org/ns/did/v1` is required. For e1 documents using the standard Ed25519 proof, `https://w3id.org/security/data-integrity/v2` and `https://w3id.org/security/multikey/v1` are also required. Others are added as needed.

- **id**: required field, cannot carry IP, but can carry port. When carrying port, the colon needs to be encoded as `%3A`. Use a colon later to split the path. For newly created path DIDs, the last path segment MUST be `e1_<fingerprint>`.

- **alsoKnownAs**: An optional field defined by DID Core. When a root binding-key change produces a new DID, the new DID Document MAY use this field to reference its direct predecessor DID. `alsoKnownAs` expresses only a reverse association claim and does not by itself constitute cryptographic proof of subject continuity.

- **deactivated**: An optional did:wba extension field defined for direct DID Document retrieval. A value of `true` indicates that the complete DID is no longer used for new authentication or business routing, while its DID Document remains available for historical verification and successor lookup.

- **successorDid**: An optional extension field defined by did:wba. Its value MUST be a complete DID string that points from a superseded DID to its direct successor DID. It MUST NOT skip an intermediate DID and be rewritten to point directly to a later successor.

- **verificationMethod**: A required field, containing an array of verification methods, which defines the public key information used to verify the DID subject. For scenarios that need to support end-to-end encryption (E2EE) communication, `verificationMethod` should contain both the signature key and the key agreement key to achieve key separation. The signing key is used for identity authentication and document assertion; the key agreement key (such as `X25519KeyAgreementKey2019`) is used for key negotiation of upper-layer protocols or receipt of confidential information. Both types of keys perform their own duties, and the leakage of a single key will not affect identity authentication and communication confidentiality at the same time.

For a path-type DID using the default path scheme, there MUST be at least one Ed25519 `Multikey` in `verificationMethod` as a binding key, and the RFC 7638 thumbprint of its equivalent public key JWK is exactly the same as the last `e1_` fingerprint segment of the DID path.

- **Subfield**:
    - **id**: The unique identifier of the verification method.
    - **type**: The type of verification method.
    - **controller**: Controls the DID of this verification method.
    - **publicKeyJwk**: Public key information, using JSON Web Key format.
    - **publicKeyMultibase**: Public key information, using Multibase format.

- **authentication**: required field, lists the verification method used for authentication, can be a string or object. For path-type DIDs using the default path scheme, the binding key MUST be authorized by the `authentication` relationship. By default, cross-platform authentication should prefer signing with this binding key.

- **assertionMethod**: Optional field listing the validation method used to express the assertion. For DIDs with the e1 profile and using the standard DID Document proof, the binding key or Ed25519 `Multikey` used to generate the proof MUST be authorized by `assertionMethod`.

- **keyAgreement**: Optional field that defines the public key information used for key agreement and can be used for encrypted communication between two DIDs. The verification method generally uses key agreement algorithms such as X25519KeyAgreementKey2019 that can be used for key exchange. `keyAgreement` can be a string reference (pointing to an entry in `verificationMethod`) or an embedded object. For end-to-end encryption (E2EE) scenarios, this field is used to provide key negotiation material to the upper layer protocol. The upper layer protocol can be direct messaging end-to-end encryption Profile, group end-to-end encryption Profile or other security overlays defined in the future; this specification does not hardcode `keyAgreement` into a specific algorithm process. New deployments should typically contain `X25519KeyAgreementKey2019` or the semantically equivalent X25519 entry. If there is no `keyAgreement` in the DID document or no negotiation entry available for the upper layer protocol, it means that the agent does not support the relevant E2EE capabilities.

- **Subfield**:
    - **id**: Unique identifier of the key agreement method.
    - **type**: The type of key agreement method.
    - **controller**: The DID that controls the key negotiation method.
    - **publicKeyMultibase**: Public key information in Multibase format.

- **service**: Optional field that defines the list of services associated with the DID subject.
  - **id**: The unique identifier of the service.
  - **type**: Service type. Currently the following types are supported:
    - `AgentDescription`: agent description service. `serviceEndpoint` points to documents that comply with the [ANP Agent Description Protocol Specification](/07-anp-agent-description-protocol-specification.md).
    - `ANPHandleService`: Handle binding service, used for WNS (WBA Name Space) bidirectional binding verification. `serviceEndpoint` MUST be a dereferenceable absolute HTTPS URI under the Handle Provider's domain. For details, see the [ANP DID:WBA Namespace Specification](04-anp-did-wba-name-space-specification.md).
      - When the DID holder is willing to disclose its Handle, `serviceEndpoint` SHOULD directly use the standard Resolution Endpoint of that Handle (such as `https://example.com/.well-known/handle/alice`).
      - When the DID holder does not want to disclose its Handle in the DID Document, `serviceEndpoint` MAY point to a DID Confirmation Endpoint (such as `https://example.com/.well-known/handle/by-did?did=...`), which returns at least `did` and `confirmed = true`.
      - When the returned document contains `handle` and it exactly matches the input Handle, the verifier can complete precise reverse verification for that specific Handle.
      - When the returned document contains only confirmation information, the verifier can confirm only the provider relationship. It MUST NOT treat that result alone as meaning that a specific Handle has been verified as bound, especially in security-sensitive scenarios that require confirmation of a specific Handle.
    - `ANPMessageService`: ANP's unified service endpoint for instant messaging. If the DID subject participates in the ANP instant messaging protocol, `serviceEndpoint` **MAY** point to its unified ANP messaging endpoint; direct messaging, group messaging, key material access, attachment control, and other capabilities are carried by this single service endpoint. The specific methods and capability statements follow ANP Profile 2 and related Profiles. If the service needs to participate in cross-domain service-to-service calls, the service entry **SHOULD** additionally declare `serviceDid`, indicating which DID the service uses in the outer HTTP request signature. For did:wba deployments, a naked domain name DID (such as `did:wba:example.com` or `did:wba:example.com%3A8800`) should normally be used.
  - **serviceEndpoint**: The endpoint URL of the service. 
  - **serviceDid**: Optional field. It is recommended to declare this field when the service participates in cross-domain service-to-service calls. Its value should be a DID string, not a DID URL, telling the peer "which DID's public key should be used to verify this outer HTTP request signature."

- **proof**: For the default `e1_` profile, `proof` is a required field; for other profiles, whether this field appears is determined by the corresponding profile rules. `proof` is used to express the integrity proof of the DID Document, proving that the DID Document has not been tampered with after generating the proof, and indicating that the signer controlled the corresponding private key when the proof was created. Proof itself does not replace the DID method parsing process alone, nor does it alone replace the `id` consistency check.
  - For the default e1 profile, this version defines `DataIntegrityProof` + `eddsa-jcs-2022` proof profiles based on W3C standards.

> Note:
>
> 1. Public key information currently supports two formats, `publicKeyJwk` and `publicKeyMultibase`. See [https://www.w3.org/TR/did-extensions-properties/#verification-method-properties](https://www.w3.org/TR/did-extensions-properties/#verification-method-properties) for details.
> 2. For verification method type definition, see [https://www.w3.org/TR/did-extensions-properties/#verification-method-types](https://www.w3.org/TR/did-extensions-properties/#verification-method-types). For e1 binding keys, `Multikey` is recommended.

> 6. For scenarios that need to support end-to-end encryption communication, it is recommended to adopt a key separation design: the signature/assertion key and the key agreement key are managed separately. Signing/assertion keys do not participate in key agreement, and key agreement keys do not participate in signing. The specific use of these materials is defined by the upper layer direct messaging E2EE, group E2EE and other Profiles.
> 7. For newly created path-type DIDs using the default path scheme, the binding key MUST satisfy:
> - represented using `Multikey` / `publicKeyMultibase`;
> - authorized by the `authentication` relationship;
> - The RFC 7638 thumbprint of its equivalent public key JWK is exactly the same as the last `e1_` fingerprint segment of the DID path.
> 8. If the implementation needs to support secp256k1 path binding, see Appendix A for `k1_` compatible extensions.

### 2.5 DID method operation

#### 2.5.1 Create (Register)

The did:wba method specification does not specify specific HTTP API operations, but leaves programmatic registration and management to each implementation to define according to the requirements of its Web environment.

Creating a DID requires the following steps:

1. Apply to the domain name registrar to use the domain name;
2. Store the location and IP address of the hosting service in the DNS query service;
3. If you create a path-type DID, first generate the Ed25519 binding key and calculate the `e1_` fingerprint segment according to Section 2.2.2;
4. Create a DID document JSON-LD file, containing the appropriate key pair, and store the `did.json` file under the `.well-known` URL to represent the entire domain name, or under the specified path if multiple DIDs need to be resolved under the domain name.

For example, for the domain name `example.com`, `did.json` will be available under the following URL:

```plaintext
Example: Creating a DID
did:wba:example.com
 -> https://example.com/.well-known/did.json
```

The creation and hosting method of the naked domain name DID is consistent with the naked domain name entry of did:web: the domain name owner only needs to provide the corresponding DID document in `/.well-known/did.json`, and the DID can be used as the domain name subject identity or domain-level service identity.

If an optional path is specified instead of a naked domain name, and the default path scheme is used, `did.json` will be available under the path with the `e1_` fingerprint segment:

```plaintext
Example 5: Creating a path-based DID with the default path scheme
did:wba:example.com:user:alice:e1_<fingerprint>
 -> https://example.com/user/alice/e1_<fingerprint>/did.json
```

If an optional port is specified on the domain name, the colon between the host and the port must be percent-encoded to prevent conflicts with the path.

```plaintext
Example 6: Creating a DID with an optional path and port
did:wba:example.com%3A3000:user:alice:e1_<fingerprint>
 -> https://example.com:3000/user/alice/e1_<fingerprint>/did.json
```

> Description:
> If an implementation requires binding path DIDs using secp256k1, see Appendix A for the `k1_` compatible extension.

#### 2.5.2 Reading (parsing)

The following steps must be performed to parse a DID Document from a `did:wba` DID:

- Replace `:` with `/` in method-specific identifiers to obtain the fully qualified domain name and optional path.
- Percent decode the colon if the domain name contains a port.
- Generate HTTPS URLs by prepending `https://` to the expected DID document location.
- If no path is specified in the URL, `/.well-known` is appended.
- Append `/did.json` to complete the URL.
- Perform HTTP GET requests to the URL using a proxy capable of successfully negotiating a secure HTTPS connection that enforces the security requirements described in [Section 2.6 Security and Privacy Considerations](https://w3c-ccg.github.io/did-method-web/#security-and-privacy-considerations).
- Verify that the `id` of the parsed DID Document matches the `did:wba` DID being parsed.
- For an `e1_` path-type DID defined by the main specification that does not set `deactivated = true`, the following strict binding relationship MUST be verified:
  - DID Document top-level `proof` must exist;
  - `proof` must pass `DataIntegrityProof` + `eddsa-jcs-2022` verification;
  - The verification method pointed to by `proof.verificationMethod` MUST be Ed25519 `Multikey` (or a semantically equivalent Ed25519 verification method representation);
  - Calculate the RFC 7638 thumbprint with the Ed25519 public key corresponding to `proof.verificationMethod`, and the result must be completely consistent with the last `e1_` fingerprint segment of the DID path.
- For an `e1_` DID that sets `deactivated = true`:
  - The verifier MUST still find in the document the original binding key whose fingerprint matches the DID path's `e1_` fingerprint;
  - If the document also contains `successorDid`, the verifier MUST verify that the old and new DIDs have the same stable subject path;
  - If the document-wide `proof` was signed by the original binding key, the migration may be treated as verified;
  - If the document-wide `proof` was signed by a pre-authorized recovery key, the migration may be treated as recovery-verified only if the verifier already holds a trusted DID Document from before deactivation and can confirm that the trusted document pre-authorized the recovery key in `assertionMethod`;
  - If no top-level `proof` is present, a standalone hop verifier MAY read `successorDid` as an `unverified` migration hint. A resolver that obtained every document through authenticated same-origin HTTPS, verified every direct hop, and reached a final active `e1_` DID with a valid binding proof MAY report the unsigned hop as `provider_asserted`. An isolated `successorDid` or document supplied without that authenticated complete-chain context remains `unverified`.
- When performing DNS resolution during an HTTP GET request, clients should use [[RFC8484](https://w3c-ccg.github.io/did-method-web/#bib-rfc8484)] to prevent tracking of the identity being resolved.
- For an active `e1_` DID, the above proof verification is not affected by a local policy switch and is a necessary condition for successful parsing.
- For other profiles, if the local policy enables DID Document proof verification and the document contains `proof`, it should be verified according to the corresponding profile rules.

For bare-domain DIDs, method resolution uses `/.well-known/did.json` and checks `id` consistency; E1 path-binding verification does not apply. Requests are separately authenticated under [ANP-02 common authentication and the WBA binding](02-anp-did-authentication-protocol-specification.md#wba-binding); this paragraph does not define a reduced verification flow.

> Description:
> If an implementation also supports the `k1_` compatible extensions of Appendix A, parsing and binding verification of `k1_` DIDs shall be performed as per Appendix A.

#### 2.5.3 Update

To update the DID document, you need to update the `did.json` file corresponding to the DID.

For path type did:wba with the default path scheme, as long as the last bound key fingerprint of the DID path does not change, the DID itself will remain unchanged, but other contents of the DID document can change, for example, adding new verification keys, revoking old keys, or updating service endpoints.

If the binding key changes, the path-type DID MUST change to a new DID. The old and new DIDs are two distinct DIDs, but they can establish a migration relationship for the same continuing subject under the following rules:

1. The new DID MUST have exactly the same stable subject path as the old DID;
2. A new DID Document MUST be created and published. The new document MAY reference the direct predecessor DID in `alsoKnownAs`;
3. The old DID Document MUST remain retrievable and set `deactivated = true` and `successorDid = <new DID>`;
4. `successorDid` MUST point only to the direct next-generation DID. On subsequent rotations, the `successorDid` of an earlier DID MUST NOT be rewritten;
5. The old DID Document's document-wide `proof` should cover `deactivated`, `successorDid`, and all other document properties; the new DID Document has its document-wide `proof` generated by the new binding key;
6. An upper-layer name service such as WNS/Handle should be updated to the new DID at the same time, but the name-service mapping does not replace the migration proof above.

This specification does not define a programmatic management interface. To prevent concurrent rotations from producing multiple successors, an implementation SHOULD perform an atomic compare-and-swap against the current complete DID (for example, `expected_current_did`) rather than submit an update based only on the stable subject path.

> Note:
>
> 1. Use a version control system such as git and a continuous integration system such as GitHub Actions to manage updates to DID documents, which can provide support for authentication and audit history.
> 2. The HTTP API update process does not specify a specific HTTP API, but leaves programmatic registration and management to each implementer to define according to their needs.

#### 2.5.4 Deactivation (withdrawal)

For an identity that is permanently deactivated and has no successor DID, the `did.json` file may be removed or otherwise made no longer publicly available.

For a path-type did:wba that has been superseded by a new DID because of binding-key rotation, the old DID Document MUST NOT be removed. It MUST remain retrievable and set `deactivated = true` and `successorDid` to support historical signature verification and successor lookup. Here, `deactivated` means only that this complete DID is no longer used for new authentication and routing; it does not mean that the continuing subject has ceased to exist.

#### 2.5.5 DID Document proof

Whether the top-level `proof` field appears in a `did:wba` DID Document depends on the profile and document state. For an active document using the default `e1_` profile, `proof` is required. A deactivated `e1_` transition document with `successorDid` follows the binding, recovery, authenticated-Provider, and unverified branches defined below, so its top-level `proof` MAY be absent. For other profiles, the DID Document MAY contain a top-level `proof` field to provide proof of document integrity. This field is used to prove that the DID Document has not been tampered with after the proof was generated and indicates that the signer controlled the corresponding private key when the proof was created. Proof itself does not replace DID method parsing, nor does it replace the `id` consistency check on its own.

For the default `e1_` profile, the `proof` profile defined by the master specification MUST conform to:

- Verifiable Credential Data Integrity 1.0
- Data Integrity EdDSA Cryptosuites v1.0

The `proof` object contains the following fields:

- `type`: required field. Fixed to `DataIntegrityProof`
- `cryptosuite`: required field. Fixed to `eddsa-jcs-2022`
- `created`: required field. Proof creation time, in XML Schema datetime format
- `verificationMethod`: required field. Full DID URL pointing to Ed25519 `Multikey` in the DID Document used to generate the proof
- `proofPurpose`: required field. Fixed to `assertionMethod`
- `proofValue`: required field. Use base58-btc multibase (`z...`) encoding
- `domain`: optional field
- `challenge`: optional field

Additional constraints:

1. For an active `e1_` document, `proof.verificationMethod` MUST use the `e1_` binding key, unifying DID path binding, public-key binding, and document-integrity proof. For a deactivated document with `successorDid`, it may instead use a recovery key that was pre-authorized by `assertionMethod` in a trusted pre-deactivation document, but it MUST NOT use a key introduced only at deactivation;
2. For an active `e1_` document, and for a deactivated transition that claims continuity through the old binding key, the parser MUST recalculate the RFC 7638 thumbprint with the Ed25519 public key corresponding to `proof.verificationMethod` and verify that it is completely consistent with the last `e1_` fingerprint segment of the DID path. A recovery proof instead MUST be verified with the key material and `assertionMethod` authorization from a trusted pre-deactivation document; the recovery key is not required to match the `e1_` binding fingerprint;
3. The generation and verification of `proof` must (MUST) follow the standard algorithm process of `eddsa-jcs-2022`, and the algorithm details will no longer be rewritten by this specification.

When parsing an active `e1_` `did:wba` DID Document, proof verification is not an optional enhanced check, but part of the path-binding semantics. If `proof` is missing, proof verification fails, or `proof.verificationMethod` is inconsistent with the `e1_` binding fingerprint, parsing MUST fail.

For `e1_` DIDs, there is no relaxed mode in which an active DID Document can still be parsed without a `proof`.

For an old DID Document that sets `deactivated = true` and `successorDid`, the top-level `proof` remains a document-wide proof over the complete document after removing `proof`:

- When signed by the old DID's binding key, the result provides strong cryptographic continuity;
- When signed by a recovery key that the old DID authorized through `assertionMethod` before deactivation, the verifier MUST confirm that prior authorization from a previously trusted state;
- If a top-level `proof` is present, it MUST verify as either an old-binding proof or a pre-authorized recovery proof. A malformed, unauthorized, or cryptographically invalid proof MUST invalidate the transition and MUST NOT be downgraded to a provider assertion or an unverified hint;
- When neither the old private key nor a pre-authorized recovery key is available, the top-level `proof` MAY be absent. A standalone hop verifier MUST report that hop as `unverified`. A complete-chain resolver MAY report it as `provider_asserted` only after obtaining the predecessor and every successor through authenticated same-origin HTTPS, verifying the stable subject path and direct-successor relationship at every hop, and reaching a final active `e1_` DID whose binding proof verifies. A failed or incomplete chain MUST NOT produce `provider_asserted`.

Transition assurance has exactly the following meanings:

- `verified`: the predecessor's original binding key signs the document-wide deactivation and direct-successor relationship;
- `recovery_verified`: a recovery key pre-authorized by `assertionMethod` in a trusted pre-deactivation document signs that relationship;
- `provider_asserted`: either an authenticated same-origin HTTPS Provider resolution completes the entire structurally valid chain to a proof-valid active DID, or the identity Provider supplies the same predecessor-to-successor fact through a separately authenticated recovery/transition authority channel. This assurance is not a DID Document property and MUST NOT be promoted to `verified` or `recovery_verified`;
- `unverified`: only an isolated `successorDid`, `alsoKnownAs`, Handle/WNS mapping, HTTP 409 hint, standalone unsigned hop, incomplete chain, or document without authenticated Provider provenance is available.

For non-`e1_` profiles, implementations MAY choose one of the following two modes according to the corresponding profile rules or local policy:

1. Relaxed mode: If the DID Document does not contain `proof`, parsing can still continue;
2. Strict mode: If the local policy requires proof, the lack of `proof` in the DID Document MUST be regarded as a verification failure.
**Normative Note**:

For DIDs using the `e1_` profile, this specification requires that the top-level `proof` of the DID Document use the W3C standard Data Integrity proof mechanism. Its proof data model, proof configuration, document transformation, hashing, proof serialization and verification rules follow [Verifiable Credential Data Integrity 1.0](https://www.w3.org/TR/vc-data-integrity/) and [Data Integrity EdDSA Cryptosuites v1.0](https://www.w3.org/TR/vc-di-eddsa/) respectively. This specification only restricts the use location, field requirements and verification relationship of proof in the did:wba scenario, and does not repeatedly define the underlying cryptographic algorithm; if a conflict occurs, the upstream W3C specification shall prevail.

### 2.6 Security and Privacy Considerations

For security and privacy considerations, please refer to [[did:web method specification section 2.6](https://w3c-ccg.github.io/did-method-web/#security-and-privacy-considerations)]. Implementers should also pay additional attention to DID rotation caused by binding key changes under the default path scheme, and name service synchronization issues.

This version does not require an independently verifiable log. After a complete resolution succeeds, clients SHOULD cache only successor edges whose hop assurance is `verified` or `recovery_verified`. `provider_asserted` and `unverified` edges MUST NOT enter that verified-edge cache. Validation failures before the cache-commit step, including invalid final proof, cycle, and hop-limit failures, MUST NOT leave prefix edges from the failed chain in it. If a cached verified edge and a newly observed `successorDid` disagree for the same old DID, the migration chain contains a cycle, or a successor DID has a different stable subject path, the client MUST reject the migration and report the conflict to the upper layer.

New deployments SHOULD prefer the `e1_` profile for better standard proof interoperability. If the implementation needs to be compatible with the wallet ecosystem and existing secp256k1 implementation, please see the `k1_` compatible extension in Appendix A.

## 3. Cross-platform identity authentication based on did:wba method and HTTP protocol

Common authentication is defined in [ANP-02 Chapter 3](02-anp-did-authentication-protocol-specification.md#http-binding). WBA method rules remain in Chapter 2; request format, verification flow, and implementation policies are unchanged from original ANP-03 vNext.

<a id="wba-auth-binding"></a>
### 3.1 WBA method constraints for request authentication

ANP-02 defines the common request format and signature verification. This section supplies WBA method requirements without applying them to other DID methods.

#### 3.1.1 Authentication-key selection

For `did:wba` using the E1 profile, the client SHOULD by default sign using the binding key corresponding to the last `e1_` fingerprint segment of the DID path. If the server allows other `authentication` verification methods, it belongs to the local authorization policy and does not change the binding semantics of DID.

> Description:
> If the implementation also supports the `k1_` compatible extension of [Appendix A](../appendix-a-did-wba-k1-compatibility-extension.md), then the authentication signature for the `k1_` DID may be performed as in [Appendix A](../appendix-a-did-wba-k1-compatibility-extension.md).

#### 3.1.2 Method state and identity binding

**Read DID document**: Parse the DID document based on the DID. If the document sets `deactivated = true`, the server MUST NOT continue to use that DID for new authentication. When the document contains `successorDid`, the server should return the DID-superseded error defined in [this chapter's 409 response](#http-superseded).

   - For a `did:wba` E1 DID, the DID binding relationship must be verified based on the Ed25519 public key corresponding to `proof.verificationMethod` instead of randomly selecting an Ed25519 key in `authentication`:
     - `proof` must exist and pass `eddsa-jcs-2022` verification;
     - Recalculate the RFC 7638 thumbprint using this public key, and the result MUST be exactly the same as the last `e1_` fingerprint segment of the DID path.

> Description:
> If an implementation also supports the `k1_` compatible extension of [Appendix A](../appendix-a-did-wba-k1-compatibility-extension.md), then binding verification and authentication verification of the `k1_` DID shall be performed as per [Appendix A](../appendix-a-did-wba-k1-compatibility-extension.md).

<a id="http-superseded"></a>
### 3.2 WBA HTTP 409 DID Superseded response

When the DID targeted by a request or used for authentication sets `deactivated = true` and has a successor DID, the server may return `409 Conflict`:

```http
HTTP/1.1 409 Conflict
Content-Type: application/json
Cache-Control: no-store
```

```json
{
  "code": "did_superseded",
  "requestedDid": "did:wba:example.com:user:alice:e1_<old-fingerprint>",
  "currentDid": "did:wba:example.com:user:alice:e1_<current-fingerprint>",
  "stableSubjectId": "example.com:user:alice"
}
```

The response's `currentDid` is only an unverified hint. A client MUST NOT retry directly based on this field. Instead, it must retrieve the old DID Document; verify `deactivated`, `successorDid`, and the document-wide `proof`; and then resolve each successor DID in turn until it finds the current active DID. The client should generate a new signature with the current DID before sending the request again. A transparent `301` / `302` redirect should not replace this verification process.

## 4. Cross-platform identity authentication process based on did:wba method and JSON-formatted data carriage

Authentication metadata carriage is defined in [ANP-02 Chapter 4](02-anp-did-authentication-protocol-specification.md#json-carriage), retaining its fields, serialization conventions, component mappings, and verification flow.

## 5 Distinguish between human authorization and intelligent agent automatic authorization

See [ANP-02 Chapter 5](02-anp-did-authentication-protocol-specification.md#5-authentication-and-application-authorization).

## 6 Privacy Protection Policy

See [ANP-02 Chapter 6](02-anp-did-authentication-protocol-specification.md#6-privacy-considerations).

For scenarios that require stable external references but also want the underlying DID to be rotated, it is recommended to use it in conjunction with a name service (such as WNS/Handle): Handle remains stable and human-readable, and the underlying did:wba can rotate as the binding key changes.

## 7 Security Tips

See [ANP-02 Chapter 7](02-anp-did-authentication-protocol-specification.md#security-privacy). Method-specific rules continue to reference Chapter 2 here; this extraction adds no security-policy requirements.

WBA-specific security requirements:

   - For `did:wba` using the default path scheme, the binding key is best kept using hardware isolation, HSM, or the system enclave.
   - For `did:wba` using a binding key, cross-platform authentication should prefer that key by default.
   - New WBA deployments SHOULD prefer the `e1_` profile.
   - When the binding key changes, the path-type DID will change with it, so upper-level name service mappings should be updated synchronously.
   - For an active `did:wba` E1 DID, the parser MUST verify `DataIntegrityProof`. A deactivated `e1_` transition document follows the binding, recovery, provider-asserted, and unverified rules in [Section 2.5.5](03-did-wba-method-design-specification.md#wba-method-rules). For other profiles, if the implementation enables DID Document proof verification, it SHOULD verify `proof` according to the corresponding profile rules.
   - A WBA stable subject path MUST NOT be recycled or reassigned. A verifier MUST NOT merge two DIDs merely by removing the final binding-fingerprint segment.
   - When following `successorDid` under the WBA method, a verifier MUST limit the chain length, detect cycles, and reject a chain whose stable subject paths differ or in which the same old DID has multiple successors.

## 8. Use cases

1. **Use Case 1: User accesses files on other websites through Assistant**

Alice stores a file on the example.com website, which she later wants to access through the Assistant. To do this, Alice first creates a DID based on the did:wba method on the smart assistant, logs in to example.com, associates the DID with her account, and grants the DID permission to access files. Once set up, the Assistant can use the DID to log in to example.com, which, after authentication, allows the Assistant to access Alice's stored files. This DID can also be configured to other websites so that the assistant can access files on different platforms.

2. **Use Case 2: Users call APIs of other platform services through smart assistants**

Alice wants to call a third-party service API named example through the smart assistant. First, Alice creates a DID based on the did:wba method on the smart assistant and uses the DID to order related services of the example platform. The example service completes identity authentication through DID, confirms that the purchaser is Alice, and records her DID. After passing the authentication, Alice can use the DID to call the API of the example service through the smart assistant to perform operations.

> The current use case does not enumerate the identity authentication of the client to the server. In fact, this process can also work.

## 9. Summary

This specification builds on did:web to define WBA document, binding, and lifecycle rules, and connects to common authentication through ANP-02.

This version further defines the default scheme for path-type DID as "carrying the bound public key fingerprint in the DID path", and the main specification uses the `e1_` profile by default:

- `e1_`: Binds the Ed25519 public key, recommended for new deployments, and can directly integrate the W3C standard Data Integrity EdDSA proof.

In order to be compatible with the wallet ecosystem and existing secp256k1 implementation, this specification additionally defines the `k1_` compatible extension in Appendix A.

When a binding-key change produces a new DID, this specification uses the permanently stable subject path as the continuity anchor and proves forward migration through the old DID Document's `successorDid` and document-wide `proof`; the new DID Document may make a reverse claim about the old DID through `alsoKnownAs`. A shared stable subject path alone does not prove DID equivalence.

The sole candidate definition of common HTTP/JSON request authentication and optional tokens is ANP-02.

Future WBA revisions may evolve method capabilities and document service declarations. Common authentication and token extensions evolve through ANP-02.

---

## Appendix A: `k1_` Compatibility Extension (Non-Default)

Reference document [Appendix A: did:wba `k1_` Compatibility Extension](../appendix-a-did-wba-k1-compatibility-extension.md)

## Appendix B: Native `did:web` Compatibility

Reference document [Appendix B: Compatibility with Native `did:web`](appendix-b-compatibility-with-native-did-web.md)

## References

1. **DID-CORE**. Decentralized Identifiers (DIDs) v1.0. Manu Sporny; Amy Guy; Markus Sabadello; Drummond Reed. W3C. 19 July 2022. W3C Recommendation. Retrieved from [https://www.w3.org/TR/did-core/](https://www.w3.org/TR/did-core/)

2. **did:web**. Retrieved from [https://w3c-ccg.github.io/did-method-web/](https://w3c-ccg.github.io/did-method-web/)

3. **RFC 7638**. JSON Web Key (JWK) Thumbprint. M. Jones; N. Sakimura. IETF. September 2015. Internet Standards Track. Retrieved from [https://www.rfc-editor.org/rfc/rfc7638](https://www.rfc-editor.org/rfc/rfc7638)

4. **RFC 8785**. JSON Canonicalization Scheme (JCS). A. Rundgren; B. Jordan; S. Erdtman. IETF. June 2020. Informational. Retrieved from [https://www.rfc-editor.org/rfc/rfc8785](https://www.rfc-editor.org/rfc/rfc8785)

5. **RFC 1035**. Domain names - implementation and specification. P. Mockapetris. IETF. November 1987. Internet Standard. Retrieved from [https://www.rfc-editor.org/rfc/rfc1035](https://www.rfc-editor.org/rfc/rfc1035)

6. **RFC 1123**. Requirements for Internet Hosts - Application and Support. R. Braden, Ed. IETF. October 1989. Internet Standard. Retrieved from [https://www.rfc-editor.org/rfc/rfc1123](https://www.rfc-editor.org/rfc/rfc1123)

7. **RFC 2119**. Key words for use in RFCs to Indicate Requirement Levels. S. Bradner. IETF. March 1997. Best Current Practice. Retrieved from [https://www.rfc-editor.org/rfc/rfc2119](https://www.rfc-editor.org/rfc/rfc2119)

8. **RFC 2181**. Clarifications to the DNS Specification. R. Elz; R. Bush. IETF. July 1997. Proposed Standard. Retrieved from [https://www.rfc-editor.org/rfc/rfc2181](https://www.rfc-editor.org/rfc/rfc2181)

9. **RFC 8174**. Ambiguity of Uppercase vs Lowercase in RFC 2119 Key Words. B. Leiba. IETF. May 2017. Best Current Practice. Retrieved from [https://www.rfc-editor.org/rfc/rfc8174](https://www.rfc-editor.org/rfc/rfc8174)

10. **RFC 8484**. DNS Queries over HTTPS (DoH). P. Hoffman; P. McManus. IETF. October 2018. Proposed Standard. Retrieved from [https://www.rfc-editor.org/rfc/rfc8484](https://www.rfc-editor.org/rfc/rfc8484)

11. **RFC 7519**. JSON Web Token (JWT). M. Jones; J. Bradley; N. Sakimura. IETF. May 2015. Internet Standards Track. Retrieved from [https://www.rfc-editor.org/rfc/rfc7519](https://www.rfc-editor.org/rfc/rfc7519)

12. **RFC 9110**. HTTP Semantics. R. Fielding, Ed.; M. Nottingham, Ed.; J. Reschke, Ed. IETF. June 2022. Internet Standard. Retrieved from [https://www.rfc-editor.org/rfc/rfc9110](https://www.rfc-editor.org/rfc/rfc9110)

13. **RFC 9421**. HTTP Message Signatures. A. Backman; M. Prorock; A. Sporny. IETF. February 2024. Internet Standards Track. Retrieved from [https://www.rfc-editor.org/rfc/rfc9421](https://www.rfc-editor.org/rfc/rfc9421)

14. **RFC 9530**. Digest Fields. R. Polli; L. Pardue. IETF. February 2024. Internet Standards Track. Retrieved from [https://www.rfc-editor.org/rfc/rfc9530](https://www.rfc-editor.org/rfc/rfc9530)

15. **RFC 9525**. Service Identity in TLS. P. Saint-Andre; R. Bonica; J. Hodges. IETF. November 2023. Internet Standards Track. Retrieved from [https://www.rfc-editor.org/rfc/rfc9525](https://www.rfc-editor.org/rfc/rfc9525)

16. **DID Use Cases**. Decentralized Identifier Use Cases. Joe Andrieu; Kim Hamilton Duffy; Ryan Grant; Adrian Gropper. W3C. 24 June 2021. W3C Note. Retrieved from [https://www.w3.org/TR/did-use-cases/](https://www.w3.org/TR/did-use-cases/)

17. **DID Extensions**. Decentralized Identifier Extensions. Orie Steele; Manu Sporny. W3C. 24 June 2021. W3C Note. Retrieved from [https://www.w3.org/TR/did-extensions/](https://www.w3.org/TR/did-extensions/)

18. **DID Extension Properties**. Decentralized Identifier Extension Properties. Orie Steele; Manu Sporny. W3C. 24 June 2021. W3C Note. Retrieved from [https://www.w3.org/TR/did-extensions-properties/](https://www.w3.org/TR/did-extensions-properties/)

19. **DID Extension Methods**. Decentralized Identifier Extension Methods. Orie Steele; Manu Sporny. W3C. 24 June 2021. W3C Note. Retrieved from [https://www.w3.org/TR/did-extensions-methods/](https://www.w3.org/TR/did-extensions-methods/)

20. **DID Extension Resolution**. Decentralized Identifier Extension Resolution. Orie Steele; Manu Sporny. W3C. 24 June 2021. W3C Note. Retrieved from [https://www.w3.org/TR/did-extensions-resolution/](https://www.w3.org/TR/did-extensions-resolution/)

21. **Controller Document**. Controller Document. Manu Sporny; Markus Sabadello. W3C. 24 June 2021. W3C Note. Retrieved from [https://www.w3.org/TR/controller-document/](https://www.w3.org/TR/controller-document/)

22. **VC-DATA-INTEGRITY**. Verifiable Credential Data Integrity 1.0. W3C. Retrieved from [https://www.w3.org/TR/vc-data-integrity/](https://www.w3.org/TR/vc-data-integrity/)

23. **VC-DI-EDDSA**. Data Integrity EdDSA Cryptosuites v1.0. W3C. Retrieved from [https://www.w3.org/TR/vc-di-eddsa/](https://www.w3.org/TR/vc-di-eddsa/)

24. **VC-DI-ECDSA**. Data Integrity ECDSA Cryptosuites v1.0. W3C. Retrieved from [https://www.w3.org/TR/vc-di-ecdsa/](https://www.w3.org/TR/vc-di-ecdsa/)

25. **CID-1.0**. Controlled Identifiers v1.0. W3C. Retrieved from [https://www.w3.org/TR/cid-1.0/](https://www.w3.org/TR/cid-1.0/)

## Copyright Notice

Copyright (c) 2024 ANP Community
This file is released under the [MIT License](/LICENSE), which you may freely use and modify, provided you retain this copyright notice.
