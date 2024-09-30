<template>
    <div class="main">
        <MochiBox shiba="random" mood="happy" blush left-eye="laugh" right-eye="laugh" left-ear="down" right-ear="down"
            @contextmenu="openMenu($event)">
            <input class="title" placeholder="输入标题..." spellcheck="false">
            <textarea class="textarea" placeholder="输入内容..." spellcheck="false"></textarea>
            <!-- <p class="shop kotobuki" title="kotobuki">小狗小狗小狗</p> -->
            <ul v-show="menu_show"
                :style="{ left: position.left + 'px', top: position.top + 'px', display: (menu_show ? 'block' : 'none') }"
                class="contextmenu">
                <div class="items" @click="Ontop">
                    置顶
                </div>
            </ul>
        </MochiBox>
    </div>
    <!-- <MochiBox v-for="(item, index) in label_list" :key="index" :shiba=item.shiba :mood=item.mood>
    </MochiBox> -->
</template>

<script setup>
import { ref, watch } from 'vue';
import MochiBox from './Mochi/one.vue';
// let label_list = [{ "shiba": "okaka", "mood": "happy" }, { "shiba": "sesame", "mood": "cheeky" }];
const menu_show = ref(false)
const position = ref({
    top: 0,
    left: 0
})

//右键菜单打开
function openMenu(e) {
    menu_show.value = true
    position.value.top = e.clientY - 110
    position.value.left = e.clientX - 0
}
watch(menu_show, () => {
    if (menu_show.value) {
        document.body.addEventListener('click', () => { menu_show.value = false })
    } else {
        document.body.removeEventListener('click', () => { menu_show.value = false })
    }
})
function Ontop() {
    $window.label_ontop()
}
</script>

<style scoped>
.main {
    -webkit-app-region: drag;
    position: relative;
    max-width: 210px;
    padding-bottom: 75px;
    background-color: transparent;
    box-shadow: none;
}

.title {
    -webkit-app-region: no-drag;
    font-size: 25px;
    font-weight: bold;
    width: 100%;
    border: 0;
    overflow: hidden;
    text-overflow: ellipsis;
}

.textarea {
    -webkit-app-region: no-drag;
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
}

.textarea:hover {
    /* resize: both; */
    overflow: auto;
}

.contextmenu {
    width: 80px;
    margin: 0;
    background: #fff;
    z-index: 2;
    position: absolute;
    list-style-type: none;
    padding: 5px 0;
    border-radius: 4px;
    font-size: 12px;
    font-weight: 400;
    color: #333;
    box-shadow: 1px 1px 2px 0 rgba(0, 0, 0, 0.3);
}

.contextmenu .items {
    padding: 0 15px;
    height: 35px;
    width: 100%;
    line-height: 35px;
    color: rgb(29, 33, 41);
    cursor: pointer;
}

.contextmenu .items:hover {
    /* width: 50px; */
    background: rgb(229, 230, 235);
}
</style>
