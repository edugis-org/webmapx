import { test } from 'node:test';
import assert from 'node:assert/strict';
import { escapeHtml } from '../src/utils/toast.js';

test('escapeHtml neutralises markup from a ?config= parameter', () => {
  assert.equal(
    escapeHtml('config/<img src=x onerror="alert(1)">.json'),
    'config/&lt;img src=x onerror=&quot;alert(1)&quot;&gt;.json',
  );
});

test('escapeHtml escapes ampersands first and quotes, and stringifies non-strings', () => {
  assert.equal(escapeHtml(`a&b 'c'`), 'a&amp;b &#39;c&#39;');
  assert.equal(escapeHtml(404), '404');
});
