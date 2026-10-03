/**
 * Organisation chart layout for the team page.
 *
 * Each person may "report to" one other person (Impostazioni → Team →
 * Riporta a). From that the page draws a tree: the top of the company on
 * the first row, each manager above the people who report to them, and a
 * line ONLY between a person and their manager, so departments read as
 * separate branches (a team under the CEO is not linked to the CFO).
 *
 * Positions are percentages of the team stage. Two shapes:
 *  - "wide" (desktop): a classic top-down tree; a manager with more than
 *    three people who have no team of their own gets them in a compact
 *    grid of 2 or 3 columns instead of one long row;
 *  - "narrow" (phones): an indented outline, one person per row.
 */
export type TreePerson = { id: string; parentId?: string | null; department?: string };

export type TreeLayout = {
    positions: Record<string, { x: number; y: number }>;
    /** Lines to draw, as [manager index, person index] in the input order. */
    edges: Array<[number, number]>;
    rows: number;
    columns: number;
    /** Department each person belongs to: their own, or their nearest manager's. */
    departmentOf: Record<string, string>;
    managerOf: Record<string, string | undefined>;
    reportsOf: Record<string, string[]>;
};

/** True when at least one person reports to someone else on the page. */
export function hasHierarchy(people: TreePerson[]): boolean {
    const ids = new Set(people.map((p) => p.id));
    return people.some((p) => p.parentId && p.parentId !== p.id && ids.has(p.parentId));
}

export function layoutTree(people: TreePerson[], shape: "wide" | "narrow"): TreeLayout {
    const byId = new Map(people.map((p) => [p.id, p]));
    const index = new Map(people.map((p, i) => [p.id, i]));

    // Valid manager links only: the manager is on the page and no loop.
    const managerOf: Record<string, string | undefined> = {};
    for (const person of people) {
        let parent = person.parentId && byId.has(person.parentId) ? person.parentId : undefined;
        const seen = new Set([person.id]);
        let walk = parent;
        while (walk) {
            if (seen.has(walk)) {
                parent = undefined; // a loop: put this person at the top
                break;
            }
            seen.add(walk);
            const next = byId.get(walk)?.parentId;
            walk = next && byId.has(next) ? next : undefined;
        }
        managerOf[person.id] = parent;
    }

    const reportsOf: Record<string, string[]> = {};
    for (const person of people) reportsOf[person.id] = [];
    for (const person of people) {
        const boss = managerOf[person.id];
        if (boss) reportsOf[boss]!.push(person.id);
    }

    const departmentOf: Record<string, string> = {};
    for (const person of people) {
        let walk: string | undefined = person.id;
        while (walk && !(byId.get(walk)?.department || "").trim()) walk = managerOf[walk];
        departmentOf[person.id] = walk ? byId.get(walk)!.department!.trim() : "";
    }

    // Top of the chart: people with a team first, then those on their own.
    const roots = people.filter((p) => !managerOf[p.id]);
    roots.sort((a, b) => Number(reportsOf[b.id]!.length > 0) - Number(reportsOf[a.id]!.length > 0));

    const units: Record<string, { x: number; row: number }> = {};
    let columns = 0;
    let rows = 1;

    if (shape === "narrow") {
        let row = 0;
        const visit = (id: string, depth: number) => {
            units[id] = { x: depth, row };
            row += 1;
            for (const kid of reportsOf[id]!) visit(kid, depth + 1);
        };
        for (const root of roots) visit(root.id, 0);
        rows = Math.max(1, row);
        columns = Math.max(...Object.values(units).map((u) => u.x), 0) + 1;
    } else {
        const isLeaf = (id: string) => reportsOf[id]!.length === 0;
        // Returns the width (in slots) used by this person's branch.
        const place = (id: string, depth: number, left: number): number => {
            const kids = reportsOf[id]!;
            if (kids.length === 0) {
                units[id] = { x: left + 0.5, row: depth };
                return 1;
            }
            if (kids.length > 3 && kids.every(isLeaf)) {
                const cols = kids.length > 8 ? 3 : 2;
                kids.forEach((kid, i) => {
                    units[kid] = { x: left + (i % cols) + 0.5, row: depth + 1 + Math.floor(i / cols) };
                });
                units[id] = { x: left + cols / 2, row: depth };
                return cols;
            }
            let cursor = left;
            for (const kid of kids) cursor += place(kid, depth + 1, cursor);
            units[id] = { x: (units[kids[0]!]!.x + units[kids[kids.length - 1]!]!.x) / 2, row: depth };
            return Math.max(1, cursor - left);
        };
        let cursor = 0;
        for (const root of roots) cursor += place(root.id, 0, cursor);
        columns = Math.max(1, cursor);
        rows = Math.max(...Object.values(units).map((u) => u.row), 0) + 1;
    }

    const positions: Record<string, { x: number; y: number }> = {};
    for (const person of people) {
        const unit = units[person.id] ?? { x: 0.5, row: 0 };
        const x =
            shape === "narrow"
                ? Math.min(78, 16 + unit.x * Math.min(20, 62 / Math.max(1, columns - 1)))
                : 6 + (unit.x / columns) * 88;
        const y = rows === 1 ? 50 : ((unit.row + 0.5) / rows) * 100;
        positions[person.id] = { x, y };
    }

    const edges: Array<[number, number]> = [];
    for (const person of people) {
        const boss = managerOf[person.id];
        if (boss) edges.push([index.get(boss)!, index.get(person.id)!]);
    }

    return { positions, edges, rows, columns, departmentOf, managerOf, reportsOf };
}
