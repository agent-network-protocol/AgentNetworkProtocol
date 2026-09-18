// Copyright (c) 2024 ANP Open Source Community. Apache-2.0.
// Generate offline public test fixtures only. No network or SDK execution.
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import {fileURLToPath} from 'node:url';
import {sha256, b64u, clone, jcs, fixtureKey, withProof, proofParts, signatureFields, percentEncodeDid, contentDigest} from './anp02-vector-utils.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const output = path.join(root, 'examples/did-authentication-vnext');
const sourceCommit = 'b7ba3ff8b628529ec88eef9625b0148fdeb9b994';
const now = '2026-09-07T08:00:00Z';
const expiry = '2026-09-14T08:00:00Z';
const profiles = ['anp.core.binding.v1', 'anp.identity.discovery.v1', 'anp.direct.base.v1', 'anp.group.base.v2', 'anp.direct.e2ee.v2', 'anp.group.e2ee.v2', 'anp.attachment.v1', 'anp.federation.relay.v1'];
const pairs = [['wba', 'wba'], ['wba', 'web'], ['web', 'wba'], ['web', 'web']];
const identities = {};
const keys = new Map();

function addIdentity(id, method, kind) {
  const rootKey = fixtureKey(id + ':root');
  const thumbprint = b64u(sha256(jcs({crv: 'Ed25519', kty: 'OKP', x: rootKey.jwk.x})));
  const did = kind === 'service' ? `did:${method}:service-${method}.example` : `did:${method}:identity-${method}.example:${kind}:${id}` + (method === 'wba' ? ':e1_' + thumbprint : '');
  const rootKid = did + '#root';
  const methods = [];
  const authentication = [];
  const assertionMethod = [];
  const keyAgreement = [];
  function addKey(fragment, key, representation, purposes) {
    const kid = did + '#' + fragment;
    keys.set(kid, key);
    const value = {id: kid, type: representation, controller: did};
    if (representation === 'JsonWebKey2020') value.publicKeyJwk = key.jwk;
    else value.publicKeyMultibase = key.multibase;
    methods.push(value);
    for (const purpose of purposes) ({authentication, assertionMethod, keyAgreement}[purpose]).push(kid);
    return kid;
  }
  addKey('root', rootKey, method === 'web' && kind === 'api' ? 'JsonWebKey2020' : 'Multikey', ['authentication', 'assertionMethod']);
  const authJwk = addKey('auth-jwk', fixtureKey(id + ':auth-jwk'), 'JsonWebKey2020', ['authentication']);
  addKey('assertion-only', fixtureKey(id + ':assertion-only'), 'Multikey', ['assertionMethod']);
  const document = {
    '@context': ['https://www.w3.org/ns/did/v1', 'https://w3id.org/security/data-integrity/v2', 'https://w3id.org/security/multikey/v1', 'https://w3id.org/security/suites/jws-2020/v1'],
    id: did,
    verificationMethod: methods,
    authentication,
    assertionMethod,
  };
  if (kind === 'agent') {
    document.deviceManifest = {type: 'ANPDeviceManifest', devices: []};
    for (const device of ['a', 'b']) {
      const signing = addKey('device-' + device + '-sign', fixtureKey(id + ':device-' + device + '-sign'), 'Multikey', ['authentication', 'assertionMethod']);
      const agreement = addKey('device-' + device + '-ka', fixtureKey(id + ':device-' + device + '-ka', 'X25519'), 'Multikey', ['keyAgreement']);
      document.deviceManifest.devices.push({device_id: 'device-' + device, signing_key_id: signing, e2ee_key_id: agreement, profiles: [...profiles]});
    }
    document.keyAgreement = keyAgreement;
  }
  if (kind === 'agent' || kind === 'group') {
    document.service = [{id: did + '#messages', type: 'ANPMessageService', serviceEndpoint: 'https://messages-' + method + '.example/anp', serviceDid: 'did:' + method + ':service-' + method + '.example', profiles: [...profiles], securityProfiles: ['transport-protected', 'direct-e2ee', 'group-e2ee']}];
  }
  if (kind === 'group') {
    document.controller = 'did:' + method + ':service-' + method + '.example';
    if (method === 'web') delete document.authentication;
  }
  identities[id] = {did, method, kind, root_kid: rootKid, ...(document.authentication?.includes(authJwk) ? {additional_authentication_kid: authJwk} : {}), document: method === 'wba' && kind !== 'service' ? withProof(document, rootKid, rootKey) : document};
  return identities[id];
}

for (const method of ['wba', 'web']) {
  addIdentity('api-' + method, method, 'api');
  addIdentity('alice-' + method, method, 'agent');
  addIdentity('bob-' + method, method, 'agent');
  addIdentity('service-' + method, method, 'service');
  addIdentity('group-' + method, method, 'group');
}

const bytes = [];
const payload = {action: 'create', orderId: '12345'};
function requestVector(id, fixture, transport, method, target, body, kid = identities[fixture].root_kid, nonce = id) {
  const subject = identities[fixture];
  const fields = signatureFields(kid, keys.get(kid), method, target, body, nonce);
  const vector = {id, kind: 'request-signature', transport, identity_fixture: fixture, subject_did: subject.did, keyid: kid, public_key_jwk: keys.get(kid).jwk, method, target_uri: target, payload_utf8: body, ...fields};
  bytes.push(vector);
  return vector;
}
for (const method of ['wba', 'web']) {
  const fixture = 'api-' + method;
  requestVector('HTTP-' + method + '-POST', fixture, 'http-headers', 'POST', 'https://api.example/orders', jcs(payload));
  requestVector('HTTP-' + method + '-GET', fixture, 'http-headers', 'GET', 'https://api.example/orders/12345', null);
  requestVector('HTTP-' + method + '-JWK', fixture, 'http-headers', 'POST', 'https://api.example/orders', jcs(payload), identities[fixture].additional_authentication_kid);
  requestVector('HTTP-' + method + '-NONCELESS', fixture, 'http-headers', 'POST', 'https://api.example/orders', jcs(payload), identities[fixture].root_kid, null);
  const vector = requestVector('JSON-' + method + '-POST', fixture, 'http-json-metadata', 'POST', 'https://api.example/orders', jcs(payload));
  vector.envelope = {auth: {contentDigest: vector.content_digest, signatureInput: vector.signature_input, signature: vector.signature}, payload: clone(payload)};
}

for (const [from, to] of pairs) {
  const sender = identities['alice-' + from];
  const recipient = identities['bob-' + to];
  const id = 'ORIGIN-' + from + '-' + to;
  const signed_request_object = {
    method: 'direct.send',
    meta: {profile: 'anp.direct.base.v1', security_profile: 'transport-protected', sender_did: sender.did, target: {kind: 'agent', did: recipient.did}, operation_id: id, message_id: id, created_at: now, content_type: 'text/plain'},
    body: {text: 'Hello from a native DID'},
  };
  const vector = requestVector(id, 'alice-' + from, 'p1-origin', 'direct.send', 'anp://agent/' + percentEncodeDid(recipient.did), jcs(signed_request_object));
  vector.signed_request_object = signed_request_object;
  vector.method_pair = [from, to];
  const groupObject = clone(signed_request_object);
  groupObject.method = 'group.send';
  groupObject.meta.profile = 'anp.group.base.v2';
  groupObject.meta.target = {kind: 'group', did: identities['group-' + to].did};
  groupObject.meta.operation_id = 'group-message-' + from + '-' + to;
  groupObject.meta.message_id = groupObject.meta.operation_id;
  groupObject.body.text = 'Group receipt assertion';
  const groupVector = requestVector('ORIGIN-GROUP-' + from + '-' + to, 'alice-' + from, 'p1-origin', 'group.send', 'anp://group/' + percentEncodeDid(groupObject.meta.target.did), jcs(groupObject));
  groupVector.signed_request_object = groupObject;
  groupVector.method_pair = [from, to];
}

for (const [id, identity] of Object.entries(identities)) {
  if (identity.document.proof) {
    const parts = proofParts(identity.document);
    bytes.push({id: 'DOCUMENT-' + id, kind: 'data-integrity', object_type: 'did-document', identity_fixture: id, keyid: identity.root_kid, public_key_jwk: keys.get(identity.root_kid).jwk, object: identity.document, proof_config_jcs: parts.proof_config_jcs, document_jcs: parts.document_jcs, hash_data_hex: parts.hash_data_hex});
  }
}

for (const method of ['wba', 'web']) {
  const fixture = 'bob-' + method;
  const identity = identities[fixture];
  const device = identity.document.deviceManifest.devices[0];
  const bundle = withProof({bundle_id: 'bundle-' + method, owner_did: identity.did, owner_device_id: device.device_id, suite: 'ANP-DIRECT-E2EE-X3DH-25519-CHACHA20POLY1305-SHA256-V1', static_key_agreement_id: device.e2ee_key_id, signed_prekey: {key_id: 'spk-' + method, public_key_b64u: b64u(fixtureKey(fixture + ':spk', 'X25519').raw), expires_at: expiry}}, device.signing_key_id, keys.get(device.signing_key_id));
  const binding = withProof({agent_did: identity.did, device_id: device.device_id, verification_method: device.signing_key_id, leaf_signature_key_b64u: b64u(fixtureKey(fixture + ':mls-leaf').raw), issued_at: now, expires_at: expiry}, device.signing_key_id, keys.get(device.signing_key_id));
  for (const [name, object] of [['P5-BUNDLE', bundle], ['P6-BINDING', binding]]) {
    const parts = proofParts(object);
    bytes.push({id: name + '-' + method, kind: 'data-integrity', object_type: name, identity_fixture: fixture, keyid: device.signing_key_id, public_key_jwk: keys.get(device.signing_key_id).jwk, object, proof_config_jcs: parts.proof_config_jcs, document_jcs: parts.document_jcs, hash_data_hex: parts.hash_data_hex});
  }
}

for (const method of ['wba', 'web']) {
  const fixture = 'group-' + method;
  const identity = identities[fixture];
  const relatedRequest = bytes.find(vector => vector.id === 'ORIGIN-GROUP-' + method + '-' + method).signed_request_object;
  const receipt = withProof({receipt_type: 'group-message-accepted', group_did: identity.did, group_state_version: '1', group_event_seq: '2', subject_method: 'group.send', operation_id: relatedRequest.meta.operation_id, message_id: relatedRequest.meta.message_id, actor_did: relatedRequest.meta.sender_did, accepted_at: now, payload_digest: contentDigest(jcs(relatedRequest))}, identity.root_kid, keys.get(identity.root_kid));
  const parts = proofParts(receipt);
  bytes.push({id: 'P4-RECEIPT-' + method, kind: 'data-integrity', object_type: 'P4-RECEIPT', related_signed_request_object: relatedRequest, identity_fixture: fixture, keyid: identity.root_kid, public_key_jwk: keys.get(identity.root_kid).jwk, object: receipt, proof_config_jcs: parts.proof_config_jcs, document_jcs: parts.document_jcs, hash_data_hex: parts.hash_data_hex});
}

for (const [from, to] of pairs) {
  const id = 'P5-AEAD-' + from + '-' + to;
  const aad = {content_type: 'application/anp-direct-cipher+json', message_id: id, operation_id: id, profile: 'anp.direct.e2ee.v2', security_profile: 'direct-e2ee', sender_did: identities['alice-' + from].did, sender_device_id: 'device-a', recipient_did: identities['bob-' + to].did, recipient_device_id: 'device-a', session_id: 'session-' + from + '-' + to, ratchet_header: {dh_pub_b64u: b64u(fixtureKey(id + ':ratchet', 'X25519').raw), pn: '0', n: '0'}};
  const plaintext = {application_content_type: 'text/plain', text: 'No separate origin proof is required for this P5 ciphertext'};
  const messageKey = sha256('PUBLIC-FIXTURE-MK:' + id);
  const nonce = sha256('PUBLIC-FIXTURE-NONCE:' + id).subarray(0, 12);
  const clearBytes = Buffer.from(jcs(plaintext));
  const cipher = crypto.createCipheriv('chacha20-poly1305', messageKey, nonce, {authTagLength: 16});
  cipher.setAAD(Buffer.from(jcs(aad)), {plaintextLength: clearBytes.length});
  const ciphertext = Buffer.concat([cipher.update(clearBytes), cipher.final(), cipher.getAuthTag()]);
  bytes.push({id, kind: 'p5-aead', method_pair: [from, to], sender_fixture: 'alice-' + from, recipient_fixture: 'bob-' + to, precondition: 'The device-pair Session and this message key/nonce are established controlled inputs; X3DH/Ratchet/SDK execution is not claimed.', message_key_hex: messageKey.toString('hex'), nonce_hex: nonce.toString('hex'), aad, aad_jcs: jcs(aad), plaintext, plaintext_jcs: jcs(plaintext), ciphertext_b64u: b64u(ciphertext), wire_body: {session_id: aad.session_id, ratchet_header: aad.ratchet_header, ciphertext_b64u: b64u(ciphertext)}, origin_proof_present: false});
}

const negatives = [];
for (const vector of bytes) {
  if (vector.kind === 'request-signature') {
    negatives.push({id: vector.id + '-TAMPER-TARGET', base_id: vector.id, mutation: 'request-target', replacement: 'https://attacker.example/other', expected_integrity: false});
    negatives.push({id: vector.id + '-TAMPER-SIGNATURE', base_id: vector.id, mutation: 'signature-byte', expected_integrity: false});
    if (vector.payload_utf8 !== null) negatives.push({id: vector.id + '-TAMPER-CONTENT', base_id: vector.id, mutation: 'request-content', replacement: vector.transport === 'http-headers' ? vector.payload_utf8 + ' ' : jcs({...JSON.parse(vector.payload_utf8), tampered: true}), expected_integrity: false});
  } else if (vector.kind === 'data-integrity') {
    negatives.push({id: vector.id + '-TAMPER-OBJECT', base_id: vector.id, mutation: 'object-property', property: 'tampered', replacement: true, expected_integrity: false});
    negatives.push({id: vector.id + '-TAMPER-PROOF-PURPOSE', base_id: vector.id, mutation: 'proof-purpose', replacement: 'authentication', expected_integrity: false});
  } else {
    negatives.push({id: vector.id + '-TAMPER-AAD', base_id: vector.id, mutation: 'aad-device', replacement: 'device-b', expected_integrity: false});
    negatives.push({id: vector.id + '-TAMPER-CIPHERTEXT', base_id: vector.id, mutation: 'ciphertext-byte', expected_integrity: false});
  }
}

const scenarios = [];
const authRef = '../../02-anp-did-authentication-protocol-specification.md';
const p1 = '../../message/01-core-binding.md';
const p2 = '../../message/02-identity-and-discovery.md';
const p3 = '../../message/03-direct-messaging-base-semantics.md';
const p4 = '../../message/04-group-messaging-base-semantics.md';
const p5 = '../../message/05-direct-end-to-end-encryption.md';
const p6 = '../../message/06-group-end-to-end-encryption.md';
const p7 = '../../message/07-attachments-and-object-transfer.md';
const p8 = '../../message/08-federation-and-cross-domain.md';
const p9 = '../../message/09-message-mentions.md';
const wns = '../../04-anp-did-wba-name-space-specification.md';
function scenario(id, category, input, actions, expected, refs) {
  const authenticationExample = refs.some(ref => ref.startsWith(authRef));
  scenarios.push({id, category, execution_status: 'design-only-not-run-against-sdk-or-product', ...(authenticationExample ? {applicability: 'illustrative-implementation-policy-not-additional-anp02-conformance', policy_note: 'Expected results illustrate the selected fixture policy, including error mapping and boundary handling. The ANP-02 1.2 authentication text remains authoritative; these scenarios do not mandate new replay, cache, resolver, credential-selection, algorithm, or token behavior.'} : {}), input, actions, expected, normative_refs: refs});
}
const authCases = [
  ['ACCEPT', 'none', null, 'authenticated', null],
  ['NO-AUTH-RELATIONSHIP', 'remove', '/document/authentication', 'reject', 'invalid_verification_method'],
  ['ASSERTION-ONLY', 'sign-with', '#assertion-only', 'reject', 'invalid_verification_method'],
  ['UNKNOWN-KID', 'replace-kid-and-resign', '#missing', 'reject', 'invalid_verification_method'],
  ['UNSUPPORTED-ALG', 'set-alg-and-resign', 'unsupported-example-alg', 'reject', 'invalid_verification_method'],
  ['DOCUMENT-ID-MISMATCH', 'replace', '/document/id', 'reject', 'invalid_did'],
  ['TARGET-TAMPER', 'replace-unsigned-target', 'https://api.example/admin', 'reject', 'invalid_signature'],
  ['BODY-TAMPER', 'replace-content', '{"action":"delete","orderId":"12345"}', 'reject', 'invalid_content_digest'],
  ['HTTP-JSON-WHITESPACE', 'append-content-byte', ' ', 'reject', 'invalid_content_digest'],
  ['MISSING-DIGEST', 'remove', '/headers/Content-Digest', 'reject', 'invalid_request'],
  ['UNCOVERED-TARGET', 'remove-component-and-resign', '@target-uri', 'reject', 'invalid_request'],
  ['EXPIRED', 'set-clock', 1788768200, 'reject', 'invalid_timestamp'],
  ['FUTURE', 'set-clock', 1788767800, 'reject', 'invalid_timestamp'],
  ['REPLAY', 'repeat-identical-request', 2, 'second-request-rejected', 'invalid_nonce'],
  ['CHALLENGE-MISMATCH', 'issue-required-challenge', 'different-required-nonce', 'reject', 'invalid_nonce'],
  ['CHALLENGE-ONCE', 'issue-matching-challenge-then-repeat', 2, 'second-request-rejected', 'invalid_nonce'],
  ['CONCURRENT-REPLAY', 'submit-identical-concurrently', 2, 'at-most-one-authenticated', 'invalid_nonce'],
  ['FORBIDDEN', 'set-authorized', false, 'authenticated-then-forbidden', 'forbidden_did'],
  ['RESOLUTION-TEMPORARY', 'resolver-result', 'temporarily-unavailable', 'reject-without-deactivation-cache', 'invalid_did'],
  ['DISABLED-METHOD', 'disable-method', true, 'reject', 'invalid_did'],
];
for (const method of ['wba', 'web']) {
  for (const [name, operation, value, outcome, error] of authCases) {
    const input = {identity_fixture: 'api-' + method, byte_vector: 'HTTP-' + method + '-POST', verifier_time: 1788768030, allowed_clock_skew_seconds: 0, authorized: true, allow_nonbinding_authentication_keys: true, message_capabilities_required: false};
    if (name === 'NO-AUTH-RELATIONSHIP' && method === 'wba') input.byte_vector = 'HTTP-wba-JWK';
    const expected = {outcome, public_error: error, side_effect_count: outcome === 'authenticated' ? 1 : outcome.includes('second-request') || outcome === 'at-most-one-authenticated' ? 1 : 0};
    if (name === 'DOCUMENT-ID-MISMATCH') expected.mutation_value = 'did:' + method + ':different.example:other';
    const actions = name === 'NO-AUTH-RELATIONSHIP' && method === 'wba' ? [{operation: 'remove-selected-jwk-request-key-from-authentication-and-resign-document-with-root'}] : [{operation, value}];
    scenario('AUTH-' + method + '-' + name, 'authentication', input, actions, expected, [authRef + '#identity-input', authRef + '#http-binding', authRef + '#challenge-errors']);
  }
  scenario('AUTH-' + method + '-JWK-ALLOWED', 'authentication', {identity_fixture: 'api-' + method, byte_vector: 'HTTP-' + method + '-JWK', verifier_time: 1788768030, allow_nonbinding_authentication_keys: true}, [{operation: 'verify-current-method-and-explicitly-authorized-jwk-request-key'}], {outcome: 'authenticated'}, [authRef + '#identity-input', authRef + '#http-binding']);
  scenario('AUTH-' + method + '-NONCELESS-REPLAY', 'authentication', {identity_fixture: 'api-' + method, byte_vector: 'HTTP-' + method + '-NONCELESS', verifier_time: 1788768030}, [{operation: 'repeat-identical-request', value: 2}], {outcome: 'second-request-rejected', public_error: 'invalid_nonce', side_effect_count: 1}, [authRef + '#challenge-errors']);
  scenario('JSON-' + method + '-ACCEPT', 'json-carriage', {identity_fixture: 'api-' + method, byte_vector: 'JSON-' + method + '-POST', binding: 'http-json-metadata', serialization: 'RFC8785', verifier_time: 1788768030}, [{operation: 'verify-payload-only-digest-and-actual-http-context'}], {outcome: 'authenticated', outer_auth_in_payload_digest: false}, [authRef + '#json-carriage']);
  scenario('JSON-' + method + '-WRONG-BOUNDARY', 'json-carriage', {identity_fixture: 'api-' + method, byte_vector: 'JSON-' + method + '-POST', binding: 'http-headers', verifier_time: 1788768030}, [{operation: 'treat-json-payload-digest-as-full-http-content-digest'}], {outcome: 'reject', public_error: 'invalid_content_digest'}, [authRef + '#json-carriage']);
  scenario('JSON-' + method + '-UNBOUND-TRANSPORT', 'json-carriage', {identity_fixture: 'api-' + method, byte_vector: 'JSON-' + method + '-POST', binding: null}, [{operation: 'send-as-websocket-frame-without-transport-binding'}], {outcome: 'reject', reason: 'no-authenticated-component-source'}, [authRef + '#json-carriage']);
  scenario('TOKEN-' + method + '-OPTIONAL', 'token', {identity_fixture: 'api-' + method, byte_vector: 'HTTP-' + method + '-POST', issue_token: false}, [{operation: 'authenticate-and-authorize-request'}], {outcome: 'accepted-without-token'}, [authRef + '#access-tokens']);
  for (const [name, change, error, outcome] of [
    ['ISSUER', {expected_issuer: 'https://other.example'}, 'invalid_access_token', 'reject'],
    ['AUDIENCE', {resource: 'https://other.example/orders'}, 'invalid_access_token', 'reject'],
    ['EXPIRY', {clock: 1788768200}, 'invalid_access_token', 'reject'],
    ['SCOPE', {required_scope: 'orders.write'}, 'forbidden_did', 'authenticated-but-forbidden'],
  ]) {
    scenario('TOKEN-' + method + '-' + name, 'token', {identity_fixture: 'api-' + method, issuer_fixture: 'service-web', token_policy: {status: 'implementation-selected-example-not-anp02-baseline', format: 'JWT', validate_issuer: true, validate_audience: true, enforce_scope: true, validate_expiry: true, error_mapping: 'fixture-selected'}, token_fixture: {iss: 'https://api.example', aud: 'https://api.example/orders', sub: identities['api-' + method].did, scope: 'orders.read', iat: 1788768000, exp: 1788768060}, verification_context: {expected_issuer: 'https://api.example', resource: 'https://api.example/orders', required_scope: 'orders.read', clock: 1788768030}}, [{operation: 'issue-valid-jwt-with-test-issuer-key'}, {operation: 'change-verification-context', value: change}], {outcome, public_error: error, side_effect_count: 0}, [authRef + '#access-tokens']);
  }
}
scenario('AUTH-UNSUPPORTED-DID-METHOD', 'authentication', {did: 'did:example:alice', enabled_methods: ['wba', 'web']}, [{operation: 'resolve-and-authenticate'}], {outcome: 'reject', public_error: 'invalid_did'}, [authRef + '#method-template']);
scenario('WBA-E1-PROOF-MISSING', 'method-evidence', {identity_fixture: 'api-wba', byte_vector: 'HTTP-wba-POST'}, [{operation: 'remove', value: '/document/proof'}], {outcome: 'reject', public_error: 'invalid_did'}, [authRef + '#wba-binding']);
scenario('WBA-E1-PROOF-TAMPER', 'method-evidence', {identity_fixture: 'api-wba', byte_vector: 'DOCUMENT-api-wba'}, [{operation: 'change-document-without-resigning', value: '/verificationMethod/0/publicKeyMultibase'}], {outcome: 'reject', public_error: 'invalid_did'}, [authRef + '#wba-binding']);
scenario('WBA-E1-WRONG-BINDING-KEY', 'method-evidence', {identity_fixture: 'api-wba', alternative_key: '#assertion-only'}, [{operation: 'resign-document-with-alternative-key-retaining-original-e1-path'}], {outcome: 'reject-even-if-document-signature-valid', reason: 'binding-thumbprint-mismatch'}, [authRef + '#wba-binding']);
scenario('WEB-NO-DOCUMENT-PROOF', 'method-evidence', {identity_fixture: 'api-web', byte_vector: 'HTTP-web-POST'}, [{operation: 'verify-native-web-method-then-request'}], {outcome: 'authenticated', wba_document_proof_required: false}, [authRef + '#web-binding']);
scenario('WEB-KEY-UPDATE-STALE-CACHE', 'method-evidence', {identity_fixture: 'api-web', byte_vector: 'HTTP-web-POST', refresh_required: true}, [{operation: 'remove-current-authentication-key-at-host'}, {operation: 'retry-with-old-signed-request'}], {outcome: 'reject-current-request', invalidate_key_cache: true}, [authRef + '#web-binding', authRef + '#security-privacy']);

const flowCases = [
  ['BASE-DIRECT', 'direct.send', 'transport-protected', 'accept-one-did-level-delivery', [p3]],
  ['BASE-GROUP', 'group.send', 'transport-protected', 'accept-and-verify-group-receipt', [p4]],
  ['P5-INIT-REPLY', 'direct.send', 'direct-e2ee', 'establish-device-pair-and-decrypt-reply', [p5]],
  ['P5-MULTI-DEVICE', 'direct.send', 'direct-e2ee', 'independent-deliveries-and-ratchets-for-two-devices', [p5]],
  ['P6-ADD-WELCOME-COMMIT', 'group.e2ee.add', 'group-e2ee', 'validate-binding-and-mls-then-decrypt-welcome-and-apply-commit', [p6]],
  ['P6-MESSAGE-REMOVE', 'group.e2ee.send', 'group-e2ee', 'decrypt-before-removal-and-reject-removed-leaf-after-commit', [p6]],
  ['P7-ORDINARY-DIRECT', 'direct.send', 'transport-protected', 'upload-authorize-download-and-check-manifest', [p7, p3]],
  ['P7-ORDINARY-GROUP', 'group.send', 'transport-protected', 'group-authorized-download-and-manifest-integrity', [p7, p4]],
  ['P7-ENCRYPTED-DIRECT', 'direct.send', 'direct-e2ee', 'object-key-only-in-e2ee-and-ciphertext-object-integrity', [p7, p5]],
  ['P7-ENCRYPTED-GROUP', 'group.e2ee.send', 'group-e2ee', 'object-key-only-in-mls-and-group-object-authorization', [p7, p6]],
  ['P9-ORDINARY', 'group.send', 'transport-protected', 'verify-full-payload-and-mention-targets', [p9, p4]],
  ['P9-ENCRYPTED', 'group.e2ee.send', 'group-e2ee', 'decrypt-then-validate-text-ranges-targets-and-selectors', [p9, p6]],
];
for (const [from, to] of pairs) {
  for (const [name, method, security, outcome, refs] of flowCases) {
    const mentionPayload = name.startsWith('P9-') ? {text: '@bob @all @agents @humans', mentions: [
      {id: 'men-1', range: {start: 0, end: 4, unit: 'unicode_code_point'}, target: {kind: 'agent', did: identities['bob-' + to].did}},
      {id: 'men-2', range: {start: 5, end: 9, unit: 'unicode_code_point'}, target: {kind: 'group_selector', selector: 'all'}},
      {id: 'men-3', range: {start: 10, end: 17, unit: 'unicode_code_point'}, target: {kind: 'group_selector', selector: 'agents'}},
      {id: 'men-4', range: {start: 18, end: 25, unit: 'unicode_code_point'}, target: {kind: 'group_selector', selector: 'humans'}, mention_role: 'cc'},
    ]} : null;
    scenario(name + '-' + from + '-' + to, 'mixed-message-flow', {method_pair: [from, to], sender_fixture: 'alice-' + from, recipient_fixture: 'bob-' + to, group_fixture: 'group-' + to, service_fixture: 'service-' + to, method, security_profile: security, verifier_time: now, group_policy: {owner_fixture: 'alice-' + from, member_fixtures: ['alice-' + from, 'bob-' + to]}, device_ids: ['device-a', 'device-b'], ...(mentionPayload ? {payload: mentionPayload} : {})}, [{operation: 'establish-current-method-and-profile-fixtures'}, {operation: 'execute-owning-profile-flow', value: name}], {outcome, no_method_specific_message_wire: true, no_silent_downgrade: true}, refs);
  }
  scenario('FEDERATION-MIXED-SERVICE-' + from + '-' + to, 'federation', {method_pair: [from, to], caller_anchor_fixture: 'alice-' + from, service_fixture: 'service-' + to, byte_vector: 'ORIGIN-' + from + '-' + to}, [{operation: 'declare-serviceDid-in-caller-anchor-and-resign-wba-document-if-needed', value: identities['service-' + to].did}, {operation: 'sign-actual-http-hop-with-service-key-and-preserve-origin-proof'}], {outcome: 'verify-hop-and-origin-independently', business_sender_unchanged: true}, [p8, p1]);
  scenario('P5-NO-EXTRA-ORIGIN-' + from + '-' + to, 'p5', {method_pair: [from, to], byte_vector: 'P5-AEAD-' + from + '-' + to, session_precondition: 'established-and-current'}, [{operation: 'validate-eligibility-session-aad-and-aead-without-origin-proof'}], {outcome: 'accept-valid-p5-ciphertext'}, [p5]);
}

const overlayCases = [
  ['P5-BUNDLE-MISSING-PROOF', 'P5-BUNDLE', 'remove', '/proof', 'anp.direct.e2ee.bundle_invalid', p5],
  ['P5-BUNDLE-TAMPER', 'P5-BUNDLE', 'replace-without-resigning', '/signed_prekey/public_key_b64u', 'anp.direct.e2ee.bundle_invalid', p5],
  ['P5-BUNDLE-WRONG-PURPOSE', 'P5-BUNDLE', 'remove-device-signing-key-from-purpose-and-resign-method-document', 'assertionMethod', 'anp.direct.e2ee.bundle_invalid', p5],
  ['P5-BUNDLE-EXPIRED', 'P5-BUNDLE', 'set-clock', '2026-09-15T08:00:00Z', 'anp.direct.e2ee.bundle_expired', p5],
  ['P6-BINDING-MISSING-PROOF', 'P6-BINDING', 'remove', '/proof', null, p6],
  ['P6-BINDING-TAMPER', 'P6-BINDING', 'replace-without-resigning', '/leaf_signature_key_b64u', null, p6],
  ['P6-WRONG-PURPOSE', 'P6-BINDING', 'remove-device-signing-key-from-purpose-and-resign-method-document', 'assertionMethod', null, p6],
  ['P6-EXTENSION-MISSING', 'P6-BINDING', 'remove-leaf-extension', '0xF0A1', null, p6],
  ['P6-EXTENSION-MISMATCH', 'P6-BINDING', 'change-sibling-binding-only', '/device_id', null, p6],
  ['P6-KEYPACKAGE-SIGNATURE', 'P6-BINDING', 'flip-valid-keypackage-signature-byte', 0, null, p6],
  ['P6-LEAF-SIGNATURE', 'P6-BINDING', 'flip-valid-leaf-signature-byte', 0, null, p6],
  ['P6-CREDENTIAL-DID', 'P6-BINDING', 'replace-credential-identity-and-resign-mls', 'did:web:other.example:bob', null, p6],
];
for (const method of ['wba', 'web']) {
  for (const [name, object, operation, value, code, ref] of overlayCases) {
    scenario(name + '-' + method, 'overlay-object', {identity_fixture: 'bob-' + method, byte_vector: object + '-' + method, group_fixture: 'group-' + method, verifier_time: now, keypackage_precondition: 'For P6, construct a valid suite KeyPackage/Leaf with this exact binding and current Manifest before applying the single mutation.'}, [{operation, value}], {outcome: 'reject', ...(code ? {public_error: code} : {}), no_state_commit: true}, [ref, p2 + '#method-validation']);
  }
  scenario('DEVICE-REVOKED-' + method, 'eligibility', {identity_fixture: 'bob-' + method, device_id: 'device-a', overlay_profiles: ['anp.direct.e2ee.v2', 'anp.group.e2ee.v2']}, [{operation: 'remove-device-and-active-key-references-and-publish-method-valid-document'}, {operation: 'use-previously-cached-bundle-session-or-leaf'}], {outcome: 'reject-stale-endpoint', public_error: 'anp.device_state_changed', other_current_device_unchanged: true}, [p2, p5, p6]);
  scenario('P6-CONTROL-ORIGIN-MISSING-' + method, 'control', {sender_fixture: 'alice-' + method, group_fixture: 'group-' + method, method: 'group.e2ee.add', mls_commit_precondition: 'valid owner-authorized add Commit under a ready P4/P6 state'}, [{operation: 'omit-required-auth.origin_proof'}], {outcome: 'reject', public_error: 'anp.unauthorized', no_state_commit: true}, [p6, p1]);
  scenario('P6-CONTROL-ORIGIN-TAMPER-' + method, 'control', {sender_fixture: 'alice-' + method, group_fixture: 'group-' + method, method: 'group.e2ee.remove', mls_commit_precondition: 'valid owner-authorized remove Commit under a ready state'}, [{operation: 'flip-origin-signature-byte'}], {outcome: 'reject', public_error: 'anp.unauthorized', no_state_commit: true}, [p6, p1]);
  scenario('SERVICE-DID-MISMATCH-' + method, 'federation', {caller_anchor_fixture: 'alice-' + method, expected_service_fixture: 'service-' + method, other_service_fixture: 'service-' + (method === 'wba' ? 'web' : 'wba')}, [{operation: 'sign-http-hop-with-other-service-without-changing-anchor-declaration'}], {outcome: 'reject', public_error: 'anp.unauthorized'}, [p8]);
  scenario('GROUP-NONMEMBER-' + method, 'admission', {sender_fixture: 'bob-' + method, group_fixture: 'group-' + method, method: 'group.send', membership: 'not-a-member'}, [{operation: 'submit-valid-origin-proof'}], {outcome: 'authenticated-but-forbidden', no_membership_created: true}, [p4]);
  scenario('NO-MESSAGE-SERVICE-' + method, 'capability', {identity_fixture: 'api-' + method}, [{operation: 'authenticate-ordinary-http-api'}, {operation: 'attempt-message-service-discovery'}], {outcome: 'http-authentication-valid-message-service-unavailable', no_endpoint_inferred_from_domain: true}, [authRef, p2]);
  scenario('MISSING-E2EE-CAPABILITY-' + method, 'capability', {identity_fixture: 'bob-' + method, requested_profile: 'anp.direct.e2ee.v2'}, [{operation: 'remove-selected-profile-from-device-and-resign-method-document'}], {outcome: 'reject', public_error: 'anp.device_not_eligible', no_silent_downgrade: true}, [p2, p5]);
  scenario('LOCAL-ACCOUNT-SELF-CLAIM-' + method, 'admission', {identity_fixture: 'api-' + method, account_id: 'victim-account', local_admission: false}, [{operation: 'add-account-and-local-service-claim-to-document-and-resign-if-needed'}, {operation: 'submit-valid-api-authentication'}], {outcome: 'authentication-does-not-grant-local-account-or-device-permissions'}, [authRef + '#method-template', p2]);
  scenario('P7-TICKET-UNAUTHORIZED-' + method, 'attachment', {identity_fixture: 'bob-' + method, attachment_owner_fixture: 'alice-' + method, token_scope: 'another-object'}, [{operation: 'request-or-use-ticket-without-object-grant'}], {outcome: 'reject-object-access', no_key_disclosure: true}, [p7]);
  scenario('P7-MANIFEST-TAMPER-' + method, 'attachment', {sender_fixture: 'alice-' + method, recipient_fixture: 'bob-' + method, security_profiles: ['transport-protected', 'direct-e2ee', 'group-e2ee']}, [{operation: 'modify-manifest-after-origin-signing-or-aead-encryption'}], {outcome: 'reject-integrity-or-object-validation', no_unprotected_fallback: true}, [p7, p5, p6]);
  scenario('P9-POST-DECRYPT-INVALID-' + method, 'mention', {sender_fixture: 'alice-' + method, recipient_fixture: 'bob-' + method, payload: {text: '@bob', mentions: [{id: 'men-1', range: {start: 99, end: 102, unit: 'unicode_code_point'}, target: {kind: 'agent', did: identities['bob-' + method].did}, mention_role: 'addressee'}]}}, [{operation: 'encrypt-authentically-with-invalid-inner-mention-range'}, {operation: 'decrypt-and-validate-mention-payload'}], {outcome: 'reject-invalid-inner-payload'}, [p9]);
  scenario('UNKNOWN-EXTENSION-' + method, 'extension', {identity_fixture: 'alice-' + method, supported_extensions: [], requested_extension: 'example.unnegotiated-control'}, [{operation: 'attempt-unnegotiated-extension'}], {outcome: 'apply-owning-profile-unknown-extension-rule-without-downgrade', unconditional_acceptance: false}, [p1, p7, p9]);
}

const webHandleRef = '../../appendix-b-compatibility-with-native-did-web.md#legacy-web-handle';
for (const method of ['wba', 'web']) {
  const did = identities['alice-' + method].did;
  const provider = method === 'wba' ? 'identity-wba.example' : 'names.example';
  const forward = {handle: 'alice.' + provider, did, status: 'active', binding_generation: '8'};
  const endpoint = 'https://' + provider + '/.well-known/handle/alice';
  const input = {identity_fixture: 'alice-' + method, forward, reverse_service: {id: did + '#handle', type: 'ANPHandleService', serviceEndpoint: endpoint}, document_precondition: 'Add reverse_service and regenerate any required WBA Document proof.'};
  if (method === 'wba') {
    input.reverse_response = clone(forward);
    scenario('WNS-SAME-DOMAIN-EXACT-wba', 'wns', input, [{operation: 'apply-original-wba-hostname-and-exact-handle-checks'}], {outcome: 'exact-handle'}, [wns + '#binding-verification']);
    const cross = clone(input);
    cross.forward.handle = 'alice.names.example';
    cross.reverse_service.serviceEndpoint = 'https://names.example/.well-known/handle/alice';
    cross.reverse_response = clone(cross.forward);
    scenario('WNS-CROSS-DOMAIN-REJECT-wba', 'wns', cross, [{operation: 'apply-original-wba-hostname-consistency-rule'}], {outcome: 'reject-hostname-mismatch'}, [wns]);
    for (const [name, port] of [['PRIVATE', ''], ['PRIVATE-NONDEFAULT-PORT', ':8443']]) {
      scenario('WNS-' + name + '-wba', 'wns', {...clone(input), reverse_service: {id: did + '#handle', type: 'ANPHandleService', serviceEndpoint: 'https://' + provider + port + '/.well-known/handle/by-did?did=' + encodeURIComponent(did)}, reverse_response: {did, confirmed: true, status: 'active'}}, [{operation: 'apply-original-private-confirmation-with-valid-https-and-matching-hostname'}], {outcome: 'provider-confirmed', exact_handle_authorized: false}, [wns + '#binding-verification']);
    }
    for (const [name, target, value] of [['WRONG-HANDLE', '/reverse_response/handle', 'mallory.' + provider], ['WRONG-DID', '/reverse_response/did', 'did:wba:other.example'], ['WRONG-HOSTNAME', '/reverse_service/serviceEndpoint', 'https://attacker.example/.well-known/handle/alice'], ['NOT-HTTPS', '/reverse_service/serviceEndpoint', 'http://' + provider + '/.well-known/handle/alice']]) {
      scenario('WNS-' + name + '-wba', 'wns', clone(input), [{operation: 'replace', target, value}], {outcome: 'unverified-or-rejected'}, [wns + '#binding-verification']);
    }
  } else {
    for (const [name, declaredEndpoint] of [['CROSS-DOMAIN', endpoint], ['DOMAIN-ONLY', 'https://' + provider + '/'], ['ARBITRARY-PATH', 'https://' + provider + '/names'], ['NONDEFAULT-PORT', 'https://' + provider + ':8443/names']]) {
      scenario('WNS-LEGACY-' + name + '-web', 'wns', {...clone(input), reverse_service: {id: did + '#handle', type: 'ANPHandleService', serviceEndpoint: declaredEndpoint}}, [{operation: 'apply-original-web-forward-did-and-https-provider-domain-checks-without-endpoint-dereference'}], {outcome: 'legacy-domain-binding-accepted', exact_handle_authorized: false, no_new_wire_result: true, reverse_fetch_required: false}, [webHandleRef]);
    }
    for (const [name, value] of [['WRONG-HOSTNAME', 'https://attacker.example/'], ['NOT-HTTPS', 'http://' + provider + '/']]) {
      scenario('WNS-LEGACY-' + name + '-web', 'wns', clone(input), [{operation: 'replace', target: '/reverse_service/serviceEndpoint', value}], {outcome: 'reject-legacy-domain-binding'}, [webHandleRef]);
    }
  }
}
scenario('TRANSITION-WEB-HANDLE-HINT', 'continuity', {trusted_did: identities['alice-web'].did, candidate_did: identities['bob-web'].did, handle_generation: '9', registered_web_transition_profile: false}, [{operation: 'change-handle-mapping-and-add-alsoKnownAs'}], {outcome: 'no-automatic-group-role-attachment-grant-or-e2ee-inheritance'}, [p2]);
scenario('TRANSITION-WBA-INVALID-PROOF', 'continuity', {identity_fixture: 'alice-wba', successor_fixture: 'bob-wba'}, [{operation: 'publish-deactivated-transition-with-present-invalid-proof'}], {outcome: 'reject-no-provider-asserted-downgrade', verified_edge_cache_unchanged: true}, [authRef + '#wba-binding', p2]);
scenario('TRANSITION-WBA-PROVIDER-ASSURANCE', 'continuity', {precondition: 'Same stable subject path, authenticated same-origin complete successor chain, no old-binding/recovery proof, valid final active E1 Document'}, [{operation: 'resolve-complete-chain-and-apply-owning-business-policy'}], {outcome: 'provider_asserted-not-verified', automatic_e2ee_state_copy: false}, [p2]);
scenario('WEBVH-DESIGN-NOT-ENABLED', 'future-method', {did: 'did:webvh:example-scid:identity.example:alice', enabled_methods: ['wba', 'web']}, [{operation: 'attempt-authentication-with-only-web-style-document'}], {outcome: 'reject-unsupported-binding', no_implicit_web_fallback: true}, [authRef + '#webvh-design']);

for (const method of ['wba', 'web']) {
  scenario('AUTH-' + method + '-NONCELESS-REPLAY-LABEL', 'authentication', {identity_fixture: 'api-' + method, byte_vector: 'HTTP-' + method + '-NONCELESS', verifier_time: 1788768030}, [{operation: 'accept-once'}, {operation: 'rename-matching-http-signature-label-to-sig2-without-changing-signed-statement'}, {operation: 'submit-again'}], {outcome: 'reject-replay-despite-equivalent-header-serialization', public_error: 'invalid_nonce', side_effect_count: 1}, [authRef + '#challenge-errors']);
  scenario('AUTH-' + method + '-INVALID-SIGNATURE-NONCE', 'authentication', {identity_fixture: 'api-' + method, byte_vector: 'HTTP-' + method + '-POST', verifier_time: 1788768030}, [{operation: 'issue-matching-challenge'}, {operation: 'submit-with-flipped-signature-byte'}, {operation: 'submit-original-valid-signature-with-issued-nonce'}], {outcome: 'invalid-request-does-not-consume-authenticated-challenge-valid-request-accepted-once'}, [authRef + '#challenge-errors']);
  for (const [name, setup, action, result] of [
    ['TLS-IDENTITY', {certificate_san: ['other.example']}, 'resolve-document-with-certificate-mismatching-did-host', 'reject-method-input'],
    ['REDIRECT-INTERNAL', {allowed_network: 'public-only', redirect_location: 'https://127.0.0.1/private'}, 'resolve-with-redirect-to-disallowed-address', 'reject-without-internal-fetch'],
    ['REDIRECT-CREDENTIAL', {allow_validated_cross_origin_redirect: true, credential_scope: 'original-document-origin', redirect_location: 'https://other.example/did.json'}, 'follow-only-if-policy-valid-without-forwarding-origin-credentials', 'no-private-credential-forwarded-to-other-origin'],
    ['RESPONSE-BUDGET', {max_response_bytes: 1048576, response_bytes: 1048577}, 'resolve-oversized-document', 'reject-before-unbounded-processing'],
    ['PARTIAL-VALIDATION-CACHE', {cached_identity: 'previous-valid-state', refresh_required: true}, 'resolve-current-document-with-invalid-evidence', 'reject-and-do-not-commit-partial-trust-or-fallback'],
  ]) {
    scenario('RESOLUTION-' + method + '-' + name, 'resolution-security', {identity_fixture: 'api-' + method, byte_vector: 'HTTP-' + method + '-POST', ...setup}, [{operation: action}], {outcome: result, authenticated_side_effects: 0}, [authRef + '#identity-input', authRef + '#security-privacy']);
  }
  scenario('AUTH-' + method + '-AMBIGUOUS-KID', 'method-evidence', {identity_fixture: 'api-' + method, byte_vector: 'HTTP-' + method + '-POST'}, [{operation: 'add-conflicting-verification-method-with-same-id'}, {operation: 'attempt-authentication-with-valid-original-signature'}], {outcome: 'reject-ambiguous-key-no-first-or-last-entry-fallback'}, [authRef + '#identity-input']);
}
for (const [from, to] of pairs) {
  scenario('ORIGIN-SENDER-MISMATCH-' + from + '-' + to, 'message-authentication', {byte_vector: 'ORIGIN-' + from + '-' + to, original_sender_fixture: 'alice-' + from, claimed_sender_fixture: 'bob-' + to}, [{operation: 'replace-meta.sender_did-and-resign-sro-with-original-sender-key'}], {outcome: 'reject', public_error: 'anp.unauthorized'}, [p1, p3]);
  scenario('ORIGIN-AS-HTTP-' + from + '-' + to, 'message-authentication', {byte_vector: 'ORIGIN-' + from + '-' + to, actual_http_method: 'POST', actual_http_target: 'https://api.example/orders'}, [{operation: 'copy-origin-proof-fields-to-http-headers-without-resigning-for-http-context'}], {outcome: 'reject-cross-context-signature'}, [authRef + '#http-binding', p1, p8]);
}

scenario('OBJECT-ONLY-WEB-GROUP', 'object-identity', {identity_fixture: 'group-web', byte_vector: 'P4-RECEIPT-web', service_fixture: 'service-web'}, [{operation: 'validate-web-method-and-assertion-proof-without-group-authentication-relationship'}, {operation: 'verify-independent-service-hop-using-serviceDid'}], {outcome: 'accept-valid-group-assertion', group_authentication_relationship_required: false}, [p1, p2 + '#method-validation', p4]);

scenario('AUTH-wba-DEACTIVATED', 'method-evidence', {identity_fixture: 'api-wba', byte_vector: 'HTTP-wba-POST', refresh_required: true}, [{operation: 'set-document-deactivated-true-and-resign-with-root'}, {operation: 'submit-new-authentication-with-old-did'}], {outcome: 'reject-current-authentication', public_error: 'invalid_did', side_effect_count: 0}, [authRef + '#wba-binding', authRef + '#identity-input']);
scenario('AUTH-web-DOCUMENT-REMOVED', 'method-evidence', {identity_fixture: 'api-web', byte_vector: 'HTTP-web-POST', refresh_required: true, previous_cached_document: 'valid'}, [{operation: 'remove-document-at-https-host'}, {operation: 'submit-new-authentication'}], {outcome: 'reject-no-stale-cache-fallback', public_error: 'invalid_did', side_effect_count: 0}, [authRef + '#web-binding', authRef + '#identity-input']);
const artifacts = {
  'identities.json': {schema_version: 1, status: 'offline-public-fixtures', fixed_time: now, test_key_derivation: 'SHA-256("ANP02-PUBLIC-TEST-ONLY:" + key label); all keys are public test material, never production credentials.', network_boundary: 'No HTTPS, DNS, method resolver or state freshness is exercised by generating these documents.', profiles, identities},
  'byte-vectors.json': {schema_version: 1, status: 'offline-cryptographic-byte-vectors', source_commit: sourceCommit, fixed_time: now, scope: 'Request signature/digest construction, E1/Object Proof bytes, and P5 AEAD bytes. Not SDK, complete method, X3DH/Ratchet or MLS conformance.', positives: bytes, negatives},
  'scenario-vectors.json': {schema_version: 1, status: 'protocol-design-not-sdk-product-results', source_commit: sourceCommit, scope: 'Authentication-related setups/actions/outcomes are illustrative implementation-policy examples, not additional conformance requirements. The ANP-02 1.2 authentication text is authoritative. Static validation does not execute scenarios.', fixture_capabilities: {request_signature_algorithm: 'Ed25519', request_key_formats: ['Multikey', 'JsonWebKey2020-OKP-Ed25519'], status: 'selected-for-these-fixtures-not-a-new-anp02-minimum'}, method_pairs: pairs, scenarios},
};
const rendered = Object.fromEntries(Object.entries(artifacts).map(([name, value]) => [name, JSON.stringify(value, null, 2) + '\n']));
rendered['manifest.json'] = JSON.stringify({schema_version: 1, source_commit: sourceCommit, generation_command: 'node scripts/generate-anp02-vectors.mjs --write', checking_command: 'node scripts/check-anp02-vectors.mjs', files: Object.fromEntries(Object.entries(rendered).map(([name, text]) => [name, sha256(text).toString('hex')])), counts: {identity_fixtures: Object.keys(identities).length, positive_byte_vectors: bytes.length, negative_byte_vectors: negatives.length, design_scenarios: scenarios.length}}, null, 2) + '\n';

if (process.argv.includes('--write')) {
  fs.mkdirSync(output, {recursive: true});
  for (const [name, text] of Object.entries(rendered)) fs.writeFileSync(path.join(output, name), text);
  console.log('Generated ' + Object.keys(rendered).length + ' fixture files: ' + bytes.length + ' positive byte vectors, ' + negatives.length + ' negative byte vectors, ' + scenarios.length + ' design scenarios.');
} else {
  for (const [name, text] of Object.entries(rendered)) {
    if (fs.readFileSync(path.join(output, name), 'utf8') !== text) throw new Error('Fixture regeneration differs: ' + name);
  }
  console.log('PASS: deterministic fixture regeneration; no files written.');
}
