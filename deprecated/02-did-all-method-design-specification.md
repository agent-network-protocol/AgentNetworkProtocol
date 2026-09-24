# did:all Method Design Specification

> !!!**Note:** This specification is no longer supported. Please use the latest DID method [did:wba](/03-did:wba%20Method%20Design%20Specification.md).

## Background
In the article on a cross-platform identity authentication and end-to-end encrypted communication technology based on the DID standard, to solve the cross-platform identity authentication problem, we propose a new DID method called all (Alliance), similar to a consortium blockchain. This means that all service providers supporting this method's standard can provide DID-related services externally.

This document, based on the W3C DID specification, details the design of the all method, including DID generation, resolution, and special modifications to the DID document.

This document assumes that you are already familiar with the background knowledge related to W3C DID. If not, you can read related articles or refer to the references in this document.

The all method proposed here makes some extensions and modifications to the W3C standard to adapt to the problems we aim to solve.

## 1. DID Method all (Alliance)

A DID Method is a way to implement Decentralized Identifiers (DIDs), specifying how to create, resolve, update, and revoke DIDs. Each DID method is associated with a specific blockchain or decentralized network and defines the specific rules for interacting with that network.

Most existing DID methods are based on blockchain design and face significant issues in scalability and commercialization due to the current stage of blockchain technology. Web-based DID methods are deeply tied to domain names and require web service providers to support DID-related operations, adding complexity to web service providers.

We propose a new DID method called all (Alliance), similar to a consortium blockchain. This means that all service providers supporting this method's standard can provide DID-related services externally. DID users can choose one or more service providers based on price, service level, reputation, etc. All service providers supporting this method can write their service domain names to a specific memory on the blockchain to ensure that all users of the all method can obtain a complete list of service providers.

Additionally, the creator of the DID can specify the domain name of the DID document's hosting service in the DID, indicating to DID resolvers to obtain the DID document from a specific service provider or a server set up by the user themselves.

Finally, all operations of the all method use standard web protocols like HTTPS, allowing the all method to leverage existing web infrastructure.

## 2. Core Design Philosophy of the all Method

The core design of the all method is to use cryptographic techniques to ensure the immutability of the DID document and to use alliance nodes to ensure the system's distribution.

### 2.1 Using Cryptography to Ensure the Immutability of the DID Document

If the underlying technology uses blockchain or distributed ledger technology, immutability of the DID document can be ensured through consensus mechanisms, encryption technology, and distributed storage. We adopt the "Alliance" technical approach, where a single node can be seen as a central node. Apart from trusting the central node, it is technically impossible to verify that the DID document has not been tampered with.

We design the DID generation specification so that the DID corresponds one-to-one with the DID holder's public key, and then use the public key to sign the document. This way, even if the DID document is sent to any centralized node, we have the technical means to ensure the document's immutability.

### DID Creation and Hosting Process:

- First, generate an asymmetric encryption private key and public key, currently using the secp256r1 algorithm.
- Generate a unique identifier in the DID based on the public key, similar to the address generation process in Bitcoin.
- The user creates a DID document based on the DID, public key, and other information, then signs it using the private key.
- Finally, the signature information is also stored in the DID document and hosted by a third-party service node.

### DID Resolution and Verification Process for Other Users:

- Send a DID resolution request to a third-party service node and download the DID document.
- Verify the correspondence between the DID and the public key according to the DID generation specification. If they correspond one-to-one, the public key is correct.
- Use the public key to verify the signature in the DID document. If the signature is correct, the document has not been tampered with.

Thus, the creation and verification process of the DID document is complete.

### 2.2 Distributed Assurance of DID Services

The all method's DID service adopts a more flexible approach. Firstly, to avoid the scalability issues of current technologies like blockchain, each node is centralized to provide the best service experience. Secondly, users have multiple options, meaning they can set up their own DID service, use third-party DID services, or use multiple DID services simultaneously and switch between them.

### 2.3 Core Processes

All operations of creating, resolving, updating, and revoking DIDs in the all method use HTTPS. The core processes are as follows:

![Core Flow of the all Method](/images/did-all-core-flow.png)

1. User A first reads the list of third-party service domain names for the all method from distributed storage like blockchain or uses a self-built DID service.
2. Creates a DID and DID document, selects one or more nodes, and initiates an HTTP request to host the DID document.
3. User B also reads the list of all method service domain names from distributed storage like blockchain.
4. Uses polling or concurrent queries to query the DID document from the service domain nodes.

## 3. DID Document Design

The current version of the DID document does not use all the fields defined by the W3C. Our DID document is currently a subset of the W3C specification.

### DID Document Example:

```json
{
  "@context": "https://www.w3.org/ns/did/v1",
  "id": "did:all:14qQqsnEPZy2wcpRuLy2xeR737ptkE2Www@example.com:443",
  "verificationMethod": [
    {
      "id": "did:all:14qQqsnEPZy2wcpRuLy2xeR737ptkE2Www@example.com:443#keys-1",
      "type": "EcdsaSecp256r1VerificationKey2019",
      "controller": "did:all:14qQqsnEPZy2wcpRuLy2xeR737ptkE2Www@example.com:443",
      "publicKeyHex": "04b11e73474896ad9e4b1a2d5a1190d5b25a916eb62f3d1db155bb64dc046bfb3868457a1912c8f9fcd603ff5b1078f883f6bf6b9f0dee60bad9e57e7fec9b439d"
    }
  ],
  "authentication": [
    "did:all:14qQqsnEPZy2wcpRuLy2xeR737ptkE2Www@example.com:443#keys-1"
  ],
  "service": [
    {
      "id": "did:all:14qQqsnEPZy2wcpRuLy2xeR737ptkE2Www@example.com:443#communication",
      "type": "messageService",
      "router": "did:all:14qQqsnEPZy2wcpRuLy2xeR737ptkE2Www@example.com:443",
      "serviceEndpoint": "wss://example.com/endpoint"
    },
    {
      "id": "did:all:14qQqsnEPZy2wcpRuLy2xeR737ptkE2Www@example.com:443#didservice",
      "type": "didDocumentService",
      "serviceEndpoint": ["https://example.com/endpoint","https://example.com/endpoint"]
    }
  ],
  "proof": {
    "type": "EcdsaSecp256r1Signature2019",
    "created": "2024-05-27T10:51:55Z",
    "proofPurpose": "assertionMethod",
    "verificationMethod": "did:all:14qQqsnEPZy2wcpRuLy2xeR737ptkE2Www@example.com:443#keys-1",
    "proofValue": "z58DAdFfa9SkqZMVPxAQpic7ndSayn1PzZs6ZjWp1CktyGesjuTSwRdoWhAfGFCF5bppETSTojQCrfFPP2oumHKtz"
  },
  "deprecation": {
    "status": "deactivated",
    "newDid": "did:example:new123456789"
  }
}
```

Below is a focused introduction to the usage of each field in the all method.

### 3.1 Id

Example: `"did:all:14qQqsnEPZy2wcpRuLy2xeR737ptkE2Www@example.com:443"`

- `did`: The DID prefix, indicating a Decentralized Identifier.
- `all`: The DID method, specifying the rules for resolving and operating the DID.
- `14qQqsnEPZy2wcpRuLy2xeR737ptkE2Www`: A unique identifier, generated similarly to a Bitcoin address.
- `@example.com:443`: An optional field indicating the domain name and port of the service hosting the DID document. The DID holder can choose to self-host the service, use a third-party service, or omit this field to use third-party services recorded on the blockchain. If the port is not provided, the default HTTP and HTTPS ports are used.

The DID unique identifier is generated based on the public key (i.e., the `publicKeyHex` in `verificationMethod`), ensuring the document's immutability. The generation process is as follows:

1. **Generate Private Key**
   
   Use a secure random number generator to generate a 256-bit (32-byte) private key.

2. **Generate Public Key**
   
   Use the Elliptic Curve Digital Signature Algorithm (ECDSA) with the Secp256r1 curve to encrypt the private key, generating the public key. The public key is in uncompressed format (prefix `0x04`, followed by the x and y coordinates).

3. **Compute Public Key Hash**
   
   Perform the following two hashing operations on the public key:
   
   - Hash the public key using SHA-256 to generate a SHA-256 hash value.
   
   - Hash the SHA-256 hash value using RIPEMD-160 to generate the public key hash.

4. **Add Network Prefix**
   
   Add a one-byte version number (`0x00`) in front of the public key hash to indicate the address type.

5. **Compute Checksum**
   
   Perform the following two SHA-256 hash operations on the result and take the first four bytes as the checksum.

6. **Generate id**
   
   Concatenate the version number, public key hash, and checksum, then use Base58Check encoding to generate the final `id`.

### 3.2 verificationMethod

The `verificationMethod` contains the public key information used to verify signatures. In the W3C standard, this field can contain multiple entries, but we currently have only one, and the `controller` field is the DID itself.

- `id`: The unique identifier of the public key.
- `type`: The type of the public key, here using `EcdsaSecp256r1VerificationKey2019`. Currently, only this method is supported.
- `controller`: The DID that controls this public key, currently the DID of the DID document itself.
- `publicKeyHex`: The public key encoded in hexadecimal.

### 3.3 authentication

The `authentication` field indicates the `verificationMethod` ID used for authentication. In our method, it temporarily only includes the `id` from the `verificationMethod` field mentioned above.

### 3.4 service

The `service` field in the DID document is used to express ways to communicate with the DID subject or associated entities. Services can be any type the DID subject wants to promote, including decentralized identity management services, for further discovery, authentication, authorization, or interaction.

We currently have two core service definitions:

- **messageService**
  
  - **Message Service**: If another user wants to communicate with this user, they can send messages using the `serviceEndpoint` in the service.
  
  - **serviceEndpoint**: Currently, this is a WSS link and does not support other protocols. The detailed design of the WSS communication protocol for end-to-end encryption is in the encryption design document.
  
  - **router**: A custom field whose value is a DID. This field is crucial for high-concurrency systems as it indicates the router DID to which a DID belongs. When a system initiates a WSS connection to a third-party message service, it may receive messages for multiple users simultaneously on this connection. Registering all users at once could lead to prolonged processing. Instead, registering the router allows the message service to automatically associate the router's DID with the WSS connection.

- **didDocumentService**
  
  - **Optional Field**: Indicates the service endpoints where this DID document is hosted, allowing multiple entries.
  
  - **Purpose**: Enables DID verifiers to check if the DID document matches the DID service provider, such as verifying whether the DID service provider has obtained the DID document through unauthorized means.

### 3.5 proof

The `proof` field stores the signature information of the DID document, used for verifying the integrity of the DID document.

- `type`: The type of signature, here using `EcdsaSecp256r1Signature2019`.
- `created`: The creation time of the signature, an ISO 8601 formatted UTC timestamp.
- `proofPurpose`: The purpose of the signature, here specified as `assertionMethod`.
- `verificationMethod`: The verification method ID used to verify the signature, corresponding to the `id` in the `verificationMethod` field.
- `proofValue`: The signature value.

### Signature Generation Process:

1. **Construct all fields of the DID document**, excluding the `proofValue` field in `proof`.
2. **Convert the DID document to a JSON string** using commas and colons as separators, and sort the keys.
3. **Encode the JSON string into UTF-8 bytes**.
4. **Sign the byte data using the private key and ECDSA with the SHA-256 hashing algorithm**.
5. **Add the signature value to the `proofValue` field in the `proof` dictionary of the DID document**.

```python
# 1. Create all fields of the DID document, excluding the proofValue field
did_document = {
    "id": "did:example:123456789abcdefghi",
    # Other necessary fields
    "proof": {
        "type": "EcdsaSecp256r1Signature2019",
        "created": "2024-05-27T10:51:55Z",
        "proofPurpose": "assertionMethod",
        "verificationMethod": "did:example:123456789abcdefghi#keys-1"
        # Exclude proofValue field
    }
}

# 2. Convert the DID document to a JSON string, sorted by keys, using commas and colons as separators
did_document_str = JSON.stringify(did_document, separators=(',', ':'), sort_keys=True)

# 3. Encode the JSON string into UTF-8 bytes
did_document_bytes = UTF8.encode(did_document_str)

# 4. Sign the byte data using the private key and ECDSA with SHA-256
signature = ECDSA.sign(did_document_bytes, private_key, algorithm=SHA-256)

# 5. Add the signature value to the proofValue field in the proof dictionary of the DID document
did_document["proof"]["proofValue"] = Base64.urlsafe_encode(signature)
```

### 3.6 deprecation

This is a custom field used to indicate whether the DID has been deprecated.

If the DID document contains this field and the `status` value is `deactivated`, it indicates that this DID document has been deprecated. If `newDid` exists, it is the new DID corresponding to this DID.

## 4. DID Document Verification

Based on the DID document generation process, the DID document verification process is as follows:

1. **Confirm the correctness of the DID**.
2. **Extract the public key**: Extract the public key that matches the `verificationMethod` field from the DID document. Currently, there is only one value.
3. **Verify the correspondence between the DID and the public key** according to the DID generation process.
4. **Verify the correctness of the signature** based on the signature generation process.

Thus, as long as the DID is correct, the integrity of the DID document can be verified to ensure it has not been tampered with.

## 5. DID HTTP Interface

### 5.1 Authentication Process

If a user is using their own DID server, they can choose not to authenticate requests. Otherwise, callers need to apply for an API key from multiple platforms.

#### 5.1.1 HTTP Request Parameters

The service supports standard HTTP calls.

**Request Headers:**

- `Content-Type`: `application/json`
- `Authorization`: Supports API Key and token authentication methods.

#### 5.1.2 HTTP User Authentication

When calling the interface, two authentication methods are supported:

1. **Pass API Key for authentication**
2. **Pass authentication token for authentication**

##### 5.1.2.1 Obtaining an API Key

Log in to the DID service provider's API Keys page to obtain the latest generated user API Key. The API Key contains both the "user identifier id" and the "signature key secret", formatted as `{id}.{secret}`.

##### 5.1.2.2 Making Requests Using the API Key

Users need to place the API Key in the `Authorization` header of the HTTP request.

**Example**: Example of API key parameter in a curl request

```bash
curl --location 'https://open.bigmodel.cn/api/paas/v4/chat/completions' \
--header 'Authorization: Bearer <YourAPIKey>' \
--header 'Content-Type: application/text' \
--data '{
  "@context": "https://www.w3.org/ns/did/v1",
  "id": "did:all:14qQqsnEPZy2wcpRuLy2xeR737ptkE2Www@example.com:443",
  ......
}'
```

##### 5.1.2.3 Making Requests Using JWT-Assembled Token

The user side needs to incorporate the corresponding JWT-related utility classes and assemble the JWT's `header` and `payload` parts as follows.

1. **Header Example**

   ```json
   {"alg": "HS256","sign_type": "SIGN"}
   ```
   - `alg`: Indicates the algorithm used for signing, defaulting to HMAC SHA256 (`HS256`).
   - `sign_type`: Indicates the type of token, with JWT tokens uniformly written as `SIGN`.

2. **Payload Example**

   ```json
   {"api_key": "{ApiKey.id}","exp": 1682503829130,"timestamp": 1682503820130}
   ```
   - `api_key`: Indicates the user identifier id, which is the `{id}` part of the user's API Key.
   - `exp`: Indicates the expiration time of the generated JWT in milliseconds, controlled by the client.
   - `timestamp`: Indicates the current timestamp in milliseconds.

**Example**: Token assembly process in Python

```python
import time
import jwt

def generate_token(apikey: str, exp_seconds: int):
    try:
        id, secret = apikey.split(".")
    except Exception as e:
        raise Exception("invalid apikey", e)
    payload = {
        "api_key": id,
        "exp": int(round(time.time() * 1000)) + exp_seconds * 1000,
        "timestamp": int(round(time.time() * 1000)),
    }
    return jwt.encode(
        payload,
        secret,
        algorithm="HS256",
        headers={"alg": "HS256", "sign_type": "SIGN"},
    )
```

3. **Place the Authentication Token in the HTTP Request Header**

Users need to place the generated authentication token in the `Authorization` header of the HTTP request:

- `Authorization`: `Bearer <YourToken>`

**Example**: Example of token parameter in a curl request

```bash
curl --location 'https://open.bigmodel.cn/api/paas/v4/chat/completions' \
--header 'Authorization: Bearer <YourToken>' \
--header 'Content-Type: application/json' \
--data '{
  "@context": "https://www.w3.org/ns/did/v1",
  "id": "did:all:14qQqsnEPZy2wcpRuLy2xeR737ptkE2Www@example.com:443",
  ......
}'
```

### 5.2 Creating a DID Document

- **Request Method**: POST
- **Request URL**: `https://example.com/v1/did`
- **Request Headers**:
  - `Content-Type`: `application/text`
- **Request Body**: Contains the JSON representation of the DID document

**Request Body Example**

```json
{
  "@context": "https://www.w3.org/ns/did/v1",
  "id": "did:all:14qQqsnEPZy2wcpRuLy2xeR737ptkE2Www@example.com:443",
  ......
}
```

### 5.3 Updating a DID Document

- **Request Method**: PUT
- **Request URL**: `https://example.com/v1/did`
- **Request Headers**:
  - `Content-Type`: `application/text`
- **Request Body**: Contains the full JSON representation of the DID document to be updated

**Note**: Specific fields of the DID document can be updated, and the DID document can be deprecated.

### 5.4 Querying a DID Document

- **Request Method**: GET
- **Request URL**: `https://example.com/v1/did/{did}`
- **Request Headers**:
  - `Accept`: `application/text`

### 5.5 Deleting a DID Document

- **Request Method**: DELETE
- **Request URL**: `https://example.com/v1/did/{did}`
- **Request Headers**:
  - `Authorization`: `Bearer <token>`

## 6. Exceptional Processes

The private key corresponding to the DID document is crucial. If the private key is compromised, it can lead to DID document insecurity, forgery of DID documents, and reduced security of end-to-end encryption. Although we can gradually add protective mechanisms like multi-signature in the future, supporting DID updates in the entire system is vital.

If a user discovers that their DID private key has been compromised, they can send a request to the DID service provider to modify the DID by changing the DID document's status to deprecated and setting a newly applied DID. At the same time, through the DID message service, notify other DIDs associated with this DID to update their DID documents.

Additionally, in the next version, we plan to add a multi-signature mechanism to enhance the security of the DID document.

## References

[1] W3C DID (Decentralized Identifier) Specification, [https://www.w3.org/TR/did-core/](https://www.w3.org/TR/did-core/)

[2] TLS (Transport Layer Security) 1.3 Specification, [https://www.rfc-editor.org/info/rfc8446](https://www.rfc-editor.org/info/rfc8446)

[3] W3C DIDs: Redefining the Authority Structure of Digital Identity Standards, [https://yurenju.blog/posts/2024-01-01_w3c-dids-redefining-identity-authority/](https://yurenju.blog/posts/2024-01-01_w3c-dids-redefining-identity-authority/)


## Copyright Notice
Copyright (c) 2024 ANP Community  
This file is released under the [MIT License](./LICENSE). You are free to use and modify it, but you must retain this copyright notice.
