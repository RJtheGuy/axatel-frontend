<template>
    <main class="team-page">
        <TeamNetwork :members="teamMembers" />
    </main>
</template>

<script setup lang="ts">
import { useSeoMeta } from "#app";
import TeamNetwork from "../../components/team/TeamNetwork.vue";
import { teamMembers } from "../../data/team";

useSeoMeta({
    title: "Team | Axatel",
    description: "Le persone e le competenze che trasformano insieme problemi complessi in soluzioni Axatel."
});
</script>

<style scoped>
.team-page {
    min-height: 100svh;
    background: #020712;
}
</style>