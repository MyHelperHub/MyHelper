/** 切换开关
 * @param isChecked 是否打开
 * @param onEnable 开启时的回调函数
 * @param onDisable 关闭时的回调函数
 */
export const handleSwitch = (
  isChecked: boolean,
  onEnable: () => void,
  onDisable: () => void,
) => {
  if (isChecked) {
    onEnable();
  } else {
    onDisable();
  }
};
