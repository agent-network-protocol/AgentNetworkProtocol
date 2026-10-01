// Copyright (c) 2024 ANP Open Source Community. Apache-2.0.
// In-memory regressions for the release reader-entry and payment metadata guards.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';
import {readerGuides, paymentDocuments, checkReaderGuide, checkPaymentMetadata} from '../scripts/release-entrypoint-checks.mjs';

const read = name => fs.readFileSync(new URL('../' + name, import.meta.url), 'utf8');
const reasons = errors => errors.map(error => error.reason);
const guide = readerGuides[0];
const current = read(guide.file);

for (const entry of readerGuides) {
  test('current reader guide passes: ' + entry.file, () => {
    assert.deepEqual(checkReaderGuide(entry, read(entry.file)), []);
  });
}

test('English specification-set metadata accepts both existing capitalizations', () => {
  for (const label of ['Specification Set:', 'Specification set:']) {
    const text = current.replace(/Specification [Ss]et:/, label);
    assert.deepEqual(checkReaderGuide(guide, text), []);
  }
});

const regressions = [
  ['old document version', value => value.replace('ANP 1.2', 'ANP 1.1'), 'guide-version-not-1.2'],
  ['stale current-version prose', value => value + '\nThe current specification set is ANP 1.1.\n', 'guide-stale-version-claim'],
  ['missing current authentication link', value => value.replaceAll(guide.auth, '../03-did-wba-method-design-specification.md'), 'guide-missing-current-auth-link'],
  ['archived authentication link', value => value + '\n[Authentication](../vnext/02-anp-did-authentication-protocol-specification.md)\n', 'guide-links-to-archived-contract'],
  ['legacy authentication wire example', value => value + '\n```text\nAuthorization: DIDWba did="example"\n```\n', 'guide-legacy-auth-header'],
  ['old direct E2EE advertisement', value => value + '\n```json\n{"profiles":["anp.direct.e2ee.v1"]}\n```\n', 'guide-stale-wire-example'],
  ['missing digest guidance', value => value.replaceAll('`Content-Digest`', 'body digest'), 'guide-missing-auth-component:Content-Digest'],
  ['authentication reading order reverted to ANP-03', value => {
    const start = value.indexOf(guide.reading);
    return value.slice(0, start) + value.slice(start).replace('ANP-02', 'ANP-03');
  }, 'guide-auth-reading-order'],
  ['P6 registration gate lost', value => value.replaceAll('0xF0A1', 'extension-value'), 'guide-p6-gate-missing'],
];
for (const [name, mutate, expected] of regressions) {
  test('rejects ' + name, () => {
    const changed = mutate(current);
    assert.notEqual(changed, current, 'Mutation must change the fixture');
    assert(reasons(checkReaderGuide(guide, changed)).includes(expected));
  });
}

for (const entry of paymentDocuments) {
  test('payment remains an independent draft: ' + entry.file, () => {
    const text = read(entry.file);
    assert.deepEqual(checkPaymentMetadata(entry, text), []);
    const released = text.replace(/^- (?:Status: Draft \/ not released|状态：草案 \/ 未发布)$/m, '- Status: Released');
    assert.notEqual(released, text);
    assert(reasons(checkPaymentMetadata(entry, released)).includes('payment-status-not-draft'));
    const renumbered = text.replace(/^- (?:Version: |版本：)\S+$/m, '- Version: 1.2');
    assert(reasons(checkPaymentMetadata(entry, renumbered)).includes('payment-independent-version-changed'));
  });
}

test('payment status guard does not reject a historical editorial explanation', () => {
  const entry = paymentDocuments[0];
  const text = read(entry.file).replace('## Abstract', '> The earlier metadata incorrectly said `Released`.\n\n## Abstract');
  assert.deepEqual(checkPaymentMetadata(entry, text), []);
});

// Additional bilingual coverage for the integrated reader-entry guards.
for (const entry of readerGuides) {
  test('HTTP binding remains explicit: ' + entry.file, () => {
    const text = read(entry.file);
    const changed = text.replaceAll(entry.auth + '#http-binding', entry.auth);
    assert.notEqual(changed, text);
    assert(reasons(checkReaderGuide(entry, changed)).includes('guide-missing-current-http-binding'));
  });
}
for (const entry of readerGuides.slice(1)) {
  test('Chinese onboarding rejects stale version, auth and archive links: ' + entry.file, () => {
    const text = read(entry.file);
    assert(reasons(checkReaderGuide(entry, text.replaceAll('ANP 1.2', 'ANP 1.1'))).includes('guide-stale-version-claim'));
    const archived = entry.auth.replace(/([^/]+)$/, 'vnext/$1');
    assert(reasons(checkReaderGuide(entry, text.replaceAll(entry.auth, archived))).includes('guide-links-to-archived-contract'));
    assert(reasons(checkReaderGuide(entry, text + '\nAuthorization: DIDWba did="example"\n')).includes('guide-legacy-auth-header'));
  });
}
for (const entry of readerGuides.filter(item => item.reading)) {
  test('draft status boundaries remain explicit: ' + entry.file, () => {
    const text = read(entry.file);
    assert(reasons(checkReaderGuide(entry, text.replaceAll('ANP-06', 'meta-protocol'))).includes('guide-meta-draft-status-missing'));
    assert(reasons(checkReaderGuide(entry, text.replaceAll('AP2', 'payment-adaptation'))).includes('guide-payment-draft-status-missing'));
    assert(reasons(checkReaderGuide(entry, text.replaceAll('candidate', 'stable').replaceAll('候选', '稳定'))).includes('guide-p6-gate-missing'));
  });
}
