<template>
  <div class="home">
    <div class="brand">
      <img class="logo" src="/logo.png" data-tauri-drag-region />
    </div>
    <div class="animation">
      <div class="dog-container">
        <div class="body"></div>
        <div class="legA"></div>
        <div class="legB"></div>
        <div class="legC"></div>
        <div class="legD"></div>
        <div class="tail"></div>
        <div class="ear"></div>
        <div class="nose"></div>
        <div class="eye"></div>
        <div class="tounge"></div>
      </div>
    </div>
  </div>
</template>
<script setup lang="ts"></script>
<style lang="less">
@scale: 0.2; /* 缩小比例 */

.home {
  background-color: aquamarine;
  width: 100%;
  height: 100%;
  display: flex;

  .brand {
    display: flex;
    justify-content: start;
    align-items: center;

    .logo {
      height: 50px;
      width: 50px;
      border-radius: 50%;
      border: 4px solid rgba(230, 235, 240, 0.8);
      z-index: 1;
    }
  }
  .animation {
    width: 100%;
    height: 100%;
    margin: 5px;
    margin-left: 12px;

    .dog-container {
      background-color: #fad06c;
      width: 120px * @scale;
      height: 70px * @scale;
      position: absolute;
      bottom: 50%;
      border-radius: 10px * @scale 10px * @scale 10px * @scale 100px * @scale;
    }

    .body {
      background-color: #fad06c;
      width: 170px * @scale;
      height: 90px * @scale;
      position: relative;
      top: 65px * @scale;
      left: 80px * @scale;
      border-radius: 10px * @scale 10px * @scale 10px * @scale 55px * @scale;
    }

    .legA,
    .legB,
    .legC,
    .legD {
      background-color: #fad06c;
      width: 19px * @scale;
      height: 55px * @scale;
      position: relative;
    }

    .legA {
      left: 100px * @scale;
      top: 50px * @scale;
      border-radius: 0px 0px 10px * @scale 10px * @scale;
    }

    .legB {
      left: 130px * @scale;
      bottom: 9px * @scale;
      border-radius: 0px 0px 10px * @scale 10px * @scale;
      background-color: #ffb838;
      z-index: -1;
    }

    .legC {
      left: 205px * @scale;
      bottom: 60px * @scale;
      background-color: #ffb838;
      z-index: -1;
      border-radius: 0px 0px 10px * @scale 10px * @scale;
    }

    .legD {
      left: 231px * @scale;
      bottom: 114px * @scale;
      border-radius: 0px 0px 10px * @scale 10px * @scale;
    }

    .tail {
      width: 0;
      height: 0;
      border-left: 10px * @scale solid transparent;
      border-bottom: 100px * @scale solid #fad06c;
      position: relative;
      bottom: 320px * @scale;
      left: 230px * @scale;
      transform: rotate(30deg * @scale);
      transform-origin: bottom;
      animation: animate 1s infinite;
      border-radius: 7px * @scale;
    }

    @keyframes animate {
      50% {
        transform: rotate(15deg * @scale);
      }
    }

    .ear {
      background-color: #000;
      position: relative;
      width: 42px * @scale;
      height: 90px * @scale;
      border-radius: 15px * @scale 15px * @scale 100px * @scale 100px * @scale;
      left: 78px * @scale;
      bottom: 410px * @scale;
    }

    .nose {
      background-color: #000;
      height: 12px * @scale;
      width: 12px * @scale;
      border-radius: 50%;
      position: relative;
      right: 1.5px * @scale;
      bottom: 499px * @scale;
    }

    .eye {
      background-color: #000;
      height: 10px * @scale;
      width: 12px * @scale;
      border-radius: 50%;
      position: relative;
      bottom: 500px * @scale;
      left: 50px * @scale;
    }

    .tounge {
      background-color: tomato;
      height: 20px * @scale;
      width: 8px * @scale;
      border-radius: 10px * @scale;
      position: relative;
      left: 23px * @scale;
      bottom: 475px * @scale;
      transform: rotate(45deg * @scale);
      z-index: -1;
      animation: animate1 1s infinite;
    }

    @keyframes animate1 {
      50% {
        transform: rotate(45deg * @scale) translateY(2.5px * @scale);
      }
    }
  }
}
</style>
