/**
 * Success stories, most recent project first ("Data del progetto" in the
 * CMS). Stories without a date come after the dated ones and keep the order
 * they arrived in (most recently published first), so nothing moves until
 * an editor fills in dates.
 */
export function byEventDate<T extends { event_date?: string | null }>(items: T[]): T[] {
    return items
        .map((item, index) => ({ item, index }))
        .sort((a, b) => {
            const left = a.item.event_date || "";
            const right = b.item.event_date || "";
            if (left && right && left !== right) return left < right ? 1 : -1;
            if (left && !right) return -1;
            if (!left && right) return 1;
            return a.index - b.index;
        })
        .map(({ item }) => item);
}
