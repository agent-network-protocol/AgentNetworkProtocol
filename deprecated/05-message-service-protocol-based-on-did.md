# Message Service Protocol Based on did:all Method

## 1. Background

In the article about cross-platform identity authentication and end-to-end encrypted communication technology based on DID, we introduced how to perform identity authentication and end-to-end encrypted communication based on DID. When negotiating short-term keys and conducting encrypted communication, two DID users need to be able to find each other and send handshake messages or encrypted messages to each other. This article describes how DID users can find each other and send messages.

## 1. Process and Architecture

The overall structure is shown in the following diagram:

![DID-based Message Communication Architecture](/images/message-flow-architecture.png)

The above diagram shows the overall architecture of DID-based message communication, with three main participants:

- User Server: The user's backend service, responsible for managing user DID documents and helping users send and receive messages.
- DID Server: DID document hosting service, responsible for DID creation, query, and other services.
- Message Proxy: Message proxy, responsible for providing message sending and receiving services for users.

As mentioned in our DID all method design specification, DID hosting services (DID server) and message services (Message Proxy) are optional, users can use self-built services, but the process remains basically the same.

## 2. User Server and Message Proxy Connection

User Server can choose its own Message service provider. After selection, apply for an API key and service endpoint on the service provider's website. The API key is used for connection authentication between User Server and Message Proxy, and the service endpoint can be written into the DID document to indicate that this DID uses this endpoint's message service.

Message service generally uses WSS long connection, requiring User Server to actively connect to Message Proxy and maintain heartbeat.

After User Server connects to Message Proxy, it needs to provide routing information for this connection (router in the DID document, which is also a DID) and related signatures to demonstrate ownership of the route. The router is used to inform Message proxy of the routing information carried by this connection. Proxy will bind the routing information, WSS connection, and DID together. All subsequent messages for this DID will be sent to the Server through this WSS connection. The advantage of this design is that after the Server connects to Proxy, it only needs to register a small number of routers without sending all DIDs to Proxy. This is particularly useful when dealing with a large number of DIDs.

One routing information can be bound to multiple WSS connections, with load balancing performed by Proxy during sending.

The process of router registration, binding, and sending messages according to DID is as follows:

![Router Registration, Binding, and DID-based Message Sending Process](/images/message-did-register-flow.png)

## 3. Message Proxy Authentication Mechanism

Message Proxy uses API key to authenticate User Server. The overall process is similar to the authentication process when User Server connects to DID Server (DID all method design specification).

### 3.1 WSS HTTP Request Parameters

Request headers:
- Content-Type: application/json
- Authorization: Supports both API Key and token authentication methods

### 3.2 WSS HTTP User Authentication

When calling interfaces, two authentication methods are supported:
1. Authentication using API Key
2. Authentication using authentication token

#### 3.2.1 Obtaining API Key

Log in to the service provider's API Keys page to get the latest generated user API Key. API Key includes both "user identifier id" and "signature key secret", in the format {id}.{secret}.

#### 3.2.2 Making Requests Using API Key

Users need to place the API Key in the HTTP Authorization header.

#### 3.2.3 Making Requests Using JWT Assembled Token

Users need to import corresponding JWT-related utility classes and assemble the JWT header and payload parts as follows.

1. Header Example

```json
{
  "alg": "HS256",
  "sign_type": "SIGN"
}
```
- alg: Attribute indicates the algorithm used for signing, default is HMAC SHA256 (written as HS256).
- sign_type: Attribute indicates the token type, uniformly written as SIGN for JWT tokens.

2. Payload Example

```json
{
  "api_key": "{ApiKey.id}",
  "exp": 1682503829130,
  "timestamp": 1682503820130
}
```
- api_key: Attribute indicates the user identifier id, which is the {id} part of the user's API Key.
- exp: Attribute indicates the expiration time of the generated JWT, controlled by the client, in milliseconds.
- timestamp: Attribute indicates the current timestamp in milliseconds.

Example: Authentication token assembly process in Python

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

3. Placing Authentication Token in HTTP Request Header
Users need to place the generated authentication token in the HTTP Authorization header:
  - Authorization: Bearer <your_token>

## 4. Message Proxy to Message Proxy Connection
Service Proxies also need to connect with each other, especially when different platforms use different services. Services can connect to each other via WSS, and after connection, notify each other of their respective service endpoints to facilitate routing.

## 5. Message Sending and Receiving Process

This section describes how user A can successfully send a message to user B using B's DID.
The overall process is shown in the following diagram:

![Message Sending and Receiving Process](/images/message-send-receive-flow.png)

Process description:
1. User A obtains user B's DID through WeChat, SMS, offline, or other channels, and initiates a request to send a message to B through A's server.
2. User A's server receives the message sending request to B and sends a request to A Server's Message proxy carrying B's DID.
3. A's Message Proxy receives the message sending request, queries B's DID document from DID Server using B's DID, obtains B's message service endpoint, and caches B's DID document for faster future connections.
4. A's Message Proxy initiates a connection to B's message service endpoint (B's Message Proxy) and sends the message.
5. B's Message Proxy receives the request, looks up B's DID document using B's DID to obtain B's message routing information (router field in DID document). Based on the message routing, it queries B Server's WSS connection and forwards the message.
6. B's Server receives the message, verifies and processes it, and sends it to B.
7. The process for B's subsequent messages to A follows the same process as A sending to B.

Note: For the first access to a new DID, the system may not have cache, making the query process time-consuming, but subsequent accesses can directly access the cache, resulting in lower latency.

## 6. Protocol Definition

As described in DID-based end-to-end encrypted communication technology, our protocol uses WSS for transmission and JSON format.

### 6.1 Message Service Registration Message

Used for user Server to register with Message Proxy. Multiple routers can be carried during registration. Each router includes router DID, creation time, nonce (used to prevent replay attacks), and signature (signature is for the JSON sub-object of that router).

Note: This is a full interface that needs to carry all routers. Routers not included in the registration message will be deleted.

Example:

```json
{
  "version": "1.0",
  "type": "register",
  "timestamp": "2024-05-27T12:00:00.123Z",
  "messageId": "randomstring",
  "routers": [
    {
      "router": "did:all:14qQqsnEPZy2wcpRuLy2xeR737ptkE2Www",
      "nonce": "randomNonceValue1",
      "proof": {
        "type": "EcdsaSecp256r1Signature2019",
        "created": "2024-05-27T10:51:55Z",
        "verificationMethod": "did:example:14qQqsnEPZy2wcpRuLy2xeR737ptkE2Www#keys-1",
        "proofValue": "z58DAdFfa9SkqZMVPxAQpic7ndSayn1PzZs6ZjWp1CktyGesjuTSwRdoWhAfGFCF5bppETSTojQCrfFPP2oumHKtz"
      }
    },
    {
      "router": "did:all:14qQqsnEPZy2wcpRuLy2xeR737ptkE2Www",
      "nonce": "randomNonceValue1",
      "proof": {
        "type": "EcdsaSecp256r1Signature2019",
        "created": "2024-05-27T10:51:55Z",
        "verificationMethod": "did:example:14qQqsnEPZy2wcpRuLy2xeR737ptkE2Www#keys-1",
        "proofValue": "z58DAdFfa9SkqZMVPxAQpic7ndSayn1PzZs6ZjWp1CktyGesjuTSwRdoWhAfGFCF5bppETSTojQCrfFPP2oumHKtz"
      }
    }
  ]
}
```

#### 6.1.1 Field Description

- version: Protocol version
- type: Request type, indicating this is a router registration request, value is "register"
- timestamp: Request timestamp indicating when the request was sent, ISO 8601 format UTC time string accurate to milliseconds
- messageId: Unique message id, 16-character random string
- routers: An array containing multiple router objects, each router object includes the following fields:
  - router: Router's DID, used to identify the router
  - nonce: Random value, 32-byte string, used to prevent replay attacks, ensuring uniqueness of each request
  - proof: Same as the proof field in SourceHello in DID-based end-to-end encrypted communication technology. Signs only the current router.

#### 6.1.2 Proof Signature Generation Steps

The process is basically the same as the sourceHello message signing method in DID-based end-to-end encrypted communication technology. The difference is that the signature here only protects a single router.

- Convert the router object to be signed into a JSON string (excluding proofValue field), using commas and colons as separators, and sort by keys.
- Encode the JSON string as UTF-8 bytes.
- Use elliptic curve digital signature algorithm (EcdsaSecp256r1Signature2019) and SHA-256 hash algorithm to sign the byte data.
- Add the generated signature value proofValue to the proofValue field in the proof dictionary of the message json.

```python
# 1. Create all fields of the json message, excluding proofValue field
router = {
    # Other necessary fields
    "proof": {
        "type": "EcdsaSecp256r1Signature2019",
        "created": "2024-05-27T10:51:55Z",
        "verificationMethod": "did:example:123456789abcdefghi#keys-1"
        # Excluding proofValue field
    }
}

# 2. Convert to JSON string, sort by keys, and use commas and colons as separators
router_str = JSON.stringify(router, separators=(',', ':'), sort_keys=True)

# 3. Encode JSON string as UTF-8 bytes
router_bytes = UTF8.encode(router_str)

# 4. Sign byte data using private key and ECDSA algorithm
signature = ECDSA.sign(router_bytes, private_key, algorithm=SHA-256)

# 5. Add signature value to proof field in json message
router["proof"]["proofValue"] = Base64.urlsafe_encode(signature)
```

#### 6.1.3 Proof Signature Verification Process
Get the DID document according to the router's DID, get the corresponding public key from the document according to verificationMethod, and verify the signature according to the public key and the above signing process.

#### 6.1.4 Nonce Generation and Verification Steps:

The purpose of Nonce is to prevent replay attacks.

1. Generate Nonce: Client generates a random number or unique identifier (nonce), a new nonce should be used for each request.
2. Record Nonce: Server records the nonce when processing the request.
3. Verify Nonce: Server verifies whether the nonce has been used within a certain time period. If it has been used, reject the request.

#### 6.1.5 Timestamp Verification:

- Timestamp: Include a timestamp in the request indicating when the request was generated.
- Validity Check: Server checks if the timestamp is within a reasonable time range (e.g., within 5 minutes). Requests outside this time range will be rejected.

### 6.2 Message Proxy to Proxy Connection

After a Proxy A resolves the message service endpoint B of the target DID, it can initiate a WSS connection to this endpoint B, after which it can directly send messages without needing to register, but heartbeat is required to keep alive.
B can establish a new WSS connection to send messages to A, not using the previous connection from A to B.
Thus, one connection is only used for the connection initiator to send messages.

### 6.3 Heartbeat Maintenance Message

Heartbeat messages are initiated by the connecting party. The server will periodically (60 seconds) clear connections without keep-alive messages.

Example:
```json
{
  "version": "1.0",
  "type": "heartbeat",
  "timestamp": "2024-06-04T12:34:56Z",
  "messageId": "randomstring",
  "message": "ping"
}
```

#### 6.3.1 Field Description

- version: Protocol version
- type: Request type, indicating this is a heartbeat request, value is "heartbeat"
- timestamp: Request timestamp indicating when the request was sent, ISO 8601 format UTC time string accurate to milliseconds
- messageId: Unique message id, 16-character random string
- message: The heartbeat message sent in the request is "ping", the response message is "pong"

### 6.4 Encrypted Communication Message

After two users negotiate short-term encryption keys through DID, they can send encrypted messages through message messages.

Example:
```json
{
  "version": "1.0",
  "type": "message",
  "timestamp": "2024-06-04T12:34:56.123Z",
  "messageId": "randomstring",
  "sourceDid": "did:example:987654321abcdefghi",
  "destinationDid": "did:example:123456789abcdefghi",
  "secretKeyId": "abc123session",
  "encryptedData": {
    "iv": "iv_encoded_base64",
    "tag": "tag_encoded_base64",
    "ciphertext": "ciphertext_encoded_base64"
  }
}
```

#### 6.4.1 Protocol Fields

- version: String, current protocol version number
- type: String, message type
- timestamp: Message sending time, ISO 8601 format UTC time string accurate to milliseconds
- messageId: Unique message id, 16-character random string
- sourceDid: String, the message source or sender's DID, always fill in the message sender's own DID here
- destinationDid: String, the destination or message recipient's DID, always fill in the message recipient's DID here
- secretKeyId: ID of the short-term encryption key, through which the previously negotiated symmetric encryption key algorithm, encryption key, and other information can be found, type: string. See DID-based end-to-end encrypted communication technology for details
- encryptedData: Encrypted data, may include different data depending on the encryption algorithm. The following is the data required for the TLS_AES_128_GCM_SHA256 encryption suite: includes iv (initialization vector), tag (authentication tag, depending on encryption algorithm). ciphertext (encrypted text) exists in all encryption algorithms.
  - iv: Initialization Vector, a random or pseudo-random byte sequence, typically 12 bytes (96 bits) for AES-GCM mode
  - tag: An authentication code generated by AES-GCM mode, used to verify data integrity and authenticity. Tag is typically 16 bytes (128 bits)
  - ciphertext: Encrypted data, the encrypted ciphertext is Base64 encoded and the encoding result is converted to a UTF-8 string
  - encryptedData generation method is the same as the finished message verifyData generation method: DID-based end-to-end encrypted communication technology

### 6.5 Response Message

For all WSS messages, there is a general response message, whose main purpose is to notify exceptions in message processing, including short-term key negotiation messages, wss registration messages, encrypted communication messages, etc. This message should not be used for WSS json message level reception confirmation. If an application layer sends a message and needs to confirm whether the other party correctly received the message, protection mechanisms need to be designed in the application layer protocol.

```json
{
  "version": "1.0",
  "type": "response",
  "timestamp": "2024-06-04T12:34:56.123Z",
  "messageId": "randomstring",
  "sourceDid": "did:example:987654321abcdefghi",
  "destinationDid": "did:example:123456789abcdefghi",
  "originalType": "register",
  "originalMessageId": "randomstring",
  "code": 200,
  "detail": "invalid json"
}
```

#### 6.5.1 Field Description

- originalType: Original message type
- originalMessageId: Original message message id
- code: Error code, basic design similar to HTTP error codes, following are common errors:
  - 200: Normal
  - 404: DID not found
  - 403: Authentication failed
  - 4000: ENCRYPTION_ERROR: Error occurred during encryption
  - 4001: DECRYPTION_ERROR: Error occurred during decryption
  - 4002: INVALID_ENCRYPTION_KEY: Encryption key invalid or mismatched
  - 4003: INVALID_DECRYPTION_KEY: Decryption key invalid or mismatched
  - 4004: ENCRYPTION_KEY_EXPIRED: Encryption key expired
  - 4005: DECRYPTION_KEY_EXPIRED: Decryption key expired
- detail: Detailed description of the error

### 6.6 DID Update Notification

When internal fields of DID are modified, or when the private key corresponding to DID is compromised and the original DID document needs to be deprecated, a DID notification message needs to be sent to notify other associated DIDs to query the DID document again in a timely manner.
To resist potential malicious attacks, DID update notifications will be launched together with the multi-signature mechanism of DID documents, planned to be supported in the next version. This way, even if one key is compromised, we can still safely notify associated parties.


## Copyright Notice
Copyright (c) 2024 ANP Community  
This file is released under the [MIT License](./LICENSE). You are free to use and modify it, but you must retain this copyright notice.
