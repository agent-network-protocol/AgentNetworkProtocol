# ANP Security Considerations

- Status: Informational implementation guidance
- Scope: Non-normative. This document does not define new protocol
  requirements. Normative requirements remain in the individual ANP
  specifications and Profiles.

This document summarizes security guidance that cuts across the ANP
specifications. It does not replace protocol-specific requirements in the
did:wba, Agent Description, Agent Discovery, Meta-Protocol, Messaging, or
application protocol documents. Instead, it clarifies the security boundaries
that implementations and applications should preserve when composing these
mechanisms. If this guidance conflicts with an applicable ANP specification or
Profile, the specification or Profile takes precedence.

## 1. Security Goals and Non-Goals

ANP provides protocol mechanisms for agent identity, authenticated requests,
message integrity, secure service discovery, protocol negotiation, and optional
end-to-end encryption Profiles. In particular, did:wba authentication proves
control of a verification method associated with a DID, while signatures and
digests protect the request components they cover from tampering.

Successful ANP authentication is not the same as application authorization. A
server or receiving agent still needs to decide whether the authenticated DID is
allowed to access a resource, invoke an operation, or act for a user. Similarly,
ANP does not by itself guarantee task correctness, prompt-injection resistance,
business-rule enforcement, or prevention of information loss in multi-agent
workflows. Those decisions belong to the application, agent runtime, or
deployment policy. ANP implementations should preserve enough authenticated
context for those layers to make and audit each decision.

## 2. Authentication and Authorization Boundary

Implementations should keep identity proof separate from resource authorization:

1. Verify the DID document, verification method, signature coverage, timestamp,
   nonce, and message digest according to the relevant ANP Profile.
2. Treat successful verification as authentication of the sender or service
   identity, not as permission to perform the requested action.
3. Apply local authorization policy to the authenticated DID, requested
   resource, protocol Profile, and operation.
4. Preserve the distinction between authentication failure and authorization
   failure in responses and security events.

When an operation requires user presence or other high-assurance approval, the
application should enforce that policy through the applicable application
protocol or runtime capability contract. A DID document should not be treated as
proof that a human approved a specific action.

### 2.1 Transport Bindings

In HTTP bindings, an authentication failure generally maps to `401 Unauthorized`,
while an authenticated identity that lacks permission generally maps to
`403 Forbidden`. Other transports should use the error model defined by their
corresponding Profile while preserving the distinction between authentication
failure and authorization failure. Implementations should not assume that HTTP
status codes are available or meaningful in every ANP transport binding.

## 3. Credential and Key Lifecycle

The did:wba specification defines timestamp checks, nonce-based replay
protection, DID document verification, and access-token handling. Implementations
should also make their lifecycle behavior explicit:

1. Use short, configurable validity windows for signatures, challenges, and
   access tokens.
2. Fail closed when a DID document cannot be resolved, a verification method is
   removed, a key no longer satisfies the required verification relationship, or
   an access token has expired.
3. Track key and authorization-state versions so that rotation, revocation, and
   DID document updates are visible to validation and audit logic.
4. Prefer sender-constrained access tokens when a compatible Profile is
   available. Otherwise, treat bearer tokens as high-value secrets and limit
   their lifetime, audience, and scope.

These practices do not require a new wire-format field unless a future ANP
Profile standardizes one.

### 3.1 Access Token Revocation Semantics

Token expiration and token revocation are different events. Expiration bounds
how long a token can be accepted without an explicit revocation mechanism; it
does not make revocation take effect before the expiration time.

Short-lived, narrowly scoped tokens are the recommended baseline. Token
lifetimes should decrease as the impact of misuse, breadth of scope, bearer-token
exposure, or expected revocation delay increases. A longer lifetime may be
appropriate only when compensating controls, such as sender constraint and an
online status check, justify it.

Deployments should document whether they provide:

1. Expiration-only invalidation, where a valid token remains usable until it
   expires.
2. Best-effort early revocation, such as a distributed denylist keyed by token
   identifier or authorization-state version.
3. Online validation, such as token introspection or an equivalent state lookup
   for each protected request.

Immediate revocation requires every resource server to consult sufficiently
current shared state before accepting the token. Replication delay, validation
caches, partitions, and failover can weaken that guarantee. Implementations
should therefore define the maximum propagation or cache delay and whether a
revocation-state outage fails closed or temporarily relies on token expiration.
A best-effort denylist improves incident response but should not be described as
immediate revocation unless those distributed-state conditions are met.

### 3.2 Replay Protection Assumptions

Timestamp validation narrows the replay window but does not replace nonce or
message-state validation. Replay protection should perform an atomic
check-and-record operation for `(keyid, nonce)`, `(keyid, jti)`, or the equivalent
Profile-specific replay key.

In a multi-instance deployment, the replay store should either be shared by all
instances or partitioned so that every request with the same replay key is
guaranteed to reach the same owner. Routing, resharding, and failover must not
allow a duplicate to reach an instance that cannot observe the earlier
acceptance. A local in-memory cache on each independently routed instance is not
sufficient.

After a service restart, an implementation should use one of these approaches:

1. Restore a durable replay store before accepting requests.
2. Fail closed until every request accepted before the restart is outside the
   timestamp acceptance window.
3. Reject requests using client-generated nonces and require a fresh,
   server-issued, single-use challenge whose state was created after the
   restart.

For a request with an explicit expiration time, retain its replay entry until at
least that expiration time plus the permitted clock skew. If expiration is
derived from a creation time and maximum age, retain the entry through the end of
that derived acceptance window plus clock skew. Challenge nonces should remain
recorded for at least their full validity window. Rate limits and storage bounds
should not evict live replay entries in a way that makes an otherwise valid
duplicate acceptable.

## 4. Security Event Hooks

ANP implementations should expose security-relevant events to the application
or runtime layer. The guidance does not prescribe a logging backend, but the
following events should be observable to policy, monitoring, and
incident-response code:

1. DID resolution, DID document verification, and verification-method mismatch.
2. Signature, digest, timestamp, nonce, replay-state, and access-token acceptance
   or rejection.
3. Protocol negotiation start, accept, reject, failure, and negotiation or
   artifact digest mismatch.
4. External artifact validation and local protocol-handler isolation failures.
5. Authorization decisions made after successful authentication.
6. Cross-domain or cross-protocol handoff events.

Useful event fields include the source DID, destination DID, service DID if
applicable, session or negotiation identifier, protocol Profile, artifact or
negotiation digest, operation name, decision, timestamp, and error code.
Applications can redact or aggregate these fields according to their privacy
requirements.

## 5. Negotiated Protocol Artifacts and Local Handlers

ANP-06 defines semantic negotiation through `MetaProtocolInterface`,
`anp.get_capabilities`, and `anp.negotiate`. A negotiation result selects an
interface, Profile, security Profile, schema, content type, and execution mode.
It may reference an external protocol artifact, but ANP-06 does not require
remote code exchange or execution. Artifact publication, signing, review, and
governance remain outside the current ANP-06 interoperability requirements.

Implementations should treat external artifacts and any locally generated or
loaded code as untrusted input. Recommended safeguards include:

1. Confirm that the selected interface and Profiles remain consistent with the
   target Agent Description, runtime capabilities, and local policy.
2. Bind an artifact to the digest obtained from an authenticated negotiation or
   another trusted metadata channel. A digest supplied alongside untrusted
   content does not establish authenticity.
3. Verify an artifact signature only against an authorized publisher key and an
   explicit trust policy. Signature validity alone does not make the publisher
   trusted.
4. Validate artifact schema, version, dependencies, content type, and size before
   caching or processing it.
5. Treat natural-language instructions and executable content inside an
   artifact as data unless local policy explicitly permits further processing.
6. Run locally generated or third-party handler code in a least-privilege
   sandbox. Deny filesystem, network, credential, tool, and environment access
   unless the application explicitly grants it.
7. Keep handler capabilities separate from the sender's authenticated identity.
   Authenticating the sender should not grant locally loaded code additional
   privileges.

## 6. Cross-Protocol and Bridge Deployments

ANP deployments may interact with other agent protocols, tool runtimes, or
application gateways. In these settings, the bridge component should preserve
security context instead of converting it into implicit authority.

For example, when an ANP message leads to a call into another protocol or tool
system, the bridge should carry forward the relevant source DID, destination
DID, service DID, protocol Profile, session or negotiation identifier, and
authorization context. The receiving runtime should still apply its own policy
before reading files, invoking tools, sending network requests, or acting on
behalf of a user.

This boundary is important because each protocol may verify only its local
message format and identity proof. A composed deployment can still create an
unsafe path if authenticated content from one side silently authorizes actions
on the other side.

## 7. Payment Scenarios

Payment-related scenarios require additional controls beyond this general
guidance. Implementations should follow the
[ANP Agent Payment Protocol](../application/10-anp-agent-payment-protocol-specification.md)
and pay particular attention to authorization scope, transaction integrity,
replay protection, and explicit user confirmation. A payment mandate or user
signature should be bound to the intended transaction details, and an
authenticated agent identity should not be treated as standing approval for a
payment.

## 8. Implementation Checklist

Implementers should verify that their deployment:

1. Separates authentication from authorization.
2. Checks signature coverage, message digest, timestamp, nonce, and replay state
   before accepting requests.
3. Defines token lifetime, scope, revocation guarantee, and outage behavior.
4. Coordinates replay state across instances, failover, and service restarts.
5. Defines key-rotation and DID document update behavior.
6. Avoids putting secrets, API keys, or bearer credentials in Agent Description
   documents.
7. Treats external artifacts and local protocol-handler code as untrusted until
   verified and isolated according to local policy.
8. Exposes security events to application policy and monitoring code.
9. Preserves source identity and protocol context across bridges, gateways, and
   cross-protocol calls.
10. Requires explicit application policy for sensitive operations such as user
    approval, file access, tool execution, payment, or external network access.
