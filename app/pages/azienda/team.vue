<template>
    <main class="team-page">
        <TeamNetwork :members="teamMembers" />
    </main>
</template>

<script setup lang="ts">
import { useSeoMeta } from "#app";
import TeamNetwork from "../../components/team/TeamNetwork.vue";
import { teamMembers } from "../../data/team";

const { t } = useI18n();

useSeoMeta({
    title: () => `${t("team.title")} | Axatel`,
    description: () => t("seo.teamDescription")
});
</script>

<style scoped>
.team-page {
    min-height: 100svh;
    background: #020712;
}
</style>