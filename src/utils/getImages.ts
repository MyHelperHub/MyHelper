/** vite加载图片 */
export const getImageByPath = (imagePath: string): string => {
    return new URL(imagePath, import.meta.url).href;
  };