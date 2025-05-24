<template>
  <div
    ref="containerRef"
    class="virtual-list-container"
    :style="{ height: `${containerHeight}px` }"
    @scroll="handleScroll">
    <div class="virtual-list-wrapper" :style="{ height: `${totalHeight}px` }">
      <div
        class="virtual-list-content"
        :style="{ transform: `translateY(${offsetY}px)` }">
        <div
          v-for="item in visibleItems"
          :key="getItemKey(item.data)"
          class="virtual-list-item"
          :style="{ height: `${itemHeight}px` }">
          <slot :item="item.data" :index="item.index"></slot>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch, nextTick } from "vue";

// 定义Props
interface Props {
  items: any[];
  itemHeight: number;
  containerHeight: number;
  keyField?: string;
  overscan?: number; // 预渲染项目数量，提升滚动体验
}

const props = withDefaults(defineProps<Props>(), {
  keyField: "id",
  overscan: 5,
});

// 容器引用
const containerRef = ref<HTMLElement>();

// 滚动位置
const scrollTop = ref(0);

// 计算总高度
const totalHeight = computed(() => props.items.length * props.itemHeight);

// 计算可见范围
const visibleRange = computed(() => {
  const start = Math.floor(scrollTop.value / props.itemHeight);
  const end = Math.min(
    start + Math.ceil(props.containerHeight / props.itemHeight),
    props.items.length,
  );

  // 加上overscan
  const overscanStart = Math.max(0, start - props.overscan);
  const overscanEnd = Math.min(props.items.length, end + props.overscan);

  return {
    start: overscanStart,
    end: overscanEnd,
  };
});

// 计算可见项目
const visibleItems = computed(() => {
  const { start, end } = visibleRange.value;
  return props.items.slice(start, end).map((item, index) => ({
    data: item,
    index: start + index,
  }));
});

// 计算偏移量
const offsetY = computed(() => {
  return visibleRange.value.start * props.itemHeight;
});

// 获取项目的key
const getItemKey = (item: any) => {
  if (typeof item === "object" && item !== null) {
    return item[props.keyField] || item.id || JSON.stringify(item);
  }
  return item;
};

// 处理滚动事件
const handleScroll = (event: Event) => {
  const target = event.target as HTMLElement;
  scrollTop.value = target.scrollTop;
};

// 滚动到指定项目
const scrollToItem = (index: number, behavior: ScrollBehavior = "smooth") => {
  if (!containerRef.value) return;

  const targetScrollTop = index * props.itemHeight;
  containerRef.value.scrollTo({
    top: targetScrollTop,
    behavior,
  });
};

// 滚动到顶部
const scrollToTop = (behavior: ScrollBehavior = "smooth") => {
  scrollToItem(0, behavior);
};

// 暴露方法给父组件
defineExpose({
  scrollToItem,
  scrollToTop,
});

// 监听items变化，保持滚动位置合理
watch(
  () => props.items.length,
  (newLength, oldLength) => {
    if (newLength < oldLength && containerRef.value) {
      const maxScrollTop = Math.max(
        0,
        newLength * props.itemHeight - props.containerHeight,
      );
      if (scrollTop.value > maxScrollTop) {
        nextTick(() => {
          containerRef.value!.scrollTop = maxScrollTop;
        });
      }
    }
  },
);
</script>

<style lang="less" scoped>
.virtual-list-container {
  overflow-y: auto;
  position: relative;

  &::-webkit-scrollbar {
    display: none;
  }

  /* Firefox */
  scrollbar-width: none;
}

.virtual-list-wrapper {
  position: relative;
  width: 100%;
}

.virtual-list-content {
  position: relative;
  width: 100%;
}

.virtual-list-item {
  width: 100%;
  box-sizing: border-box;
}
</style>
