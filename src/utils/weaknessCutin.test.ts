import test from "node:test"
import assert from "node:assert/strict"
import { existsSync } from "node:fs"

import {
    getWeaknessCutinCharacter,
    getWeaknessCutinSource,
    isWeaknessCutinCharacter,
} from "./weaknessCutin.ts"

test("8ball and Jackson select the 8ball cut-in", () => {
    for (const name of ["8ball", "8 Ball", "8-ball", "Jackson"]) {
        assert.equal(getWeaknessCutinCharacter(name), "8ball")
    }

    assert.equal(isWeaknessCutinCharacter("8ball"), true)
    assert.equal(getWeaknessCutinSource("8ball"), "/cutin/8ball_cutin.mp4")
    assert.equal(existsSync(new URL("../../public/cutin/8ball_cutin.mp4", import.meta.url)), true)
})

test("unrelated names still use their own cut-in or the default", () => {
    assert.equal(getWeaknessCutinCharacter("Wiz"), "Wiz")
    assert.equal(getWeaknessCutinCharacter("18ball"), "Blank")
})
