# End-to-End Encrypted Communication Technology Protocol Based on did

## 1. Background

End-to-End Encryption (E2EE) is a method of encrypting communication to ensure that information remains encrypted during transmission between the sender and receiver, thereby preventing unauthorized access to plaintext content by third parties, including internet service providers, man-in-the-middle attackers, and the servers themselves.

In the [AgentNetworkProtocol Technical White Paper](01-AgentNetworkProtocol%20Technical%20White%20Paper.md), we proposed an end-to-end encryption communication technology based on DID. This document details the implementation specifics of that technology.

## 2. Solution Overview

This solution leverages high-security technologies such as TLS and blockchain, which have been validated in practice. By combining these technologies, we have designed an end-to-end encrypted communication scheme based on DID, suitable for secure encrypted communication between users on two different platforms.

We have designed a set of DID-based message routing mechanisms and short-term key negotiation mechanisms on top of the WebSocket protocol. Both parties holding a DID can use the public keys in their DID documents and their own private keys to perform short-term key negotiations using ECDHE (Elliptic Curve Diffie-Hellman Ephemeral). Subsequently, messages are encrypted using the negotiated keys within their validity period, ensuring secure communication. ECDHE ensures that even if messages are forwarded through intermediaries like third-party message proxies, they cannot be maliciously decrypted.

We chose the WebSocket protocol because it is widely used on the internet and has a lot of available infrastructure, which is crucial for the early adoption of the solution. Additionally, since we have designed an end-to-end encryption scheme on top of WebSocket, there is no need to use the WebSocket Secure protocol, thus avoiding redundant encryption and decryption processes.

Our current solution essentially uses application-layer encryption to replace transport-layer encryption. This approach leverages existing infrastructure while reducing the difficulty of protocol adoption.

The overall process is illustrated in the following diagram:

![end-to-end-encryption](/images/end-to-end-encryption-process.png)

**Note:** The third-party Message service may not exist; users can use their own message services.

Currently, we only support the WebSocket protocol because it is a bidirectional protocol. In the future, we plan to support the HTTP protocol to expand to more scenarios. We also consider implementing our end-to-end encryption scheme at the transport layer to enable its use in more scenarios.

## 3. Encrypted Communication Process

Assume there are users from two different platforms, one is A (DID-A) and the other is B (DID-B). Both A and B can obtain each other's DID documents from the DID SERVER, which contain their respective public keys.

To perform encrypted communication, A and B first need to initiate the short-term key creation process. The process of creating a short-term key is similar to how TLS generates temporary encryption keys. This key has a validity period, and before it expires, they need to re-initiate the short-term key creation process to generate and update the key.

Once A and B hold the negotiated short-term key, if A wants to send a message to B, it can encrypt the message using the key and then send it to B via the message sending protocol through the message server. Upon receiving the message, B uses the key ID in the message to find the previously stored short-term key and decrypts the encrypted message. If the corresponding key is not found or has expired, an error message is sent to notify A to initiate the short-term key update process. After the short-term key is updated, the message is sent again.

```plaintext
Client (A)                                      Client (B)
|                                                 |
| -- Initiate Short-term Key Creation Process --> |
|                                                 |
|      (Create Temporary Encryption Key)          |
|                                                 |
| <---- Temporary Key Created ----                |
|                                                 |
|       (Key has an expiration time)              |
|                                                 |
|      (Monitor Key Validity)                     |
|                                                 |
|   (Before expiration, restart creation process) |
|                                                 |
| (A and B now have a negotiated short-term key)  |
|                                                 |
| ---- Encrypted Message ---->                    |
|                                                 |
|     (Encrypt message using short-term key)      |
|     (Send via message server)                   |
|                                                 |
| <---- Receive Encrypted Message ----            |
|                                                 |
|     (Find stored key using key ID)              |
|     (Decrypt message)                           |
|      (If key not found or expired)              |
|                                                 |
| <---- or Error Message ----                     |
|                                                 |
|      (Notify A to update short-term key)        |
|                                                 |
```

## 4. Short-term Key Negotiation Process

The process of creating a short-term key is similar to the key exchange process in TLS 1.3, using ECDHE (Elliptic Curve Diffie-Hellman Ephemeral), a key exchange protocol based on elliptic curves. It is a variant of the Diffie-Hellman key exchange protocol that combines Elliptic Curve Cryptography (ECC) with ephemeral keys to securely exchange encryption keys over an insecure network, thereby achieving secure communication.

### Brief Description of ECDHE Process:

1. **Key Pair Generation:**
   - Both the client and the server generate a temporary elliptic curve key pair, including a private key and a public key.

2. **Public Key Exchange:**
   - The client sends its generated public key to the server.
   - The server sends its generated public key to the client.

3. **Shared Secret Computation:**
   - The client uses its private key and the server's received public key to compute the shared secret.
   - The server uses its private key and the client's received public key to compute the shared secret.
   - Due to the properties of the Elliptic Curve Diffie-Hellman algorithm, both computations result in the same shared secret.

### Differences from the TLS Process:

- The entire process involves only three messages: `SourceHello`, `DestinationHello`, and `Finished`, corresponding to TLS's `ClientHello`, `ServerHello`, and `Finished`. In our process, there are only source and destination instead of client and server.
- Other messages like `EncryptedExtensions`, `Certificate`, and `CertificateVerify` are not needed. Specifically:
  - `EncryptedExtensions` are currently not required but may be added later to convey encryption extensions.
  - `Certificate` and `CertificateVerify` are unnecessary because these messages primarily ensure the server's public key is secure. We verify the correctness of the DID's corresponding public key through the DID address and public key relationship—each DID corresponds to exactly one public key and vice versa.
- `Finished` no longer hashes and encrypts the handshake messages because `SourceHello` and `DestinationHello` already include signatures that ensure message integrity.
- `Source` and `Destination` can simultaneously initiate multiple short-term key negotiations, allowing multiple keys to exist at the same time for encrypting different types of messages.

### Overall Process Diagram:

```plaintext
Client (A)                                          Server (B)
   |                                                    |
   |  ---------------- SourceHello ---------------->    |
   |                                                    |
   |                  (Includes public key and signature)|
   |                                                    |
   |                                                    |
   |  <------------- DestinationHello ------------      |
   |                                                    |
   |                  (Includes public key and signature)|
   |                                                    |
   |                                                    |
   |  -------- Finished (Includes verify_data) -------> |
   |                                                    |
   |  <-------- Finished (Includes verify_data) --------|
   |                                                    |
   |                                                    |
```

## 5. Protocol Definition

Our protocol is designed based on WebSocket and uses JSON format. A DID user's message receiving address is stored in the DID document under the "service" field with the endpoint type `messageService`. (Refer to DID all method design specification)

### 5.1 SourceHello Message

The `SourceHello` message is used to initiate the encrypted communication handshake. It includes the source's identity information, public key, supported encryption parameters, session ID, version information, and a message signature to ensure the integrity and authentication of the message.

**Message Example:**
```json
{
  "version": "1.0",
  "type": "sourceHello",
  "timestamp": "2024-05-27T12:00:00.123Z",
  "messageId": "randomstring",
  "sessionId": "abc123session",
  "sourceDid": "did:example:123456789abcdefghi",
  "destinationDid": "did:example:987654321abcdefghi",
  "verificationMethod": {
    "id": "did:example:987654321abcdefghi#keys-1",
    "type": "EcdsaSecp256r1VerificationKey2019",
    "publicKeyHex": "04a34b4c8d2e48f37a6c6c6f6d7b7a6e4b4d5f6c4e4f7a6b4c8d2e48f37a6c6c6f6d7b7a6e4b4d5f6c4e4f7a6"
  },
  "random": "b7e4b4d5f6c4e4f7a6b4c8d2e48f37a6c6c6f6d7b7a6e4b4d5f6c4e4f7a6b4c8d2e48f37a6c6c6f6d7b7a6e4b4d5f6c4e4f7a6",
  "supportedVersions": ["1.0", "0.9"],
  "cipherSuites": [
    "TLS_AES_128_GCM_SHA256",
    "TLS_AES_256_GCM_SHA384",
    "TLS_CHACHA20_POLY1305_SHA256"
  ],
  "supportedGroups": [
    "secp256r1",
    "secp384r1",
    "secp521r1"
  ],
  "keyShares": [
    {
      "group": "secp256r1",
      "expires": 864000,
      "keyExchange": "0488b21e000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000"
    },
    {
      "group": "secp384r1",
      "expires": 864000,
      "keyExchange": "0488b21e000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000"
    }
  ],
  "proof": {
    "type": "EcdsaSecp256r1Signature2019",
    "created": "2024-05-27T10:51:55Z",
    "verificationMethod": "did:example:987654321abcdefghi#keys-1",
    "proofValue": "eyJhbGciOiJFUzI1NksifQ..myEaggpdg0-GflPHibRZWfDEdDOqzZzBcBM5TKvaUzCUSv1_7anUvtgdFXMd12E_qM6RmAAaSWWBGwLY-Srvyg"
  }
}
```

#### 5.1.1 Field Descriptions

- **version**: String, the version number of the current protocol.
- **type**: String, the message type, e.g., "SourceHello".
- **timestamp**: Message sending time, ISO 8601 formatted UTC timestamp with millisecond precision.
- **messageId**: Unique message ID, a 16-character random string.
- **sessionId**: String, session ID, a 16-character random string, valid within a single short-term session negotiation.
- **sourceDid**: String, the source of the message, i.e., the sender's DID. Always the sender's own DID.
- **destinationDid**: String, the destination end, i.e., the receiver's DID. Always the receiver's DID.
- **verificationMethod**: The sender's public key corresponding to their DID.
  - **id**: String, verification method ID.
  - **type**: String, the type of public key as defined by the DID specification.
  - **publicKeyHex**: String, the hexadecimal representation of the public key.
- **random**: String, a 32-character random string ensuring the uniqueness of the handshake process, participating in key exchange.
- **supportedVersions**: Array, a list of protocol versions supported by the sender.
- **cipherSuites**: Array, a list of supported cipher suites. Currently supports TLS_AES_128_GCM_SHA256.
- **supportedGroups**: Array, a list of supported elliptic curve groups.
- **keyShares**: Array, contains multiple public key exchange information.
  - **group**: String, the elliptic curve group used. Currently supports secp256r1.
  - **keyExchange**: String, hexadecimal representation of the public key used for key exchange generated by the sender.
  - **expires**: Number, the validity period of the final encryption key in seconds. Communicates the validity period to the other party to prevent negotiation failure due to key expiration.
- **proof**:
  - **type**: String, the type of signature.
  - **created**: String, the creation time of the signature, ISO 8601 formatted UTC timestamp with second precision.
  - **verificationMethod**: The ID of the verification method used for the signature, referring to the top-level `verificationMethod` field.
  - **proofValue**: The signature of the message using the sender's private key, ensuring the integrity of the message.

#### 5.1.2 Process of Generating proofValue

1. **Construct all fields of the `sourceHello` message**, excluding the `proofValue` field in the `proof` dictionary.
2. **Convert the message without `proofValue` to a JSON string**, using commas and colons as separators and sorting the keys.
3. **Encode the JSON string to UTF-8 bytes**.
4. **Sign the byte data using the ECDSA algorithm and the private key with SHA-256**.
5. **Add the generated signature value to the `proofValue` field of the `proof` dictionary in the JSON message**.

**Python Example:**
```python
# 1. Create all fields of the JSON message, excluding the proofValue field
msg = {
    # Other necessary fields
    "proof": {
        "type": "EcdsaSecp256r1Signature2019",
        "created": "2024-05-27T10:51:55Z",
        "verificationMethod": "did:example:123456789abcdefghi#keys-1"
        # Exclude proofValue field
    }
}

# 2. Convert msg to a JSON string, sorted by keys, using commas and colons as separators
msg_str = JSON.stringify(msg, separators=(',', ':'), sort_keys=True)

# 3. Encode the JSON string to UTF-8 bytes
msg_bytes = UTF8.encode(msg_str)

# 4. Sign the byte data using ECDSA and SHA-256
signature = ECDSA.sign(msg_bytes, private_key, algorithm=SHA-256)

# 5. Add the signature value to the proofValue field in the proof dictionary of the JSON message
msg["proof"]["proofValue"] = Base64.urlsafe_encode(signature)
```

#### 5.1.3 Verifying the SourceHello Message

1. **Parse the Message**: The receiver parses the `SourceHello` message and extracts each field.
2. **Verify DID and Public Key**: Read `sourceDid` and the public key from `verificationMethod`. Use the DID generation method defined in the DID all method design specification to generate a DID from the public key and confirm it matches the `sourceDid`.
3. **Verify the Signature**: Use the public key corresponding to `sourceDid` to verify the signature in the `proof` field.
4. **Verify Other Fields**: Check the randomness of the `random` field to prevent replay attacks. Check the `created` field in the proof to ensure the signature time has not expired.

### 5.2 DestinationHello Message

The `DestinationHello` message is sent by the destination to initiate the key exchange handshake. It includes the destination's identity information, public key, negotiated encryption parameters, session ID, version information, and a message signature to ensure the integrity and authentication of the message.

**Message Example:**
```json
{
  "version": "1.0",
  "type": "destinationHello",
  "timestamp": "2024-05-27T12:00:00Z",
  "messageId": "randomstring",
  "sessionId": "abc123session",
  "sourceDid": "did:example:987654321abcdefghi",
  "destinationDid": "did:example:123456789abcdefghi",
  "verificationMethod": {
    "id": "did:example:987654321abcdefghi#keys-1",
    "type": "EcdsaSecp256r1VerificationKey2019",
    "publicKeyHex": "04a34b4c8d2e48f37a6c6c6f6d7b7a6e4b4d5f6c4e4f7a6b4c8d2e48f37a6c6c6f6d7b7a6e4b4d5f6c4e4f7a6"
  },
  "random": "e4b4d5f6c4e4f7a6b4c8d2e48f37a6c6c6f6d7b7a6e4b4d5f6c4e4f7a6b4c8d2e48f37a6c6c6f6d7b7a6e4b4d5f6c4e4f7a6",
  "selectedVersion": "1.0",
  "cipherSuite": "TLS_AES_128_GCM_SHA256",
  "keyShare": {
    "group": "secp256r1",
    "expires": 864000,
    "keyExchange": "0488b21e000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000"
  },
  "proof": {
    "type": "EcdsaSecp256r1Signature2019",
    "created": "2024-05-27T10:51:55Z",
    "verificationMethod": "did:example:987654321abcdefghi#keys-1",
    "proofValue": "eyJhbGciOiJFUzI1NksifQ..myEaggpdg0-GflPHibRZWfDEdDOqzZzBcBM5TKvaUzCUSv1_7anUvtgdFXMd12E_qM6RmAAaSWWBGwLY-Srvyg"
  }
}
```

#### 5.2.1 Field Descriptions

The fields in the `DestinationHello` message are largely similar to those in the `SourceHello` message. Key differences include:

- **selectedVersion**: The chosen protocol version number.
- **cipherSuite**: The chosen cipher suite. Currently supports TLS_AES_128_GCM_SHA256.
- **keyShare**:
  - **group**: String, the elliptic curve group used. Currently supports secp256r1.
  - **keyExchange**: String, the hexadecimal representation of the public key used for key exchange generated by the destination.
  - **expires**: Number, the validity period of the key set by the destination. If the validity period exceeds that set in `SourceHello`, the key negotiator can still use their own validity period and, after their validity period expires, refuse to accept messages encrypted with this key and send an error to re-initiate negotiation.

**Message Example:**
```json
{
  "version": "1.0",
  "type": "destinationHello",
  "timestamp": "2024-05-27T12:00:00Z",
  "messageId": "randomstring",
  "sessionId": "abc123session",
  "sourceDid": "did:example:987654321abcdefghi",
  "destinationDid": "did:example:123456789abcdefghi",
  "verificationMethod": {
    "id": "did:example:987654321abcdefghi#keys-1",
    "type": "EcdsaSecp256r1VerificationKey2019",
    "publicKeyHex": "04a34b4c8d2e48f37a6c6c6f6d7b7a6e4b4d5f6c4e4f7a6b4c8d2e48f37a6c6c6f6d7b7a6e4b4d5f6c4e4f7a6"
  },
  "random": "e4b4d5f6c4e4f7a6b4c8d2e48f37a6c6c6f6d7b7a6e4b4d5f6c4e4f7a6b4c8d2e48f37a6c6c6f6d7b7a6e4b4d5f6c4e4f7a6",
  "selectedVersion": "1.0",
  "cipherSuite": "TLS_AES_128_GCM_SHA256",
  "keyShare": {
    "group": "secp256r1",
    "expires": 864000,
    "keyExchange": "0488b21e000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000"
  },
  "proof": {
    "type": "EcdsaSecp256r1Signature2019",
    "created": "2024-05-27T10:51:55Z",
    "verificationMethod": "did:example:987654321abcdefghi#keys-1",
    "proofValue": "eyJhbGciOiJFUzI1NksifQ..myEaggpdg0-GflPHibRZWfDEdDOqzZzBcBM5TKvaUzCUSv1_7anUvtgdFXMd12E_qM6RmAAaSWWBGwLY-Srvyg"
  }
}
```

### 5.3 Finished Message

In TLS 1.3, the content of the `Finished` message is a hash of all previous handshake messages, processed through HMAC (Hash-based Message Authentication Code) to ensure that both parties' handshake messages have not been tampered with, preventing replay attacks.

In our process, both `sourceHello` and `destinationHello` messages carry signatures, ensuring that the messages cannot be tampered with. The primary purpose of the `Finished` message in our process is to prevent replay attacks. Specifically, it concatenates the random numbers from both `sourceHello` and `destinationHello` messages, hashes them to obtain a key ID, and then encrypts this key ID with the negotiated key and includes it in the `Finished` message. By decrypting the message, one can verify whether the key ID matches, thereby preventing replay attacks.

**Message Example:**
```json
{
  "version": "1.0",
  "type": "finished",
  "timestamp": "2024-05-27T12:00:00Z",
  "messageId": "randomstring",
  "sessionId": "abc123session",
  "sourceDid": "did:example:987654321abcdefghi",
  "destinationDid": "did:example:123456789abcdefghi",
  "verifyData": {
    "iv": "iv_encoded",
    "tag": "tag_encoded",
    "ciphertext": "ciphertext_encoded"
  }
}
```

#### 5.3.1 Field Descriptions

- **version**: String, the version number of the current protocol.
- **type**: String, the message type.
- **timestamp**: Message sending time, ISO 8601 formatted UTC timestamp with millisecond precision.
- **messageId**: Unique message ID, a 16-character random string.
- **sessionId**: String, session ID, using the `sessionId` from the `sourceHello` message.
- **sourceDid**: String, the source of the message, i.e., the sender's DID. Always the sender's own DID.
- **destinationDid**: String, the destination end, i.e., the receiver's DID. Always the receiver's DID.
- **verifyData**: Verification data. AES-GCM mode carries `iv` and `tag`.
  - **iv**: Initialization Vector, a sequence of random or pseudo-random bytes, typically 12 bytes (96 bits) long for AES-GCM mode.
  - **tag**: Authentication tag generated by AES-GCM mode, used to verify the integrity and authenticity of the data. Typically 16 bytes (128 bits).
  - **ciphertext**: Encrypted data carrying the short-term encryption key ID. See section 5.3.2 for detailed generation method.

#### 5.3.2 Method for Generating verifyData

Encrypt the following JSON using the negotiated short-term encryption key to obtain `ciphertext`:

```json
{
    "secretKeyId":"0123456789abcdef"
}
```

**Python Example:**
```python
# TLS_AES_128_GCM_SHA256 encryption function
def encrypt_aes_gcm_sha256(data: bytes, key: bytes) -> Dict[str, str]:
    # Ensure key length is 16 bytes (128 bits)
    if len(key) != 16:
        raise ValueError("Key must be 128 bits (16 bytes).")
    
    # Generate random IV
    iv = os.urandom(12)  # Recommended IV length for GCM is 12 bytes
    
    # Create cipher object
    encryptor = Cipher(
        algorithms.AES(key),
        modes.GCM(iv),
        backend=default_backend()
    ).encryptor()
    
    # Encrypt data
    ciphertext = encryptor.update(data) + encryptor.finalize()
    
    # Get authentication tag
    tag = encryptor.tag
    
    # Encode to Base64
    iv_encoded = base64.b64encode(iv).decode('utf-8')
    tag_encoded = base64.b64encode(tag).decode('utf-8')
    ciphertext_encoded = base64.b64encode(ciphertext).decode('utf-8')
    
    # Create JSON object
    encrypted_data = {
        "iv": iv_encoded,
        "tag": tag_encoded,
        "ciphertext": ciphertext_encoded
    }
        
    return encrypted_data
```

`secretKeyId` is the short-term encryption key ID between `sourceDid` and `destinationDid`. When sending encrypted messages later, this key ID will be included to indicate which key was used for encryption. This key ID is only valid within the key's validity period and must be discarded once the key expires.

**Method for Generating secretKeyId:**

1. **Concatenate** the random numbers from `sourceHello` and `destinationHello` into a single string, with `sourceHello` first and `destinationHello` second, without any separators.
2. **Encode the string** into a byte sequence using UTF-8.
3. **Initialize HKDF (HMAC-based Extract-and-Expand Key Derivation Function)** with SHA-256 as the hash algorithm, no salt (default), and empty context information. **Python Example:**

    ```python
    hkdf = HKDF(
        algorithm=hashes.SHA256(),  # Ensure using the hash algorithm instance from the cryptography library
        length=8,  # Generate an 8-byte key
        salt=None,
        info=b'',  # Optional context information to distinguish keys for different purposes
        backend=default_backend()  # Use the default cryptographic backend
    )
    ```

4. **Derive an 8-byte sequence** using the `derive` method of HKDF from the input byte sequence.
5. **Encode the derived 8-byte sequence** into a 16-character hexadecimal string, which becomes the `secretKeyId`.

**Python Example for Generating secretKeyId:**
```python
from cryptography.hazmat.primitives.kdf.hkdf import HKDF
from cryptography.hazmat.primitives import hashes
from cryptography.hazmat.backends import default_backend

def generate_16_char_from_random_num(random_num1: str, random_num2: str):
    content = random_num1 + random_num2
    random_bytes = content.encode('utf-8')
    
    # Use HKDF to derive an 8-byte key
    hkdf = HKDF(
        algorithm=hashes.SHA256(),  # Ensure using the hash algorithm instance from the cryptography library
        length=8,  # Generate an 8-byte key
        salt=None,
        info=b'',  # Optional context information to distinguish keys for different purposes
        backend=default_backend()  # Use the default cryptographic backend
    )
    
    derived_key = hkdf.derive(random_bytes)
    
    # Encode the derived key to a hexadecimal string
    derived_key_hex = derived_key.hex()
    
    return derived_key_hex
```

#### 5.3.3 Finished Message Verification

Use the negotiated short-term encryption key to decrypt the encrypted data in the message and extract the `secretKeyId`. Verify whether it matches the locally generated `secretKeyId`.

### 5.4 Method for Generating Short-term Encryption Keys

Once both the source and destination possess both `sourceHello` and `destinationHello`, they can compute the short-term encryption key.

The process of creating a short-term key is similar to the key exchange process in TLS 1.3, using ECDHE (Elliptic Curve Diffie-Hellman Ephemeral), a key exchange protocol based on elliptic curves.

1. **Obtain the Other Party's Public Key:**
   - Extract the other party's elliptic curve public key from the hexadecimal string (`keyExchange`).

2. **Generate Shared Secret:**
   - Use the local private key and the other party's public key to generate a shared secret through the ECDH (Elliptic Curve Diffie-Hellman) algorithm. This ensures that both parties can compute the same shared secret without directly transmitting private keys.

3. **Determine Key Length:**
   - Based on the selected cipher suite, determine the required encryption key length. For example, TLS_AES_128_GCM_SHA256 corresponds to a 128-bit (16-byte) key length.

4. **Generate Encryption and Decryption Keys:**
   - **Initialize HKDF Extraction Phase:**
     - First, initialize the HKDF extractor with the specified hash algorithm (e.g., SHA-256) and an initial salt value (all-zero bytes). The HKDF extractor is used to derive a pseudorandom key from the shared secret.
   - **Extract Pseudorandom Key:**
     - Through the HKDF extraction phase, convert the shared secret into an extracted key. This extracted key serves as the basis for deriving subsequent keys.
   - **Generate Handshake Traffic Keys:**
     - Generate the source and destination handshake keys. These keys combine the extracted key, specific labels ("s ap traffic" and "d ap traffic"), and the concatenated random strings from `sourceHello` and `destinationHello`.

    ```python
    def derive_secret(secret: bytes, label: bytes, messages: bytes) -> bytes:
        hkdf_expand = HKDFExpand(
            algorithm=hash_algorithm,
            length=hash_algorithm.digest_size,
            info=hkdf_label(hash_algorithm.digest_size, label, messages),
            backend=backend
        )
        return hkdf_expand.derive(secret)

    # Generate handshake traffic secrets
    source_data_traffic_secret = derive_secret(extracted_key, b"s ap traffic", source_hello_random + destination_hello_random)
    destination_data_traffic_secret = derive_secret(extracted_key, b"d ap traffic", source_hello_random + destination_hello_random)
    ```

   - **Expand to Generate Actual Handshake Keys:**
     - Use the HKDF expansion phase to derive the actual encryption keys from the handshake traffic keys. This process uses HKDF labels ("key") and the desired key length.

    ```python
    # Expand to generate actual handshake keys
    source_data_key = HKDF(
            algorithm=hash_algorithm,
            length=key_length,  # 256-bit key for AES-256
            salt=None,
            info=hkdf_label(32, b"key", source_data_traffic_secret),
            backend=backend
        ).derive(source_data_traffic_secret)

    destination_data_key = HKDF(
            algorithm=hash_algorithm,
            length=key_length,  # 256-bit key for AES-256
            salt=None,
            info=hkdf_label(32, b"key", destination_data_traffic_secret),
            backend=backend
        ).derive(destination_data_traffic_secret)
    ```

## 6. Limitations

The current solution has some limitations. For example, our encrypted data is transmitted as JSON over WebSocket. If large binary data, such as video files, are transmitted, efficiency is low. We recommend using this only for text and control instruction messages. For large binary data like video files, we suggest transmitting the video's URL and decryption key via the WebSocket JSON message. The receiver can then download the video file through another protocol, such as HTTPS, and decrypt it.

In the future, we plan to design a binary protocol based on WebSocket to address data transmission efficiency issues.

## 7. Summary and Outlook

This solution proposes an end-to-end encrypted communication technology based on DID. By combining high-security technologies like TLS and blockchain, we have designed a DID-based short-term key negotiation mechanism. This scheme ensures secure communication between users on both ends, preventing third parties from accessing unauthorized plaintext content.

Specifically, this solution implements end-to-end encrypted communication on top of the WebSocket protocol and utilizes ECDHE (Elliptic Curve Diffie-Hellman Ephemeral) for short-term key negotiation, ensuring that messages cannot be decrypted even if forwarded through intermediaries. We have detailed the encrypted communication process, short-term key negotiation process, and protocol definitions, including the generation and verification of `SourceHello`, `DestinationHello`, and `Finished` messages.

Although the current version is based on the WebSocket protocol to leverage existing infrastructure, we plan to introduce end-to-end encryption schemes based on TCP or UDP transport layers in the future to further enhance transmission efficiency and application scope.

Through this scheme, we aim to achieve secure and efficient encrypted communication between users on different platforms and provide a reliable technical foundation for decentralized identity authentication. Future work will include optimizing the existing protocol, adding more security features, and expanding to more application scenarios.


## Copyright Notice
Copyright (c) 2024 ANP Community  
This file is released under the [MIT License](./LICENSE). You are free to use and modify it, but you must retain this copyright notice.
