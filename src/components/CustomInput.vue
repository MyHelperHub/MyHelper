<template>
    <div class="input-container">
        <input type="text" v-model="localInputValue" required />
        <span class="highlight"></span>
        <span class="bar"></span>
        <label>{{ label }}</label>
        <div class="slot-container">
            <slot></slot>
        </div>
    </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue';
import { useDebounce } from '@/utils/debounce';

const props = defineProps({
    label: {
        type: String,
        required: true,
    },
    modelValue: {
        type: String,
        default: '',
    },
});

const emit = defineEmits(['update:modelValue']);

const localInputValue = ref(props.modelValue);

// 监听本地变量的变化，并使用防抖函数更新父组件的值
watch(localInputValue, useDebounce((newValue: any) => {
    emit('update:modelValue', newValue);
}, 300));
</script>
<style lang="less" scoped>
.input-container {
    position: relative;
    margin-bottom: 45px;

    input {
        font-size: 16px;
        padding: 10px 0 1px 0;
        display: block;
        width: 100%;
        border: none;
        border-bottom: 1px solid #757575;

        &:focus {
            outline: none;
        }

        &:focus~label,
        &:valid~label {
            top: -10px;
            font-size: 14px;
            color: #5264ae;
        }

        &:focus~.bar:before,
        &:focus~.bar:after {
            width: 50%;
        }

        &:focus~.highlight {
            animation: inputHighlighter 0.3s ease;
        }
    }

    label {
        display: flex;
        color: #999;
        font-size: 14px;
        font-weight: normal;
        position: absolute;
        pointer-events: none;
        left: 5px;
        top: 5px;
        transition: 0.2s ease all;
    }

    .bar {
        position: relative;
        display: block;
        width: 100%;

        &:before,
        &:after {
            content: '';
            height: 2px;
            width: 0;
            bottom: 1px;
            position: absolute;
            background: #5264ae;
            transition: 0.2s ease all;
        }

        &:before {
            left: 50%;
        }

        &:after {
            right: 50%;
        }
    }

    .highlight {
        position: absolute;
        height: 60%;
        width: 100px;
        top: 25%;
        left: 0;
        pointer-events: none;
        opacity: 0.5;
    }

    .slot-container {
        position: absolute;
        top: 50%;
        right: 10px;
        transform: translateY(-50%);
    }
}

@keyframes inputHighlighter {
    from {
        background: #8a9ce4;
    }

    to {
        width: 0;
        background: transparent;
    }
}
</style>