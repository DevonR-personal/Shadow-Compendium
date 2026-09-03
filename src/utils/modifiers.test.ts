import test from "node:test"
import assert from "node:assert/strict"

import {
    clampModifier,
    applyModifierDelta,
    getTurnDotCount,
} from "./modifiers"

test("damage and armor modifiers stay within ±12 in 2-point steps", () => {
    assert.equal(clampModifier(14, "damage_mod"), 12)
    assert.equal(clampModifier(-14, "armor_mod"), -12)
    assert.equal(applyModifierDelta(8, 2, "damage_mod"), 10)
    assert.equal(applyModifierDelta(-10, -2, "armor_mod"), -12)
    assert.equal(applyModifierDelta(12, 2, "damage_mod"), 12)
})

test("accuracy stays within ±2 in 2-point steps", () => {
    assert.equal(clampModifier(4, "accuracy_mod"), 2)
    assert.equal(clampModifier(-4, "accuracy_mod"), -2)
    assert.equal(applyModifierDelta(0, 2, "accuracy_mod"), 2)
    assert.equal(applyModifierDelta(-2, -2, "accuracy_mod"), -2)
})

test("turn dots stay between 0 and 3 and hide when empty", () => {
    assert.deepEqual(getTurnDotCount(3), [true, true, true])
    assert.deepEqual(getTurnDotCount(1), [true, false, false])
    assert.deepEqual(getTurnDotCount(0), [false, false, false])
})
