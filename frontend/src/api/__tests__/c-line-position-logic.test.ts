// `resolveLinePositionSpec` (10d): resolution over the one C-MCL-04 template, plus fail-closed
// negative controls, each proving the guard fires.

import { test } from 'node:test';
import assert from 'node:assert/strict';

import type { CNextTaskResponse } from '@/src/api/generated/openapi-types';
import { EXEMPLAR_ENTRIES, type ExemplarEntry } from '@/src/api/generated/c-prompt-exemplars';
import { resolveLinePositionSpec } from '@/src/features/c-session/archetypes/line-position-logic';
import { resolveArchetype } from '@/src/features/c-session/archetypes/registry';

function makeTask(entry: ExemplarEntry): CNextTaskResponse {
  return {
    blanks: entry.blanks,
    c_task_instance_id: 'task-1',
    difficulty_level: entry.difficulty_level,
    game_family_id: 'C-GF-03',
    game_task_template_id: entry.game_task_template_id,
    interactive_assets: entry.interactive_assets,
    prompt_payload: entry.prompt_payload,
    prompt_text: entry.prompt_text,
    representation_mode: 'TEST_FIXTURE_ONLY_REPRESENTATION',
    request_id: 'req-1',
    scaffold_state: 'C0',
    skill_id: 'number-sense',
    task_index: 1,
    technical_status: 'OK',
    valid_action_space: entry.valid_action_space,
  };
}

const MCL04_ENTRIES = EXEMPLAR_ENTRIES.filter((entry) => entry.game_task_template_id === 'C-MCL-04');

test('C-MCL-04: exactly 5 exemplar rows (difficulty 1-5), all present in the frozen fixture', () => {
  assert.equal(MCL04_ENTRIES.length, 5);
});

test('C-MCL-04: resolves at every difficulty level with intervalMax/targetPosition/positionKey matching the wire', () => {
  for (const entry of MCL04_ENTRIES) {
    const spec = resolveLinePositionSpec(makeTask(entry));
    if (spec === null) {
      assert.fail(`C-MCL-04 level ${entry.difficulty_level} failed to resolve`);
      continue;
    }
    const payload = entry.prompt_payload as { interval_max: number; target_position: number };
    assert.equal(spec.intervalMax, payload.interval_max, `level ${entry.difficulty_level}`);
    assert.equal(spec.targetPosition, payload.target_position, `level ${entry.difficulty_level}`);
    assert.equal(spec.positionKey, 'marker_position', `level ${entry.difficulty_level}`);
    assert.equal(spec.promptText, entry.prompt_text);
    assert.deepEqual(spec.interactiveAssets, entry.interactive_assets);
    assert.deepEqual(spec.payloadValues, []);
  }
});

test('C-MCL-04: intervalMax ramps 10 -> 200 across L1-L5, measured directly from the frozen fixture', () => {
  const intervalMaxes = MCL04_ENTRIES.map((entry) => (entry.prompt_payload as { interval_max: number }).interval_max);
  assert.deepEqual(intervalMaxes, [10, 20, 50, 100, 200]);
});

// --- the discoverability hint: a 5-wide bucketed range containing targetPosition, never the exact
// value on its own -----------------------------------------------------------------------------

test('C-MCL-04 L5 (target_position 34): targetRangeStart/targetRangeEnd bucket to 30-35 (multiples of 5, "0-5, 5-10, 10-15" style, per the owner-approved correction)', () => {
  const entry = MCL04_ENTRIES[4]!;
  assert.equal(entry.difficulty_level, 5);
  const spec = resolveLinePositionSpec(makeTask(entry));
  assert.notEqual(spec, null);
  assert.equal(spec!.targetRangeStart, 30);
  assert.equal(spec!.targetRangeEnd, 35);
});

test('the range always contains targetPosition, at every difficulty level', () => {
  for (const entry of MCL04_ENTRIES) {
    const spec = resolveLinePositionSpec(makeTask(entry));
    assert.notEqual(spec, null);
    assert.ok(spec!.targetRangeStart <= spec!.targetPosition, `level ${entry.difficulty_level}`);
    assert.ok(spec!.targetPosition <= spec!.targetRangeEnd, `level ${entry.difficulty_level}`);
  }
});

test('the range is always exactly 5 wide (targetRangeEnd - targetRangeStart === 5) when not clamped by intervalMax', () => {
  for (const entry of MCL04_ENTRIES) {
    const spec = resolveLinePositionSpec(makeTask(entry));
    assert.notEqual(spec, null);
    if (spec!.targetRangeStart + 5 <= spec!.intervalMax) {
      assert.equal(spec!.targetRangeEnd - spec!.targetRangeStart, 5, `level ${entry.difficulty_level}`);
    }
  }
});

test("the range clamps at the line's own far end rather than extending past intervalMax", () => {
  const task = makeTask(MCL04_ENTRIES[0]!);
  task.prompt_payload = { interval_max: 10, target_position: 9 };
  const spec = resolveLinePositionSpec(task);
  assert.notEqual(spec, null);
  assert.equal(spec!.targetRangeStart, 5);
  assert.equal(spec!.targetRangeEnd, 10); // would be 15, clamped to intervalMax (10)
});

test('target_position exactly 0 buckets to range 0-5', () => {
  const task = makeTask(MCL04_ENTRIES[0]!);
  task.prompt_payload = { interval_max: 10, target_position: 0 };
  const spec = resolveLinePositionSpec(task);
  assert.notEqual(spec, null);
  assert.equal(spec!.targetRangeStart, 0);
  assert.equal(spec!.targetRangeEnd, 5);
});

// --- fail-closed negative controls, each derived from a real, resolving exemplar ------------------

function baseTask(): CNextTaskResponse {
  return makeTask(MCL04_ENTRIES[0]!);
}

test('sanity: the base fixture used by every negative control below resolves on its own', () => {
  assert.notEqual(resolveLinePositionSpec(baseTask()), null);
});

test('fails closed: prompt_text empty', () => {
  const task = baseTask();
  task.prompt_text = '';
  assert.equal(resolveLinePositionSpec(task), null);
});

test('fails closed: prompt_payload not an object (null)', () => {
  const task = baseTask();
  // @ts-expect-error -- deliberately malformed for the fail-closed control
  task.prompt_payload = null;
  assert.equal(resolveLinePositionSpec(task), null);
});

test('fails closed: prompt_payload missing interval_max', () => {
  const task = baseTask();
  const { interval_max: _intervalMax, ...withoutIntervalMax } = task.prompt_payload as Record<string, unknown>;
  task.prompt_payload = withoutIntervalMax;
  assert.equal(resolveLinePositionSpec(task), null);
});

test('fails closed: prompt_payload missing target_position', () => {
  const task = baseTask();
  const { target_position: _targetPosition, ...withoutTargetPosition } = task.prompt_payload as Record<string, unknown>;
  task.prompt_payload = withoutTargetPosition;
  assert.equal(resolveLinePositionSpec(task), null);
});

test('fails closed: interval_max is a fractional number', () => {
  const task = baseTask();
  task.prompt_payload = { ...task.prompt_payload, interval_max: 10.5 };
  assert.equal(resolveLinePositionSpec(task), null);
});

test('fails closed: interval_max is zero', () => {
  const task = baseTask();
  task.prompt_payload = { ...task.prompt_payload, interval_max: 0 };
  assert.equal(resolveLinePositionSpec(task), null);
});

test('fails closed: interval_max is negative', () => {
  const task = baseTask();
  task.prompt_payload = { ...task.prompt_payload, interval_max: -10 };
  assert.equal(resolveLinePositionSpec(task), null);
});

test('fails closed: interval_max exceeds MAX_INTERVAL_MAX (1000)', () => {
  const task = baseTask();
  task.prompt_payload = { ...task.prompt_payload, interval_max: 1001, target_position: 5 };
  assert.equal(resolveLinePositionSpec(task), null);
});

test('fails closed: interval_max is not a number at all (string)', () => {
  const task = baseTask();
  task.prompt_payload = { ...task.prompt_payload, interval_max: '10' };
  assert.equal(resolveLinePositionSpec(task), null);
});

test('fails closed: target_position is fractional', () => {
  const task = baseTask();
  task.prompt_payload = { ...task.prompt_payload, target_position: 2.5 };
  assert.equal(resolveLinePositionSpec(task), null);
});

test('fails closed: target_position is negative', () => {
  const task = baseTask();
  task.prompt_payload = { ...task.prompt_payload, target_position: -1 };
  assert.equal(resolveLinePositionSpec(task), null);
});

test('fails closed: target_position exceeds interval_max', () => {
  const task = baseTask();
  task.prompt_payload = { ...task.prompt_payload, interval_max: 10, target_position: 11 };
  assert.equal(resolveLinePositionSpec(task), null);
});

test('target_position exactly equal to interval_max is accepted (boundary, not "exceeds")', () => {
  const task = baseTask();
  task.prompt_payload = { ...task.prompt_payload, interval_max: 10, target_position: 10 };
  const spec = resolveLinePositionSpec(task);
  assert.notEqual(spec, null);
  assert.equal(spec!.targetPosition, 10);
});

test('target_position exactly 0 is accepted', () => {
  const task = baseTask();
  task.prompt_payload = { ...task.prompt_payload, target_position: 0 };
  const spec = resolveLinePositionSpec(task);
  assert.notEqual(spec, null);
  assert.equal(spec!.targetPosition, 0);
});

test('fails closed: a non-structural prompt_payload value is not a finite number', () => {
  const task = baseTask();
  task.prompt_payload = { ...task.prompt_payload, some_extra_value: 'two' };
  assert.equal(resolveLinePositionSpec(task), null);
});

test('a numeric extra prompt_payload key resolves and is carried in payloadValues', () => {
  const task = baseTask();
  task.prompt_payload = { ...task.prompt_payload, some_extra_value: 7 };
  const spec = resolveLinePositionSpec(task);
  assert.notEqual(spec, null);
  assert.deepEqual(spec!.payloadValues.map((value) => value.key), ['some_extra_value']);
  assert.equal(spec!.payloadValues[0]!.value, 7);
});

test('fails closed: valid_action_space declares no key', () => {
  const task = baseTask();
  task.valid_action_space = {};
  assert.equal(resolveLinePositionSpec(task), null);
});

test('fails closed: valid_action_space declares an unbound type', () => {
  const task = baseTask();
  task.valid_action_space = { marker_position: 'weird_type' };
  assert.equal(resolveLinePositionSpec(task), null);
});

test('fails closed: valid_action_space declares int, not number', () => {
  const task = baseTask();
  task.valid_action_space = { marker_position: 'int' };
  assert.equal(resolveLinePositionSpec(task), null);
});

test('fails closed: two numeric-field keys', () => {
  const task = baseTask();
  task.valid_action_space = { marker_position: 'number', another_position: 'number' };
  assert.equal(resolveLinePositionSpec(task), null);
});

test('fails closed: a second declared key of any other kind alongside the required one', () => {
  const task = baseTask();
  task.valid_action_space = { marker_position: 'number', extra_flag: 'bool' };
  assert.equal(resolveLinePositionSpec(task), null);
});

test('fails closed: blanks is not null', () => {
  const task = baseTask();
  task.blanks = 1;
  assert.equal(resolveLinePositionSpec(task), null);
});

test('resolves: a synthetic differently-named numeric-field key still resolves (proves classification is type-derived, not a hardcoded key name)', () => {
  const task = baseTask();
  task.valid_action_space = { landing_spot: 'number' };
  const spec = resolveLinePositionSpec(task);
  assert.notEqual(spec, null);
  assert.equal(spec!.positionKey, 'landing_spot');
});

test("C-MCL-04 resolves to 'line-position', not any other archetype", () => {
  const entry = MCL04_ENTRIES[0]!;
  assert.equal(resolveArchetype('C-MCL-04', entry.valid_action_space), 'line-position');
});
