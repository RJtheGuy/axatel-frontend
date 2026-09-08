<template>
    <section class="glossary" aria-labelledby="glossary-search-label">
        <div class="search-panel">
            <label id="glossary-search-label" for="glossary-search">Cerca nel glossario</label>
            <div class="search-row">
                <input
                    id="glossary-search"
                    v-model="query"
                    type="search"
                    placeholder="Scrivi un termine o un concetto"
                    autocomplete="off"
                />
                <button v-if="query" type="button" @click="query = ''">Azzera</button>
            </div>
            <p aria-live="polite">{{ resultLabel }}</p>
        </div>

        <dl v-if="filteredTerms.length" class="term-list">
            <div v-for="item in filteredTerms" :key="item.term" class="term-item">
                <dt>{{ item.term }}</dt>
                <dd>{{ item.definition }}</dd>
            </div>
        </dl>

        <div v-else class="empty-state">
            <h2>Nessun termine trovato</h2>
            <p>Prova con una parola piu breve o con un concetto collegato.</p>
            <button type="button" @click="query = ''">Mostra tutti i termini</button>
        </div>
    </section>
</template>

<script setup lang="ts">
import { computed, ref } from "vue";
import type { GlossaryTerm } from "../../data/glossary";

const props = defineProps<{ terms: GlossaryTerm[] }>();
const query = ref("");

const normalize = (value: string): string => value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLocaleLowerCase("it")
    .trim();

const filteredTerms = computed(() => {
    const search = normalize(query.value);
    if (!search) return props.terms;

    return props.terms.filter((item) => normalize([
        item.term,
        item.definition,
        ...(item.aliases || [])
    ].join(" ")).includes(search));
});

const resultLabel = computed(() => {
    const count = filteredTerms.value.length;
    if (!query.value.trim()) return `${count} termini disponibili`;
    return count === 1 ? "1 termine trovato" : `${count} termini trovati`;
});
</script>

<style scoped>
.glossary {
    margin-top: 30px;
}

.search-panel {
    max-width: 760px;
    padding: 22px 0;
    border-top: 1px solid rgba(11, 53, 91, 0.18);
    border-bottom: 1px solid rgba(11, 53, 91, 0.18);
}

.search-panel label {
    display: block;
    margin-bottom: 10px;
    color: #0b355b;
    font-size: 0.78rem;
    font-weight: 800;
    letter-spacing: 0.08em;
    text-transform: uppercase;
}

.search-row {
    display: flex;
    gap: 10px;
}

.search-row input {
    width: 100%;
    min-width: 0;
    padding: 13px 14px;
    border: 1px solid rgba(11, 53, 91, 0.28);
    border-radius: 0;
    outline: none;
    background: rgba(255, 255, 255, 0.84);
    color: #0b355b;
    font: inherit;
}

.search-row input:focus {
    border-color: #c52317;
    box-shadow: 0 0 0 3px rgba(197, 35, 23, 0.1);
}

.search-row button,
.empty-state button {
    border: 1px solid #c52317;
    background: transparent;
    color: #0b355b;
    padding: 10px 15px;
    font: inherit;
    font-weight: 700;
    cursor: pointer;
}

.search-panel > p {
    margin: 10px 0 0;
    color: #667f97;
    font-size: 0.82rem;
}

.term-list {
    max-width: 760px;
    margin: 12px 0 0;
}

.term-item {
    display: grid;
    grid-template-columns: minmax(130px, 0.42fr) minmax(0, 1.58fr);
    gap: 24px;
    padding: 22px 0;
    border-bottom: 1px solid rgba(11, 53, 91, 0.14);
}

.term-item dt {
    color: #0b355b;
    font-size: 1.05rem;
    font-weight: 800;
}

.term-item dd {
    margin: 0;
    color: #274e72;
    line-height: 1.68;
}

.empty-state {
    max-width: 760px;
    padding: 34px 0;
}

.empty-state h2 {
    margin: 0 0 8px;
    color: #0b355b;
    font-size: 1.3rem;
}

.empty-state p {
    margin: 0 0 18px;
    color: #274e72;
}

@media (max-width: 560px) {
    .search-row {
        align-items: stretch;
        flex-direction: column;
    }

    .term-item {
        grid-template-columns: 1fr;
        gap: 8px;
    }
}
</style>