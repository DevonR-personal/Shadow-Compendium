import test from "node:test"
import assert from "node:assert/strict"
import {
    createHealthNotification,
    formatReflectNotice,
    isHealthNotification,
} from "./healthNotifications.ts"

test("revealed changes report the actual HP change, including capped healing and damage", () => {
    assert.deepEqual(createHealthNotification("a", 7, 3, 0, true), {
        id: "a", combatantId: 7, delta: -3,
    })
    assert.deepEqual(createHealthNotification("b", 7, 8, 10, true), {
        id: "b", combatantId: 7, delta: 2,
    })
    assert.equal(createHealthNotification("c", 7, 10, 10, true), null)
})

test("hidden HP changes never produce a player notification", () => {
    assert.equal(createHealthNotification("a", 7, 10, 4, false), null)
    assert.equal(createHealthNotification("b", 7, 4, 10, false), null)
})

test("reflected damage omits the amount only when hidden", () => {
    assert.equal(formatReflectNotice(12, "Fire", true), "12 Fire damage was reflected!")
    assert.equal(formatReflectNotice(12, "Fire", false), "Fire damage was reflected!")
})

test("malformed health notifications are ignored", () => {
    assert.equal(isHealthNotification({ id: "a", combatantId: 7, delta: -2 }), true)
    assert.equal(isHealthNotification({ id: "a", combatantId: 7, delta: 0 }), false)
    assert.equal(isHealthNotification({ id: "a", combatantId: 7, delta: "2" }), false)
    assert.equal(isHealthNotification(null), false)
})
