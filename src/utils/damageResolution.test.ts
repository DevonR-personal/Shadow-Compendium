import test from "node:test"
import assert from "node:assert/strict"

import {
    applyDamageOutcomeToHitPoints,
    resolveDamage,
} from "./damageResolution"

test("weakness adds two damage before armor reduction", () => {
    assert.deepEqual(resolveDamage(8, "fire", "weak", 3), { kind: "damage", amount: 7 })
})

test("resistance subtracts two damage before armor reduction", () => {
    assert.deepEqual(resolveDamage(8, "fire", "resist", 3), { kind: "damage", amount: 3 })
})

test("ordinary damage applies armor and keeps the minimum one damage", () => {
    assert.deepEqual(resolveDamage(4, null, null, 8), { kind: "damage", amount: 1 })
})

test("null affinity blocks damage", () => {
    assert.deepEqual(resolveDamage(8, "fire", "null", 0), { kind: "immune", amount: 0 })
})

test("drain heals for the entered amount", () => {
    assert.deepEqual(resolveDamage(8, "fire", "drain", 4), { kind: "heal", amount: 8 })
})

test("reflect returns the entered amount for a notice", () => {
    assert.deepEqual(resolveDamage(8, "fire", "reflect", 4), { kind: "reflect", amount: 8 })
})

test("heal type restores the entered amount without affinity or armor", () => {
    assert.deepEqual(resolveDamage(8, "heal", "weak", 99), { kind: "heal", amount: 8 })
})

test("negative amounts never create negative damage, healing, or reflection", () => {
    assert.deepEqual(resolveDamage(-8, "fire", "weak", 0), { kind: "damage", amount: 0 })
    assert.deepEqual(resolveDamage(-8, "heal", null, 0), { kind: "heal", amount: 0 })
    assert.deepEqual(resolveDamage(-8, "fire", "reflect", 0), { kind: "reflect", amount: 0 })
})

test("healing is capped at maximum HP and damage cannot reduce HP below zero", () => {
    assert.equal(
        applyDamageOutcomeToHitPoints(8, 10, { kind: "heal", amount: 5 }),
        10,
    )
    assert.equal(
        applyDamageOutcomeToHitPoints(2, 10, { kind: "damage", amount: 20 }),
        0,
    )
})