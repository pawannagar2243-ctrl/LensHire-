import test from 'node:test';
import assert from 'node:assert/strict';
import { mergeUniqueFiles } from './cameraImageSelection.js';

const makeFile = (name, size = 1024, lastModified = 1) =>
  new File([new Uint8Array(size)], name, { type: 'image/jpeg', lastModified });

test('mergeUniqueFiles appends new files without dropping earlier selections', () => {
  const first = makeFile('one.jpg');
  const second = makeFile('two.jpg');
  const third = makeFile('three.jpg');

  const merged = mergeUniqueFiles([first, second], [second, third], 8);

  assert.deepEqual(merged.map((file) => file.name), ['one.jpg', 'two.jpg', 'three.jpg']);
});

test('mergeUniqueFiles respects maxAllowed limit', () => {
  const files = [
    makeFile('one.jpg'),
    makeFile('two.jpg'),
    makeFile('three.jpg'),
    makeFile('four.jpg'),
  ];

  const merged = mergeUniqueFiles([], files, 3);

  assert.equal(merged.length, 3);
  assert.deepEqual(merged.map((file) => file.name), ['one.jpg', 'two.jpg', 'three.jpg']);
});
