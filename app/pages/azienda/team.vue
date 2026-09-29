<template>
    <main class="team-page">
        <TeamNetwork :members="members" />
    </main>
</template>

<script setup lang="ts">
/**
 * Team page. People come from the CMS (Impostazioni → Team: name, role,
 * description, photo, "Visibile" switch, order). Until at least one
 * person is published there, the built-in example team is shown.
 */
import { computed } from "vue";
import { useSeoMeta } from "#app";
import TeamNetwork from "../../components/team/TeamNetwork.vue";
import { teamMembers, teamPosition, type TeamMember } from "../../data/team";

const { t, locale } = useI18n();
const { getTeam } = useCms();
const { imageUrl } = useCmsImage();

type CmsMember = { id: number; name: string; role: string; bio: string; photo: { url: string } | null };

const { data: cmsTeam } = await useAsyncData(
    () => `team-${locale.value}`,
    () => getTeam<CmsMember>().catch(() => null),
    { watch: [locale] }
);

const members = computed<TeamMember[]>(() => {
    const people = cmsTeam.value?.members ?? [];
    if (!people.length) return teamMembers;
    return people.map((person, index) => ({
        id: `cms-${person.id}`,
        name: person.name,
        role: person.role,
        image: person.photo ? imageUrl(person.photo.url) : "",
        description: person.bio,
        position: teamPosition(index, people.length),
    }));
});

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