<template>
  <div class="MochiBox" :class="[shibaAttribute, { pop: popRef }]" tabindex="0">
    <MochiShiba
      :size="size"
      :mood="moodAttribute"
      :leftEye="leftEyeAttribute"
      :rightEye="rightEyeAttribute"
      :leftEar="leftEarAttribute"
      :rightEar="rightEarAttribute"
      :blush="blushAttribute" />
    <div class="MochiContent">
      <slot></slot>
    </div>
    <MochiPaws :size="size" />
  </div>
</template>

<script setup>
import { ref, onMounted } from "vue";
import MochiPaws from "./MochiPaws.vue";
import MochiShiba from "./MochiShiba.vue";

const { shiba, size, mood, leftEye, rightEye, leftEar, rightEar, blush, pop } =
  defineProps({
    shiba: {
      type: String,
      default: "okaka",
    },
    size: {
      type: String,
      default: "medium",
    },
    mood: {
      type: String,
      default: "",
    },
    leftEye: {
      type: String,
      default: "open",
    },
    rightEye: {
      type: String,
      default: "open",
    },
    leftEar: {
      type: String,
      default: "up",
    },
    rightEar: {
      type: String,
      default: "flat",
    },
    blush: {
      type: Boolean,
      default: false,
    },
    pop: {
      type: Boolean,
      default: true,
    },
  });
const canRandom = ref(false);
const popRef = ref(pop);
const shibaAttribute = ref(shiba);
const moodAttribute = ref(mood);
const leftEyeAttribute = ref(leftEye);
const rightEyeAttribute = ref(rightEye);
const leftEarAttribute = ref(leftEar);
const rightEarAttribute = ref(rightEar);
const blushAttribute = ref(blush);

// Function to randomize the shiba's attributes
const randomize = () => {
  if (canRandom.value) {
    shibaAttribute.value = [
      "ume",
      "sesame",
      "tuna",
      "okaka",
      "anko",
      "kinako",
      "sakura",
      "monaka",
    ][Math.floor(Math.random() * 8)];
    moodAttribute.value = [
      "",
      "happy",
      "content",
      "excited",
      "cheeky",
      "drool",
      "cute",
      "gleam",
    ][Math.floor(Math.random() * 8)];
    leftEyeAttribute.value = ["open", "wink", "shy", "laugh"][
      Math.floor(Math.random() * 4)
    ];
    rightEyeAttribute.value = ["open", "wink", "shy", "laugh"][
      Math.floor(Math.random() * 4)
    ];
    leftEarAttribute.value = ["up", "down", "flat", "middle"][
      Math.floor(Math.random() * 4)
    ];
    rightEarAttribute.value = ["up", "down", "flat", "middle"][
      Math.floor(Math.random() * 4)
    ];
    blushAttribute.value = Math.random() < 0.5;
  }
};

onMounted(() => {
  setTimeout(() => {
    popRef.value = false;
  }, 2000);
});

if (shibaAttribute.value == "random") {
  canRandom.value = true;
  randomize();
}
</script>
