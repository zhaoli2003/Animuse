import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import { preparePagesExport } from './prepare-pages-export.mjs';

async function fixture(run) {
  const temporaryRoot = await fs.realpath(os.tmpdir());
  const root = await fs.mkdtemp(path.join(temporaryRoot, 'animuse-pages-export-'));
  const write = async (relative, content = '') => {
    const target = path.join(root, relative);
    await fs.mkdir(path.dirname(target), { recursive: true });
    await fs.writeFile(target, content);
  };
  try {
    await write('index.html', '<!doctype html><title>Fixture</title>');
    await run({ root, write });
  } finally {
    const relative = path.relative(temporaryRoot, path.resolve(root));
    if (relative.startsWith('..') || path.isAbsolute(relative) || !relative.startsWith('animuse-pages-export-')) {
      throw new Error('Temporary cleanup escaped its test directory.');
    }
    await fs.rm(root, { recursive: true, force: true });
  }
}

test('copies real nested segment names byte-for-byte and is repeatable', async () => {
  await fixture(async ({ root, write }) => {
    const text = '中文 /asset';
    const payload = Buffer.from('1:T' + Buffer.byteLength(text).toString(16) + ',' + text + '\n2:{"url":"/original"}\n');
    const source = 'components/__next.!KHNoZWxsKQ/components/__PAGE__.txt';
    const alias = 'components/__next.!KHNoZWxsKQ.components.__PAGE__.txt';
    await write(source, payload);
    await write('docs/animations/demo/__next.!KHNoZWxsKQ/docs/animations/$d$slug/__PAGE__.txt', 'other');
    const first = await preparePagesExport(root);
    assert.equal(first.created, 2);
    assert.equal(first.nojekyllCreated, true);
    assert.deepEqual(await fs.readFile(path.join(root, source)), payload);
    assert.deepEqual(await fs.readFile(path.join(root, alias)), payload);
    assert.equal((await fs.readFile(path.join(root, '.nojekyll'))).length, 0);
    const second = await preparePagesExport(root);
    assert.equal(second.created, 0);
    assert.equal(second.reused, 2);
    assert.equal(second.nojekyllCreated, false);
  });
});

test('rejects a conflicting existing alias before creating any output', async () => {
  await fixture(async ({ root, write }) => {
    await write('a/__next.a/page.txt', 'source');
    await write('a/__next.a.page.txt', 'different existing content');
    await write('b/__next.b/page.txt', 'otherwise safe');
    await assert.rejects(preparePagesExport(root), /Conflicting Next segment alias/);
    assert.equal(await fs.readFile(path.join(root, 'a/__next.a.page.txt'), 'utf8'), 'different existing content');
    await assert.rejects(fs.access(path.join(root, 'b/__next.b.page.txt')));
    await assert.rejects(fs.access(path.join(root, '.nojekyll')));
  });
});

test('rejects ambiguous dotted segment paths', async () => {
  await fixture(async ({ root, write }) => {
    await write('__next.a/b.c.txt', 'one');
    await write('__next.a.b/c.txt', 'two');
    await assert.rejects(preparePagesExport(root), /Ambiguous Next segment alias/);
    await assert.rejects(fs.access(path.join(root, '.nojekyll')));
  });
});

test('rejects hard links before preparing a Pages artifact', async () => {
  await fixture(async ({ root, write }) => {
    await write('payload.txt', 'linked payload');
    await fs.link(path.join(root, 'payload.txt'), path.join(root, 'hard-link.txt'));
    await assert.rejects(preparePagesExport(root), /hard link/);
    await assert.rejects(fs.access(path.join(root, '.nojekyll')));
  });
});

test('rejects linked directories without following them', async () => {
  await fixture(async ({ root, write }) => {
    await write('real/payload.txt', 'inside linked directory');
    await fs.symlink(path.join(root, 'real'), path.join(root, 'linked'), process.platform === 'win32' ? 'junction' : 'dir');
    await assert.rejects(preparePagesExport(root), /symbolic link/);
    await assert.rejects(fs.access(path.join(root, '.nojekyll')));
  });
});
