<template>
  <div class="button-container">
    <div class="button">
      <div class="content">{{ value }}</div>
    </div>
  </div>
</template>

<script setup lang="ts">
// @ts-expect-error
const props = defineProps({
  value: {
    type: String,
    default: "确定",
  },
});
</script>

<style lang="less" scoped>
.button-container {
  .button {
    cursor: pointer;
    position: relative;
    transition: all 0.4s;
    font-size: 14px;
    display: flex;
    justify-content: center;
    align-items: center;

    .content {
      padding: 4px;
    }

    &:after,
    &:before {
      content: "";
      width: 10px;
      height: 10px;
      position: absolute;
      border: 0px solid #fff;
      transition: all 0.4s;
    }

    &:after {
      top: 0;
      left: 0;
      border-top: 3px solid black;
      border-left: 3px solid black;
    }

    &:before {
      bottom: 0;
      right: 0;
      border-bottom: 3px solid black;
      border-right: 3px solid black;
    }

    &:hover {
      border-top-right-radius: 0px;
      border-bottom-left-radius: 0px;

      &:before,
      &:after {
        width: 100%;
        height: 100%;
      }
    }
  }
}
</style>
