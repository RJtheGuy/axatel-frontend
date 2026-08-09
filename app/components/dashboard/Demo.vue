<template>
    <section
        class="demo-section"
    >

        <div class="demo-content">

            <DashboardDemoAngel
                :last-alarm="lastAlarm"
            />

            <DashboardDemoCaroselloVerticali
                :applications="applications"
                @alarm="onAlarm"
                @normal="onNormal"
            />

        </div>

    </section>
</template>

<script setup lang="ts">
import { ref } from "vue"

type DemoApplication = {
    name: string;
    description: string;
    demo: string | null;
    instruction?: string;
};

const props = defineProps<{
    applications?: DemoApplication[];
}>();

const defaultApplications: DemoApplication[] = [
    {
        name: "Geo Angel",
        description: "Monitoraggio geologico",
        demo: "GeoAngel",
        instruction: "Colpisci il sensore col mouse per generare l'impatto"
    },
    {
        name: "Traffic Alert",
        description: "Traffico intelligente",
        demo: "TrafficAlert",
        instruction: "Passa il mouse sulla card per aumentare il traffico fino alla congestione"
    },
    {
        name: "Angel River",
        description: "Monitoraggio di fiumi",
        demo: "AngelRiver",
        instruction: "Passa il mouse sulla card per simulare la pioggia e far salire il livello"
    },
    {
        name: "Angel Road Site",
        description: "Gestione cantieri",
        demo: "AngelRoadSite",
        instruction: "Colpisci col mouse il cartello lavori in corso per far scattare l'allarme"
    },
    {
        name: "Angel Bridge",
        description: "Monitoraggio ponti",
        demo: "AngelBridge",
        instruction: "Passa il mouse sulla card per aprire la crepa"
    }
];

const applications = (props.applications && props.applications.length > 0)
    ? props.applications
    : defaultApplications;

const lastAlarm = ref<string | null>(null)

function onAlarm(application: string){
    lastAlarm.value = application
}

function onNormal(){
    lastAlarm.value = null
}
</script>

<style scoped>
.demo-section {
    position: relative;
    width: 100vw;
    min-height: 100dvh;
    overflow: hidden;
    background: transparent;
}

.demo-content {
    position: relative;
    z-index: 1;
}

@media (max-width: 900px) {
    .demo-section {
        min-height: 100vh;
    }
}
</style>