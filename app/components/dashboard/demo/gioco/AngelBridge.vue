<template>
<div
    ref="card"
    class="bridge-card"
    @pointerenter="onPointerEnter"
    @pointerleave="onPointerLeave"
>

    <div
        class="sensor"
        :class="{ alarm:isAlarm }"
    >

        <div class="core">
            <div class="led"></div>
        </div>

        <span class="label">
            {{ isAlarm ? currentValue.toFixed(1) + ' mm' : 'Fessura monitorata' }}
        </span>

    </div>

    <div class="bridge">

        <div
            class="bridge-side left"
            :style="{
                transform:`translateX(${-crackWidth/2}px)`
            }"
        >

            <div class="concrete"></div>

        </div>

        <div
            class="bridge-side right"
            :style="{
                transform:`translateX(${crackWidth/2}px)`
            }"
        >

            <div class="concrete"></div>

        </div>

        <div class="crack-shadow"></div>

    </div>

    <div class="measure">

        <div class="measure-value">
            {{ currentValue.toFixed(1) }} mm
        </div>

        <div class="measure-bar">

            <div
                class="measure-fill"
                :style="{
                    width:(currentValue / MAX_MM * 100) + '%'
                }"
            ></div>

            <div
                class="threshold-marker"
                :class="{ active:isAlarm }"
            ></div>

        </div>

        <div class="measure-scale">

            <span>0</span>

            <span class="threshold-label">
                {{ THRESHOLD_MM }}
            </span>

            <span>{{ MAX_MM }}</span>

        </div>

    </div>

</div>
</template>


<script setup lang="ts">
import { ref,onMounted,onUnmounted } from "vue"
import { gsap } from "gsap"

const emit=defineEmits<{
    (e:"alarm"):void
    (e:"normal"):void
}>()

const MAX_MM=5
const THRESHOLD_MM=3.5
const MAX_CRACK=70

const OPEN_SPEED=.45
const CLOSE_SPEED=.45
const ALARM_DISPLAY_MS=1200

const crackWidth=ref(0)
const currentValue=ref(0)
const maxValue=ref(0)
const isAlarm=ref(false)

let closing=false
let hoverOpen=false
let alarmTimer:ReturnType<typeof setTimeout>|null=null

function saveAlarm(){

    const alarms=JSON.parse(
        localStorage.getItem("alarms") ?? "[]"
    )

    alarms.unshift({

        id:crypto.randomUUID(),

        name:"Crepa aperta",

        unit:"mm",

        timestamp:new Date().toISOString(),

        value:Number(maxValue.value.toFixed(1))

    })

    localStorage.setItem(

        "alarms",

        JSON.stringify(
            alarms.slice(0,100)
        )

    )

}

function updateValue(){

    currentValue.value=Number(

        (
            crackWidth.value/
            MAX_CRACK*
            MAX_MM
        ).toFixed(1)

    )

    if(
        !isAlarm.value &&
        currentValue.value>=THRESHOLD_MM
    ){

        isAlarm.value=true

        maxValue.value=currentValue.value

        emit("alarm")

        if(alarmTimer){

            clearTimeout(alarmTimer)

        }

        alarmTimer=setTimeout(()=>{

            saveAlarm()

            closing=true

        },ALARM_DISPLAY_MS)

    }

    if(isAlarm.value){

        maxValue.value=Math.max(

            maxValue.value,

            currentValue.value

        )

    }

}

function tick(){

    if(hoverOpen && !isAlarm.value){

        const delta=gsap.ticker.deltaRatio(60)

        closing=false

        crackWidth.value=Math.min(

            MAX_CRACK,

            crackWidth.value+
            OPEN_SPEED*delta

        )

        updateValue()

    }

    if(!closing)
        return

    const delta=gsap.ticker.deltaRatio(60)

    crackWidth.value=Math.max(

        0,

        crackWidth.value-
        CLOSE_SPEED*delta

    )

    updateValue()

    if(crackWidth.value<=0){

        crackWidth.value=0

        currentValue.value=0

        maxValue.value=0

        closing=false

        if(isAlarm.value){

            isAlarm.value=false

            emit("normal")

        }

    }

}

function onPointerEnter(){
    hoverOpen=true
}

function onPointerLeave(){

    hoverOpen=false

    if(!isAlarm.value){

        closing=true

    }

}

onMounted(()=>{

    gsap.ticker.add(tick)

})

onUnmounted(()=>{

    gsap.ticker.remove(tick)

    if(alarmTimer){

        clearTimeout(alarmTimer)

    }

})
</script>

<style scoped>
.bridge-card {
    position: relative;
    width: 100%;
    height: 100%;
    overflow: hidden;
    border-radius: var(--ax-card-radius);
    border: 1px solid rgba(31, 62, 104, .16);
    background:
        linear-gradient(180deg, #fbfdff 0%, #eef4fb 100%);
    box-shadow:
        inset 0 1px 0 rgba(255, 255, 255, .95),
        0 10px 22px rgba(21, 41, 74, .12);
    user-select: none;
    cursor: default;
    --panel-ink: #17304f;
    --panel-muted: #5d7592;
    --panel-line: rgba(37, 70, 116, .2);
    --panel-accent: #4db6ff;
    --panel-danger: #d93b47;
}

.bridge-card::before {
    content: "";
    position: absolute;
    inset: 0;
    pointer-events: none;
    background:
        radial-gradient(circle at 14% 12%, rgba(255, 255, 255, .86), transparent 44%),
        radial-gradient(circle at 86% 82%, rgba(195, 221, 255, .5), transparent 48%);
}

.bridge-card::after {
    content: "";
    position: absolute;
    inset: 0;
    pointer-events: none;
    background-image:
        linear-gradient(to right, rgba(62, 98, 145, .06) 1px, transparent 1px),
        linear-gradient(to bottom, rgba(62, 98, 145, .06) 1px, transparent 1px);
    background-size: 28px 28px;
    opacity: .35;
}

.sensor {
    position: absolute;
    top: 14px;
    left: 50%;
    transform: translateX(-50%);
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 7px;
    z-index: 30;
}

.sensor .core {
    width: 32px;
    height: 32px;
    border-radius: 50%;
    display: grid;
    place-items: center;
    border: 1px solid var(--panel-line);
    background: rgba(255, 255, 255, .95);
    box-shadow: inset 0 0 0 1px rgba(255, 255, 255, .9);
}

.led {
    width: 12px;
    height: 12px;
    border-radius: 50%;
    background: #53df9f;
    box-shadow: 0 0 12px rgba(83, 223, 159, .75);
    transition: .2s;
}

.sensor.alarm .led {
    background: var(--panel-danger);
    box-shadow: 0 0 16px rgba(255, 79, 95, .9);
}

.label {
    padding: 4px 10px;
    border-radius: 0;
    border: 1px solid var(--panel-line);
    background: rgba(255, 255, 255, .92);
    color: var(--panel-ink);
    font-size: .72rem;
    font-weight: 700;
    letter-spacing: .04em;
    text-transform: uppercase;
    white-space: nowrap;
}

.bridge {
    position: absolute;
    left: 50%;
    top: 53%;
    width: 88%;
    height: 206px;
    transform: translate(-50%, -50%);
    display: flex;
    justify-content: center;
    align-items: center;
    z-index: 10;
}

.bridge-side {
    position: relative;
    width: 50%;
    height: 100%;
    transition: transform .08s linear;
}

.concrete {
    position: absolute;
    inset: 0;
    border-top: 1px solid rgba(184, 221, 255, .3);
    border-bottom: 1px solid rgba(0, 0, 0, .3);
    background:
        linear-gradient(180deg, #506377 0%, #34465a 100%);
    box-shadow:
        inset 0 1px 0 rgba(255, 255, 255, .16),
        inset 0 -30px 32px rgba(0, 0, 0, .24);
}

.concrete::before {
    content: "";
    position: absolute;
    inset: 0;
    opacity: .2;
    background-image:
        radial-gradient(circle at 20% 28%, rgba(255, 255, 255, .45) 1px, transparent 2px),
        radial-gradient(circle at 74% 64%, rgba(0, 0, 0, .5) 1px, transparent 2px);
    background-size: 30px 30px;
}

.crack-shadow {
    position: absolute;
    top: 0;
    bottom: 0;
    left: 50%;
    width: 12px;
    transform: translateX(-50%);
    background: rgba(41, 66, 98, .28);
    filter: none;
    pointer-events: none;
}

.measure {
    position: absolute;
    left: 50%;
    bottom: 14px;
    transform: translateX(-50%);
    width: 84%;
    padding: 10px 12px 9px;
    border-radius: 0;
    border: 1px solid var(--panel-line);
    background: rgba(255, 255, 255, .9);
    display: flex;
    flex-direction: column;
    gap: 8px;
    z-index: 30;
}

.measure-value {
    color: var(--panel-ink);
    text-align: center;
    font-size: .78rem;
    font-weight: 700;
    letter-spacing: .04em;
    text-transform: uppercase;
}

.measure-bar {
    position: relative;
    width: 100%;
    height: 8px;
    border-radius: 999px;
    overflow: hidden;
    background: rgba(148, 183, 226, .18);
}

.measure-fill {
    height: 100%;
    border-radius: 999px;
    background: linear-gradient(90deg, #1ce09f 0%, #59bbff 52%, #3f89ff 100%);
    transition: width .08s linear;
}

.threshold-marker {
    position: absolute;
    left: 70%;
    top: -3px;
    width: 3px;
    height: 14px;
    border-radius: 4px;
    background: #ffd360;
}

.threshold-marker.active {
    background: var(--panel-danger);
    box-shadow: 0 0 12px rgba(255, 79, 95, .95);
}

.measure-scale {
    display: flex;
    justify-content: space-between;
    color: var(--panel-muted);
    font-size: .68rem;
    font-weight: 700;
    letter-spacing: .03em;
}

.threshold-label {
    color: #ffd360;
}

.sensor.alarm ~ .bridge {
    animation: shake .18s linear infinite;
}

@keyframes shake {
    0% { transform: translate(-50%, -50%); }
    25% { transform: translate(calc(-50% - 1px), calc(-50% - 1px)); }
    50% { transform: translate(calc(-50% + 1px), calc(-50% + 1px)); }
    75% { transform: translate(calc(-50% - 1px), calc(-50% + 1px)); }
    100% { transform: translate(-50%, -50%); }
}

</style>
