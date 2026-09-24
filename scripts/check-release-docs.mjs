// Copyright (c) 2024 ANP Open Source Community. Apache-2.0.
// Documentation promotion checks; does not establish SDK or product conformance.
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {readerGuides, paymentDocuments, checkReaderGuide, checkPaymentMetadata} from './release-entrypoint-checks.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = name => fs.readFileSync(path.join(root, name), 'utf8');
const list = dir => fs.readdirSync(path.join(root, dir)).filter(name => name.endsWith('.md')).map(name => path.posix.join(dir, name));
const core = [...list('.'), ...list('chinese')].filter(name => /^(?:chinese\/)?(?:0[1-9]-|appendix-|附录)/.test(name));
const messages = [...list('message'), ...list('chinese/message')];
const archiveIndexes = ['vnext/README.md', 'vnext/chinese/README.md', 'vnext/message/README.md', 'vnext/chinese/message/README.md', 'chinese/vnext/README.md', 'message/vnext/README.md', 'chinese/message/vnext/README.md'];
const unifiedArchiveDirectories = [['vnext', 'vnext'], ['chinese/vnext', 'vnext/chinese'], ['message/vnext', 'vnext/message'], ['chinese/message/vnext', 'vnext/chinese/message']];
const unifiedArchive = [...list('vnext'), ...list('vnext/chinese'), ...list('vnext/message'), ...list('vnext/chinese/message')].filter(name => !name.endsWith('/README.md'));
const exampleIndexes = ['examples/message-vnext/README.md', 'examples/message-vnext/README.cn.md', 'examples/did-authentication-vnext/README.md', 'examples/did-authentication-vnext/README.cn.md'];
const documents = [...new Set([...core, ...messages, 'README.md', 'README.cn.md', ...archiveIndexes, ...exampleIndexes, ...readerGuides.map(guide => guide.file)])].sort();
const errors = [];
const schematicExamples = [];
const cache = new Map();
const check = (condition, item) => { if (!condition) errors.push(item); };

function parse(text) {
  const prose = [], blocks = [], anchors = new Set(), explicit = [];
  const counts = new Map();
  let fence = null;
  for (const [index, line] of text.split('\n').entries()) {
    const match = line.match(/^\s{0,3}(`{3,}|~{3,})(.*)$/);
    if (match) {
      if (!fence) fence = {marker: match[1][0], length: match[1].length, language: match[2].trim(), start: index + 1, lines: []};
      else if (match[1][0] === fence.marker && match[1].length >= fence.length && !match[2].trim()) {
        blocks.push({language: fence.language, text: fence.lines.join('\n'), line: fence.start});
        fence = null;
      } else fence.lines.push(line);
      continue;
    }
    if (fence) { fence.lines.push(line); continue; }
    prose.push(line);
    for (const match of line.matchAll(/\bid=["']([^"']+)["']/g)) { anchors.add(match[1]); explicit.push(match[1]); }
    const heading = line.match(/^#{1,6}\s+(.+?)\s*#*$/);
    if (heading) {
      const slug = heading[1].replace(/!?\[([^\]]*)\]\([^)]*\)/g, '$1').replace(/<[^>]*>/g, '').replace(/[`*]/g, '').toLowerCase().replace(/[^\p{L}\p{N}\p{M}\p{Pc}\-\s]/gu, '').replace(/\s/g, '-');
      const count = counts.get(slug) ?? 0;
      counts.set(slug, count + 1);
      anchors.add(slug + (count ? '-' + count : ''));
    }
  }
  return {prose: prose.join('\n'), blocks, anchors, explicit, unclosed: fence?.start ?? null};
}
function parsed(name) { if (!cache.has(name)) cache.set(name, parse(read(name))); return cache.get(name); }
function targets(text) {
  const links = [];
  for (const match of text.matchAll(/!?\[[^\]\n]*\]\((<[^>]+>|[^)\n]+)\)/g)) links.push(match[1].startsWith('<') ? match[1].slice(1, -1) : match[1].replace(/\s+["'][^"']*["']\s*$/, '').trim());
  for (const match of text.matchAll(/(?:href|src)=["']([^"']+)["']/g)) links.push(match[1]);
  for (const match of text.matchAll(/^\[(?!\^)[^\]]+\]:\s+(\S+)/gm)) links.push(match[1]);
  return links;
}
let localLinks = 0, jsonExamples = 0;
function checkLink(source, target) {
  if (/^[a-z][a-z0-9+.-]*:/i.test(target) || target.startsWith('//')) return;
  localLinks += 1;
  let file, fragment;
  try {
    const split = target.indexOf('#');
    file = decodeURIComponent((split < 0 ? target : target.slice(0, split)).split('?')[0]);
    fragment = decodeURIComponent(split < 0 ? '' : target.slice(split + 1));
  } catch { errors.push({file: source, target, reason: 'invalid-percent-encoding'}); return; }
  const destination = file ? path.posix.normalize(file.startsWith('/') ? file.slice(1) : path.posix.join(path.posix.dirname(source), file)) : source;
  if (destination.startsWith('../')) { errors.push({file: source, target, reason: 'outside-repository'}); return; }
  if (!fs.existsSync(path.join(root, destination))) { errors.push({file: source, target, reason: 'missing-file', destination}); return; }
  if (fragment && destination.endsWith('.md')) check(parsed(destination).anchors.has(fragment), {file: source, target, reason: 'missing-anchor', destination});
  if (fragment && destination.endsWith('.html')) check(read(destination).includes('id="' + fragment + '"') || read(destination).includes("id='" + fragment + "'"), {file: source, target, reason: 'missing-html-anchor'});
}
for (const file of documents) {
  const data = parsed(file);
  check(!data.unclosed, {file, reason: 'unclosed-fence', line: data.unclosed});
  check(new Set(data.explicit).size === data.explicit.length, {file, reason: 'duplicate-explicit-anchor'});
  for (const target of targets(data.prose)) checkLink(file, target);
  for (const block of data.blocks) {
    if (block.language === 'json') {
      try { JSON.parse(block.text); jsonExamples += 1; }
      catch { errors.push({file, reason: 'invalid-json-example', line: block.line}); }
    } else if (block.language === 'text' || block.language === 'jsonc') schematicExamples.push({file, line: block.line});
  }
}
for (const file of unifiedArchive) {
  for (const target of targets(parsed(file).prose)) checkLink(file, target);
}
for (const [original, consolidated] of unifiedArchiveDirectories) {
  for (const source of list(original).filter(name => !name.endsWith('/README.md'))) {
    const destination = path.posix.join(consolidated, path.posix.basename(source));
    check(fs.existsSync(path.join(root, destination)), {source, destination, reason: 'missing-unified-archive-document'});
  }
}
check(unifiedArchive.length === 26, {reason: 'unexpected-unified-archive-coverage', count: unifiedArchive.length});

for (const guide of readerGuides) errors.push(...checkReaderGuide(guide, read(guide.file)));
for (const document of paymentDocuments) errors.push(...checkPaymentMetadata(document, read(document.file)));

const promotedPairs = [];
for (const directory of ['vnext', 'chinese/vnext', 'message/vnext', 'chinese/message/vnext']) {
  for (const source of list(directory).filter(name => !name.endsWith('/README.md'))) {
    const destination = path.posix.join(path.posix.dirname(directory), path.posix.basename(source));
    promotedPairs.push([source, destination]);
    check(fs.existsSync(path.join(root, destination)), {source, destination, reason: 'missing-promoted-document'});
    if (!fs.existsSync(path.join(root, destination))) continue;
    // Fenced wire examples remain byte-identical; relabeling schematic JSON as text is editorial.
    const examples = name => parsed(name).blocks.map(block => block.text);
    check(JSON.stringify(examples(source)) === JSON.stringify(examples(destination)), {source, destination, reason: 'promoted-code-example-changed'});
    const identifiers = name => [...new Set(read(name).match(/\banp\.[a-z0-9_.-]+\.v[0-9]+\b/g) ?? [])].sort();
    check(JSON.stringify(identifiers(source)) === JSON.stringify(identifiers(destination)), {source, destination, reason: 'wire-profile-identifier-changed'});
    const errorRows = name => [...read(name).matchAll(/^\|\s*(\d{4})\s*\|\s*`([^`]+)`/gm)].map(match => match[1] + ':' + match[2]);
    check(JSON.stringify(errorRows(source)) === JSON.stringify(errorRows(destination)), {source, destination, reason: 'wire-error-table-changed'});
  }
}
check(promotedPairs.length === 26, {reason: 'unexpected-promotion-coverage', count: promotedPairs.length});
const normative = [...core, ...messages.filter(name => !name.endsWith('/README.md'))];
for (const file of normative) {
  const text = read(file);
  check(/^- (?:Version: |版本：)1\.2$/m.test(text), {file, reason: 'missing-1.2-document-version'});
  check(!/^-[^\n]*ANP-(?:P[1-9]|0[1-9])-vNext/m.test(text), {file, reason: 'stale-document-id'});
  for (const target of targets(parsed(file).prose)) check(!/(?:^|\/)vnext\//.test(target), {file, target, reason: 'release-reference-to-draft'});
}
const wire = ['anp.core.binding.v1', 'anp.identity.discovery.v1', 'anp.direct.base.v1', 'anp.group.base.v2', 'anp.direct.e2ee.v2', 'anp.group.e2ee.v2', 'anp.attachment.v1', 'anp.federation.relay.v1', null];
for (let i = 1; i <= 9; i += 1) {
  const prefix = String(i).padStart(2, '0') + '-';
  const en = messages.filter(name => name.startsWith('message/' + prefix));
  const cn = messages.filter(name => name.startsWith('chinese/message/' + prefix));
  check(en.length === 1 && cn.length === 1, {reason: 'incomplete-profile-mirrors', profile: i});
  if (en.length !== 1 || cn.length !== 1) continue;
  for (const file of [...en, ...cn]) {
    const text = read(file);
    check(new RegExp('^- (?:Document ID: |文档编号：)ANP-P' + i + '$', 'm').test(text), {file, reason: 'incorrect-profile-document-id'});
    if (wire[i - 1]) check(text.includes('`' + wire[i - 1] + '`'), {file, reason: 'missing-wire-identifier'});
    check(text.includes('ANP Messaging 1.2'), {file, reason: 'incorrect-specification-set'});
    check(i === 6 ? /^- (?:Status: Candidate|状态：候选)/m.test(text) : /^- (?:Status: Released|状态：已发布)$/m.test(text), {file, reason: 'incorrect-profile-status'});
  }
  check(JSON.stringify(parsed(en[0]).explicit) === JSON.stringify(parsed(cn[0]).explicit), {file: en[0], mirror: cn[0], reason: 'mirror-explicit-anchor-mismatch'});
}
for (const file of core.filter(name => /^(?:chinese\/)?06-/.test(name))) check(/^- (?:Status: Draft|状态：Draft|状态：草案)$/m.test(read(file)), {file, reason: 'meta-protocol-draft-status-lost'});
for (const file of messages.filter(name => /\/06-/.test(name))) check(read(file).includes('0xF0A1') && /before releasing v2|发布 v2 前/.test(read(file)), {file, reason: 'p6-release-gate-lost'});
const scenariosFile = 'examples/did-authentication-vnext/scenario-vectors.json';
const scenarios = JSON.parse(read(scenariosFile));
for (const scenario of scenarios.scenarios) {
  check(scenario.execution_status === 'design-only-not-run-against-sdk-or-product', {scenario: scenario.id, reason: 'scenario-execution-claim-changed'});
  for (const target of scenario.normative_refs) {
    check(!/(?:^|\/)vnext\//.test(target), {scenario: scenario.id, target, reason: 'scenario-reference-to-draft'});
    checkLink(scenariosFile, target);
  }
}
console.log(JSON.stringify({result: errors.length ? 'FAIL' : 'PASS', scope: 'anp-1.2-documentation-promotion', documents: documents.length, unified_archive_specifications_checked: unifiedArchive.length, promoted_specifications: promotedPairs.length, bilingual_message_profiles: 9, reader_guides_checked: readerGuides.length, payment_metadata_checked: paymentDocuments.length, local_links_checked: localLinks, parseable_json_examples: jsonExamples, schematic_or_annotated_example_blocks: schematicExamples.length, design_scenario_references_checked: scenarios.scenarios.length, sdk_or_product_tests_run: false, errors}, null, 2));
process.exitCode = errors.length ? 1 : 0;
