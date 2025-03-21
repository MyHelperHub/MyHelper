import { LoginDTO } from "@/interface/user";
import { request } from "./wrapper";

export const login = (formData: { Email: string; Password: string }) => {
  return request.post<LoginDTO>("/api/user/login", formData);
};

export const register = (formData: {
  Username: string;
  Email: string;
  Password: string;
}) => {
  return request.post("/api/user/register", formData);
};
