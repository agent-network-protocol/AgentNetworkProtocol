// Copyright (c) 2024 ANP Open Source Community. Apache-2.0.
// Scoped documentation checks with explicit pre-existing-link diagnostics.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import {execFileSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const git = args => execFileSync('git', args, {cwd: root, encoding: 'utf8', maxBuffer: 16 * 1024 * 1024});
const baseFlag = process.argv.indexOf('--base');
const requestedBase = baseFlag >= 0 ? process.argv[baseFlag + 1] : 'b7ba3ff8b628529ec88eef9625b0148fdeb9b994';
const sourceCommit = git(['rev-parse', '--verify', requestedBase + '^{commit}']).trim();
const changed = [...new Set([...git(['diff', '--name-only', '-z', sourceCommit]).split('\0'), ...git(['ls-files', '--others', '--exclude-standard', '-z']).split('\0')].filter(Boolean))].sort();
const documents = changed.filter(name => name.endsWith('.md'));
const knownPaths = new Set(git(['ls-tree', '-r', '--name-only', '-z', sourceCommit]).split('\0').filter(Boolean));
const oldCache = new Map();
const currentCache = new Map();
function read(name, old) {
  const cache = old ? oldCache : currentCache;
  if (cache.has(name)) return cache.get(name);
  let result = null;
  if (old) {
    if (knownPaths.has(name)) result = git(['show', sourceCommit + ':' + name]);
  } else if (fs.existsSync(path.join(root, name)) && fs.statSync(path.join(root, name)).isFile()) {
    result = fs.readFileSync(path.join(root, name), 'utf8');
  }
  cache.set(name, result);
  return result;
}

function stripHtmlTagsRepeatedly(input) {
  let previous;
  let output = input;
  do {
    previous = output;
    output = output.replace(/<[^>]*>/g, '');
  } while (output !== previous);
  return output;
}

function parseMarkdown(text) {
  const lines = text.split('\n');
  const prose = [];
  const blocks = [];
  const headings = [];
  const explicit = [];
  let open = null;
  for (let index = 0; index < lines.length; index += 1) {
    const line = lines[index];
    const fence = line.match(/^\s{0,3}(`{3,}|~{3,})(.*)$/);
    if (fence) {
      if (!open) open = {marker: fence[1][0], length: fence[1].length, language: fence[2].trim(), start: index + 1, lines: []};
      else if (fence[1][0] === open.marker && fence[1].length >= open.length && !fence[2].trim()) {
        blocks.push({language: open.language, text: open.lines.join('\n'), start: open.start});
        open = null;
      } else open.lines.push(line);
      continue;
    }
    if (open) {
      open.lines.push(line);
      continue;
    }
    prose.push(line);
    const heading = line.match(/^#{1,6}\s+(.+?)\s*#*$/);
    if (heading) headings.push(heading[1]);
    for (const match of line.matchAll(/\bid=["']([^"']+)["']/g)) explicit.push(match[1]);
  }
  const anchors = new Set(explicit);
  const duplicates = explicit.filter((id, index) => explicit.indexOf(id) !== index);
  const slugCounts = new Map();
  for (const heading of headings) {
    const label = stripHtmlTagsRepeatedly(heading.replace(/!?(?:\[([^\]]*)\])\([^)]*\)/g, '$1')).replace(/[`*]/g, '');
    const slug = label.toLowerCase().replace(/[^\p{L}\p{N}\p{M}\p{Pc}\-\s]/gu, '').replace(/\s/g, '-');
    const count = slugCounts.get(slug) ?? 0;
    slugCounts.set(slug, count + 1);
    anchors.add(slug + (count ? '-' + count : ''));
  }
  return {prose: prose.join('\n'), blocks, headings, anchors, explicit, duplicates, unclosed: open?.start ?? null};
}

const parsedCache = new Map();
function parsed(name, old) {
  const key = Number(old) + ':' + name;
  if (!parsedCache.has(key)) {
    const text = read(name, old);
    parsedCache.set(key, text === null ? null : parseMarkdown(text));
  }
  return parsedCache.get(key);
}

function targets(prose) {
  const values = [];
  for (const match of prose.matchAll(/!?\[[^\]\n]*\]\((<[^>]+>|[^)\n]+)\)/g)) {
    let target = match[1];
    if (target.startsWith('<')) target = target.slice(1, -1);
    else target = target.replace(/\s+["'][^"']*["']\s*$/, '');
    values.push(target.trim());
  }
  for (const match of prose.matchAll(/(?:href|src)=["']([^"']+)["']/g)) values.push(match[1]);
  for (const match of prose.matchAll(/^\[[^\]]+\]:\s+(\S+)/gm)) values.push(match[1]);
  return values;
}

function checkTarget(source, target, old) {
  if (/^[a-z][a-z0-9+.-]*:/i.test(target) || target.startsWith('//')) return null;
  const split = target.indexOf('#');
  const filePart = split < 0 ? target : target.slice(0, split);
  let fragment = split < 0 ? '' : target.slice(split + 1);
  let relative;
  try {
    relative = decodeURIComponent(filePart.split('?')[0]);
    fragment = decodeURIComponent(fragment);
  } catch {
    return 'invalid-percent-encoding';
  }
  const filename = relative ? path.posix.normalize(relative.startsWith('/') ? relative.slice(1) : path.posix.join(path.posix.dirname(source), relative)) : source;
  if (filename.startsWith('../')) return 'outside-repository';
  const exists = old ? knownPaths.has(filename) || [...knownPaths].some(name => name.startsWith(filename.replace(/\/$/, '') + '/')) : fs.existsSync(path.join(root, filename));
  if (!exists) return 'missing-target:' + filename;
  if (fragment && filename.endsWith('.md')) {
    if (!parsed(filename, old)?.anchors.has(fragment)) return 'missing-anchor:' + filename + '#' + fragment;
  }
  if (fragment && filename.endsWith('.html')) {
    const html = read(filename, old);
    if (html !== null && !html.includes('id="' + fragment + '"') && !html.includes("id='" + fragment + "'")) return 'missing-html-anchor:' + filename + '#' + fragment;
  }
  return null;
}

const errors = [];
const inherited = [];
let localLinks = 0;
let jsonExamples = 0;
for (const name of documents) {
  const data = parsed(name, false);
  assert(data, 'Missing changed document');
  if (data.unclosed) errors.push({file: name, reason: 'unclosed-fence', line: data.unclosed});
  if (data.duplicates.length) errors.push({file: name, reason: 'duplicate-explicit-anchor', ids: data.duplicates});
  const old = parsed(name, true);
  const oldTargets = new Set(old ? targets(old.prose) : []);
  for (const target of targets(data.prose)) {
    if (!/^[a-z][a-z0-9+.-]*:/i.test(target) && !target.startsWith('//')) localLinks += 1;
    const problem = checkTarget(name, target, false);
    if (!problem) continue;
    const item = {file: name, target, reason: problem};
    if (oldTargets.has(target) && checkTarget(name, target, true) === problem) inherited.push(item);
    else errors.push(item);
  }
  for (const block of data.blocks.filter(item => item.language === 'json')) {
    try {
      JSON.parse(block.text);
      jsonExamples += 1;
    } catch {
      const item = {file: name, reason: 'invalid-json-example', line: block.start};
      if (old?.blocks.some(previous => previous.language === 'json' && previous.text === block.text)) inherited.push(item);
      else errors.push(item);
    }
  }
}

const mirrorPairs = [
  ['vnext/02-anp-did-authentication-protocol-specification.md', 'chinese/vnext/02-ANP-基于DID的身份认证协议.md'],
  ['vnext/appendix-b-compatibility-with-native-did-web.md', 'chinese/vnext/附录B：与原生did-web-的兼容.md'],
  ['examples/did-authentication-vnext/README.md', 'examples/did-authentication-vnext/README.cn.md'],
];
for (const [en, cn] of mirrorPairs) {
  const left = parsed(en, false);
  const right = parsed(cn, false);
  if (JSON.stringify(left.explicit) !== JSON.stringify(right.explicit)) errors.push({file: en, reason: 'mirror-explicit-anchor-mismatch', mirror: cn});
  if (JSON.stringify(left.blocks.map(({language, text}) => ({language, text}))) !== JSON.stringify(right.blocks.map(({language, text}) => ({language, text})))) errors.push({file: en, reason: 'mirror-code-example-mismatch', mirror: cn});
}
for (const directory of ['message/vnext', 'chinese/message/vnext']) {
  const files = fs.readdirSync(path.join(root, directory)).filter(name => /^0[1-9]-.*\.md$/.test(name));
  for (const name of files) {
    const filename = directory + '/' + name;
    assert(changed.includes(filename), 'Unreviewed message Profile: ' + filename);
    const text = read(filename, false);
    if (/root-protected DID Document|根保护 DID Document/.test(text)) errors.push({file: filename, reason: 'generic-root-proof-assumption'});
    // Existing wire/object/AAD examples keep their exact content bytes. Relabeling
    // a schematic block as text does not alter its content or make it executable JSON.
    const beforeBlocks = parsed(filename, true).blocks.filter(block => block.language !== 'mermaid');
    const afterBlocks = parsed(filename, false).blocks;
    for (const block of beforeBlocks) {
      if (!afterBlocks.some(current => current.text === block.text)) errors.push({file: filename, reason: 'existing-wire-example-content-changed', source_line: block.start});
    }
    // Profile IDs, algorithm identifiers, wire error numbers/names stay stable.
    const errorRows = value => [...value.matchAll(/^\|\s*(\d{4})\s*\|\s*`([^`]+)`/gm)].map(match => match[1] + ':' + match[2]);
    if (JSON.stringify(errorRows(text)) !== JSON.stringify(errorRows(read(filename, true)))) errors.push({file: filename, reason: 'wire-error-table-changed'});
  }
}
const modifiedMirrorPairs = [
  ['vnext/03-did-wba-method-design-specification.md', 'chinese/vnext/03-did-wba方法规范.md'],
  ['vnext/04-anp-did-wba-name-space-specification.md', 'chinese/vnext/04-ANP-基于DID-WBA的命名空间规范.md'],
  ['message/vnext/02-identity-and-discovery.md', 'chinese/message/vnext/02-身份与发现.md'],
  ['message/vnext/05-direct-end-to-end-encryption.md', 'chinese/message/vnext/05-私聊端到端加密.md'],
  ['message/vnext/07-attachments-and-object-transfer.md', 'chinese/message/vnext/07-附件与对象传输.md'],
  ['message/vnext/09-message-mentions.md', 'chinese/message/vnext/09-消息Mention扩展.md'],
];
for (const [en, cn] of modifiedMirrorPairs) {
  if (JSON.stringify(parsed(en, false).explicit) !== JSON.stringify(parsed(cn, false).explicit)) errors.push({file: en, reason: 'changed-mirror-anchor-mismatch', mirror: cn});
}
for (let number = 1; number <= 9; number += 1) {
  const prefix = '0' + number + '-';
  const en = 'message/vnext/' + fs.readdirSync(path.join(root, 'message/vnext')).find(name => name.startsWith(prefix));
  const cn = 'chinese/message/vnext/' + fs.readdirSync(path.join(root, 'chinese/message/vnext')).find(name => name.startsWith(prefix));
  const metadata = value => ({
    id: value.match(/^- (?:Document ID:|文档编号：)\s*(\S+)/m)?.[1],
    profile: value.match(/^- Profile[:：]\s*`([^`]+)`/m)?.[1] ?? null,
  });
  if (JSON.stringify(metadata(read(en, false))) !== JSON.stringify(metadata(read(cn, false)))) errors.push({file: en, reason: 'profile-mirror-metadata-mismatch', mirror: cn});
}
// Extraction guard: authenticate against the original ANP-03 vNext text,
// allowing only the declared headings, links, anchors and 409 relocation.
const extractionPairs = [
  {source: 'vnext/03-did-wba-method-design-specification.md', target: 'vnext/02-anp-did-authentication-protocol-specification.md', web: 'appendix-b-compatibility-with-native-did-web.md', cn: false},
  {source: 'chinese/vnext/03-did-wba方法规范.md', target: 'chinese/vnext/02-ANP-基于DID的身份认证协议.md', web: 'chinese/附录B：与原生did-web-的兼容.md', cn: true},
];
function between(text, start, end) {
  const first = text.indexOf(start);
  const last = text.indexOf(end, first);
  assert(first >= 0 && last > first, 'Missing extraction boundary');
  return text.slice(first, last);
}
const authEditorialChanges = {
  "en": [
    [
      "## 3. Cross-platform identity authentication based on DID and HTTP",
      "## 3. HTTP Request Authentication"
    ],
    [
      "## 4. Cross-platform identity authentication with DID and JSON-formatted data carriage",
      "## 4. JSON Authentication Metadata Carriage"
    ],
    [
      "## 5 Distinguish between human authorization and intelligent agent automatic authorization",
      "## 5. Authentication and Application Authorization"
    ],
    [
      "## 6 Privacy Protection Policy",
      "## 6. Privacy Considerations"
    ],
    [
      "## 7 Security Tips",
      "## 7. Security Considerations"
    ],
    [
      "By default, the client SHOULD sign using the binding key corresponding to the last `e1_` fingerprint segment of the DID path.",
      "For `did:wba` using the E1 profile, the client SHOULD by default sign using the binding key corresponding to the last `e1_` fingerprint segment of the DID path."
    ],
    [
      "2. Select the verification method to use for the signature. By default, binding keys for path-type DIDs should be used in preference.",
      "2. Select the verification method to use for the signature. For `did:wba` using a binding-fingerprint path, its binding key should be preferred by default."
    ],
    [
      "   - For `e1_` DID, the DID binding relationship must be verified",
      "   - For a `did:wba` E1 DID, the DID binding relationship must be verified"
    ],
    [
      "In the previous chapter, we introduced the cross-platform identity authentication process based on the did:wba method and HTTP protocol. However, authentication using the did:wba method is transport protocol independent.",
      "The preceding chapter defines DID-based HTTP authentication. Other transports can carry authentication metadata using component mappings defined by their application-layer protocols."
    ],
    [
      "In theory, protocols based on other data formats could also add support for the did:wba method.",
      "Protocols based on other data formats can also adopt this authentication mechanism."
    ],
    [
      "   - For path-based DIDs with the default path scheme, the binding key is best kept using hardware isolation, HSM, or the system enclave.",
      "   - For `did:wba` using the default path scheme, the binding key is best kept using hardware isolation, HSM, or the system enclave."
    ],
    [
      "   - By default, cross-platform authentication should prefer signing with a bound key.",
      "   - For `did:wba` using a binding key, cross-platform authentication should prefer that key by default."
    ],
    [
      "   - New deployments SHOULD prefer the `e1_` profile.",
      "   - New WBA deployments SHOULD prefer the `e1_` profile."
    ],
    [
      "   - For an active `e1_` DID, the parser MUST verify",
      "   - For an active `did:wba` E1 DID, the parser MUST verify"
    ],
    [
      "   - A stable subject path MUST NOT be recycled or reassigned.",
      "   - A WBA stable subject path MUST NOT be recycled or reassigned."
    ],
    [
      "   - When following `successorDid`, a verifier MUST limit",
      "   - When following `successorDid` under the WBA method, a verifier MUST limit"
    ]
  ],
  "cn": [
    [
      "## 3. 基于 DID 和 HTTP 协议的跨平台身份认证",
      "## 3. HTTP 请求认证"
    ],
    [
      "## 4. 基于 DID 和 JSON 格式数据承载的跨平台身份认证流程",
      "## 4. JSON 认证信息承载"
    ],
    [
      "## 5 区分人类授权与智能体自动授权",
      "## 5. 身份认证与应用授权"
    ],
    [
      "## 6 隐私保护策略",
      "## 6. 隐私保护"
    ],
    [
      "## 7 安全性建议",
      "## 7. 安全考虑"
    ],
    [
      "默认情况下，客户端应当（SHOULD）使用 DID 路径最后 `e1_` 指纹段对应的**绑定密钥**进行签名。",
      "对于采用 E1 profile 的 `did:wba`，默认情况下，客户端应当（SHOULD）使用 DID 路径最后 `e1_` 指纹段对应的**绑定密钥**进行签名。"
    ],
    [
      "2. 选择用于签名的验证方法。默认情况下，应优先使用路径型 DID 的绑定密钥。",
      "2. 选择用于签名的验证方法。对于采用绑定指纹路径的 `did:wba`，默认情况下，应优先使用绑定密钥。"
    ],
    [
      "   - 对 `e1_` DID，必须（MUST）基于",
      "   - 对 `did:wba` 的 `e1_` DID，必须（MUST）基于"
    ],
    [
      "在上一章中，我们介绍了基于did:wba方法和HTTP协议的跨平台身份认证流程。然而，使用did:wba方法进行身份认证，是传输协议无关的。",
      "上一章定义了基于 DID 和 HTTP 的身份认证流程。认证信息可以由其他传输承载，其组件映射由相应应用层协议确定。"
    ],
    [
      "理论上，基于其他数据格式的协议也可以添加对 did:wba 方法的支持。",
      "基于其他数据格式的协议也可以采用本认证机制。"
    ],
    [
      "   - 对于采用默认路径方案的路径型 DID，绑定密钥最好使用硬件隔离、HSM 或系统安全区保管。",
      "   - 对于采用默认路径方案的 `did:wba`，绑定密钥最好使用硬件隔离、HSM 或系统安全区保管。"
    ],
    [
      "   - 默认情况下，跨平台身份认证应优先使用绑定密钥进行签名。",
      "   - 对于采用绑定密钥的 `did:wba`，默认情况下，跨平台身份认证应优先使用绑定密钥进行签名。"
    ],
    [
      "   - 新部署应当（SHOULD）优先采用 `e1_` profile。",
      "   - 新的 WBA 部署应当（SHOULD）优先采用 `e1_` profile。"
    ],
    [
      "   - 对于活动 `e1_` DID，解析器必须",
      "   - 对于活动的 `did:wba` E1 DID，解析器必须"
    ],
    [
      "   - 稳定主体路径不得（MUST NOT）被回收或重新分配；",
      "   - WBA 的稳定主体路径不得（MUST NOT）被回收或重新分配；"
    ],
    [
      "   - 验证者在跟随 `successorDid` 时必须（MUST）限制链长",
      "   - 验证者按 WBA 方法跟随 `successorDid` 时必须（MUST）限制链长"
    ]
  ]
};
const authMethodSeparationChanges = {
  "en": {
    "main": [
      [
        "For `did:wba` using the E1 profile, the client SHOULD by default sign using the binding key corresponding to the last `e1_` fingerprint segment of the DID path. If the server allows other `authentication` verification methods, it belongs to the local authorization policy and does not change the binding semantics of DID.",
        "Authentication-key selection follows the applicable DID method and local authorization policy; the selected verification method must be authorized by the subject Document's `authentication` relationship."
      ],
      [
        "4. **Read DID document**: Parse the DID document based on the DID. If the document sets `deactivated = true`, the server MUST NOT continue to use that DID for new authentication. When the document contains `successorDid`, the server should return the DID-superseded error defined in Section 3.2.4.3.",
        "4. **Resolve and validate the DID Document**: Resolve and validate the Document under the applicable DID method. Its specification governs identity state and restrictions on new authentication; method-specific responses are addressed in Section 3.2.4.3."
      ],
      [
        "   - For a `did:wba` E1 DID, the DID binding relationship must be verified based on the Ed25519 public key corresponding to `proof.verificationMethod` instead of randomly selecting an Ed25519 key in `authentication`:\n     - `proof` must exist and pass `eddsa-jcs-2022` verification;\n     - Recalculate the RFC 7638 thumbprint using this public key, and the result MUST be exactly the same as the last `e1_` fingerprint segment of the DID path.",
        "   - Method-specific identity-binding verification follows the corresponding DID method specification; see Section 2 and its method binding."
      ],
      [
        "2. Select the verification method to use for the signature. For `did:wba` using a binding-fingerprint path, its binding key should be preferred by default.",
        "2. Select the signing verification method under the applicable DID method and local authorization policy."
      ],
      [
        "   - If the DID uses the Ed25519 binding key represented by `Multikey` (corresponding to the `e1_` profile), it should be signed using the Ed25519 algorithm;",
        "   - If the selected verification method uses an Ed25519 key represented by `Multikey`, it should be signed using the Ed25519 algorithm;"
      ],
      [
        "> Description:\n> If the implementation also supports the `k1_` compatible extension of [Appendix A](../appendix-a-did-wba-k1-compatibility-extension.md), then the authentication signature for the `k1_` DID may be performed as in [Appendix A](../appendix-a-did-wba-k1-compatibility-extension.md).",
        "Signature-generation requirements specific to a DID method are defined by that method specification; see Section 2."
      ],
      [
        "> Description:\n> If an implementation also supports the `k1_` compatible extension of [Appendix A](../appendix-a-did-wba-k1-compatibility-extension.md), then binding verification and authentication verification of the `k1_` DID shall be performed as per [Appendix A](../appendix-a-did-wba-k1-compatibility-extension.md).",
        "Identity-verification requirements specific to a DID method are defined by that method specification; see Section 2."
      ],
      [
        "For scenarios that require stable external references but also want the underlying DID to be rotated, it is recommended to use it in conjunction with a name service (such as WNS/Handle): Handle remains stable and human-readable, and the underlying did:wba can rotate as the binding key changes.",
        "A name service (such as WNS/Handle) can provide a stable human-readable name; naming bindings and DID lifecycles are governed by their corresponding specifications."
      ],
      [
        "The `did:wba` DID Document only declares the verification methods that can be used for `authentication` and no longer defines the `humanAuthorization` field.",
        "A DID Document declares authentication verification methods through `authentication`; this authentication specification does not define a `humanAuthorization` field."
      ],
      [
        "##### 3.2.4.3 409 DID Superseded",
        "##### 3.2.4.3 Method-specific responses"
      ],
      [
        "For a superseded WBA DID, response conditions, status code, fields, and retry handling follow [ANP-03: HTTP 409 DID Superseded](03-did-wba-method-design-specification.md#http-superseded).",
        "Identity-state errors and subsequent handling are defined by the applicable DID method; see its method binding. Common authentication errors use Sections 3.2.4.1 and 3.2.4.2."
      ],
      [
        "<a id=\"security-privacy\"></a>\n## 7. Security Considerations\n\nImplementers need to consider the following security issues when implementing:\n\n1. **Key Management**\n\n- The private key corresponding to DID must be kept properly and must not be leaked. In addition, a mechanism for regularly refreshing the private key should be established.\n   - For `did:wba` using the default path scheme, the binding key is best kept using hardware isolation, HSM, or the system enclave.\n   - For `did:wba` using a binding key, cross-platform authentication should prefer that key by default.\n   - New WBA deployments SHOULD prefer the `e1_` profile.\n   - Users should generate multiple DIDs, each with different roles and permissions, and use different key pairs to achieve fine-grained permission control.\n   - When the binding key changes, the path-type DID will change with it, so upper-level name service mappings should be updated synchronously.\n\n2. **Anti-attack measures**\n\n- The server **must** implement replay protection. For direct connection proof profile, a short-term replay cache should be established for `(keyid, nonce)`, `(keyid, jti)` or equivalent keys; for challenge profile, `nonce` issued by the server must be used one at a time.\n   - The server must determine the `created` / `expires` time window in the request to prevent time rollback attacks. Generally speaking, the cache time of the server's replay cache should be longer than the signature expiration time.\n   - When generating `nonce`, you **must** use a secure random number generator provided by the operating system, complying with modern cryptographic security specifications and standards. For example, you can use a module like Python's `secrets` to generate secure random numbers.\n   - When the request contains a message body, the server must verify `Content-Digest` to prevent the message body from being tampered with.\n   - Successful authentication does not equal successful authorization. The server must handle authorization judgment and identity authentication separately.\n   - For an active `did:wba` E1 DID, the parser MUST verify `DataIntegrityProof`. A deactivated `e1_` transition document follows the binding, recovery, provider-asserted, and unverified rules in [Section 2.5.5](03-did-wba-method-design-specification.md#wba-method-rules). For other profiles, if the implementation enables DID Document proof verification, it SHOULD verify `proof` according to the corresponding profile rules.\n   - A WBA stable subject path MUST NOT be recycled or reassigned. A verifier MUST NOT merge two DIDs merely by removing the final binding-fingerprint segment.\n   - When following `successorDid` under the WBA method, a verifier MUST limit the chain length, detect cycles, and reject a chain whose stable subject paths differ or in which the same old DID has multiple successors.\n\n3. **Transmission Security**\n\n- When obtaining DID documents, the server should use the DNS-over-HTTPS (DoH) protocol to improve security.\n   - The transmission protocol **must** use HTTPS, and the client **must** strictly determine whether the other party's CA certificate is trustworthy.\n   - When performing TLS service identity verification, the client **must** match according to `dNSName` in `subjectAltName` and should not rely on Common Name.\n   - Unconditional following of untrusted cross-origin redirects should be avoided during DID resolution.\n\n4. **Token Security**\n\n- The client and server **must** properly keep the Access Token, and **must** set a reasonable expiration time.\n   - **should** be preferred over sender-constrained access tokens. This specification has reserved expansion capabilities, but the specific profile has not yet been fully defined.\n   - IP address, User-Agent and other information can only be used as auxiliary risk signals and should not be used as the only binding mechanism for Access Token.\n   - The access token **SHOULD** only be returned on HTTPS connections and sent via the `Authentication-Info` response header.\n\n",
        "<a id=\"security-privacy\"></a>\n## 7. Security Considerations\n\nImplementers need to consider the following security issues when implementing:\n\n1. **Key Management**\n\n- The private key corresponding to DID must be kept properly and must not be leaked. In addition, a mechanism for regularly refreshing the private key should be established.\n   - Users should generate multiple DIDs, each with different roles and permissions, and use different key pairs to achieve fine-grained permission control.\n\n2. **Anti-attack measures**\n\n- The server **must** implement replay protection. For direct connection proof profile, a short-term replay cache should be established for `(keyid, nonce)`, `(keyid, jti)` or equivalent keys; for challenge profile, `nonce` issued by the server must be used one at a time.\n   - The server must determine the `created` / `expires` time window in the request to prevent time rollback attacks. Generally speaking, the cache time of the server's replay cache should be longer than the signature expiration time.\n   - When generating `nonce`, you **must** use a secure random number generator provided by the operating system, complying with modern cryptographic security specifications and standards. For example, you can use a module like Python's `secrets` to generate secure random numbers.\n   - When the request contains a message body, the server must verify `Content-Digest` to prevent the message body from being tampered with.\n   - Successful authentication does not equal successful authorization. The server must handle authorization judgment and identity authentication separately.\n\n3. **Transmission Security**\n\n- When obtaining DID documents, the server should use the DNS-over-HTTPS (DoH) protocol to improve security.\n   - The transmission protocol **must** use HTTPS, and the client **must** strictly determine whether the other party's CA certificate is trustworthy.\n   - When performing TLS service identity verification, the client **must** match according to `dNSName` in `subjectAltName` and should not rely on Common Name.\n   - Unconditional following of untrusted cross-origin redirects should be avoided during DID resolution.\n\n4. **Token Security**\n\n- The client and server **must** properly keep the Access Token, and **must** set a reasonable expiration time.\n   - **should** be preferred over sender-constrained access tokens. This specification has reserved expansion capabilities, but the specific profile has not yet been fully defined.\n   - IP address, User-Agent and other information can only be used as auxiliary risk signals and should not be used as the only binding mechanism for Access Token.\n   - The access token **SHOULD** only be returned on HTTPS connections and sent via the `Authentication-Info` response header.\n\n"
      ],
      [
        "did:wba:example.com:user:alice:e1_<fingerprint>",
        "did:web:identity.example:alice"
      ]
    ],
    "web": [
      [
        "In compatibility mode, implementations MUST NOT enforce the following did:wba-specific checks on native `did:web`:\n\n- `e1_` / `k1_` path binding public key fingerprint check;\n- Path binding profile semantic check in did:wba main specification;\n- did:wba's unique path-type DID rotation semantic check;\n- Use did:wba-specific proof rules as a prerequisite for successful `did:web` parsing.",
        "Implementations MUST NOT make identifier-binding, document-proof, or lifecycle rules specific to another DID method prerequisites for successful native `did:web` validation."
      ],
      [
        "If the native `did:web` DID Document itself carries a standard proof (such as Data Integrity proof), the implementation MAY perform verification according to the proof's declaration profile and local policy; however, the success of `did:web` parsing itself is not predicated on the `proof` rules of did:wba.",
        "If the native `did:web` DID Document itself carries a standard proof (such as Data Integrity proof), the implementation MAY perform verification according to the proof's declaration profile and local policy; other methods' document-proof requirements do not apply to native `did:web`."
      ],
      [
        "In compatibility mode, the identity binding semantics of `did:web` comes from the parsing result of `did:web` itself, rather than the path binding public key fingerprint of did:wba.",
        "The identity-binding semantics of `did:web` follow its own method-resolution and verification rules."
      ],
      [
        "5. The subsequent HTTP Message Signatures / `Content-Digest` verification logic is the same as did:wba.",
        "5. Subsequent HTTP Message Signatures / `Content-Digest` verification follows the common authentication flow in Chapters 3 and 4."
      ]
    ],
    "relocated": [
      "   - For `did:wba` using the default path scheme, the binding key is best kept using hardware isolation, HSM, or the system enclave.",
      "   - For `did:wba` using a binding key, cross-platform authentication should prefer that key by default.",
      "   - New WBA deployments SHOULD prefer the `e1_` profile.",
      "   - When the binding key changes, the path-type DID will change with it, so upper-level name service mappings should be updated synchronously.",
      "   - For an active `did:wba` E1 DID, the parser MUST verify `DataIntegrityProof`. A deactivated `e1_` transition document follows the binding, recovery, provider-asserted, and unverified rules in [Section 2.5.5](03-did-wba-method-design-specification.md#wba-method-rules). For other profiles, if the implementation enables DID Document proof verification, it SHOULD verify `proof` according to the corresponding profile rules.",
      "   - A WBA stable subject path MUST NOT be recycled or reassigned. A verifier MUST NOT merge two DIDs merely by removing the final binding-fingerprint segment.",
      "   - When following `successorDid` under the WBA method, a verifier MUST limit the chain length, detect cycles, and reject a chain whose stable subject paths differ or in which the same old DID has multiple successors.",
      "For `did:wba` using the E1 profile, the client SHOULD by default sign using the binding key corresponding to the last `e1_` fingerprint segment of the DID path. If the server allows other `authentication` verification methods, it belongs to the local authorization policy and does not change the binding semantics of DID.",
      "   - For a `did:wba` E1 DID, the DID binding relationship must be verified based on the Ed25519 public key corresponding to `proof.verificationMethod` instead of randomly selecting an Ed25519 key in `authentication`:\n     - `proof` must exist and pass `eddsa-jcs-2022` verification;\n     - Recalculate the RFC 7638 thumbprint using this public key, and the result MUST be exactly the same as the last `e1_` fingerprint segment of the DID path.",
      "For scenarios that require stable external references but also want the underlying DID to be rotated, it is recommended to use it in conjunction with a name service (such as WNS/Handle): Handle remains stable and human-readable, and the underlying did:wba can rotate as the binding key changes.",
      "> Description:\n> If the implementation also supports the `k1_` compatible extension of [Appendix A](../appendix-a-did-wba-k1-compatibility-extension.md), then the authentication signature for the `k1_` DID may be performed as in [Appendix A](../appendix-a-did-wba-k1-compatibility-extension.md).",
      "> Description:\n> If an implementation also supports the `k1_` compatible extension of [Appendix A](../appendix-a-did-wba-k1-compatibility-extension.md), then binding verification and authentication verification of the `k1_` DID shall be performed as per [Appendix A](../appendix-a-did-wba-k1-compatibility-extension.md).",
      "4. **Read DID document**: Parse the DID document based on the DID. If the document sets `deactivated = true`, the server MUST NOT continue to use that DID for new authentication. When the document contains `successorDid`, the server should return the DID-superseded error defined in [this chapter's 409 response](#http-superseded)."
    ]
  },
  "cn": {
    "main": [
      [
        "对于采用 E1 profile 的 `did:wba`，默认情况下，客户端应当（SHOULD）使用 DID 路径最后 `e1_` 指纹段对应的**绑定密钥**进行签名。服务端如果允许其他 `authentication` 验证方法，属于本地授权策略，不改变 DID 的绑定语义。",
        "认证密钥的选择遵循适用 DID 方法及本地授权策略；所选验证方法须由主体 DID Document 的 `authentication` 关系授权。"
      ],
      [
        "4. **读取 DID 文档**：根据 DID 解析 DID 文档。若文档设置 `deactivated = true`，服务端不得（MUST NOT）继续使用该 DID 完成新的身份认证；当文档包含 `successorDid` 时，应按 3.2.4.3 节返回 DID 已被替代的错误。",
        "4. **读取并验证 DID 文档**：按适用 DID 方法解析和验证 DID Document。方法定义的身份状态及其对新认证的限制由对应方法规范处理；方法特有响应见第 3.2.4.3 节。"
      ],
      [
        "   - 对 `did:wba` 的 `e1_` DID，必须（MUST）基于 `proof.verificationMethod` 对应的 Ed25519 公钥验证 DID 绑定关系，而不是在 `authentication` 中任意选择一个 Ed25519 key：\n     - `proof` 必须存在并通过 `eddsa-jcs-2022` 校验；\n     - 用该公钥重新计算 RFC 7638 thumbprint，结果必须（MUST）与 DID 路径最后的 `e1_` 指纹段完全一致。",
        "   - 方法特有的身份绑定验证按对应 DID 方法规范执行，见第 2 节和相应方法绑定。"
      ],
      [
        "2. 选择用于签名的验证方法。对于采用绑定指纹路径的 `did:wba`，默认情况下，应优先使用绑定密钥。",
        "2. 根据适用 DID 方法及本地授权策略选择用于签名的验证方法。"
      ],
      [
        "   - 如果 DID 使用 `Multikey` 表示的 Ed25519 绑定密钥（对应 `e1_` profile），应使用 Ed25519 算法进行签名；",
        "   - 如果所选验证方法使用 `Multikey` 表示的 Ed25519 密钥，应使用 Ed25519 算法进行签名；"
      ],
      [
        "> 说明：  \n> 如果实现同时支持[附录 A](../附录A：did-wba-k1_兼容扩展.md) 的 `k1_` 兼容扩展，则对 `k1_` DID 的认证签名可按[附录 A](../附录A：did-wba-k1_兼容扩展.md) 执行。",
        "方法特有的签名生成要求由对应 DID 方法规范定义，见第 2 节。"
      ],
      [
        "> 说明：  \n> 如果实现同时支持[附录 A](../附录A：did-wba-k1_兼容扩展.md) 的 `k1_` 兼容扩展，则对 `k1_` DID 的绑定验证和认证验证应按[附录 A](../附录A：did-wba-k1_兼容扩展.md) 执行。",
        "方法特有的身份验证要求由对应 DID 方法规范定义，见第 2 节。"
      ],
      [
        "对于需要稳定对外引用、但又希望底层 DID 可轮换的场景，推荐结合名称服务（如 WNS/Handle）使用：Handle 保持稳定和人类可读，底层 did:wba 可以随着绑定密钥变化而轮换。",
        "名称服务（如 WNS/Handle）可提供稳定的人类可读名称；名称绑定和 DID 生命周期分别由对应规范处理。"
      ],
      [
        "did:wba DID 文档只声明可以用于 `authentication` 的验证方法，不再定义 `humanAuthorization` 字段。",
        "DID Document 通过 `authentication` 声明认证验证方法；本认证规范不定义 `humanAuthorization` 字段。"
      ],
      [
        "##### 3.2.4.3 409 DID 已被替代",
        "##### 3.2.4.3 方法特有响应"
      ],
      [
        "WBA DID 已被替代时，响应条件、状态码、字段及重试流程遵循 [ANP-03：409 DID 已被替代](03-did-wba方法规范.md#http-superseded)。",
        "身份状态相关的错误与后续处理由适用 DID 方法定义，参见相应方法绑定。通用认证错误使用第 3.2.4.1、3.2.4.2 节的规则。"
      ],
      [
        "<a id=\"security-privacy\"></a>\n## 7. 安全考虑\n\n实现者在实现的时候，需要考虑以下几个方面的安全性问题：\n\n1. **密钥管理**\n\n   - DID对应的私钥**必须**妥善保管，绝对不能泄露。另外，**应该**建立私钥定期刷新机制。\n   - 对于采用默认路径方案的 `did:wba`，绑定密钥最好使用硬件隔离、HSM 或系统安全区保管。\n   - 对于采用绑定密钥的 `did:wba`，默认情况下，跨平台身份认证应优先使用绑定密钥进行签名。\n   - 新的 WBA 部署应当（SHOULD）优先采用 `e1_` profile。\n   - 用户**应该**生成多个DID，每个DID具有不同的角色和权限，使用不同的密钥对，实现细粒度的权限控制。\n   - 当绑定密钥发生变化时，路径型 DID 会随之变化，因此**应该**同步更新上层名称服务映射。\n\n2. **防攻击措施**\n\n   - 服务端**必须**实现重放防护。对于直连 proof profile，应针对 `(keyid, nonce)`、`(keyid, jti)` 或等价键建立短期 replay cache；对于 challenge profile，服务端下发的 `nonce` **必须**一次一用。\n   - 服务端**必须**判断请求中的 `created` / `expires` 时间窗口，防止时间回滚攻击。一般情况下，服务端对 replay cache 的缓存时间长度**应该**大于签名过期时间长度。\n   - 生成 `nonce` 时，**必须**使用操作系统提供的安全随机数生成器，要符合现代密码学安全规范和标准。比如可以使用类似 Python `secrets` 模块生成安全随机数。\n   - 当请求存在消息体时，服务端**必须**验证 `Content-Digest`，防止消息体被篡改。\n   - 认证成功不等于授权成功。服务端**必须**将授权判断与身份认证分开处理。\n   - 对于活动的 `did:wba` E1 DID，解析器必须（MUST）验证 `DataIntegrityProof`。已停用 `e1_` transition 文档按 [2.5.5 节](03-did-wba方法规范.md#wba-method-rules)的 binding、recovery、provider-asserted 和 unverified 规则处理；对于其他 profile，如果实现启用了 DID Document proof 校验，则应当（SHOULD）按对应 profile 规则验证 `proof`。\n   - WBA 的稳定主体路径不得（MUST NOT）被回收或重新分配；验证者不得（MUST NOT）仅通过删除最后一个绑定指纹 segment 来合并两个 DID。\n   - 验证者按 WBA 方法跟随 `successorDid` 时必须（MUST）限制链长、检测循环，并拒绝稳定主体路径不一致或同一旧 DID 出现多个后继的情况。\n\n3. **传输安全**\n\n   - 服务端在获取DID文档时，**应该**使用 DNS-over-HTTPS（DoH）协议，以提高安全性。\n   - 传输协议**必须**使用 HTTPS，并且客户端**必须**严格判断对方 CA 证书是否可信。\n   - 客户端在进行 TLS 服务身份校验时，**必须**按 `subjectAltName` 中的 `dNSName` 进行匹配，不应依赖 Common Name。\n   - 在 DID 解析过程中，**应该**避免无条件跟随不受信任的跨源重定向。\n\n4. **令牌安全**\n\n   - 客户端和服务端**必须**对 Access Token 进行妥善保管，并且**必须**设置合理的过期时间。\n   - **应该**优先采用 sender-constrained access token。本规范已经预留扩展能力，但尚未完整定义具体 profile。\n   - IP 地址、User-Agent 等信息只能作为辅助风险信号，**不应**作为 Access Token 唯一绑定机制。\n   - access token **应该**只在 HTTPS 连接上返回，并通过 `Authentication-Info` 响应头发送。\n\n",
        "<a id=\"security-privacy\"></a>\n## 7. 安全考虑\n\n实现者在实现的时候，需要考虑以下几个方面的安全性问题：\n\n1. **密钥管理**\n\n   - DID对应的私钥**必须**妥善保管，绝对不能泄露。另外，**应该**建立私钥定期刷新机制。\n   - 用户**应该**生成多个DID，每个DID具有不同的角色和权限，使用不同的密钥对，实现细粒度的权限控制。\n\n2. **防攻击措施**\n\n   - 服务端**必须**实现重放防护。对于直连 proof profile，应针对 `(keyid, nonce)`、`(keyid, jti)` 或等价键建立短期 replay cache；对于 challenge profile，服务端下发的 `nonce` **必须**一次一用。\n   - 服务端**必须**判断请求中的 `created` / `expires` 时间窗口，防止时间回滚攻击。一般情况下，服务端对 replay cache 的缓存时间长度**应该**大于签名过期时间长度。\n   - 生成 `nonce` 时，**必须**使用操作系统提供的安全随机数生成器，要符合现代密码学安全规范和标准。比如可以使用类似 Python `secrets` 模块生成安全随机数。\n   - 当请求存在消息体时，服务端**必须**验证 `Content-Digest`，防止消息体被篡改。\n   - 认证成功不等于授权成功。服务端**必须**将授权判断与身份认证分开处理。\n\n3. **传输安全**\n\n   - 服务端在获取DID文档时，**应该**使用 DNS-over-HTTPS（DoH）协议，以提高安全性。\n   - 传输协议**必须**使用 HTTPS，并且客户端**必须**严格判断对方 CA 证书是否可信。\n   - 客户端在进行 TLS 服务身份校验时，**必须**按 `subjectAltName` 中的 `dNSName` 进行匹配，不应依赖 Common Name。\n   - 在 DID 解析过程中，**应该**避免无条件跟随不受信任的跨源重定向。\n\n4. **令牌安全**\n\n   - 客户端和服务端**必须**对 Access Token 进行妥善保管，并且**必须**设置合理的过期时间。\n   - **应该**优先采用 sender-constrained access token。本规范已经预留扩展能力，但尚未完整定义具体 profile。\n   - IP 地址、User-Agent 等信息只能作为辅助风险信号，**不应**作为 Access Token 唯一绑定机制。\n   - access token **应该**只在 HTTPS 连接上返回，并通过 `Authentication-Info` 响应头发送。\n\n"
      ],
      [
        "did:wba:example.com:user:alice:e1_<fingerprint>",
        "did:web:identity.example:alice"
      ]
    ],
    "web": [
      [
        "在兼容模式下，实现**不得（MUST NOT）**对原生 `did:web` 强制执行以下 did:wba 特有检查：\n\n- `e1_` / `k1_` 路径绑定公钥指纹检查；\n- did:wba 主规范中的路径绑定 profile 语义检查；\n- did:wba 特有的路径型 DID 轮换语义检查；\n- 将 did:wba 特有 proof 规则作为 `did:web` 解析成功的前提条件。",
        "实现**不得（MUST NOT）**将其他 DID 方法特有的标识符绑定、文档证明或生命周期规则作为原生 `did:web` 验证成功的前提。"
      ],
      [
        "如果原生 `did:web` DID Document 自身携带了标准 proof（例如 Data Integrity proof），实现可以（MAY）按照该 proof 的声明 profile 和本地策略执行验证；但 `did:web` 解析成功本身不以 did:wba 的 `proof` 规则为前提。",
        "如果原生 `did:web` DID Document 自身携带了标准 proof（例如 Data Integrity proof），实现可以（MAY）按照该 proof 的声明 profile 和本地策略执行验证；其他方法的文档证明要求不适用于原生 `did:web`。"
      ],
      [
        "兼容模式下，`did:web` 的身份绑定语义来自 `did:web` 的解析结果本身，而不是 did:wba 的路径绑定公钥指纹。",
        "`did:web` 的身份绑定语义由其自身的方法解析与验证规则确定。"
      ],
      [
        "5. 随后的 HTTP Message Signatures / `Content-Digest` 验证逻辑与 did:wba 相同。",
        "5. 随后的 HTTP Message Signatures / `Content-Digest` 验证逻辑遵循第 3、4 章的共同认证流程。"
      ]
    ],
    "relocated": [
      "   - 对于采用默认路径方案的 `did:wba`，绑定密钥最好使用硬件隔离、HSM 或系统安全区保管。",
      "   - 对于采用绑定密钥的 `did:wba`，默认情况下，跨平台身份认证应优先使用绑定密钥进行签名。",
      "   - 新的 WBA 部署应当（SHOULD）优先采用 `e1_` profile。",
      "   - 当绑定密钥发生变化时，路径型 DID 会随之变化，因此**应该**同步更新上层名称服务映射。",
      "   - 对于活动的 `did:wba` E1 DID，解析器必须（MUST）验证 `DataIntegrityProof`。已停用 `e1_` transition 文档按 [2.5.5 节](03-did-wba方法规范.md#wba-method-rules)的 binding、recovery、provider-asserted 和 unverified 规则处理；对于其他 profile，如果实现启用了 DID Document proof 校验，则应当（SHOULD）按对应 profile 规则验证 `proof`。",
      "   - WBA 的稳定主体路径不得（MUST NOT）被回收或重新分配；验证者不得（MUST NOT）仅通过删除最后一个绑定指纹 segment 来合并两个 DID。",
      "   - 验证者按 WBA 方法跟随 `successorDid` 时必须（MUST）限制链长、检测循环，并拒绝稳定主体路径不一致或同一旧 DID 出现多个后继的情况。",
      "对于采用 E1 profile 的 `did:wba`，默认情况下，客户端应当（SHOULD）使用 DID 路径最后 `e1_` 指纹段对应的**绑定密钥**进行签名。服务端如果允许其他 `authentication` 验证方法，属于本地授权策略，不改变 DID 的绑定语义。",
      "   - 对 `did:wba` 的 `e1_` DID，必须（MUST）基于 `proof.verificationMethod` 对应的 Ed25519 公钥验证 DID 绑定关系，而不是在 `authentication` 中任意选择一个 Ed25519 key：\n     - `proof` 必须存在并通过 `eddsa-jcs-2022` 校验；\n     - 用该公钥重新计算 RFC 7638 thumbprint，结果必须（MUST）与 DID 路径最后的 `e1_` 指纹段完全一致。",
      "对于需要稳定对外引用、但又希望底层 DID 可轮换的场景，推荐结合名称服务（如 WNS/Handle）使用：Handle 保持稳定和人类可读，底层 did:wba 可以随着绑定密钥变化而轮换。",
      "> 说明：  \n> 如果实现同时支持[附录 A](../附录A：did-wba-k1_兼容扩展.md) 的 `k1_` 兼容扩展，则对 `k1_` DID 的认证签名可按[附录 A](../附录A：did-wba-k1_兼容扩展.md) 执行。",
      "> 说明：  \n> 如果实现同时支持[附录 A](../附录A：did-wba-k1_兼容扩展.md) 的 `k1_` 兼容扩展，则对 `k1_` DID 的绑定验证和认证验证应按[附录 A](../附录A：did-wba-k1_兼容扩展.md) 执行。",
      "4. **读取 DID 文档**：根据 DID 解析 DID 文档。若文档设置 `deactivated = true`，服务端不得（MUST NOT）继续使用该 DID 完成新的身份认证；当文档包含 `successorDid` 时，应按 [本章的 409 响应](#http-superseded)返回 DID 已被替代的错误。"
    ]
  }
};
for (const pair of extractionPairs) {
  const original = read(pair.source, true);
  const candidate = read(pair.target, false);
  const originalBody = between(original, '## 3. ', '## 8. ');
  let extracted = between(candidate, '## 3. ', '<a id="wba-binding">');
  const separation = authMethodSeparationChanges[pair.cn ? 'cn' : 'en'];
  for (const rule of separation.relocated) {
    const methodRule = rule.startsWith('4. **') ? rule.slice(3) : rule;
    assert(read(pair.source, false).includes(methodRule), 'WBA-specific rule missing from ANP-03');
  }
  assert(!/e1_|k1_|\bE1\b|\bK1\b|RFC 7638|绑定密钥|绑定指纹|路径绑定公钥指纹|stable subject path|successorDid/.test(candidate), 'Method-specific WBA detail leaked into ANP-02');
  for (const [before, after] of [...separation.main].reverse()) {
    assert(extracted.includes(after), 'Missing approved method-independent wording: ' + after.slice(0,100));
    extracted = extracted.split(after).join(before);
  }
  extracted = extracted.replace(/^<a id="(?:json-carriage|access-tokens|challenge-errors|security-privacy)"><\/a>\n/gm, '');
  for (const [before, after] of authEditorialChanges[pair.cn ? 'cn' : 'en']) {
    assert.equal(extracted.split(after).length, 2, 'Missing or repeated approved editorial wording');
    extracted = extracted.replace(after, before);
  }
  for (const number of [3, 4]) {
    const originalHeading = originalBody.split('\n').find(line => line.startsWith('## ' + number + '. '));
    const newHeading = extracted.split('\n').find(line => line.startsWith('## ' + number + '. '));
    extracted = extracted.replace(newHeading, originalHeading);
  }
  const old409 = between(originalBody, '##### 3.2.4.3 ', '## 4. ');
  const new409 = between(extracted, '##### 3.2.4.3 ', '## 4. ');
  const expected409Link = pair.cn ? '03-did-wba方法规范.md#http-superseded' : '03-did-wba-method-design-specification.md#http-superseded';
  assert(new409.includes('](' + expected409Link + ')'), 'Missing relocated WBA 409 reference');
  const retained409 = between(read(pair.source, false), '### 3.2 WBA ', '## 4. ').split('\n').slice(1).join('\n');
  assert.equal(retained409, old409.split('\n').slice(1).join('\n'), 'WBA 409 body changed');
  extracted = extracted.replace(new409, old409);
  const referenceReplacements = pair.cn ? [
    ['[附录 A](../附录A：did-wba-k1_兼容扩展.md)', '附录 A'],
    ['[2.5.5 节](03-did-wba方法规范.md#wba-method-rules)', '2.5.5 节'],
  ] : [
    ['[Appendix A](../appendix-a-did-wba-k1-compatibility-extension.md)', 'Appendix A'],
    ['[Section 2.5.5](03-did-wba-method-design-specification.md#wba-method-rules)', 'Section 2.5.5'],
  ];
  for (const [link, label] of referenceReplacements) extracted = extracted.split(link).join(label);
  assert.equal(extracted, originalBody, 'Authentication text differs beyond extraction-only changes: ' + pair.target);
  const originalWeb = between(read(pair.web, true), '### B.2 ', '### B.4 ');
  let copiedWeb = between(candidate, '### B.1 ', '<a id="webvh-design">').replace('### B.2 ', '### B.3 ').replace('### B.1 ', '### B.2 ');
  for (const [before, after] of [...separation.web].reverse()) {
    assert(copiedWeb.includes(after));
    copiedWeb = copiedWeb.split(after).join(before);
  }
  assert.equal(copiedWeb, originalWeb, 'Web authentication compatibility text changed');
}
// WNS rollback guard: keep original WBA binding and Provider behavior,
// and the original native Web domain-declaration compatibility body.
for (const cn of [false, true]) {
  const name = cn ? 'chinese/vnext/04-ANP-基于DID-WBA的命名空间规范.md' : 'vnext/04-anp-did-wba-name-space-specification.md';
  const original = read(name, true);
  const candidate = read(name, false).replace(/^<a id="(?:method-resolution|binding-verification|binding-management)"><\/a>\n/gm, '');
  for (const [start, end] of [['### 4.4 ', '### 4.5 '], ['## 6.', '## 7.'], ['## 8.', '## 9.'], ['## 11.', cn ? '## 附录 A' : '## Appendix A']]) {
    assert.equal(between(candidate, start, end), between(original, start, end), 'WBA WNS behavior changed: ' + name + ' ' + start);
  }
  const oldWeb = cn ? 'chinese/附录B：与原生did-web-的兼容.md' : 'appendix-b-compatibility-with-native-did-web.md';
  const newWeb = cn ? 'chinese/vnext/附录B：与原生did-web-的兼容.md' : 'vnext/appendix-b-compatibility-with-native-did-web.md';
  const body = between(read(oldWeb, true), '### B.4 ', '### B.5 ').split('\n').slice(1).join('\n').trimStart();
  const link = cn ? '04-ANP-基于DID-WBA的命名空间规范.md' : '04-anp-did-wba-name-space-specification.md';
  const expected = body.split('](' + link + ')').join('](../' + link + ')');
  const actual = between(read(newWeb, false), '## B.4 ', '## B.5 ');
  assert(actual.endsWith(expected), 'Legacy Web Handle binding text changed');
}
const currentAuth = read(mirrorPairs[0][0], false);
const requiredAuthAnchors = ['scope', 'identity-input', 'common-model', 'http-binding', 'json-carriage', 'challenge-errors', 'access-tokens', 'security-privacy', 'wba-binding', 'web-binding', 'webvh-design', 'method-template'];
for (const anchor of requiredAuthAnchors) assert(parsed(mirrorPairs[0][0], false).anchors.has(anchor));
assert(currentAuth.includes('Draft / not released'));
assert(currentAuth.includes('no normative dependency on Messaging P1–P9 or WNS'));
const preserved = [...knownPaths].filter(name => name.endsWith('.md') && (
  name.startsWith('deprecated/') || name.startsWith('chinese/deprecated/') ||
  name.startsWith('message/') && !name.startsWith('message/vnext/') ||
  name.startsWith('chinese/message/') && !name.startsWith('chinese/message/vnext/') ||
  /^(?:chinese\/)?(?:0[1-9]|appendix-|附录)/.test(name)
));
preserved.push('references/did_web-method-specification.html');
// The user separately authorized only these ANP-06 design-origin paragraphs.
// A different paragraph or any other edit still fails the baseline comparison.
const authorizedOriginAdditions = new Map([
  ['06-anp-agent-communication-meta-protocol-specification.md', {
    marker: '## 2. Design Goals and Non-Goals',
    addition: '### 1.1 Design Origins\n\nThe ANP meta-protocol draws inspiration from [Agora Protocol, described in *A Scalable Communication Protocol for Networks of Large Language Models*](https://arxiv.org/html/2410.11905v1), particularly the use of a meta-protocol to negotiate how agents communicate and combine natural-language flexibility with structured-protocol efficiency. ANP adapts these ideas to its own agent description, discovery, identity authentication, and Core Binding architecture; the negotiation interfaces and interoperability requirements are defined by this specification.\n\n',
  }],
  ['chinese/06-ANP-智能体通信元协议规范.md', {
    marker: '## 2. 设计目标与非目标',
    addition: '### 1.1 设计来源\n\nANP 元协议的设计参考和借鉴了 [Agora Protocol（论文：*A Scalable Communication Protocol for Networks of Large Language Models*）](https://arxiv.org/html/2410.11905v1)，尤其是通过元协议协商智能体通信方式、结合自然语言的灵活性与结构化协议效率的思路。ANP 将这些思路与自身的智能体描述、发现、身份认证和 Core Binding 架构结合；具体协商接口和互操作要求由本规范定义。\n\n',
  }],
]);
for (const filename of preserved) {
  const baselineText = read(filename, true);
  const authorized = authorizedOriginAdditions.get(filename);
  let expectedText = baselineText;
  if (authorized && !baselineText.includes(authorized.addition)) {
    assert.equal(baselineText.split(authorized.marker).length, 2, 'Ambiguous origin insertion point');
    expectedText = baselineText.replace(authorized.marker, authorized.addition + authorized.marker);
  }
  const before = crypto.createHash('sha256').update(expectedText).digest('hex');
  const after = crypto.createHash('sha256').update(fs.readFileSync(path.join(root, filename))).digest('hex');
  assert.equal(after, before, 'Published/historical document modified: ' + filename);
}
const scenarioFile = 'examples/did-authentication-vnext/scenario-vectors.json';
const scenarioData = JSON.parse(read(scenarioFile, false));
for (const scenario of scenarioData.scenarios) {
  for (const target of scenario.normative_refs) {
    const problem = checkTarget(scenarioFile, target, false);
    if (problem) errors.push({file: scenarioFile, scenario: scenario.id, target, reason: problem});
  }
}
const report = {result: errors.length ? 'FAIL' : 'PASS', source_commit: sourceCommit, scope: 'changed-documents-and-new-candidate-artifacts', documents: documents.length, local_links_checked: localLinks, parseable_json_examples: jsonExamples, preserved_documents: preserved.length, exact_authorized_origin_additions: authorizedOriginAdditions.size, mirror_pairs_checked: mirrorPairs.length + modifiedMirrorPairs.length, profile_metadata_pairs_checked: 9, verbatim_authentication_pairs_checked: extractionPairs.length, original_wns_and_web_binding_pairs_checked: 2, new_errors: errors, preexisting_diagnostics: inherited, sdk_or_product_tests_run: false};
console.log(JSON.stringify({...report, preexisting_diagnostics: {count: inherited.length, details: inherited}}, null, 2));
process.exitCode = errors.length ? 1 : 0;
