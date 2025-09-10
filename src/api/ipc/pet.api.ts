import { invokeApi } from "./wrapper";

// 导入 Live2D 模型
export const ipcImportLive2DModel = async (
  filePath: string,
  modelName?: string,
) => {
  return invokeApi("import_live2d_model", {
    filePath,
    modelName,
  });
};

// 获取所有 Live2D 模型（预置+用户导入）
export const ipcGetAllLive2DModels = async () => {
  return invokeApi("get_all_live2d_models");
};

// 删除用户导入的模型（仅限用户模型）
export const ipcDeleteUserLive2DModel = async (modelName: string) => {
  return invokeApi("delete_user_live2d_model", {
    modelName,
  });
};
