<template>
  <section
    ref="container"
    class="applications"
    @pointerenter="onPointerEnter"
    @pointerleave="onPointerLeave"
    @pointerdown="onPointerDown"
    @pointerup="onPointerEnd"
    @pointercancel="onPointerEnd"
  >
    <div ref="track" class="track">
      <DashboardDemoCardVerticale
        v-for="(app, index) in duplicatedApplications"
        :key="`${app.name}-${index}`"
        :application="app"
        :lazy-index="index"
        @alarm="onAlarm"
        @normal="onNormal"
      />
    </div>
  </section>
</template>

<script setup lang="ts">
import {
    ref,
    computed,
    onMounted,
    nextTick,
  onUnmounted
} from "vue"

import { useCarousel } from "~/composables/carousel"

type DemoApplication = {
  name: string;
  description: string;
  demo: string | null;
  instruction?: string;
};

type AlarmEvent = {
  application: string;
  origin: { x: number; y: number };
  getOrigin: () => { x: number; y: number };
};

const props = defineProps<{
  applications?: DemoApplication[];
}>();

const emit = defineEmits<{
  (e:"alarm", payload:AlarmEvent):void
    (e:"normal", application:string):void
}>()

const container = ref<HTMLElement | null>(null)
const track = ref<HTMLElement | null>(null)

let carousel: ReturnType<typeof useCarousel> | null = null
let mouseHovered = false
const activePointers = new Set<number>()

const updateCarouselMotion = () => {
  if (mouseHovered || activePointers.size > 0) {
    carousel?.pause()
  } else {
    carousel?.resume()
  }
}

const onPointerEnter = (event: PointerEvent) => {
  if (event.pointerType !== "mouse") return

  mouseHovered = true
  updateCarouselMotion()
}

const onPointerLeave = (event: PointerEvent) => {
  if (event.pointerType !== "mouse") return

  mouseHovered = false
  updateCarouselMotion()
}

const onPointerDown = (event: PointerEvent) => {
  if (event.pointerType === "mouse") return

  activePointers.add(event.pointerId)
  updateCarouselMotion()
}

const onPointerEnd = (event: PointerEvent) => {
  activePointers.delete(event.pointerId)
  updateCarouselMotion()
}

const defaultApplications: DemoApplication[] = [
  {
    name:"Geo Angel",
    description:"Monitoraggio geologico",
    demo:"GeoAngel",
    instruction:"Colpisci il sensore col mouse per generare l'impatto"
  },
  {
    name:"Traffic Alert",
    description:"Traffico intelligente",
    demo:"TrafficAlert",
    instruction:"Passa il mouse sulla card per aumentare il traffico fino alla congestione"
  },
  {
    name:"Angel River",
    description:"Monitoraggio di fiumi",
    demo:"AngelRiver",
    instruction:"Passa il mouse sulla card per simulare la pioggia e far salire il livello"
  },
  {
    name:"Angel Road Site",
    description:"Gestione cantieri",
    demo:"AngelRoadSite",
    instruction:"Colpisci col mouse il cartello lavori in corso per far scattare l'allarme"
  },
  {
    name:"Angel Bridge",
    description:"Monitoraggio ponti",
    demo:"AngelBridge",
    instruction:"Passa il mouse sulla card per aprire la crepa"
  }
]

const applications = computed(() => {
  const source = props.applications && props.applications.length > 0
    ? props.applications
    : defaultApplications;

  return source.map((item) => ({ ...item }));
})

const duplicatedApplications = computed(()=>
  [...applications.value,...applications.value]
)

const onAlarm = (payload:AlarmEvent)=>{
  emit("alarm",payload)
}

const onNormal = (application:string)=>{
    emit("normal",application)
}

onMounted(async()=>{

    await nextTick()

    if(!container.value || !track.value)
        return

    carousel = useCarousel({

        container:container.value,

        track:track.value

    })

})

onUnmounted(()=>{

  activePointers.clear()
    carousel?.destroy()

})
</script>
<style scoped>
.applications {
  position: relative;
  width: 100vw;
  min-height: 58vh;
  margin-left: calc(50% - 50vw);
  overflow: hidden;
  user-select: none;
  cursor: default;
  /* Spostato il padding orizzontale qui per non falsare il calcolo di track.scrollWidth */
  padding: 10px 8vw; 
}

.track {
  display: flex;
  align-items: center;
  gap: 36px;
  width: max-content;
  will-change: transform;
}

.track > * {
  flex: 0 0 360px;
}

@media (max-width: 1200px) {
  .track > * {
    flex-basis: 320px;
  }
}

@media (max-width: 768px) {
  .track > * {
    flex-basis: 82vw;
  }

  .applications {
    min-height: 62vh;
    padding: 14px 5vw 40px;
  }
}

@media (max-width: 480px) {
  .applications {
    min-height: 64vh;
    padding: 8px 4vw 30px;
  }

  .track {
    gap: 16px;
  }
}
</style>