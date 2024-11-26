import { request } from "./wrapper";

interface LoginResponse {
  token: string;
  username: string;
}

export const login = async (
  username: string,
  password: string,
): Promise<LoginResponse> => {
  // 模拟延时0.2秒
  await new Promise((resolve) => setTimeout(resolve, 200));

  return request.post<LoginResponse>("/api/login", {
    username,
    password,
  });
};
