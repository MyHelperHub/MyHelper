<template>
  <div class="MochiPaws /" :class="size">
    <svg
      class="paws"
      xmlns="http://www.w3.org/2000/svg"
      width="152"
      height="40"
      viewBox="0 0 152 40">
      <title>Mochi Paws</title>
      <g id="paws">
        <g id="left-paw">
          <path
            id="paw"
            class="fur"
            d="M5.3,24.53A19.76,19.76,0,0,1,11,12,18.79,18.79,0,0,1,24,6.41a18,18,0,0,1,13.71,6.35,13.28,13.28,0,0,1,2.91,6.39,7.68,7.68,0,0,1-.44,4.77,7.12,7.12,0,0,1-3.5,3.29,7.34,7.34,0,0,1-4,.51A6.07,6.07,0,0,1,30.49,30a7,7,0,0,1-6.06.18,4.84,4.84,0,0,1-1.36,2.38c-1.7,1.59-4.63,1.77-7.36.43A6.2,6.2,0,0,1,13.55,31a6.13,6.13,0,0,1-.93-2.12Z" />
          <path
            class="fur outline"
            d="M5.3,24.53A19.76,19.76,0,0,1,11,12,18.79,18.79,0,0,1,24,6.41a18,18,0,0,1,13.71,6.35,12.15,12.15,0,0,1,2.91,6.39A8,8,0,0,1,39.51,25c-2.09,2.87-5.85,2.86-6.32,2.85" />
          <path
            class="fur outline"
            d="M31.11,22a4.77,4.77,0,0,1,2,3.4,4.69,4.69,0,0,1-1.07,3.27,5.68,5.68,0,0,1-3.85,2,6.59,6.59,0,0,1-3.41-.44" />
          <path
            class="fur outline"
            d="M12.62,28.9a6.79,6.79,0,0,0,2.83,3.87c2.82,1.72,7.5,1.17,8.72-1.7.77-1.79,0-4.16-1.62-6" />
        </g>
        <g id="right-paw">
          <path
            class="fur"
            d="M146.7,24.53A19.76,19.76,0,0,0,141,12,18.79,18.79,0,0,0,128,6.41a18,18,0,0,0-13.71,6.35,13.28,13.28,0,0,0-2.91,6.39,7.68,7.68,0,0,0,.44,4.77,7.12,7.12,0,0,0,3.5,3.29,7.34,7.34,0,0,0,4,.51,6.07,6.07,0,0,0,2.2,2.23,7,7,0,0,0,6.06.18,4.84,4.84,0,0,0,1.36,2.38c1.7,1.59,4.63,1.77,7.36.43A6.2,6.2,0,0,0,138.45,31a6.13,6.13,0,0,0,.93-2.12Z" />
          <path
            class="fur outline"
            d="M146.7,24.53A19.76,19.76,0,0,0,141,12,18.79,18.79,0,0,0,128,6.41a18,18,0,0,0-13.71,6.35,12.15,12.15,0,0,0-2.91,6.39A8,8,0,0,0,112.49,25c2.09,2.87,5.85,2.86,6.32,2.85" />
          <path
            class="fur outline"
            d="M120.89,22a4.77,4.77,0,0,0-2,3.4,4.69,4.69,0,0,0,1.07,3.27,5.68,5.68,0,0,0,3.85,2,6.59,6.59,0,0,0,3.41-.44" />
          <path
            class="fur outline"
            d="M139.38,28.9a6.79,6.79,0,0,1-2.83,3.87c-2.82,1.72-7.5,1.17-8.72-1.7-.77-1.79,0-4.16,1.62-6" />
        </g>
      </g>
    </svg>
  </div>
</template>

<script setup>
defineProps({
  size: { type: String, default: "medium" },
});
</script>
