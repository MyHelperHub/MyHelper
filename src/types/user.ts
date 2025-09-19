export type User = {
  UserId: number;
  Username: string;
  Email: string;
  /** 用户头像，不是软件Logo */
  Avatar?: string;
  Token?: string;
};

export type LoginDTO = {
  Token: string;
  UserInfo: User;
};

// 添加新的接口，扩展 User 类型
export type UserForm = User & {
  Password?: string;
  ConfirmPassword?: string;
};
