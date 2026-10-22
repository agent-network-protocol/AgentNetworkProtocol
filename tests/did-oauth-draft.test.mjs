// Copyright (c) 2026 ANP Open Source Community. Apache-2.0.
// Documentation checks only: these do not verify JWT signatures or OAuth runtime behavior.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {createPublicKey, createHash} from 'node:crypto';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {spawnSync} from 'node:child_process';
import test from 'node:test';
import {checkWhitePaperAuthorizationScope} from '../scripts/release-entrypoint-checks.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const enFile = '05-anp-did-authorization-protocol-specification.md';
const cnFile = 'chinese/05-ANP-基于DID的授权协议.md';
const read = file => fs.readFileSync(path.join(root, file), 'utf8');
const en = read(enFile);
const cn = read(cnFile);
const enValidationFile = 'docs/anp-05-validation-guide.md';
const cnValidationFile = 'docs/chinese/anp-05-validation-guide.md';
const enValidation = read(enValidationFile);
const cnValidation = read(cnValidationFile);
const profile = 'anp.authorization.oauth2.cimd.v1-draft1';
const vcProfile = 'anp.authorization.vc.v1-draft2';
const blocks = text => [...text.matchAll(/^```([^\n]*)\n([\s\S]*?)^```\s*$/gm)].map(match => ({language: match[1], text: match[2].trimEnd()}));
const anchors = text => [...text.matchAll(/<a id="([^"]+)"><\/a>/g)].map(match => match[1]);
const scenarios = text => [...text.matchAll(/^\| (AUTHZ-\d+) \|/gm)].map(match => match[1]);
const jsonBlocks = text => blocks(text).filter(block => block.language === 'json').map(block => JSON.parse(block.text));
const samples = text => {
  // Identify examples by their schema so adding an OAuth example cannot shift VC fixtures.
  const examples = jsonBlocks(text);
  const metadata = examples.find(value => value.authorization_endpoint && value.token_endpoint);
  const header = examples.find(value => value.alg && value.kid && !value.kty);
  const claims = examples.find(value => value.iss && value.iss === value.sub && value.jti);
  const token = examples.find(value => value.access_token);
  const resource = examples.find(value => value.authorization_servers);
  const did = examples.find(value => value.verificationMethod && value.authentication);
  const cimd = examples.find(value => value.client_id && value.token_endpoint_auth_method);
  const access = examples.find(value => value.client_id && value.sub && value.scope);
  return {metadata, header, claims, token, resource, did, cimd, access};
};

for (const [file, text] of [[enFile, en], [cnFile, cn]]) {
  test('authorization document is an unreleased independent draft: ' + file, () => {
    assert.match(text, /^- (?:Document ID: |文档编号：)ANP-05$/m);
    assert.match(text, /^- (?:Status: Draft \/ not released|状态：草案 \/ 未发布)$/m);
    assert.match(text, /^- (?:Version: |版本：)0\.7$/m);
    assert(text.includes(profile));
    assert(text.includes(vcProfile));
    assert.doesNotMatch(text, /^- (?:Status: Released|状态：已发布)/m);
    assert.match(text, /not part of the ANP 1\.2 release|不属于 ANP 1\.2 发布范围/);
    const profileHeader = text.split('\n').find(line => /^- (?:Draft Profile identifiers:|Profile 标识|草案 Profile)/.test(line));
    assert(profileHeader && profileHeader.includes(profile));
    assert.doesNotMatch(profileHeader, /anp\.authorization\.oauth2\.did\.v1-draft/);
  });
}

test('bilingual sections, explicit anchors and wire examples stay synchronized', () => {
  assert.equal(anchors(en).length, 27);
  assert.deepEqual(anchors(en), anchors(cn));
  assert.equal(new Set(anchors(en)).size, anchors(en).length);
  assert.equal(anchors(en).at(-1), 'future-extensions');
  assert(!anchors(en).includes('interoperability'));
  for (const id of ['anpcimd', 'anp-oauth-keys', 'anp-metadata-sha256', 'mechanism-selection', 'vc-authorization', 'vc-oauth-composition', 'vc-direct-presentation', 'vc-organization-agents']) assert(anchors(en).includes(id), id);
  const sections = text => [...text.matchAll(/^## (\d+)\./gm)].map(match => Number(match[1]));
  assert.deepEqual(sections(en), Array.from({length: 16}, (_, index) => index + 1));
  assert.deepEqual(sections(en), sections(cn));
  // Diagram labels are localized; every other code block must match byte for byte.
  const wire = text => blocks(text).filter(block => block.language !== 'mermaid');
  assert.deepEqual(wire(en), wire(cn));
  assert.deepEqual(jsonBlocks(en), jsonBlocks(cn));
  const diagramKinds = text => blocks(text).filter(block => block.language === 'mermaid').map(block => block.text.split('\n')[0]);
  assert.deepEqual(diagramKinds(en), ['flowchart TD', 'flowchart LR', 'flowchart TD', 'flowchart TD', 'sequenceDiagram', 'flowchart LR', 'flowchart TD', 'sequenceDiagram', 'flowchart TD', 'flowchart TD']);
  assert.deepEqual(diagramKinds(en), diagramKinds(cn));
  const flowcharts = text => blocks(text).filter(block => block.language === 'mermaid' && block.text.startsWith('flowchart')).map(block => block.text.replace(/"[^"]*"/g, '"label"'));
  assert.deepEqual(flowcharts(en), flowcharts(cn));
});

test('Mermaid diagrams avoid statement separators that break rendering', () => {
  // Mermaid treats an ASCII semicolon as a statement separator, which truncates message labels.
  for (const text of [en, cn]) {
    for (const block of blocks(text).filter(item => item.language === 'mermaid')) {
      assert.doesNotMatch(block.text, /;/, block.text.split('\n')[0]);
    }
  }
});

test('metadata reuses private_key_jwt and standard OAuth grant types', () => {
  const {metadata} = samples(en);
  assert.deepEqual(metadata.token_endpoint_auth_methods_supported, ['private_key_jwt']);
  assert.deepEqual(metadata.grant_types_supported, ['client_credentials', 'authorization_code', 'refresh_token']);
  assert.equal(metadata.client_id_metadata_document_supported, true);
  assert.deepEqual(metadata.anp_cimd_binding, {
    profile,
    did_methods_supported: ['did:web', 'did:wba'],
    client_enrollment_methods_supported: ['self_published', 'pre_registered'],
    redirect_uri_modes_supported: ['https', 'loopback'],
  });
  assert.deepEqual(metadata.code_challenge_methods_supported, ['S256']);
  assert.equal(metadata.authorization_response_iss_parameter_supported, true);
  assert(!Object.hasOwn(metadata, 'anp_did_oauth'));
  assert(metadata.token_endpoint_auth_signing_alg_values_supported.includes('RS256'));
  assert(metadata.token_endpoint_auth_signing_alg_values_supported.includes('Ed25519'));
  for (const field of ['issuer', 'authorization_endpoint', 'token_endpoint']) {
    assert.equal(new URL(metadata[field]).protocol, 'https:');
  }
});

test('illustrative assertion uses the CIMD URL, a JWKS key and bounded NumericDates', () => {
  const {metadata, header, claims, cimd} = samples(en);
  assert.equal(header.typ, 'JWT');
  assert.equal(header.alg, 'Ed25519');
  assert.equal(claims.iss, claims.sub);
  assert.equal(claims.sub, cimd.client_id);
  assert.equal(new URL(claims.sub).protocol, 'https:');
  assert(cimd.jwks.keys.some(key => key.kid === header.kid));
  assert.equal(claims.aud, metadata.issuer);
  assert.notEqual(claims.aud, metadata.token_endpoint);
  assert(Number.isInteger(claims.iat) && Number.isInteger(claims.exp));
  assert(claims.exp > claims.iat && claims.exp - claims.iat <= 300);
  assert.equal(Buffer.from(claims.jti, 'base64url').length, 16);
  for (const forbidden of ['jwk', 'jku', 'x5u', 'x5c']) assert(!Object.hasOwn(header, forbidden));
  assert(!Object.hasOwn(claims, 'scope'));
  assert(!Object.hasOwn(claims, 'authorization_details'));
});

test('token request uses the CIMD URL and the standard client-assertion transport', () => {
  const requests = blocks(en).filter(block => block.language === 'http' && block.text.startsWith('POST /token ') && block.text.includes('grant_type=client_credentials&'));
  assert.equal(requests.length, 1);
  const request = requests[0];
  const form = new URLSearchParams(request.text.split('\n\n')[1]);
  for (const field of ['grant_type', 'client_id', 'client_assertion_type', 'client_assertion', 'resource', 'scope']) {
    assert.equal(form.getAll(field).length, 1, field);
  }
  assert.equal(form.get('grant_type'), 'client_credentials');
  assert.equal(form.get('client_id'), samples(en).claims.sub);
  assert.equal(form.get('client_assertion_type'), 'urn:ietf:params:oauth:client-assertion-type:jwt-bearer');
  assert.equal(form.get('client_assertion'), 'SIGNED_CLIENT_ASSERTION');
  assert.equal(form.get('resource'), 'https://docs.example/api');
  assert.equal(form.get('scope'), 'documents.read');
  for (const field of ['assertion', 'client_secret', 'vp_token', 'agent_did']) assert(!form.has(field));
});

test('illustrative token response remains a standard non-cacheable OAuth response', () => {
  const {token} = samples(en);
  assert.deepEqual(Object.keys(token).sort(), ['access_token', 'expires_in', 'scope', 'token_type']);
  assert.equal(token.token_type, 'Bearer');
  assert.equal(token.access_token, 'OPAQUE_ACCESS_TOKEN');
  assert.equal(token.scope, 'documents.read');
  assert(Number.isInteger(token.expires_in) && token.expires_in > 0);
  const headers = blocks(en).find(block => block.language === 'http' && block.text.startsWith('HTTP/1.1 200'));
  assert(headers.text.includes('Cache-Control: no-store'));
  assert(headers.text.includes('Pragma: no-cache'));
  assert.doesNotMatch(headers.text, /Authentication-Info:/);
});

test('mirrors retain applicable security scenarios without reusing removed scenario IDs', () => {
  // Preserve established IDs; retired scenarios leave intentional gaps.
  const ids = [1, 2, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 20, 21, 22, 23, 26, 27, 29, 30, 31, 32, 33];
  ids.push(...Array.from({length: 10}, (_, index) => index + 41));
  ids.push(...Array.from({length: 5}, (_, index) => index + 53));
  ids.push(...Array.from({length: 17}, (_, index) => index + 59));
  ids.push(...Array.from({length: 8}, (_, index) => index + 76));
  const expected = ids.map(id => 'AUTHZ-' + String(id).padStart(2, '0'));
  assert.deepEqual(scenarios(enValidation), expected);
  assert.deepEqual(scenarios(cnValidation), expected);
  assert.match(en, /not executable cryptographic fixtures/);
  assert.match(cn, /不是可执行的?密码学测试向量/);
  assert.match(enValidation, /not a claim that an implementation has passed/);
  assert.match(cnValidation, /不是宣称某个实现已经通过/);
  assert.doesNotMatch(en, /^\| AUTHZ-\d+/m);
  assert.doesNotMatch(cn, /^\| AUTHZ-\d+/m);
  assert(en.includes('(' + enValidationFile + ')'));
  assert(cn.includes('(../' + cnValidationFile + ')'));
  assert(enValidation.includes('(../' + enFile + '#conformance)'));
  assert(cnValidation.includes('(../../' + cnFile + '#conformance)'));
  for (const guide of [enValidation, cnValidation]) {
    assert(guide.includes('v0.7'));
    assert(guide.includes(profile));
    assert(guide.includes(vcProfile));
  }
});

test('identity references use the current ANP-02 bindings', () => {
  assert(en.includes('(02-anp-did-authentication-protocol-specification.md#identity-input)'));
  assert(cn.includes('(02-ANP-基于DID的身份认证协议.md#identity-input)'));
  assert(en.includes('(03-did-wba-method-design-specification.md#wba-auth-binding)'));
  assert(cn.includes('(03-did-wba方法规范.md#wba-auth-binding)'));
  assert(en.includes('**not** its HTTP signature serialization'));
  assert(cn.includes('**不复用**其 HTTP 签名序列化'));
});

test('root and vNext indexes expose the current CIMD draft scope', () => {
  assert(read('README.md').includes('(' + enFile + ')'));
  assert(read('README.cn.md').includes('(' + cnFile + ')'));
  assert(read('vnext/README.md').includes('(../' + enFile + ')'));
  assert(read('vnext/chinese/README.md').includes('(../../' + cnFile + ')'));
  assert.match(read('README.md'), /^\| Authorization \| \[ANP-05:[^\n]+\| Draft \/ not released; v0\.7 \|/m);
  assert.match(read('README.cn.md'), /^\| 授权 \| \[ANP-05：[^\n]+\| 草案 \/ 未发布；v0\.7 \|/m);
  for (const file of ['README.md', 'README.cn.md', 'vnext/README.md', 'vnext/chinese/README.md']) {
    const draftLines = read(file).split('\n').filter(line => /ANP-05/.test(line));
    assert.doesNotMatch(draftLines.join('\n'), /MCP|A2A|mapped|projection|投影|映射/i);
  }
  for (const file of ['vnext/README.md', 'vnext/chinese/README.md']) {
    assert.match(read(file), /v0\.7/);
    assert.doesNotMatch(read(file), /v0\.(?:2|3|4|5|6)/);
  }
});

test('release checker validates authorization and white paper drafts without redundant snapshots', () => {
  const result = spawnSync(process.execPath, ['scripts/check-release-docs.mjs'], {
    cwd: root, encoding: 'utf8', timeout: 15000, maxBuffer: 2 * 1024 * 1024,
  });
  assert.ifError(result.error);
  assert.equal(result.status, 0, result.stdout + result.stderr);
  const report = JSON.parse(result.stdout);
  assert.equal(report.result, 'PASS');
  assert.equal(report.vnext_drafts_checked, 2);
  assert.equal(report.authorization_drafts_checked, 2);
  assert.equal(report.white_paper_drafts_checked, 2);
  assert.equal(report.authorization_validation_guides_checked, 2);
  assert.deepEqual(fs.readdirSync(path.join(root, 'vnext')).sort(), ['01-agentnetworkprotocol-technical-white-paper.md', 'README.md', 'chinese']);
  assert.deepEqual(fs.readdirSync(path.join(root, 'vnext/chinese')).sort(), ['01-AgentNetworkProtocol技术白皮书.md', 'README.md']);
  assert.equal(report.sdk_or_product_tests_run, false);
  assert.deepEqual(report.errors, []);
});

test('vNext white paper authorization overviews match the current ANP-05 scope', () => {
  for (const file of ['vnext/01-agentnetworkprotocol-technical-white-paper.md', 'vnext/chinese/01-AgentNetworkProtocol技术白皮书.md']) {
    assert.deepEqual(checkWhitePaperAuthorizationScope({file}, read(file)), []);
  }
});

test('white paper scope check rejects current exchange claims and permits future research', () => {
  const file = 'vnext/chinese/01-AgentNetworkProtocol技术白皮书.md';
  const text = read(file);
  const heading = text.match(/^### 8\.3[^\n]*$/m)[0];
  const insert = sentence => text.replace(heading, heading + '\n\n' + sentence);
  const current = insert('两者也可以组合：智能体把 VC 交给资源方的授权服务器，换发普通的访问令牌。');
  assert(checkWhitePaperAuthorizationScope({file}, current).some(error => error.reason === 'white-paper-claims-current-vc-token-exchange'));
  const future = insert('未来扩展可以研究将 VC 换发为 OAuth 访问令牌。');
  assert.deepEqual(checkWhitePaperAuthorizationScope({file}, future), []);
  const missing = text.replace('首版不定义 VC/VP 换取 OAuth 访问令牌', '首版支持 VC/VP 换取 OAuth 访问令牌');
  assert(checkWhitePaperAuthorizationScope({file}, missing).some(error => error.reason === 'white-paper-v1-vc-exchange-boundary-missing'));
  const english = '### 8.3 Authorization\nANP-05 v1 defines two independent authorization paths. V1 does not define conversion from VC/VP to OAuth access tokens. Future extensions may evaluate VC-to-token exchange.\n';
  assert.deepEqual(checkWhitePaperAuthorizationScope({file: 'english'}, english), []);
  assert(checkWhitePaperAuthorizationScope({file: 'english'}, english + 'An Agent exchanges a VC for an OAuth access token.\n').some(error => error.reason === 'white-paper-claims-current-vc-token-exchange'));
});

test('resource metadata and challenge bind to the illustrated RS and AS', () => {
  const {metadata, resource} = samples(en);
  assert.equal(resource.resource, 'https://docs.example/api');
  assert.deepEqual(resource.authorization_servers, [metadata.issuer]);
  assert.deepEqual(resource.bearer_methods_supported, ['header']);
  assert.deepEqual(resource.scopes_supported, ['documents.read']);
  const challenge = blocks(en).find(block => block.text.startsWith('HTTP/1.1 401'));
  assert(challenge);
  assert(challenge.text.includes('resource_metadata="https://docs.example/.well-known/oauth-protected-resource/api"'));
  assert(!challenge.text.includes('access_token='));
});

test('DID service links to the exact CIMD client identifier without redefining OAuth metadata', () => {
  const {metadata, did, cimd, claims} = samples(en);
  assert(metadata.anp_cimd_binding.client_enrollment_methods_supported.includes('self_published'));
  assert.equal(cimd.anp_did, did.id);
  assert.notEqual(cimd.client_id, did.id);
  assert.equal(cimd.client_id, claims.sub);
  const services = did.service.filter(item => item.type === 'ANPCIMD');
  assert.equal(services.length, 1);
  assert.equal(services[0].id, did.id + '#oauth-client');
  const url = new URL(services[0].serviceEndpoint);
  assert.equal(url.protocol, 'https:');
  assert.equal(url.hash + url.search + url.username + url.password, '');
  assert.notEqual(url.pathname, '/');
  assert.equal(cimd.client_id, services[0].serviceEndpoint);
  assert(services[0].anp_oauth_keys.length > 0);
  for (const id of services[0].anp_oauth_keys) assert(did.authentication.includes(id));
  assert(cimd.jwks.keys.length > 0);
  for (const field of ['anp_profile', 'anp_application_type', 'jwks_uri', 'client_secret', 'client_secret_expires_at', 'anp_cimd_uri']) {
    assert(!Object.hasOwn(cimd, field), field);
  }
});

// This decodes the public document sample; it is not a DID-method validator.
function decodeBase58btc(value) {
  assert.equal(value[0], 'z');
  const alphabet = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz';
  let number = 0n;
  for (const char of value.slice(1)) {
    const digit = alphabet.indexOf(char);
    assert(digit >= 0, 'Invalid base58 character');
    number = number * 58n + BigInt(digit);
  }
  let hex = number.toString(16);
  if (hex.length % 2) hex = '0' + hex;
  const leading = value.slice(1).match(/^1*/)[0].length;
  return Buffer.concat([Buffer.alloc(leading), number ? Buffer.from(hex, 'hex') : Buffer.alloc(0)]);
}

test('WBA publication binds its DID fingerprint to the authorized public Multikey', () => {
  const {did, header, cimd} = samples(en);
  assert.equal(did.verificationMethod.length, 1);
  const method = did.verificationMethod[0];
  assert.equal(method.id, header.kid);
  assert.equal(method.controller, did.id);
  assert.deepEqual(did.authentication, [method.id]);
  assert.equal(method.type, 'Multikey');
  assert(!Object.hasOwn(method, 'publicKeyJwk'));
  const bytes = decodeBase58btc(method.publicKeyMultibase);
  assert.equal(bytes.length, 34);
  assert.deepEqual(bytes.subarray(0, 2), Buffer.from([0xed, 0x01]));
  const key = {kty: 'OKP', crv: 'Ed25519', x: bytes.subarray(2).toString('base64url')};
  const oauthKey = cimd.jwks.keys.find(value => value.kid === header.kid);
  assert(oauthKey, 'The asserted key must be published in the CIMD JWKS');
  assert.deepEqual({kty: oauthKey.kty, crv: oauthKey.crv, x: oauthKey.x}, key);
  assert(did.service[0].anp_oauth_keys.includes(method.id));
  assert(!Object.hasOwn(oauthKey, 'd'));
  assert.equal(key.x, 'VEpJi1nTD8okbTyhNIyr-NlO4dH7if8D8FOccCQyxQQ');
  const fingerprint = createHash('sha256').update(JSON.stringify({crv: key.crv, kty: key.kty, x: key.x})).digest('base64url');
  assert.equal(did.id, 'did:wba:agents.example:agent-a:e1_' + fingerprint);
  assert.deepEqual(did['@context'].slice(0, 3), ['https://www.w3.org/ns/did/v1', 'https://w3id.org/security/data-integrity/v2', 'https://w3id.org/security/multikey/v1']);
  const context = did['@context'][3];
  assert(context && typeof context === 'object');
  for (const term of ['ANPCIMD', 'anp_oauth_keys', 'anp_metadata_sha256']) assert(Object.hasOwn(context, term));
  assert.deepEqual(did.assertionMethod, [method.id]);
  assert.equal(did.proof.type, 'DataIntegrityProof');
  assert.equal(did.proof.cryptosuite, 'eddsa-jcs-2022');
  assert.equal(did.proof.verificationMethod, method.id);
  assert.equal(did.proof.proofPurpose, 'assertionMethod');
  assert.equal(did.proof.proofValue, 'zDOCUMENT_PROOF_PLACEHOLDER');
  assert.equal(createPublicKey({key, format: 'jwk'}).asymmetricKeyType, 'ed25519');
  assert(!JSON.stringify(did).includes('privateKey'));
});

test('illustrative DID identities use did:wba in both languages and form bodies', () => {
  for (const text of [en, cn]) {
    assert.doesNotMatch(text, /did:web:[a-z0-9]|did%3Aweb%3A/i);
    for (const block of jsonBlocks(text)) {
      const walk = value => {
        if (typeof value === 'string' && value.startsWith('did:wba:')) {
          assert.match(value, /^did:wba:[a-z0-9.-]+:(?:agent-a|local-a|hr-agent|sales-agent|issuer):e1_[A-Za-z0-9_-]{43}(?:#[A-Za-z0-9-]+)?$/);
        } else if (value && typeof value === 'object') {
          for (const entry of Object.values(value)) walk(entry);
        }
      };
      walk(block);
    }
  }
});

test('CIMD grant and callback metadata are internally consistent', () => {
  const {cimd} = samples(en);
  assert.equal(cimd.token_endpoint_auth_method, 'private_key_jwt');
  assert.deepEqual(cimd.response_types, ['code']);
  assert(cimd.grant_types.includes('authorization_code'));
  assert(cimd.grant_types.includes('refresh_token'));
  assert(cimd.redirect_uris.length > 0);
  for (const uri of cimd.redirect_uris) assert.equal(new URL(uri).protocol, 'https:');
  for (const forbidden of ['implicit', 'password']) assert(!cimd.grant_types.includes(forbidden));
});

// Scope validation concerns document structure, not OAuth runtime behavior.
function scopeErrors(text) {
  const errors = [];
  const start = text.indexOf('<a id="future-extensions"></a>');
  const end = text.search(/^## (?:Copyright Notice|版权声明)$/m);
  if (start < 0 || end < start) return ['missing-final-future-section'];
  const before = text.slice(0, start);
  const future = text.slice(start, end);
  if (!before.includes(profile) || !before.includes('client_id_metadata_document_supported') || !before.includes('ANPCIMD')) errors.push('current-cimd-contract-missing');
  if (/\b(?:MCP|A2A|Microsoft|Entra|VIRA|OBO)\b|modelcontextprotocol|a2a-protocol|learn\.microsoft/i.test(text)) errors.push('ecosystem-composition-remains');
  for (const value of jsonBlocks(before)) {
    if (typeof value.client_id === 'string' && !value.client_id.startsWith('https://')) errors.push('non-url-client-id-example');
    if (/anp_did_oauth|client_id_modes_supported|ANPOAuthClientMetadata|anp\.authorization\.oauth2\.did\.v1-draft/.test(JSON.stringify(value))) errors.push('legacy-did-client-contract-remains');
  }
  const body = future.replace(/^<a[^\n]*\n/m, '').replace(/^##[^\n]*\n/m, '').split(/^### 16\.1[^\n]*$/m)[0].trim();
  if (/```/m.test(body)) errors.push('future-did-wire-contract-remains');
  if (!/DID/.test(body) || !/future|未来/i.test(body)) errors.push('future-did-client-scope-not-explicit');
  return errors;
}

test('CIMD is the current contract and the retired DID client-ID contract is absent', () => {
  for (const text of [en, cn]) assert.deepEqual(scopeErrors(text), []);
});

test('scope guard rejects obsolete client identity and unrelated ecosystem contracts', () => {
  for (const text of [en, cn]) {
    const mutations = [
      [text.replaceAll(profile, 'REMOVED_PROFILE'), 'current-cimd-contract-missing'],
      [text + '\nMCP composition\n', 'ecosystem-composition-remains'],
      [text + '\nA2A composition\n', 'ecosystem-composition-remains'],
      [text + '\nMicrosoft Entra adapter\n', 'ecosystem-composition-remains'],
      ['```json\n{"anp_did_oauth":{}}\n```\n' + text, 'legacy-did-client-contract-remains'],
      ['```json\n{"client_id_modes_supported":["did"]}\n```\n' + text, 'legacy-did-client-contract-remains'],
      ['```json\n{"client_id":"did:example:agent"}\n```\n' + text, 'non-url-client-id-example'],
      [text.replace(/(## 16\.[^\n]*\n)/, '$1\n```json\n{}\n```\n'), 'future-did-wire-contract-remains'],
    ];
    for (const [changed, expected] of mutations) {
      assert.notEqual(changed, text);
      assert(scopeErrors(changed).includes(expected), expected);
    }
  }
});

// These guards check the documented CIMD contract, not a runtime implementation.
const bindingGuards = [
  ['ordinary CIMD processing has no ANP resolver requirement',
    /The AS need not resolve DIDs, understand ANP extensions or check DID-pinned digests/,
    /AS 无需解析 DID、理解 ANP 扩展或检查 DID 内固定的摘要/],
  ['exact URL client identity equality',
    /The request `client_id`, CIMD `client_id`, and client assertion `iss` and `sub` MUST be the same exact CIMD URL/,
    /请求 `client_id`、CIMD `client_id` 和客户端断言 `iss`、`sub` 必须（MUST）是完全相同的 CIMD URL/],
  ['first-contact admission is an AS policy choice',
    /A CIMD AS MAY admit previously unknown Client Identifier URLs, or restrict admission to approved\/pre-registered clients/,
    /CIMD AS 可以（MAY）接纳此前未知的客户端标识 URL，也可以将准入限制为已批准\/预注册客户端/],
  ['admission does not grant resource access',
    /Admission does not grant resource access/,
    /准入不授予资源访问权限/],
  ['unchanged approved security snapshot at code redemption',
    /a changed binding or security-relevant metadata invalidates the pending transaction rather than replacing its values/,
    /绑定或安全相关元数据变化时，未完成事务失效，而不是替换其中的值/],
  ['authorization-response issuer strategy is fixed before the flow',
    /The client MUST pin that strategy beforehand; it MUST NOT fall back after an issuer-check failure/,
    /客户端必须（MUST）事先固定该策略，不得（MUST NOT）在 issuer 检查失败后回退/],
  ['resource binding remains mandatory without imposing RFC 8707 on every AS',
    /An ordinary CIMD connection MAY use the AS's existing, explicitly configured target-binding mechanism instead[\s\S]{0,300}Absence of RFC 8707 is not permission to mint an unrestricted token/,
    /普通 CIMD 连接可以（MAY）使用 AS 既有且明确配置的目标绑定机制[\s\S]{0,160}不支持 RFC 8707 不是签发不受限令牌的理由/],
  ['no resource-token passthrough',
    /A token issued for Agent A MUST NOT be forwarded to service B as B's resource credential/,
    /签发给 Agent A 的令牌不得（MUST NOT）作为服务 B 的资源凭据直接转发给 B/],
  ['a required DID binding cannot fall back after rejection',
    /failure of its checks MUST abort the operation; it MUST NOT trigger an automatic retry in `cimd` mode/,
    /其检查失败，必须（MUST）终止操作，不得（MUST NOT）自动切换为 `cimd` 模式重试/],
  ['atomic assertion replay enforcement',
    /atomically reserve `\(AS issuer, client_id, jti\)` until `exp \+ allowed skew`/,
    /原子占用 `\(AS issuer, client_id, jti\)`，保留至 `exp \+ allowed skew`/],
  ['key revocation does not implicitly revoke issued access tokens',
    /DID or JWKS key revocation does not itself revoke an AS-issued access token/,
    /DID 或 JWKS 密钥撤销[\s\S]{0,60}AS[\s\S]{0,30}访问令牌/],
  ['advertising DID binding commits the AS to enforcement for all covered transactions',
    /commits the AS to enforce `did_bound` for every CIMD client transaction[\s\S]{0,400}a request cannot opt out into ordinary processing/,
    /对其已声明授权端点与令牌端点接受的每个 CIMD 客户端事务，强制执行 `did_bound`[\s\S]{0,160}请求不能选择退出并改走普通处理/],
  ['actual key authorization cannot be satisfied by another key in the JWKS',
    /actual key used for this client's authentication[\s\S]{0,400}Finding one matching key elsewhere in a JWKS is insufficient/,
    /实际用于该客户端认证的密钥[\s\S]{0,300}仅在 JWKS 的其他位置找到一把匹配密钥不够/],
  ['reverse discovery is a hint and never overrides a trusted binding',
    /A conflicting reverse DID MUST NOT override an existing accepted binding/,
    /冲突的反向 DID 不得（MUST NOT）覆盖已有的已接受绑定/],
  ['a CIMD digest does not authenticate external JWKS bytes',
    /only the URL string of `jwks_uri`; it does not protect the separately fetched JWKS bytes/,
    /对 `jwks_uri` 只覆盖 URL 字符串，不保护独立获取的 JWKS 字节/],
  ['metadata binding alone does not prove private-key possession',
    /DID\/URL declarations and matching public keys are public configuration that can be copied[\s\S]{0,180}proof of private-key possession/,
    /DID\/URL 声明及匹配公钥均为可复制的公开配置[\s\S]{0,100}私钥持有证明/],
  ['revocation is checked before each operation',
    /Before each operation, the RS MUST check that the applicable authorization is still valid under the deployment's expiry\/revocation policy/,
    /每次操作[\s\S]{0,30}RS 必须（MUST）[\s\S]{0,140}撤销[\s\S]{0,100}有效/],
  ['enhanced assertion validation requires bounded integer time claims',
    /Enhanced verifiers MUST require every claim in the table[\s\S]{0,500}`0 < exp - iat <= 300`[\s\S]{0,400}`nbf <= exp` and `nbf <= now \+ skew`/,
    /增强验证方必须（MUST）要求表中每个声明均存在[\s\S]{0,200}`0 < exp - iat <= 300`[\s\S]{0,250}`nbf <= exp` 和 `nbf <= now \+ skew`/],
  ['CIMD production fetches cannot use the general private-network exception',
    /CIMD draft-02 Section 8\.6 overrides the general controlled-deployment exception: the AS MUST NOT fetch special-use IP destinations in production[\s\S]{0,250}the same loopback interface/,
    /CIMD draft-02 第 8\.6 节优先于一般的受控部署例外：AS 在生产环境不得（MUST NOT）获取特殊用途 IP 目标[\s\S]{0,160}同一个 loopback 接口/],
  ['enhanced binding caches expire and failed revalidation cannot weaken processing',
    /In `did_bound` mode, DID resolution, CIMD and authentication-key freshness MUST be bounded to no more than 300 seconds[\s\S]{0,200}Revalidation failure must not cause indefinite stale-key use or a fallback to ordinary CIMD/,
    /`did_bound` 模式下，DID 解析、CIMD 及认证密钥的新鲜度必须（MUST）限制在不超过 300 秒[\s\S]{0,120}重新验证失败不得导致无限沿用旧密钥或回退到普通 CIMD/],
  ['cache eviction cannot clear a prior suspension or revocation decision',
    /A cache miss MUST NOT erase a suspension or revocation policy/,
    /缓存未命中不得（MUST NOT）抹除停用或撤销策略/],
];
for (const [name, enPattern, cnPattern] of bindingGuards) {
  test('CIMD binding requirement and deletion regression: ' + name, () => {
    for (const [text, pattern] of [[en, enPattern], [cn, cnPattern]]) {
      assert.match(text, pattern);
      const changed = text.replace(pattern, 'REMOVED_BINDING_REQUIREMENT');
      assert.notEqual(changed, text);
      assert.throws(() => assert.match(changed, pattern), assert.AssertionError);
    }
  });
}


// Additional checks below validate this document's examples and stated boundaries.
// They do not replace resolver, authorization-server, browser or signature tests.
const hash = bytes => createHash('sha256').update(bytes).digest('hex');
const rawJsonExamples = text => [...text.matchAll(/^\x60{3}json\n([\s\S]*?)^\x60{3}/gm)].map(match => match[1]);

test('metadata digest matches exact serialized bytes including final newline in both languages', () => {
  for (const text of [en, cn]) {
    const raw = rawJsonExamples(text);
    const {did, cimd} = samples(text);
    const bytes = raw.find(value => JSON.parse(value).token_endpoint_auth_method === 'private_key_jwt');
    assert(bytes && bytes.endsWith('\n'));
    assert.deepEqual(JSON.parse(bytes), cimd);
    const digest = did.service[0].anp_metadata_sha256;
    assert.match(digest, /^[0-9a-f]{64}$/);
    assert.equal(hash(Buffer.from(bytes, 'utf8')), digest);
    assert.notEqual(hash(Buffer.from(bytes.trimEnd(), 'utf8')), digest);
  }
});

test('metadata example integrity detects changed presentation, permissions and callbacks', () => {
  const raw = rawJsonExamples(en).find(value => JSON.parse(value).token_endpoint_auth_method === 'private_key_jwt');
  const expected = samples(en).did.service[0].anp_metadata_sha256;
  const variants = [
    raw.replace('Example Agent A', 'Different Agent'),
    raw.replace('documents.read', 'documents.write'),
    raw.replace('/agent-a/callback', '/agent-a/other-callback'),
    raw.replace('VEpJi1nTD8okbTyhNIyr-NlO4dH7if8D8FOccCQyxQQ', 'AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA'),
    JSON.stringify(JSON.parse(raw)),
    raw + '\n',
  ];
  for (const variant of variants) {
    assert.notEqual(variant, raw);
    assert.notEqual(hash(Buffer.from(variant, 'utf8')), expected);
  }
});

test('user-delegated access-token example uses existing client_id and a separate user sub', () => {
  const {metadata, cimd, resource, access} = samples(en);
  assert.equal(access.iss, metadata.issuer);
  assert.equal(access.client_id, cimd.client_id);
  assert.equal(access.aud, resource.resource);
  assert.notEqual(access.sub, access.client_id);
  assert.equal(access.scope, 'documents.read');
  for (const field of ['iss', 'sub', 'aud', 'client_id', 'iat', 'exp', 'jti']) assert(Object.hasOwn(access, field));
  assert(access.exp > access.iat);
  assert(!Object.hasOwn(access, 'agent_did'));
});

test('local code-redemption example repeats the actual loopback port and its distinct CIMD URL', () => {
  const request = blocks(en).find(block => block.language === 'http' && block.text.includes('grant_type=authorization_code&'));
  assert(request);
  const form = new URLSearchParams(request.text.split('\n\n')[1]);
  assert.equal(new URL(form.get('client_id')).protocol, 'https:');
  assert(new URL(form.get('client_id')).pathname.includes('/local-a/'));
  assert.notEqual(form.get('client_id'), samples(en).cimd.client_id);
  assert.equal(form.get('redirect_uri'), 'http://127.0.0.1:49152/callback');
  assert.equal(form.get('resource'), samples(en).resource.resource);
  assert.equal(form.get('code'), 'ONE_TIME_LOCAL_CODE');
  assert.equal(form.get('client_assertion'), 'FRESH_LOCAL_CLIENT_ASSERTION');
  assert.equal(form.get('client_assertion_type'), 'urn:ietf:params:oauth:client-assertion-type:jwt-bearer');
  assert(form.has('code_verifier'));
  for (const key of form.keys()) assert.equal(form.getAll(key).length, 1);
  assert(en.includes('http://127.0.0.1:49153/callback — reject'));
  assert(cn.includes('http://127.0.0.1:49153/callback — 拒绝'));
});

test('source references retain published baseline and distinguish future-design inputs', () => {
  for (const text of [en, cn]) {
    for (const target of ['rfc7523.html', 'rfc8252.html#section-7.3', 'rfc6234.html', 'rfc9068.html', 'rfc7662.html', 'rfc7591.html', 'rfc7638.html', 'draft-ietf-oauth-client-id-metadata-document-02', 'openid-connect-core-1_0.html#ClientAuthentication']) assert(text.includes(target), target);
    assert(text.includes('draft-ietf-oauth-rfc7523bis-11'));
    assert(text.includes('rfc9396.html') && text.includes('rfc8693.html') && text.includes('rfc8628.html'));
  }
});

const reviewScopeGuards = [
  ['v1 is basic user delegation, not completed full delegation',
    /first release \(v1\) is a DID–OAuth client identity and basic delegated-access Profile/,
    /第一版（v1）是 DID–OAuth 客户端身份与基础委托访问 Profile/],
  ['all four agent-authorization questions are defined',
    /Human-to-Agent delegation[\s\S]*One Agent serving a user across multiple services[\s\S]*Multi-level redelegation[\s\S]*Per-operation approval/,
    /人把权限委托给智能体[\s\S]*同一智能体代表用户访问多个服务[\s\S]*多级转委托[\s\S]*高风险操作逐笔批准/],
  ['standard AS compatibility is conditional on its supported features and policy',
    /Compatibility is conditional on the AS's admission policy, supported authentication algorithms and selected flow/,
    /兼容性取决于 AS 的准入策略、支持的认证算法和所选流程/],
  ['metadata digest must be checked before its fields are used',
    /Before an enhanced AS uses the metadata for a callback or authorization decision[\s\S]{0,300}verify the pinned digest/,
    /增强 AS 在将元数据用于回调或授权决定前[\s\S]{0,180}验证固定摘要/],
  ['metadata integrity does not remove DID-host and rollback assumptions',
    /for did:web, control of the DID-document host can still replace its keys and digest[\s\S]{0,160}Neither mode gains rollback resistance/,
    /对 did:web，控制 DID 文档托管方仍可替换密钥与摘要[\s\S]{0,100}抗回滚能力/],
  ['loopback port exception cannot change the redemption URI',
    /Redemption MUST repeat that exact value; the port exception applies only to metadata-to-authorization-request matching/,
    /兑换时必须（MUST）重复该精确值；端口例外只适用于元数据与授权请求之间的匹配/],
  ['loopback redirects do not relax SSRF protection',
    /This HTTP exception never authorizes the AS to fetch a callback/,
    /此 HTTP 例外不授权 AS 获取回调/],
  ['routine key rotation preserves a client only while DID and URL remain unchanged',
    /Rotating a runtime key while keeping the DID and CIMD URL unchanged does not create a new OAuth client/,
    /保留 DID 和 CIMD URL 不变，仅轮换运行期密钥，不会产生新的 OAuth 客户端/],
  ['algorithm interoperability does not assume Ed25519 support at ordinary servers',
    /RFC 7523 specifies RS256 as mandatory to implement for conforming implementations[\s\S]{0,200}imply that a CIMD AS supports Ed25519/,
    /RFC 7523 将 RS256 列为符合其规范的实现必须支持的算法[\s\S]{0,100}不表示 CIMD AS 支持 Ed25519/],
  ['legacy EdDSA is a configured compatibility option, not mandatory for all',
    /The earlier `EdDSA` identifier is an explicitly enabled compatibility choice restricted to Ed25519 keys/,
    /旧 `EdDSA` 标识是需明确启用、仅限 Ed25519 密钥的兼容选项/],
  ['client-dependent policy rejects missing trusted identity rather than trusting a caller claim',
    /An RS whose policy depends on client identity MUST obtain that identity through a trusted token\/introspection context[\s\S]{0,240}rather than trust a caller-supplied field/,
    /策略依赖客户端身份的 RS 必须（MUST）从可信令牌\/introspection 上下文[\s\S]{0,160}不能相信调用方提供的字段/],
  ['multiple resources require isolated authorizations rather than universal rights',
    /One target per token is an isolation rule, not one service per Agent/,
    /每个令牌只对应一个目标，是隔离规则，不是限制一个 Agent 只能访问一个服务/],
  ['high-risk approval remains independently enforced',
    /the RS MUST verify approval of the actual operation[\s\S]*or reject the operation/,
    /RS 必须（MUST）在执行前验证实际操作的批准[\s\S]*否则拒绝/],
  ['draft and experimental reviews are separate from the stable release gate',
    /This gate does not block publishing or reviewing a draft/,
    /该门槛不阻止发布或评审草案/],
];
for (const [name, enPattern, cnPattern] of reviewScopeGuards) {
  test('review scope and deletion regression: ' + name, () => {
    for (const [text, pattern] of [[en, enPattern], [cn, cnPattern]]) {
      assert.match(text, pattern);
      const changed = text.replace(pattern, 'REMOVED_REVIEW_SCOPE');
      assert.notEqual(changed, text);
      assert.throws(() => assert.match(changed, pattern), assert.AssertionError);
    }
  });
}

// VC Profile examples: structural consistency only, not credential or signature verification.
const vcSamples = text => {
  const examples = jsonBlocks(text);
  const presentationRequest = examples.find(value => value.type === 'ANPPresentationRequest');
  const presentation = examples.find(value => Array.isArray(value.type) && value.type.includes('VerifiablePresentation'));
  const roleCredential = examples.find(value => Array.isArray(value.type) && value.type.includes('ANPAgentRoleCredential'));
  return {presentationRequest, presentation, roleCredential};
};
const oneTimeValue = value => Buffer.from(value, 'base64url').length === 16 && /^[A-Za-z0-9_-]{22}$/.test(value);

test('VC delegation credential example follows the Section 11.2 shape', () => {
  const {presentation} = vcSamples(en);
  assert.equal(presentation.verifiableCredential.length, 1);
  const credential = presentation.verifiableCredential[0];
  assert.deepEqual(credential['@context'], ['https://www.w3.org/ns/credentials/v2', 'https://agent-network-protocol.com/contexts/authorization/v1']);
  assert.deepEqual(credential.type, ['VerifiableCredential', 'ANPAgentDelegationCredential']);
  assert.match(credential.id, /^urn:uuid:[0-9a-f-]{36}$/);
  assert.match(credential.issuer, /^did:/);
  assert.notEqual(credential.issuer, credential.credentialSubject.id);
  assert(Date.parse(credential.validUntil) > Date.parse(credential.validFrom));
  const [permission] = credential.credentialSubject.permissions;
  assert.equal(new URL(permission.resource).protocol, 'https:');
  assert.equal(new URL(permission.resource).hash, '');
  assert(permission.actions.length > 0);
  assert.match(permission.constraints.perOperationLimit.value, /^\d+\.\d{2}$/);
  assert.match(permission.constraints.perOperationLimit.currency, /^[A-Z]{3}$/);
  assert.equal(credential.credentialStatus.type, 'BitstringStatusListEntry');
  assert.equal(credential.credentialStatus.statusPurpose, 'revocation');
  assert.equal(typeof credential.credentialStatus.statusListIndex, 'string');
  assert(credential.credentialStatus.id.startsWith(credential.credentialStatus.statusListCredential + '#'));
  assert.equal(credential.proof.type, 'DataIntegrityProof');
  assert.equal(credential.proof.cryptosuite, 'eddsa-jcs-2022');
  assert.equal(credential.proof.proofPurpose, 'assertionMethod');
  assert(credential.proof.verificationMethod.startsWith(credential.issuer + '#'));
  assert(!JSON.stringify(credential).includes('privateKey'));
});

test('VC presentation binds holder and subject to the direct presentation transaction', () => {
  const {did} = samples(en);
  const {presentation, presentationRequest} = vcSamples(en);
  const credential = presentation.verifiableCredential[0];
  assert.deepEqual(presentation.type, ['VerifiablePresentation']);
  assert.equal(presentation['@context'][0], 'https://www.w3.org/ns/credentials/v2');
  assert.equal(presentation.holder, did.id);
  assert.equal(presentation.holder, credential.credentialSubject.id);
  assert.equal(presentation.proof.proofPurpose, 'authentication');
  assert(did.authentication.includes(presentation.proof.verificationMethod));
  assert.equal(presentation.proof.domain, presentationRequest.domain);
  assert.equal(presentation.proof.challenge, presentationRequest.challenge);
  assert(oneTimeValue(presentation.proof.challenge));
  const created = Date.parse(presentation.proof.created);
  assert(created >= Date.parse(credential.validFrom) && created < Date.parse(credential.validUntil));
  assert(presentationRequest.expires_at > created / 1000);
});

test('v0.6 removes VC exchange wire fields and keeps RFC 8693 informative', () => {
  for (const text of [en, cn]) {
    assert.doesNotMatch(text, /anp_vc_authorization|subject_token|requested_token_type|actor_token|issued_token_type|urn:ietf:params:oauth:grant-type:token-exchange|BASE64URL_VP|FRESH_CLIENT_ASSERTION/);
    const references = text.slice(text.indexOf('<a id="references"></a>'), text.indexOf('<a id="future-extensions"></a>'));
    const informative = references.search(/(?:Informative:|资料性引用：)/);
    assert(informative > 0);
    assert(!references.slice(0, informative).includes('rfc8693.html'));
    assert(references.slice(informative).includes('rfc8693.html'));
    const vcSection = text.slice(text.indexOf('<a id="vc-authorization"></a>'), text.indexOf('<a id="errors"></a>'));
    assert.doesNotMatch(vcSection, /`jti`|client_assertion|client_id/);
    const diagram = blocks(vcSection).find(block => block.language === 'mermaid');
    assert(diagram);
    assert.doesNotMatch(diagram.text, /\balt\b|\bAS\b|Token exchange|令牌交换/);
  }
});

test('VC direct presentation request carries a fresh challenge and a covered permission', () => {
  const {presentation, presentationRequest} = vcSamples(en);
  const [permission] = presentation.verifiableCredential[0].credentialSubject.permissions;
  assert.equal(presentationRequest.type, 'ANPPresentationRequest');
  assert.equal(presentationRequest.profile, vcProfile);
  assert(oneTimeValue(presentationRequest.challenge));
  assert.equal(presentationRequest.challenge, presentation.proof.challenge);
  assert.equal(presentationRequest.domain, new URL(permission.resource).origin);
  assert(Number.isInteger(presentationRequest.expires_at));
  const created = Date.parse(presentation.proof.created) / 1000;
  assert(presentationRequest.expires_at > created && presentationRequest.expires_at - created <= 300);
  assert.deepEqual(presentationRequest.credential_types, ['ANPAgentDelegationCredential']);
  assert.equal(presentationRequest.mode, 'operation');
  assert.equal(presentationRequest.resource, permission.resource);
  assert.deepEqual(permission.actions, ['orders.create']);
  for (const action of presentationRequest.actions) assert(permission.actions.includes(action), action);
  assert.deepEqual(permission.constraints.perOperationLimit, {currency: 'CNY', value: '5000.00'});
});

test('examples distinguish supported role credentials from the type requested in this transaction', () => {
  const {presentationRequest, presentation, roleCredential} = vcSamples(en);
  const authorizationTypes = ['ANPAgentDelegationCredential', 'ANPAgentRoleCredential'];
  const requestedType = presentation.verifiableCredential[0].type.find(type => authorizationTypes.includes(type));
  const otherType = roleCredential.type.find(type => authorizationTypes.includes(type));
  assert(presentationRequest.credential_types.includes(requestedType));
  assert(authorizationTypes.includes(otherType));
  assert(!presentationRequest.credential_types.includes(otherType));
  for (const text of [enValidation, cnValidation]) assert(scenarios(text).includes('AUTHZ-70'));
});

test('organization role credential authorizes by action URI, not by resource or role name', () => {
  const {presentation, roleCredential} = vcSamples(en);
  const delegation = presentation.verifiableCredential[0];
  assert.deepEqual(roleCredential['@context'], delegation['@context']);
  assert.deepEqual(roleCredential.type, ['VerifiableCredential', 'ANPAgentRoleCredential']);
  assert.match(roleCredential.id, /^urn:uuid:[0-9a-f-]{36}$/);
  assert.notEqual(roleCredential.id, delegation.id);
  assert.equal(roleCredential.issuer, delegation.issuer);
  assert.notEqual(roleCredential.credentialSubject.id, roleCredential.issuer);
  assert(Date.parse(roleCredential.validUntil) > Date.parse(roleCredential.validFrom));
  const subject = roleCredential.credentialSubject;
  assert.equal(typeof subject.role, 'string');
  assert(subject.role.length > 0);
  assert(!Object.hasOwn(subject, 'permissions'));
  assert(subject.capabilities.length > 0);
  for (const capability of subject.capabilities) {
    assert.equal(new URL(capability.action).protocol, 'https:');
    assert(!Object.hasOwn(capability, 'resource'));
  }
  assert.equal(roleCredential.credentialStatus.statusListCredential, delegation.credentialStatus.statusListCredential);
  assert.notEqual(roleCredential.credentialStatus.statusListIndex, delegation.credentialStatus.statusListIndex);
  assert.equal(roleCredential.proof.proofPurpose, 'assertionMethod');
  assert(roleCredential.proof.verificationMethod.startsWith(roleCredential.issuer + '#'));
});

const vcGuards = [
  ['a role name alone is never authority',
    /for display and audit only, and MUST NOT by itself be used as an authorization basis/,
    /只用于展示和审计，不得（MUST NOT）单独作为授权依据/],
  ['unmapped role actions fail closed',
    /an action without such a correspondence MUST be treated as unknown and its entry rejected/,
    /没有对应关系的动作必须（MUST）视为未知，并拒绝该项/],
  ['role credentials cannot create rights the issuer does not hold',
    /A role credential cannot grant rights the organization itself does not have/,
    /角色凭证不能授予组织本身没有的权利/],
  ['role-credential issuers must be confirmed as the organization acting as principal',
    /For a role credential, the verifier MUST confirm that the issuer DID is the organization it will treat as the principal/,
    /对角色凭证，验证方必须确认签发方 DID 就是它将视为委托主体的那个组织/],
  ['VC and OAuth are distinct mechanisms with a stated selection section',
    /OAuth answers “does the resource side allow this client to perform this operation on this resource now\?”[\s\S]*VC answers “which issuer made what verifiable statement about this Agent\?”/,
    /OAuth 回答“资源方现在是否允许这个客户端对这个资源执行这个操作？”[\s\S]*VC 回答“哪个签发方对这个 Agent 作出了什么可验证声明？”/],
  ['a raw VC or VP is never an access token',
    /An RS MUST NOT accept a raw VC or VP as a Bearer access credential/,
    /RS 不得（MUST NOT）把原始 VC 或 VP 当作 Bearer 访问凭据接受/],
  ['self-issued delegation is invalid',
    /The issuer MUST NOT be the holder: a delegation credential an Agent issues to itself is invalid/,
    /签发方不得（MUST NOT）与持有者相同：Agent 给自己签发的委托凭证无效/],
  ['unknown constraints fail closed',
    /MUST reject the whole permission entry containing it rather than ignore the constraint/,
    /必须（MUST）拒绝包含它的整条权限，而不是忽略该约束/],
  ['unavailable status fails closed',
    /Reject when status cannot be obtained; never treat it as valid/,
    /状态无法取得时拒绝，不得视为有效/],
  ['issuer authority is confirmed by the verifier, not by the credential',
    /The credential itself cannot establish or change that correspondence/,
    /凭证本身不能建立或改变这种对应关系/],
  ['status lists must carry and satisfy validUntil',
    /the status list credential MUST carry `validUntil` and be within its validity under the step 5 rule/,
    /状态列表凭证必须带有 `validUntil`，并按第 5 步规则处于有效期内/],
  ['issuing authority cannot be derived from credentials the issuer holds',
    /Issuing authority MUST come from the verifier's local principal binding or trust policy and MUST NOT be derived from a delegation credential, role credential, access token or execution permission the issuer itself holds/,
    /签发资格必须（MUST）来自验证方本地的主体绑定或信任策略，不得从签发方自己持有的委托凭证、角色凭证、访问令牌或执行权限推导/],
  ['challenges are consumed only after holder binding',
    /Only after this check does the verifier consume the presentation transaction/,
    /验证方通过这项检查后才按第 11\.3 节消费出示事务/],
  ['the Agent signs only for the verifier it is dealing with',
    /Before signing, the Agent MUST confirm that `domain` identifies the verifier it is actually dealing with/,
    /Agent 签署前必须（MUST）确认 `domain` 就是它实际交互的验证方/],
  ['direct presentation is bound to the stored transaction',
    /The verifier MUST store the challenge together with the requester DID[\s\S]*performs or rejects only the operation in that transaction/,
    /验证方必须（MUST）把 challenge 与请求方 DID[\s\S]*只执行或拒绝该事务中的操作/],
  ['a single-operation presentation cannot become a session',
    /MUST NOT widen a single-operation presentation into a session after receiving the VP/,
    /不得（MUST NOT）在收到 VP 后把单次操作扩大为会话/],
  ['amount limits never guess the amount or convert currency',
    /the verifier MUST reject the operation and MUST NOT convert currencies or guess the amount/,
    /验证方必须（MUST）拒绝该操作，不得（MUST NOT）自行换算汇率或猜测金额/],
  ['attached credentials are not holder-bound and grant no authority',
    /Attached credentials are not subject to the holder-binding rule[\s\S]{0,120}they grant no authority by themselves/,
    /附加凭证不适用持有者绑定规则[\s\S]{0,40}它们本身不授予权限/],
  ['VC conformance applies by role rather than to all of Section 11',
    /Section 11\.6 defines direct presentation; Section 11\.5 explicitly excludes VC–OAuth composition from this version/,
    /第 11\.6 节定义直接出示流程；第 11\.5 节明确本版不定义 VC 与 OAuth 的组合/],
  ['v1 keeps OAuth and VC as independent authorization paths',
    /ANP-05 v1 defines two independent authorization paths[\s\S]{0,250}V1 does not define conversion from VC\/VP to OAuth access tokens/,
    /ANP-05 v1 定义两条相互独立的授权路径[\s\S]{0,120}v1 不定义 VC\/VP 到 OAuth Access Token 的转换/],
  ['the presentation request advertises the exact supported VC profile',
    /a `profile` that MUST exactly match the supported VC Profile `anp\.authorization\.vc\.v1-draft2`/,
    /`profile`，必须（MUST）精确等于受支持的 VC Profile `anp\.authorization\.vc\.v1-draft2`/],
  ['unsupported presentation profiles cannot be silently downgraded',
    /a holder MUST NOT silently downgrade or reinterpret an unsupported Profile version/,
    /不得（MUST NOT）静默降级或重新解释不支持的 Profile 版本/],
  ['the verifier generates and stores the presentation challenge',
    /a `challenge` that is a one-time value generated and stored by the verifier/,
    /`challenge` 为验证方生成并保存的一次性值/],
  ['holder identity is bound to the carrying transport authentication',
    /`holder` MUST equal the DID of the requester authenticated by the carrying ANP-02 HTTP request or authenticated messaging session, and MUST equal the authorization credential's `credentialSubject\.id`/,
    /`holder` 必须（MUST）等于承载本次出示的 ANP-02 HTTP 请求或已认证消息会话所认证的请求方 DID，并且必须（MUST）等于授权凭证的 `credentialSubject\.id`/],
  ['a successful presentation does not authorize an OAuth access token',
    /A successful VC or VP verification MUST NOT by itself create, imply, mint or authorize an OAuth access token in this version/,
    /成功验证 VC 或 VP 本身不得（MUST NOT）创建、暗示、签发或授权 OAuth 访问令牌/],
  ['the current profile prohibits sending a VC to an OAuth token endpoint',
    /A VC or VP MUST NOT be sent to an OAuth token endpoint under this Profile/,
    /在本 Profile 下，不得（MUST NOT）向 OAuth 令牌端点发送 VC 或 VP/],
  ['direct presentation cannot bypass an OAuth interface',
    /An interface requiring OAuth MUST NOT be bypassed through VC direct presentation/,
    /某个接口要求 OAuth 时，不得（MUST NOT）用 VC 直接出示绕过其授权要求/],
  ['standalone qualification profiles are outside the current version',
    /Standalone qualification or attribute credential profiles are not defined by this version/,
    /本版本不定义独立的资质或属性凭证 Profile/],
  ['the authorization type must be accepted by the stored presentation transaction',
    /that type MUST be in the stored presentation transaction's `credential_types`/,
    /该类型必须（MUST）属于本次保存的出示事务的 `credential_types`/],
  ['a different supported credential type cannot substitute for the requested type',
    /A different type supported by this Profile MUST NOT substitute for the type requested in that transaction/,
    /不得（MUST NOT）仅因另一类型也受本 Profile 支持，就替代本次要求的类型/],
  ['accepted credential types are retained with the challenge',
    /requester DID, `profile`, `credential_types`, `domain`, required resource and actions/,
    /请求方 DID、`profile`、`credential_types`、`domain`、所需资源与动作/],
  ['sessions retain the accepted entries and per-entry constraints',
    /Retain the local principal confirmed in Section 11\.4[\s\S]*accepted permission\/capability entries with all their per-entry constraints/,
    /保存第 11\.4 节确认的本地主体[\s\S]*所采纳的权限\/能力条目及各条目的全部约束/],
  ['every subsequent session request authenticates its bound holder',
    /Each subsequent request MUST still authenticate as the holder DID bound to that context[\s\S]*MUST NOT replace requester authentication/,
    /每次后续请求仍必须（MUST）[\s\S]*该上下文绑定的 holder DID[\s\S]*不得（MUST NOT）替代请求方身份认证/],
  ['session authorization rechecks dynamic parameters on every operation',
    /For every actual operation, the verifier MUST re-evaluate[\s\S]*actual targets, amount, currency and other parameters/,
    /每次实际操作都必须（MUST）[\s\S]*实际对象、金额、币种等参数[\s\S]*重新执行适用的权限和全部约束检查/],
  ['sessions have fixed finite lifetimes and renew only through a fresh presentation',
    /fixed expiry under a finite local maximum lifetime[\s\S]*MUST NOT slide that expiry forward[\s\S]*fresh challenge and a newly verified VP/,
    /有限的本地时长上限设置固定到期时间[\s\S]*不得（MUST NOT）滚动延长到期时间[\s\S]*带新 challenge 的出示请求，并重新验证 VP/],
  ['personal data access requires an independently confirmed resource-side basis',
    /The resource side MUST independently confirm a valid basis for that access under its own rules/,
    /资源方必须（MUST）按自身规则独立确认有效的访问授权依据/],
];
for (const [name, enPattern, cnPattern] of vcGuards) {
  test('VC requirement and deletion regression: ' + name, () => {
    for (const [text, pattern] of [[en, enPattern], [cn, cnPattern]]) {
      assert.match(text, pattern);
      const changed = text.replace(pattern, 'REMOVED_VC_REQUIREMENT');
      assert.notEqual(changed, text);
      assert.throws(() => assert.match(changed, pattern), assert.AssertionError);
    }
  });
}
