// Copyright (c) 2026 ANP Open Source Community. Apache-2.0.
// Documentation checks only: these do not verify JWT signatures or OAuth runtime behavior.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {createPublicKey, createHash} from 'node:crypto';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {spawnSync} from 'node:child_process';
import test from 'node:test';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const enFile = 'vnext/05-anp-did-authorization-protocol-specification.md';
const cnFile = 'vnext/chinese/05-ANP-基于DID的授权协议.md';
const read = file => fs.readFileSync(path.join(root, file), 'utf8');
const en = read(enFile);
const cn = read(cnFile);
const profile = 'anp.authorization.oauth2.did.v1-draft4';
const vcProfile = 'anp.authorization.vc.v1-draft1';
const blocks = text => [...text.matchAll(/^```([^\n]*)\n([\s\S]*?)^```\s*$/gm)].map(match => ({language: match[1], text: match[2].trimEnd()}));
const anchors = text => [...text.matchAll(/<a id="([^"]+)"><\/a>/g)].map(match => match[1]);
const scenarios = text => [...text.matchAll(/^\| (AUTHZ-\d+) \|/gm)].map(match => match[1]);
const jsonBlocks = text => blocks(text).filter(block => block.language === 'json').map(block => JSON.parse(block.text));
const samples = text => {
  const [metadata, header, claims, token, resource, did, native] = jsonBlocks(text);
  return {metadata, header, claims, token, resource, did, native};
};

for (const [file, text] of [[enFile, en], [cnFile, cn]]) {
  test('authorization document is an unreleased independent draft: ' + file, () => {
    assert.match(text, /^- (?:Document ID: |文档编号：)ANP-05$/m);
    assert.match(text, /^- (?:Status: Draft \/ not released|状态：草案 \/ 未发布)$/m);
    assert.match(text, /^- (?:Version: |版本：)0\.5$/m);
    assert(text.includes(profile));
    assert(text.includes(vcProfile));
    assert.doesNotMatch(text, /^- (?:Status: Released|状态：已发布)/m);
    assert.match(text, /not part of the ANP 1\.2 release|不属于 ANP 1\.2 发布范围/);
    assert.doesNotMatch(text, /anp\.authorization\.oauth2\.did\.v1-draft(?:2|3)?(?:`|")/);
  });
}

test('bilingual sections, explicit anchors and wire examples stay synchronized', () => {
  assert.equal(anchors(en).length, 24);
  assert.deepEqual(anchors(en), anchors(cn));
  assert.equal(new Set(anchors(en)).size, anchors(en).length);
  assert.equal(anchors(en).at(-1), 'future-extensions');
  assert(!anchors(en).includes('interoperability'));
  for (const id of ['mechanism-selection', 'vc-authorization', 'vc-token-exchange', 'vc-direct-presentation', 'vc-organization-agents']) assert(anchors(en).includes(id), id);
  const sections = text => [...text.matchAll(/^## (\d+)\./gm)].map(match => Number(match[1]));
  assert.deepEqual(sections(en), Array.from({length: 16}, (_, index) => index + 1));
  assert.deepEqual(sections(en), sections(cn));
  // Diagram labels are localized; every other code block must match byte for byte.
  const wire = text => blocks(text).filter(block => block.language !== 'mermaid');
  assert.deepEqual(wire(en), wire(cn));
  assert.equal(jsonBlocks(en).length, 13);
  const diagramKinds = text => blocks(text).filter(block => block.language === 'mermaid').map(block => block.text.split('\n')[0]);
  assert.deepEqual(diagramKinds(en), ['flowchart TD', 'flowchart LR', 'sequenceDiagram', 'sequenceDiagram']);
  assert.deepEqual(diagramKinds(en), diagramKinds(cn));
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
  assert.deepEqual(metadata.anp_did_oauth, {
    profile,
    did_methods_supported: ['did:web', 'did:wba'],
    client_id_modes_supported: ['did'],
    client_enrollment_methods_supported: ['self_published', 'pre_registered'],
    redirect_uri_modes_supported: ['https', 'loopback'],
  });
  assert.deepEqual(metadata.code_challenge_methods_supported, ['S256']);
  assert.equal(metadata.authorization_response_iss_parameter_supported, true);
  assert(!Object.hasOwn(metadata, 'client_id_metadata_document_supported'));
  assert(metadata.token_endpoint_auth_signing_alg_values_supported.includes('RS256'));
  assert(metadata.token_endpoint_auth_signing_alg_values_supported.includes('Ed25519'));
  for (const field of ['issuer', 'authorization_endpoint', 'token_endpoint']) {
    assert.equal(new URL(metadata[field]).protocol, 'https:');
  }
});

test('illustrative assertion has exact DID, AS audience and bounded NumericDates', () => {
  const {metadata, header, claims} = samples(en);
  assert.equal(header.typ, 'client-authentication+jwt');
  assert.equal(header.alg, 'Ed25519');
  assert.equal(claims.iss, claims.sub);
  assert.equal(header.kid, claims.sub + '#auth-1');
  assert.equal(claims.aud, metadata.issuer);
  assert.notEqual(claims.aud, metadata.token_endpoint);
  assert(Number.isInteger(claims.iat) && Number.isInteger(claims.exp));
  assert(claims.exp > claims.iat && claims.exp - claims.iat <= 300);
  assert.equal(Buffer.from(claims.jti, 'base64url').length, 16);
  for (const forbidden of ['jwk', 'jku', 'x5u', 'x5c']) assert(!Object.hasOwn(header, forbidden));
  assert(!Object.hasOwn(claims, 'scope'));
  assert(!Object.hasOwn(claims, 'authorization_details'));
});

test('token request uses the native DID client-assertion binding, not a new grant', () => {
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
  // Preserve established IDs; removed integration-only scenarios leave intentional gaps.
  const ids = [1, 2, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 20, 21, 22, 23, 26, 27, 29, 30, 31, 32, 33];
  ids.push(...Array.from({length: 24}, (_, index) => index + 41));
  const expected = ids.map(id => 'AUTHZ-' + String(id).padStart(2, '0'));
  assert.deepEqual(scenarios(en), expected);
  assert.deepEqual(scenarios(cn), expected);
  assert.match(en, /not executable cryptographic fixtures/);
  assert.match(cn, /不是可执行密码学测试向量/);
  assert.match(en, /not a claim that an implementation has passed/);
  assert.match(cn, /不是宣称某个实现已经通过/);
});

test('identity references use the current ANP-02 bindings', () => {
  assert(en.includes('../02-anp-did-authentication-protocol-specification.md#identity-input'));
  assert(cn.includes('../../chinese/02-ANP-基于DID的身份认证协议.md#identity-input'));
  assert(en.includes('../03-did-wba-method-design-specification.md#wba-auth-binding'));
  assert(cn.includes('../../chinese/03-did-wba方法规范.md#wba-auth-binding'));
  assert(en.includes('**not** its HTTP signature serialization'));
  assert(cn.includes('**不复用**其 HTTP 签名序列化'));
});

test('root and vNext indexes expose only the current native draft scope', () => {
  assert(read('README.md').includes('(' + enFile + ')'));
  assert(read('README.cn.md').includes('(' + cnFile + ')'));
  assert(read('vnext/README.md').includes('(05-anp-did-authorization-protocol-specification.md)'));
  assert(read('vnext/chinese/README.md').includes('(05-ANP-基于DID的授权协议.md)'));
  for (const file of ['README.md', 'README.cn.md', 'vnext/README.md', 'vnext/chinese/README.md']) {
    const draftLines = read(file).split('\n').filter(line => /ANP-05/.test(line));
    assert.doesNotMatch(draftLines.join('\n'), /CIMD|MCP|A2A|mapped|projection|投影|映射/i);
  }
  for (const file of ['vnext/README.md', 'vnext/chinese/README.md']) {
    assert.match(read(file), /v0\.5/);
    assert.doesNotMatch(read(file), /v0\.(?:2|3|4)/);
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
  assert.equal(report.vnext_drafts_checked, 4);
  assert.equal(report.authorization_drafts_checked, 2);
  assert.equal(report.white_paper_drafts_checked, 2);
  assert.deepEqual(fs.readdirSync(path.join(root, 'vnext')).sort(), ['01-agentnetworkprotocol-technical-white-paper.md', '05-anp-did-authorization-protocol-specification.md', 'README.md', 'chinese']);
  assert.deepEqual(fs.readdirSync(path.join(root, 'vnext/chinese')).sort(), ['01-AgentNetworkProtocol技术白皮书.md', '05-ANP-基于DID的授权协议.md', 'README.md']);
  assert.equal(report.sdk_or_product_tests_run, false);
  assert.deepEqual(report.errors, []);
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

test('native publication keeps DID identity separate from the metadata retrieval URL', () => {
  const {metadata, did, native, claims} = samples(en);
  assert.deepEqual(metadata.anp_did_oauth.client_id_modes_supported, ['did']);
  assert(metadata.anp_did_oauth.client_enrollment_methods_supported.includes('self_published'));
  assert.equal(native.anp_profile, profile);
  assert.equal(native.client_id, did.id);
  assert.equal(native.client_id, claims.sub);
  const services = did.service.filter(item => item.type === 'ANPOAuthClientMetadata');
  assert.equal(services.length, 1);
  assert.equal(services[0].id, did.id + '#oauth-client');
  const url = new URL(services[0].serviceEndpoint);
  assert.equal(url.protocol, 'https:');
  assert.equal(url.hash + url.search + url.username + url.password, '');
  assert.notEqual(url.pathname, '/');
  assert.notEqual(native.client_id, services[0].serviceEndpoint);
  for (const field of ['jwks', 'jwks_uri', 'client_secret', 'client_secret_expires_at', 'anp_cimd_uri']) {
    assert(!Object.hasOwn(native, field), field);
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

test('native sample contains only its authorized public Multikey', () => {
  const {did, header} = samples(en);
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
  assert.equal(key.x, 'VEpJi1nTD8okbTyhNIyr-NlO4dH7if8D8FOccCQyxQQ');
  assert.equal(createPublicKey({key, format: 'jwk'}).asymmetricKeyType, 'ed25519');
  assert(!JSON.stringify(did).includes('privateKey'));
});

test('native grant and callback metadata are internally consistent', () => {
  const {native} = samples(en);
  assert.equal(native.token_endpoint_auth_method, 'private_key_jwt');
  assert.deepEqual(native.response_types, ['code']);
  assert(native.grant_types.includes('authorization_code'));
  assert(native.grant_types.includes('refresh_token'));
  assert(native.redirect_uris.length > 0);
  for (const uri of native.redirect_uris) assert.equal(new URL(uri).protocol, 'https:');
  for (const forbidden of ['implicit', 'password']) assert(!native.grant_types.includes(forbidden));
});

// Scope validation concerns document structure, not OAuth runtime behavior.
function scopeErrors(text) {
  const errors = [];
  const start = text.indexOf('<a id="future-extensions"></a>');
  const end = text.search(/^## (?:Copyright Notice|版权声明)$/m);
  if (start < 0 || end < start) return ['missing-final-future-section'];
  const before = text.slice(0, start);
  const future = text.slice(start, end);
  if (/CIMD/i.test(before) || (text.match(/CIMD/g) ?? []).length !== 1) errors.push('cimd-not-confined-to-future');
  if (/\b(?:MCP|A2A|Microsoft|Entra|VIRA|OBO)\b|modelcontextprotocol|a2a-protocol|learn\.microsoft/i.test(text)) errors.push('ecosystem-composition-remains');
  if (/anp_cimd_uri|client_id_metadata_document_supported|oauth-compat-1|legacy-auth\.example|\bmapped\b/i.test(text)) errors.push('adapter-contract-remains');
  const body = future.replace(/^<a[^\n]*\n/m, '').replace(/^##[^\n]*\n/m, '').trim();
  if (body.split(/\n\s*\n/).length !== 1 || /```|^\s*[|*-]/m.test(body)) errors.push('future-section-not-one-paragraph');
  if (!/A future version is planned|未来版本计划/.test(body) || !/includes no conversion|不包含相关转换/.test(body)) errors.push('future-scope-not-explicit');
  return errors;
}

test('CIMD appears only in one final future paragraph, with no current adapter contract', () => {
  for (const text of [en, cn]) assert.deepEqual(scopeErrors(text), []);
});

test('scope guard rejects reintroduced combinations, fields, examples and early CIMD requirements', () => {
  for (const text of [en, cn]) {
    const mutations = [
      ['CIMD requirements\n' + text, 'cimd-not-confined-to-future'],
      [text + '\nMCP composition\n', 'ecosystem-composition-remains'],
      [text + '\nA2A composition\n', 'ecosystem-composition-remains'],
      [text + '\nMicrosoft Entra adapter\n', 'ecosystem-composition-remains'],
      [text + '\nanp_cimd_uri\n', 'adapter-contract-remains'],
      [text + '\nclient_id_metadata_document_supported\n', 'adapter-contract-remains'],
      [text.replace(/(## 16\.[^\n]*\n)/, '$1\n```json\n{}\n```\n'), 'future-section-not-one-paragraph'],
    ];
    for (const [changed, expected] of mutations) {
      assert.notEqual(changed, text);
      assert(scopeErrors(changed).includes(expected), expected);
    }
  }
});

// Preserve applicable native security requirements while removing ecosystem-specific checks.
const nativeGuards = [
  ['native identity and discovery',
    /An AS claiming this revision's core conformance MUST implement DID-as-client-ID and the self-published metadata discovery\/admission procedure below/,
    /声明本修订核心一致性的 AS 必须（MUST）实现 DID 直接作为客户端标识，以及下文的自发布元数据发现\/准入流程/],
  ['exact native identity equality',
    /The request `client_id`, assertion `iss`, assertion `sub`, and native metadata `client_id` MUST identify the same exact bare DID/,
    /请求 `client_id`、断言 `iss`、断言 `sub` 和原生元数据 `client_id` 必须（MUST）标识完全相同的裸 DID/],
  ['first-contact admission instead of mandatory preregistration',
    /an unknown bare DID is a candidate for discovery, not an immediate .*solely for lacking a database row/,
    /未知裸 DID 是待发现候选者，不能仅因数据库没有记录就立即返回/],
  ['admission does not grant resource access',
    /This decision does not grant resource access/,
    /准入决定不授予资源权限/],
  ['unchanged approved security snapshot at code redemption',
    /A changed authentication policy, metadata endpoint or callback\/grant configuration invalidates that pending transaction/,
    /认证策略、元数据端点或回调\/授权配置变化时，该未完成事务失效/],
  ['strict authorization-response issuer validation',
    /Missing, duplicate, or mismatched `iss` MUST abort this Profile flow/,
    /`iss` 缺失、重复或不一致必须（MUST）终止流程/],
  ['resource binding on every token request',
    /on authorization requests and on all token requests covered here, including code redemption and refresh/,
    /在授权请求及本版全部令牌请求中[\s\S]*?包括授权码兑换与刷新/],
  ['no resource-token passthrough',
    /A token issued for Agent A MUST NOT be forwarded to service B as B's resource credential/,
    /签发给 Agent A 的令牌不得（MUST NOT）作为服务 B 的资源凭据直接转发给 B/],
  ['no identity substitution after rejection',
    /Authentication or admission failure MUST NOT trigger an automatic switch of client identity or weaker authentication/,
    /认证或准入失败时，不得（MUST NOT）自动更换客户端身份或降低认证强度/],
  ['atomic assertion replay enforcement',
    /atomically reserve `\(AS issuer, client_id, jti\)` until `exp \+ allowed skew`/,
    /原子性占用 `\(AS issuer, client_id, jti\)`，保留至 `exp \+ allowed skew`/],
  ['DID key revocation does not implicitly revoke issued tokens',
    /DID key revocation does not itself revoke an already issued AS token/,
    /DID 密钥撤销不会自行撤销已经由 AS 签发的令牌/],
];
for (const [name, enPattern, cnPattern] of nativeGuards) {
  test('native requirement and deletion regression: ' + name, () => {
    for (const [text, pattern] of [[en, enPattern], [cn, cnPattern]]) {
      assert.match(text, pattern);
      const changed = text.replace(pattern, 'REMOVED_NATIVE_REQUIREMENT');
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
    const {did, native} = samples(text);
    const bytes = raw.find(value => JSON.parse(value).anp_profile === profile);
    assert(bytes && bytes.endsWith('\n'));
    assert.deepEqual(JSON.parse(bytes), native);
    const digest = did.service[0].anp_metadata_sha256;
    assert.match(digest, /^[0-9a-f]{64}$/);
    assert.equal(hash(Buffer.from(bytes, 'utf8')), digest);
    assert.notEqual(hash(Buffer.from(bytes.trimEnd(), 'utf8')), digest);
  }
});

test('metadata example integrity detects changed presentation, permissions and callbacks', () => {
  const raw = rawJsonExamples(en).find(value => JSON.parse(value).anp_profile === profile);
  const expected = samples(en).did.service[0].anp_metadata_sha256;
  const variants = [
    raw.replace('Example Agent A', 'Different Agent'),
    raw.replace('documents.read', 'documents.write'),
    raw.replace('/agent-a/callback', '/agent-a/other-callback'),
    JSON.stringify(JSON.parse(raw)),
    raw + '\n',
  ];
  for (const variant of variants) {
    assert.notEqual(variant, raw);
    assert.notEqual(hash(Buffer.from(variant, 'utf8')), expected);
  }
});

test('user-delegated access-token example uses existing client_id and a separate user sub', () => {
  const access = jsonBlocks(en)[7];
  const {metadata, did, resource} = samples(en);
  assert.equal(access.iss, metadata.issuer);
  assert.equal(access.client_id, did.id);
  assert.equal(access.aud, resource.resource);
  assert.notEqual(access.sub, access.client_id);
  assert.equal(access.scope, 'documents.read');
  for (const field of ['iss', 'sub', 'aud', 'client_id', 'iat', 'exp', 'jti']) assert(Object.hasOwn(access, field));
  assert(access.exp > access.iat);
  assert(!Object.hasOwn(access, 'agent_did'));
});

test('local code-redemption example repeats the actual loopback port and keeps a distinct client DID', () => {
  const request = blocks(en).find(block => block.language === 'http' && block.text.includes('grant_type=authorization_code&'));
  assert(request);
  const form = new URLSearchParams(request.text.split('\n\n')[1]);
  assert.equal(form.get('client_id'), 'did:web:agents.example:local-a');
  assert.notEqual(form.get('client_id'), samples(en).did.id);
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
    for (const target of ['rfc7523.html', 'rfc8252.html#section-7.3', 'rfc6234.html', 'rfc9068.html', 'rfc7662.html']) assert(text.includes(target), target);
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
  ['AS integration cost is stated rather than claiming plug-and-play',
    /A stock OAuth AS is not expected to accept this flow unchanged/,
    /不假设现成 OAuth AS 可以原样接受本流程/],
  ['metadata digest must be checked before its fields are used',
    /Before using any client name, redirect URI or grant metadata, the AS MUST compare the computed digest/,
    /在使用任何客户端名称、回调 URI 或授权元数据前，AS 必须（MUST）将计算值/],
  ['metadata integrity does not remove DID-host and rollback assumptions',
    /an attacker controlling the DID-document host can still replace its keys and digest[\s\S]*not rollback resistance/,
    /did:web 的 DID 文档托管方被控制时[\s\S]*它不等于抗回滚/],
  ['loopback port exception cannot change the redemption URI',
    /port exception applies only to metadata-to-authorization-request matching, not to code redemption/,
    /端口例外只用于元数据与授权请求之间的匹配，不适用于授权码兑换/],
  ['loopback redirects do not relax SSRF protection',
    /This HTTP exception never authorizes the AS to fetch a callback/,
    /此 HTTP 例外不授权 AS 抓取回调/],
  ['routine runtime-key rotation does not force DID migration',
    /Changing only an authorized runtime key[\s\S]*does not change the DID/,
    /只轮换获准运行密钥[\s\S]*不会改变 DID/],
  ['RS256 requirement is correctly attributed to RFC 7523 section 5',
    /The AS MUST implement RS256 verification: RFC 7523 Section 5 explicitly makes it mandatory/,
    /AS 必须（MUST）实现 RS256 验证：RFC 7523 第 5 节明确/],
  ['legacy EdDSA is a configured compatibility option, not mandatory for all',
    /AS SHOULD provide an explicitly configured EdDSA verification option restricted to Ed25519 keys/,
    /AS 应当（SHOULD）提供可明确配置、仅接受 Ed25519 密钥的 EdDSA 验证选项/],
  ['existing client_id is required on active introspection only by this Profile',
    /RFC 7662 makes that field optional in general; this Profile requires it on active responses/,
    /RFC 7662 本身将其定义为可选，本 Profile 对活动结果增加此要求/],
  ['multiple resources require isolated authorizations rather than universal rights',
    /One target per token is an isolation rule, not one service per Agent/,
    /每个令牌一个目标是隔离规则，不是每个 Agent 只能访问一个服务/],
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
  const [presentation, asMetadata, exchangeResponse, presentationRequest, roleCredential] = jsonBlocks(text).slice(8);
  return {presentation, asMetadata, exchangeResponse, presentationRequest, roleCredential};
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

test('VC presentation binds holder, subject, AS domain and assertion jti', () => {
  const {claims, header} = samples(en);
  const {presentation, asMetadata} = vcSamples(en);
  const credential = presentation.verifiableCredential[0];
  assert.deepEqual(presentation.type, ['VerifiablePresentation']);
  assert.equal(presentation['@context'][0], 'https://www.w3.org/ns/credentials/v2');
  assert.equal(presentation.holder, claims.sub);
  assert.equal(presentation.holder, credential.credentialSubject.id);
  assert.equal(presentation.proof.proofPurpose, 'authentication');
  assert.equal(presentation.proof.verificationMethod, header.kid);
  assert.equal(presentation.proof.domain, asMetadata.issuer);
  assert(oneTimeValue(presentation.proof.challenge));
  const created = Date.parse(presentation.proof.created);
  assert(created >= Date.parse(credential.validFrom) && created < Date.parse(credential.validUntil));
  assert.equal(created / 1000, claims.iat);
  for (const text of [en, cn]) assert(text.includes('`' + presentation.proof.challenge + '`'));
});

test('VC token exchange uses RFC 8693 with DID client authentication and no refresh token', () => {
  const {presentation, asMetadata, exchangeResponse} = vcSamples(en);
  assert(asMetadata.grant_types_supported.includes('urn:ietf:params:oauth:grant-type:token-exchange'));
  assert.deepEqual(asMetadata.anp_vc_authorization, {
    profile: vcProfile,
    credential_types_supported: ['ANPAgentDelegationCredential', 'ANPAgentRoleCredential'],
    cryptosuites_supported: ['eddsa-jcs-2022'],
    status_types_supported: ['BitstringStatusListEntry'],
  });
  const request = blocks(en).find(block => block.language === 'http' && block.text.includes('grant_type=urn%3Aietf%3Aparams%3Aoauth%3Agrant-type%3Atoken-exchange&'));
  assert(request);
  assert(request.text.includes('Host: ' + new URL(asMetadata.issuer).host));
  const form = new URLSearchParams(request.text.split('\n\n')[1]);
  for (const key of form.keys()) assert.equal(form.getAll(key).length, 1, key);
  assert.equal(form.get('client_id'), presentation.holder);
  assert.equal(form.get('client_assertion_type'), 'urn:ietf:params:oauth:client-assertion-type:jwt-bearer');
  assert.equal(form.get('subject_token_type'), 'https://agent-network-protocol.com/oauth/token-type/vp');
  const [permission] = presentation.verifiableCredential[0].credentialSubject.permissions;
  assert.equal(form.get('resource'), permission.resource);
  for (const action of form.get('scope').split(' ')) assert(permission.actions.includes(action), action);
  for (const field of ['actor_token', 'actor_token_type', 'audience', 'assertion', 'client_secret', 'vp_token']) assert(!form.has(field), field);
  assert.equal(exchangeResponse.issued_token_type, 'urn:ietf:params:oauth:token-type:access_token');
  assert.equal(exchangeResponse.token_type, 'Bearer');
  assert.equal(exchangeResponse.scope, form.get('scope'));
  assert(!Object.hasOwn(exchangeResponse, 'refresh_token'));
  assert(Number.isInteger(exchangeResponse.expires_in) && exchangeResponse.expires_in > 0);
});

test('VC direct presentation request carries a fresh challenge and a covered permission', () => {
  const {claims} = samples(en);
  const {presentation, presentationRequest} = vcSamples(en);
  const [permission] = presentation.verifiableCredential[0].credentialSubject.permissions;
  assert.equal(presentationRequest.type, 'ANPPresentationRequest');
  assert(oneTimeValue(presentationRequest.challenge));
  assert.notEqual(presentationRequest.challenge, presentation.proof.challenge);
  assert.match(presentationRequest.domain, /^did:/);
  assert(Number.isInteger(presentationRequest.expires_at));
  assert(presentationRequest.expires_at > claims.iat && presentationRequest.expires_at - claims.iat <= 300);
  assert.deepEqual(presentationRequest.credential_types, ['ANPAgentDelegationCredential']);
  assert.equal(presentationRequest.mode, 'operation');
  assert.equal(presentationRequest.resource, permission.resource);
  for (const action of presentationRequest.actions) assert(permission.actions.includes(action), action);
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
  ['organizations cannot grant authority over third-party personal data',
    /A role credential cannot grant rights the organization itself does not have/,
    /角色凭证不能授予组织本身没有的权利/],
  ['role-credential issuers must be confirmed as the organization acting as principal',
    /For a role credential, the verifier MUST confirm that the issuer DID is the organization it will treat as the principal/,
    /对角色凭证，验证方必须确认签发方 DID 就是它将视为委托主体的那个组织/],
  ['VC and OAuth are distinct mechanisms with a stated selection section',
    /OAuth answers “does the resource side allow this client to access this resource now\?”[\s\S]*VC answers “who stated what about this Agent\?”/,
    /OAuth 回答“资源方是否允许这个客户端现在访问这个资源”[\s\S]*VC 回答“谁对这个 Agent 声明了什么”/],
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
  ['exchange VP is bound to the AS issuer and the assertion jti',
    /The VP's `domain` MUST equal the AS `issuer`, and its `challenge` MUST equal the `jti` of this request's client assertion/,
    /VP 的 `domain` 必须等于 AS 的 `issuer`，`challenge` 必须等于本次请求客户端断言的 `jti`/],
  ['exchanged tokens do not outlive the credential and carry its constraints',
    /The token expiry MUST NOT be later than the credential's `validUntil`[\s\S]*MUST NOT issue a token without the constraints[\s\S]*MUST NOT issue a refresh token for this binding/,
    /令牌过期时间不得（MUST NOT）晚于凭证的 `validUntil`[\s\S]*不得签发不带约束的令牌[\s\S]*AS 不得（MUST NOT）为本绑定签发刷新令牌/],
  ['revocation latency is documented rather than claimed instantaneous',
    /Deployments MUST document the upper bound on revocation latency/,
    /部署必须（MUST）记录撤销延迟的上界/],
  ['the revocation bound includes status-list validity, not only cache time',
    /bounded by the sum of the status list credential's maximum validity, the status cache time, the token lifetime and the allowed clock skew/,
    /撤销延迟的上界为状态列表凭证的最长有效期、状态缓存时间、令牌有效期与允许时钟偏差之和/],
  ['status lists must carry and satisfy validUntil',
    /the status list credential MUST carry `validUntil` and be within its validity under the step 5 rule/,
    /状态列表凭证必须带有 `validUntil`，并按第 5 步规则处于有效期内/],
  ['issuing authority cannot be derived from credentials the issuer holds',
    /Issuing authority MUST come from the verifier's local principal binding or trust policy and MUST NOT be derived from a delegation credential, role credential, access token or execution permission the issuer itself holds/,
    /签发资格必须（MUST）来自验证方本地的主体绑定或信任策略，不得从签发方自己持有的委托凭证、角色凭证、访问令牌或执行权限推导/],
  ['the exchange challenge is consumed once, through the assertion jti',
    /the atomic reservation of that `jti` under Section 6\.4 is this consumption and MUST NOT be repeated as a separate value/,
    /第 6\.4 节对该 `jti` 的原子占用即是本次消费，不得（MUST NOT）作为另一个值重复占用/],
  ['the exchange replay record covers the whole VP acceptance window',
    /the AS MUST retain that replay record until the later of `exp \+ s` and the VP's `created` plus 300 seconds plus `s`/,
    /AS 必须（MUST）把该防重放记录保留到 `exp \+ s` 与“VP 的 `created` 加 300 秒再加 `s`”两者中较晚的时刻/],
  ['challenges are consumed only after holder binding',
    /For direct presentation, only after this check does the verifier consume the presentation transaction/,
    /直接出示时，验证方通过这项检查后才按第 11\.3 节消费出示事务/],
  ['the Agent signs only for the verifier it is dealing with',
    /Before signing, the Agent MUST confirm that `domain` identifies the verifier it is actually dealing with/,
    /Agent 签署前必须（MUST）确认 `domain` 就是它实际交互的验证方/],
  ['direct presentation is bound to the stored transaction',
    /The verifier MUST store the challenge together with the requester DID[\s\S]*performs or rejects only the operation in that transaction/,
    /验证方必须（MUST）把 challenge 与请求方 DID[\s\S]*然后只执行或拒绝该事务中的操作/],
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
    /Section 11\.5 applies only to an AS that supports token exchange, and Section 11\.6 only to a verifier that accepts direct presentation/,
    /第 11\.5 节只适用于声明支持令牌换发的 AS，第 11\.6 节只适用于接受直接出示的验证方/],
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
