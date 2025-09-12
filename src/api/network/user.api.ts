import { LoginDTO } from "@/interface/user";
import { request } from "./wrapper";

/** 用户登录 */
export const login = (formData: { Email: string; Password: string }) => {
  return request.post<LoginDTO>("/api/user/login", formData);
};

/** 用户注册 */
export const register = (formData: {
  Username: string;
  Email: string;
  Password: string;
}) => {
  return request.post("/api/user/register", formData);
};

/** 刷新token接口 */
export const refreshToken = () => {
  return request.post<{ token: string }>("/api/user/refresh-token");
};
