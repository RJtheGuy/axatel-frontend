import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { stripTypeScriptTypes } from "node:module";
import vm from "node:vm";
import test from "node:test";

const source = readFileSync(new URL("../app/utils/balanceNavigationGroups.ts", import.meta.url), "utf8");
const context = vm.createContext({});
vm.runInContext(stripTypeScriptTypes(source.replace("export function", "function")), context);
const balance = (heights) => Array.from(context.balanceNavigationGroups(heights), (placement) => ({ ...placement }));

test("places the third category under the shorter second category", () => {
    assert.deepEqual(balance([300, 80, 100]), [
        { column: 1, row: 1, span: 300 },
        { column: 2, row: 1, span: 80 },
        { column: 2, row: 105, span: 100 }
    ]);
});

test("uses the left column for ties and the actual height of wrapped content", () => {
    assert.deepEqual(balance([80, 80, 140.2, 60]), [
        { column: 1, row: 1, span: 80 },
        { column: 2, row: 1, span: 80 },
        { column: 1, row: 105, span: 141 },
        { column: 2, row: 105, span: 60 }
    ]);
    assert.deepEqual(balance([]), []);
    assert.deepEqual(balance([0]), [{ column: 1, row: 1, span: 1 }]);
});

test("keeps every category and never overlaps categories in the same column", () => {
    for (const heights of [[500, 50, 80, 40, 200, 100], Array(20).fill(72.4)]) {
        const placements = balance(heights);
        assert.equal(placements.length, heights.length);
        const ends = [0, 0];
        for (const placement of placements) {
            const index = placement.column - 1;
            assert.ok(placement.row > ends[index]);
            if (ends[index]) assert.ok(placement.row - ends[index] >= 24);
            ends[index] = placement.row + placement.span - 1;
        }
    }
});
