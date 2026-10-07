<template>
    <section class="cms-measures">
        <h2>{{ value.heading }}</h2>
        <div class="table-wrap">
            <table>
                <tbody>
                    <tr v-for="item in value.items" :key="item.quantity">
                        <th scope="row">{{ item.quantity }}</th>
                        <td class="unit">{{ item.unit }}</td>
                        <td class="note">{{ item.note }}</td>
                    </tr>
                </tbody>
            </table>
        </div>
    </section>
</template>

<script setup lang="ts">
// "Cosa misuriamo": the quantities a solution measures, with units.
defineProps<{ value: { heading: string; items: Array<{ quantity: string; unit?: string; note?: string }> } }>();
</script>

<style scoped>
.cms-measures {
    max-width: var(--cms-measure, 760px);
    margin: 0 auto;
    padding: 28px 0;
    border-top: 1px solid var(--cms-border, rgba(147, 183, 218, 0.18));
}

h2 {
    margin: 0 0 16px;
    color: var(--cms-heading, var(--ax-color-text-primary));
    font-size: clamp(1.35rem, 2.4vw, 1.7rem);
    font-weight: 500;
}

.table-wrap {
    overflow-x: auto;
}

table {
    width: 100%;
    border-collapse: collapse;
    font-size: 0.95rem;
}

th,
td {
    padding: 11px 12px;
    border-bottom: 1px solid var(--cms-border, rgba(147, 183, 218, 0.18));
    text-align: left;
    vertical-align: top;
}

th {
    color: var(--cms-heading, var(--ax-color-text-primary));
    font-weight: 600;
}

.unit {
    color: var(--ax-color-accent-red-soft, #ea3f30);
    font-weight: 600;
    white-space: nowrap;
    font-variant-numeric: tabular-nums;
}

.note {
    color: var(--cms-text, var(--ax-color-text-secondary));
}
</style>
