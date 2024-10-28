* **Tauri:** 使用 `emit` 用于跨窗口通信，使用: 命名，如``emit('my:event')``。

* **EventBus:** `emit`用于窗口内通信，使用-命名，如``emit('my-event')``。

* **Vue:** `emit`用于子组件向父组件传递数据，使用大驼峰命名，如``emit('myEvent')``。