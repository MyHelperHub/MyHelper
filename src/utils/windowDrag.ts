import type { ObjectDirective, DirectiveBinding } from "vue";
import { Window } from "@tauri-apps/api/window";

/** 轻量型拖拽配置（仅保留常用开关） */
export interface WindowDragOptions {
  // 触发拖拽的位移阈值（像素）
  threshold?: number;
  // 仅当事件源位于该选择器内时允许拖拽（可选）
  handle?: string;
  // 禁用拖拽
  disabled?: boolean;
  // 双击是否切换最大化
  dblclickMaximize?: boolean;
}

interface DragState {
  isDown: boolean;
  didDrag: boolean; // 标记是否发生过拖拽，用于吞掉紧随其后的 click
  startX: number;
  startY: number;
  options: Required<WindowDragOptions>;
  cleanup?: () => void;
  lastDownTarget: EventTarget | null;
}

// 判断是否为交互元素（在这些元素上不触发拖拽）
function isInteractive(target: EventTarget | null): boolean {
  const el = target as HTMLElement | null;
  if (!el) return false;
  const selector = [
    "button",
    "a",
    "input",
    "textarea",
    "select",
    ".no-drag",
    "[data-no-drag]",
  ].join(",");
  return !!el.closest(selector);
}

// 起点位于可滚动容器内则不触发拖拽（避免和滚动冲突）
function isScrollable(target: EventTarget | null): boolean {
  let el = target as HTMLElement | null;
  while (el && el !== document.body) {
    const s = getComputedStyle(el);
    const oy = s.overflowY || s.overflow;
    if (oy === "auto" || oy === "scroll") return true;
    el = el.parentElement;
  }
  return false;
}

function dist(x1: number, y1: number, x2: number, y2: number): number {
  const dx = x2 - x1;
  const dy = y2 - y1;
  return Math.hypot(dx, dy);
}

const STATE_KEY = "__windowDragState" as const;

const windowDrag: ObjectDirective<HTMLElement, WindowDragOptions | undefined> =
  {
    mounted(
      el: HTMLElement,
      binding: DirectiveBinding<WindowDragOptions | undefined>,
    ) {
      const opts: Required<WindowDragOptions> = {
        threshold: binding.value?.threshold ?? 6,
        handle: binding.value?.handle ?? "",
        disabled: binding.value?.disabled ?? false,
        dblclickMaximize: binding.value?.dblclickMaximize ?? true,
      };

      const state: DragState = {
        isDown: false,
        didDrag: false,
        startX: 0,
        startY: 0,
        options: opts,
        lastDownTarget: null,
      };

      const onPointerDown = (e: PointerEvent) => {
        if (state.options.disabled) return;
        if (e.button !== 0) return; // 仅左键

        state.isDown = true;
        state.didDrag = false;
        state.startX = e.clientX;
        state.startY = e.clientY;
        state.lastDownTarget = e.target;

        // 忽略交互元素 / 可滚动容器 / 不在 handle 内
        const target = e.target as HTMLElement | null;
        if (
          isInteractive(target) ||
          isScrollable(target) ||
          (state.options.handle && !target?.closest(state.options.handle))
        ) {
          return;
        }

        // 拖拽预备：避免文本选中
        el.style.userSelect = "none";
        (document.body as HTMLElement).style.userSelect = "none";
      };

      const onPointerMove = async (e: PointerEvent) => {
        if (!state.isDown || state.options.disabled) return;
        if (state.didDrag) return; // 已经触发过拖拽
        if (
          dist(state.startX, state.startY, e.clientX, e.clientY) <
          state.options.threshold
        )
          return;

        // 二次判断起点是否合法
        const origin = state.lastDownTarget as HTMLElement | null;
        if (
          isInteractive(origin) ||
          isScrollable(origin) ||
          (state.options.handle && !origin?.closest(state.options.handle))
        ) {
          return;
        }

        state.didDrag = true;
        try {
          await Window.getCurrent().startDragging();
        } catch {
          // 非 Tauri 环境忽略
        }
      };

      const onPointerUp = () => {
        state.isDown = false;
        el.style.userSelect = "";
        (document.body as HTMLElement).style.userSelect = "";
      };

      const onClickCapture = (e: MouseEvent) => {
        // 若刚发生过拖拽，吞掉紧随其后的点击
        if (state.didDrag) {
          e.stopPropagation();
          e.preventDefault();
          state.didDrag = false;
        }
      };

      const onDblClick = async (e: MouseEvent) => {
        if (!state.options.dblclickMaximize) return;
        if (isInteractive(e.target)) return;
        try {
          await Window.getCurrent().toggleMaximize();
        } catch {
          // 非 Tauri 环境忽略
        }
      };

      el.addEventListener("pointerdown", onPointerDown);
      window.addEventListener("pointermove", onPointerMove);
      window.addEventListener("pointerup", onPointerUp);
      window.addEventListener("pointercancel", onPointerUp);
      window.addEventListener("blur", onPointerUp);
      el.addEventListener("click", onClickCapture, true);
      el.addEventListener("dblclick", onDblClick);

      (el as any)[STATE_KEY] = state;
      state.cleanup = () => {
        el.removeEventListener("pointerdown", onPointerDown);
        window.removeEventListener("pointermove", onPointerMove);
        window.removeEventListener("pointerup", onPointerUp);
        window.removeEventListener("pointercancel", onPointerUp);
        window.removeEventListener("blur", onPointerUp);
        el.removeEventListener("click", onClickCapture, true);
        el.removeEventListener("dblclick", onDblClick);
      };
    },
    updated(
      el: HTMLElement,
      binding: DirectiveBinding<WindowDragOptions | undefined>,
    ) {
      const state = (el as any)[STATE_KEY] as DragState | undefined;
      if (!state) return;
      const v = binding.value || {};
      state.options.threshold = v.threshold ?? state.options.threshold;
      state.options.handle = v.handle ?? state.options.handle;
      state.options.disabled = v.disabled ?? state.options.disabled;
      state.options.dblclickMaximize =
        v.dblclickMaximize ?? state.options.dblclickMaximize;
    },
    unmounted(el: HTMLElement) {
      const state = (el as any)[STATE_KEY] as DragState | undefined;
      if (state?.cleanup) state.cleanup();
      delete (el as any)[STATE_KEY];
    },
  };

export default windowDrag;
