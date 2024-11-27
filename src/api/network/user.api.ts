import {  User } from "@/interface/user";
import { request } from "./wrapper";


export const login = async (
  username: string,
  password: string,
): Promise<User> => {
  // 模拟延时0.2秒
  await new Promise((resolve) => setTimeout(resolve, 200));
  return {
    token: "1234567890",
    username: "admin",
    id: 1,
    email: "admin@example.com",
  };

  // return request.post<LoginResponse>("/api/login", {
  //   username,
  //   password,
  // });
};
