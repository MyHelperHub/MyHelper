export interface RegisterForm {
    username: string;
    email: string;
    password: string;
    confirmPassword: string;
}

export interface User {
    id: number;
    username: string;
    email: string;
    /** 用户头像，不是软件Logo */
    avatar?: string;
    token?: string;
}