export function balanceNavigationGroups(heights: number[], gap = 24) {
    const columnHeights = [0, 0];
    return heights.map((height) => {
        const column = columnHeights[0]! <= columnHeights[1]! ? 0 : 1;
        const span = Math.max(1, Math.ceil(height));
        const row = columnHeights[column]! + 1;
        columnHeights[column] = row - 1 + span + gap;
        return { column: column + 1, row, span };
    });
}
