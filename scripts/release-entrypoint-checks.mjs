// Copyright (c) 2024 ANP Open Source Community. Apache-2.0.
// Focused release-entry checks. These are documentation guards, not conformance tests.
export const readerGuides = [
  {file: 'docs/anp-getting-started-guide.md', auth: '../02-anp-did-authentication-protocol-specification.md', reading: '## Recommended Reading Path'},
  {file: 'docs/chinese/ANP入门指南.md', auth: '../../chinese/02-ANP-基于DID的身份认证协议.md', reading: '## 推荐阅读路径'},
  {file: 'docs/did-wba入门指南.md', auth: '../chinese/02-ANP-基于DID的身份认证协议.md'},
];
export const paymentDocuments = [
  {file: 'application/10-anp-agent-payment-protocol-specification.md', version: '1.1'},
  {file: 'chinese/application/10-ANP-智能体支付协议规范.md', version: '0.1'},
];

export function checkReaderGuide(guide, text) {
  const errors = [];
  const check = (condition, reason) => { if (!condition) errors.push({file: guide.file, reason}); };
  const links = [...text.matchAll(/\[[^\]\n]*\]\(([^)\n]+)\)/g)].map(match => match[1]);
  check(/^- (?:Specification [Ss]et: |规范集：)ANP 1\.2$/m.test(text), 'guide-version-not-1.2');
  check(!/ANP(?:-03)?\s+v?1\.1\b|Version: 1\.1|版本：1\.1/.test(text), 'guide-stale-version-claim');
  check(links.some(link => link.split('#')[0] === guide.auth), 'guide-missing-current-auth-link');
  check(links.includes(guide.auth + '#http-binding'), 'guide-missing-current-http-binding');
  check(!links.some(link => /(?:^|\/)vnext\//.test(link)), 'guide-links-to-archived-contract');
  check(!/Authorization:\s*DIDWba\b/i.test(text), 'guide-legacy-auth-header');
  for (const header of ['Signature-Input', 'Signature', 'Content-Digest']) {
    check(text.includes('`' + header + '`'), 'guide-missing-auth-component:' + header);
  }
  check(!/anp\.(?:group\.base|direct\.e2ee|group\.e2ee)\.v1\b/.test(text), 'guide-stale-wire-example');
  if (guide.reading) {
    const start = text.indexOf(guide.reading + '\n');
    const tail = start < 0 ? '' : text.slice(start + guide.reading.length);
    const section = tail.split(/\n#{1,3} /)[0];
    const auth = section.indexOf('ANP-02');
    const method = section.indexOf('ANP-03');
    check(start >= 0 && auth >= 0 && method > auth, 'guide-auth-reading-order');
    for (const profile of ['anp.group.base.v2', 'anp.direct.e2ee.v2', 'anp.group.e2ee.v2']) {
      check(text.includes('`' + profile + '`'), 'guide-missing-current-profile:' + profile);
    }
    check(/^\|[^\n]*P6[^\n]*(?:candidate|候选)/im.test(text) && text.includes('0xF0A1'), 'guide-p6-gate-missing');
    check(/ANP-06[^\n]*(?:draft|草案)/i.test(text), 'guide-meta-draft-status-missing');
    check(/AP2[^\n]*(?:draft|草案)/i.test(text), 'guide-payment-draft-status-missing');
  }
  return errors;
}

export function checkPaymentMetadata(document, text) {
  const errors = [];
  const check = (condition, reason) => { if (!condition) errors.push({file: document.file, reason}); };
  // Deliberately limit this check to status metadata; payment payloads are independently versioned.
  const header = text.split(/^## (?:Abstract|摘要)\s*$/m)[0];
  check(/^#[^\n]*(?:\(Draft\)|（草案）)$/m.test(header), 'payment-title-not-draft');
  check(/^- (?:Status: Draft \/ not released|状态：草案 \/ 未发布)$/m.test(header), 'payment-status-not-draft');
  const version = header.match(/^- (?:Version: |版本：)(\S+)$/m)?.[1];
  check(version === document.version, 'payment-independent-version-changed');
  return errors;
}
