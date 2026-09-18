# Appendix A: did:wba `k1_` Compatibility Extension

- Status: Released
- Version: 1.2
- Language: English

### A.1 Scope of application

This appendix defines the `k1_` path binding profile for compatibility with the wallet ecosystem and existing secp256k1 implementation. `k1_` does not belong to the default scheme of the main specification. New deployments SHOULD give priority to using the `e1_` profile of the main specification.

### A.2 `k1_` path syntax

When an implementation enables this appendix, the last path segment of a path-type DID can be used:

```plaintext
k1_<fingerprint>
```

The ABNF extension of Appendix A is as follows:

```abnf
k1-fingerprint = "k1_" 43base64url-char
wba-k1-path-did = "did:wba:" domain-name 1*(":" path-segment) ":" k1-fingerprint
```

Example:

```plaintext
did:wba:example.com:user:alice:k1_<fingerprint>
did:wba:example.com%3A3000:user:alice:k1_<fingerprint>
```

### A.3 `k1_` Fingerprint generation method

The `k1_` fingerprint is used to associate the path DID with the secp256k1 bound public key. The generation method is as follows:

1. Select a DID binding key. The binding key MUST meet the following conditions:
   - is a secp256k1 public key;
   - Represented as `publicKeyJwk` in DID documents;
   - Authorized by the `authentication` relationship of the DID document.

2. Get the JWK public key object corresponding to the binding key and retain only the necessary fields required by RFC 7638:

```json
{
  "crv": "secp256k1",
  "kty": "EC",
  "x": "...",
  "y": "..."
}
```

3. Generate JWK Thumbprint input according to the rules of [RFC 7638](https://www.rfc-editor.org/rfc/rfc7638):
   - Only keep necessary fields;
   - Field names are sorted lexicographically;
   - Use JSON strings without extra whitespace;
   - Use UTF-8 encoding.

4. Perform a SHA-256 hash on the UTF-8 byte sequence obtained in step 3 to obtain a 32-byte digest value.

5. Base64url encode the 32-byte digest value and remove the trailing `=` padding. The encoding result length is fixed at 43 characters.

6. Add the `k1_` prefix in front of the encoding result to get the final path segment.

### A.4 `k1_` DID Document constraint

When DID uses `k1_` profile, the DID Document must at least meet:

1. `id` is exactly the same as the requested DID;
2. There is at least one secp256k1 `publicKeyJwk` in `verificationMethod` as a binding key;
3. The binding key MUST be authorized by the `authentication` relationship;
4. The RFC 7638 thumbprint of the binding key MUST be exactly the same as the last `k1_` fingerprint segment of the DID path.

The recommended k1 binding verification method shape is as follows:

```json
{
  "id": "did:wba:example.com:user:alice:k1_<fingerprint>#key-1",
  "type": "EcdsaSecp256k1VerificationKey2019",
  "controller": "did:wba:example.com:user:alice:k1_<fingerprint>",
  "publicKeyJwk": {
    "crv": "secp256k1",
    "kty": "EC",
    "x": "...",
    "y": "...",
    "kid": "<fingerprint>"
  }
}
```

### A.5 DID Document proof of `k1_` (compatible extension)

For DIDs using the `k1_` profile, this appendix defines a **non-standard, optional secp256k1 DID Document proof profile** to provide DID Document integrity proof capabilities in the wallet ecosystem or existing secp256k1 implementation.

This proof profile does not fall within the scope of W3C standards interoperability defined by the mainline of this specification. If the implementation chooses to support this section, it should generate and verify the `k1_` DID Document proof according to the rules of this section; implementations that do not support this section may (MAY) ignore the `proof` field in the `k1_` DID Document.

#### A.5.1 proof object field

When the `k1_` DID Document contains the top-level `proof` field, the `proof` object contains the following fields:

- `type`: required field. Fixed to `DataIntegrityProof`
- `cryptosuite`: required field. Fixed to `didwba-jcs-ecdsa-secp256k1-2025`
- `created`: required field. Proof creation time, in XML Schema datetime format
- `verificationMethod`: required field. Full DID URL pointing to the secp256k1 verification method in the DID Document used to generate the proof
- `proofPurpose`: required field. Fixed to `assertionMethod`
- `proofValue`: required field. Signature value, encoding rules see later in this section
- `domain`: optional field
- `challenge`: optional field

Additional constraints:

1. It is recommended (SHOULD) to directly use the `k1_` binding key as `proof.verificationMethod` to unify DID binding and document integrity certification;
2. The verification method pointed to by `proof.verificationMethod` must correspond one-to-one with the private key actually used to generate `proofValue`.

#### A.5.2 proof generation process

Implementations that use `k1_` profile and need to generate DID Document proof should follow the following process:

1. Copy the DID Document to be signed and remove the top-level `proof` field to get `unsecuredDocument`;
2. Construct a proof options object, including:
   - `type`
   - `cryptosuite`
   - `created`
   - `verificationMethod`
   - `proofPurpose`
   - Optional `domain`
   - Optional `challenge`
3. Perform JCS standardization on DID Document and proof options respectively;
4. Calculate the SHA-256 hash values of both;
5. Splice `hash(proofOptions) || hash(document)` to obtain the byte string to be signed;
6. Use the secp256k1 private key pointed to by `verificationMethod` to perform ECDSA + SHA-256 signature on the byte string to obtain a DER encoded signature;
7. Convert the DER encoded signature to a fixed-length 64-byte `R || S`;
8. Encode `R || S` with base64url (without padding) and write `proofValue`;
9. Add the generated `proof` object back to the top level of the DID Document.

#### A.5.3 proof verification process

If you use `k1_` profile and need to verify the implementation of DID Document proof, you should follow the following process:

1. Read the top level `proof` of DID Document;
2. Check whether the following fields exist:
   - `type`
   - `cryptosuite`
   - `created`
   - `verificationMethod`
   - `proofPurpose`
   - `proofValue`
3. Check:
   - Whether `type` is `DataIntegrityProof`
   - Whether `cryptosuite` is `didwba-jcs-ecdsa-secp256k1-2025`
   - Whether `proofPurpose` is `assertionMethod`
4. Remove `proof` from the DID Document to obtain the document to be verified;
5. Remove `proofValue` from `proof` to get proof options;
6. Perform JCS normalization on documents and proof options respectively;
7. Calculate the SHA-256 hashes separately and concatenate them into:
   - `hash(proofOptions) || hash(document)`
8. Parse the secp256k1 public key pointed to by `verificationMethod`;
9. Decode `proofValue` with base64url and restore 64 bytes `R || S`;
10. Convert `R || S` into a signature representation acceptable for ECDSA signature verification;
11. Use the corresponding secp256k1 public key to perform ECDSA + SHA-256 signature verification on the spliced byte string to be verified;
12. If the signature verification is successful, the proof verification passes; otherwise, the verification fails.

#### A.5.4 Parsing strategy

For `k1_` DID, proof verification is an optional enhanced integrity check by default; but once the local policy enables proof verification, proof verification and DID binding verification must be completed simultaneously with the secp256k1 public key corresponding to `proof.verificationMethod`.

Implementations MAY choose one of two modes:

1. Relaxed mode: If the DID Document does not contain `proof`, parsing can still continue;
2. Strict mode: If the local policy requires that the `k1_` document must carry proof, then the DID Document missing `proof` MUST be regarded as a verification failure.

If the implementation enables strict proof checking, it MUST additionally check:

1. The verification method type pointed to by `proof.verificationMethod` is `EcdsaSecp256k1VerificationKey2019`;
2. Use the secp256k1 public key corresponding to this verification method to recalculate the RFC 7638 thumbprint. The result must be completely consistent with the last `k1_` fingerprint segment of the DID path;
3. Other secp256k1 keys in the DID Document that have not participated in the proof must not be used in place of `proof.verificationMethod` to complete the binding verification.

If an implementation does not declare support for `didwba-jcs-ecdsa-secp256k1-2025`, it MAY ignore this proof in the `k1_` DID Document.

Note: The `k1_` DID Document proof defined in this appendix is ​​a compatible extension of did:wba and is used to support document integrity proof in the secp256k1 binding key scenario. This proof profile does not belong to the W3C standard interoperability proof. The standard proof scheme recommended by the main specification is still `DataIntegrityProof` + `eddsa-jcs-2022` under the `e1_` profile.

### A.6 `k1_` Identity Authentication

When an implementation enables this appendix, the `k1_` DID can use the cross-platform HTTP authentication flow defined in [ANP-02 Chapter 3](02-anp-did-authentication-protocol-specification.md#http-binding), subject to the WBA `k1_` method constraints in this appendix.

Certification requirements are as follows:

1. By default, the client SHOULD use the secp256k1 binding key bound to the `k1_` path for signing;
2. `keyid` MUST point to the secp256k1 binding verification method in the DID document;
3. The signature algorithm is ECDSA + SHA-256 on the secp256k1 curve;
4. The signature output uses fixed-length `r || s` byte string encoding;
5. When verifying, the server must (MUST) check at the same time:
   - The verification method pointed to by `keyid` exists;
   - This verification method is located in `authentication`;
   - The thumbprint of this verification method is consistent with the `k1_` fingerprint segment.

### A.7 `k1_` DID Document proof Interoperability instructions

This appendix defines did:wba's own **`k1_` compatible proof profile** (see A.5), which is used to provide optional DID Document integrity proof capability in the secp256k1 binding scenario. It is not the W3C standard `eddsa-jcs-2022` mainline proof, but a compatible extension of did:wba.

Therefore:

1. `k1_` DID Document MAY not contain top-level `proof`;
2. If the implementation enables proof verification, it should be executed according to the `didwba-jcs-ecdsa-secp256k1-2025` rules of A.5;
3. If the implementation does not enable proof verification, you MAY ignore the proof in the `k1_` document;
4. Once proof verification is enabled, other secp256k1 keys in the DID Document that are not involved in proof must not be used instead of `proof.verificationMethod` to complete binding verification.

### A.8 `k1_` creation, parsing and updating

- Create: generate secp256k1 binding key, calculate `k1_` fingerprint segment, and store `did.json` under the corresponding path;
- Parsing: In addition to the general parsing process of the main specification, the `k1_` binding relationship is also verified according to A.3 and A.4;
- Update: As long as the `k1_` binding key remains unchanged, the DID itself remains unchanged; if the binding key changes, the DID MUST change;
- Decommissioning: Rotation can be accomplished by deactivating the old DID and creating a new one; stable reference relationships are maintained by the upper-layer name service.
