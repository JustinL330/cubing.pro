import { test } from 'node:test';
import assert from 'node:assert/strict';
import { average, format } from '../src/views/Practice/timer-model.ts';
const solve = (ms, penalty = 'none') => ({ id: crypto.randomUUID(), ms, penalty, scramble: 'R', puzzle: '333', session: '1', date: new Date().toISOString() });
test('timer trims extremes, applies penalties and handles DNF', () => {
  assert.equal(format(60010), '1:00.01');
  assert.equal(average([1,2,3,4].map(x => solve(x * 1000)), 5), '—');
  assert.equal(average([10,11,12,13,100].map(x => solve(x * 1000)), 5), '12.00');
  assert.equal(average([solve(1000),solve(2000),solve(3000),solve(4000),solve(100,'DNF')], 5), '3.00');
  assert.equal(average([solve(1000),solve(2000),solve(3000),solve(10,'DNF'),solve(10,'DNF')], 5), 'DNF');
  assert.equal(average([solve(1000),solve(2000,'+2'),solve(3000),solve(4000),solve(5000)], 5), '3.66');
});
