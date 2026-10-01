# did:wba Server Test Interface

To facilitate testing of did:wba, we have developed a test server with multiple HTTP endpoints for uploading, retrieving, and testing DID functionality.

The test server's domain is `agent-network-protocol.com` (it will be changed to `agent-network-protocol.com` in the future).

You can generate DID documents locally and upload them to our server to create a usable DID.

For example, if you upload to the path `https://agent-network-protocol.com/wba/user/2i3dg4dtf908cde0/did.json`, your generated DID will be `did:wba:agent-network-protocol.com:wba:user:2i3dg4dtf908cde0`.

## 1. Upload JSON File (PUT Request)

### Request Path
`https://agent-network-protocol.com/wba/user/2i3dg4dtf908cde0/did.json`

Notes:
- "2i3dg4dtf908cde0" is a unique identifier. To prevent conflicts, it's recommended to use a 16-character random string.
- If the ID already exists on the server, it will return 409 Conflict.
- This interface is currently for testing purposes only, with a limit of 50 files per IP address.

### Request Format Example
```plaintext
PUT /wba/user/2i3dg4dtf908cde0/did.json HTTP/1.1
Host: agent-network-protocol.com
Content-Type: application/json
Content-Length: <file_length>

<DID_document_json>
```

## 2. Retrieve JSON File (GET Request)

### Request Path
`https://agent-network-protocol.com/wba/user/2i3dg4dtf908cde0/did.json`

### Request Format Example
```plaintext
GET /wba/user/2i3dg4dtf908cde0/did.json HTTP/1.1
Host: agent-network-protocol.com
```

### Response Format Example
```plaintext
HTTP/1.1 200 OK
Content-Type: application/json
Content-Length: <file_length>

<DID_document_json>
```

### Error Response
- 404 Not Found: The specified resource does not exist.

## 3. Test did:wba Authentication Normal Functionality

A server test endpoint is provided to verify if the user's did:wba authentication is functioning correctly.

### Request Path
`https://agent-network-protocol.com/wba/test`

### Request Format Example
```plaintext
GET /wba/test HTTP/1.1
Host: agent-network-protocol.com
Authorization: DID did:wba:example.com%3A8800:user:alice Nonce <abc123> Timestamp <2024-12-05T12:34:56Z> VerificationMethod <key-1> Signature <base64url(signature_of_nonce_timestamp_service_did)>
```

The Authorization field in the HTTP request header should be signed according to the did:wba method specification.
For token verification flow, fill the Authorization with the token returned from the server's initial request. Example:

```plaintext
Authorization: Bearer <token>
```

### Response Format Example
```plaintext
HTTP/1.1 200 OK
Authorization: Bearer <token>
Content-Type: application/text
Content-Length: <file_length>

OK
```

In the initial request, the Authorization field contains the token for subsequent HTTP requests.

### Error Response
- 403 Forbidden: Authentication failed

## 4. Test did:wba Authentication 401 Functionality

A server test endpoint is provided to test if the client can properly handle 401 responses from the server during did:wba authentication.

### Request Path
`https://agent-network-protocol.com/wba/test401`

### Request Format Example
```plaintext
GET /wba/test401 HTTP/1.1
Host: agent-network-protocol.com
Authorization: DID did:wba:example.com%3A8800:user:alice Nonce <abc123> Timestamp <2024-12-05T12:34:56Z> VerificationMethod <key-1> Signature <base64url(signature_of_nonce_timestamp_service_did)>
```

The Authorization field in the HTTP request header should be signed according to the did:wba method specification.
For token verification flow, fill the Authorization with the token returned from the server's initial request. Example:

```plaintext
Authorization: Bearer <token>
```

### Response Format Example
```plaintext
HTTP/1.1 401 Unauthorized
WWW-Authenticate: Bearer error="invalid_nonce", error_description="Nonce has already been used. Please provide a new nonce.", nonce="xyz987"
Content-Type: application/json
Content-Length: 0
```

The WWW-Authenticate field contains the nonce for signing subsequent HTTP requests.

## 5. Generate DID Document and Private Key Interface

### Request Path
`https://agent-network-protocol.com/wba/demo/generate`

### Request Format Example
```plaintext
GET /wba/demo/generate HTTP/1.1
Host: agent-network-protocol.com
```

### Response Format Example
```plaintext
HTTP/1.1 200 OK
Content-Type: application/json
Content-Length: <file_length>

{
  "did_document": "<DID_document_json>",
  "private_key": "<private_key_pem_format>"
}
```

### Notes
- When handling DID documents and private keys, special characters may be included. To ensure data is correctly sent via JSON, it is recommended to escape special characters.
- Special characters in JSON, such as double quotes (`"`) and backslashes (`\`), need to be escaped with a backslash.
- If the DID document or private key contains newline characters (`\n`), they also need to be escaped.
- For data containing non-text characters, it is recommended to use Base64 encoding to ensure data integrity.

## 6. Authentication Interface

### Request Path
`https://agent-network-protocol.com/wba/demo/auth`

### Request Format Example
```plaintext
POST /wba/demo/auth HTTP/1.1
Host: agent-network-protocol.com
Content-Type: application/json
Content-Length: <file_length>

{
  "did_document": "<DID_document_json>",
  "private_key": "<private_key_pem_format>",
  "auth_url": "<authentication_url>"
}
```

### Response Format Example
```plaintext
HTTP/1.1 200 OK
Content-Type: application/json
Content-Length: <file_length>

{
  "authorization": "DID did:wba:example.com%3A8800:user:alice Nonce <abc123> Timestamp <2024-12-05T12:34:56Z> VerificationMethod <key-1> Signature <base64url(signature_of_nonce_timestamp_service_did)>",
  "auth_code": 200,
  "error_message": null,
  "access_token": "<token>"
}
```

## 7. Authentication 401 Interface

### Request Path
`https://agent-network-protocol.com/wba/demo/auth401`

### Request Format Example
```plaintext
POST /wba/demo/auth401 HTTP/1.1
Host: agent-network-protocol.com
Content-Type: application/json
Content-Length: <file_length>

{
  "did_document": "<DID_document_json>",
  "private_key": "<private_key_pem_format>",
  "auth_url": "<authentication_url>"
}
```

### Response Format Example
```plaintext
HTTP/1.1 401 Unauthorized
Content-Type: application/json
Content-Length: <file_length>

{
  "authorization": "DID did:wba:example.com%3A8800:user:alice Nonce <abc123> Timestamp <2024-12-05T12:34:56Z> VerificationMethod <key-1> Signature <base64url(signature_of_nonce_timestamp_service_did)>",
  "auth_code": 401,
  "error_message": "Invalid credentials provided.",
  "access_token": "<token>"
}
```







## Copyright Notice
Copyright (c) 2024 ANP Community  
This file is released under the [MIT License](./LICENSE). You are free to use and modify it, but you must retain this copyright notice.
