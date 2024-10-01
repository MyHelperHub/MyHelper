<template>
    <div class="label-container">
        <Mochi shiba="random" mood="happy" blush left-eye="laugh" right-eye="laugh" left-ear="down" right-ear="down">
            <input class="title" placeholder="输入标题..." spellcheck="false">
            <textarea class="textarea" placeholder="输入内容..." spellcheck="false"></textarea>
        </Mochi>
    </div>
</template>

<script setup>
import Mochi from './Mochi/Mochi.vue';
</script>

<style lang="less">
.label-container {
    .title {
        font-size: 25px;
        font-weight: bold;
        width: 100%;
        border: 0;
        overflow: hidden;
        text-overflow: ellipsis;
    }

    .textarea {
        border: 0;
        background-color: transparent;
        width: 100%;
        min-width: 84px;
        min-height: 132px;
        max-width: 168px;
        max-height: 132px;
        font-size: 22px;
        font-weight: bold;
        resize: none;
        overflow: hidden;
        color: #666464;
        height: auto;

        &:hover {
            overflow: auto;
        }
    }
}
</style>
