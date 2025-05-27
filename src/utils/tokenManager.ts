import GlobalData from "@/utils/globalData";
import { User } from "@/interface/user";

/**
 * Token管理器
 * 提供token的存储、获取、验证等功能
 */
export class TokenManager {
  private static instance: TokenManager;
  private token: string | null = null;
  private userInfo: User | null = null;
  private initialized: boolean = false;
  private initPromise: Promise<void> | null = null;

  private constructor() {
    // 不在构造函数中调用async方法
  }

  public static getInstance(): TokenManager {
    if (!TokenManager.instance) {
      TokenManager.instance = new TokenManager();
    }
    return TokenManager.instance;
  }

  /**
   * 确保初始化完成
   */
  private async ensureInitialized(): Promise<void> {
    if (this.initialized) {
      return;
    }

    if (this.initPromise) {
      return this.initPromise;
    }

    this.initPromise = this.init();
    await this.initPromise;
  }

  /**
   * 初始化token
   */
  private async init(): Promise<void> {
    try {
      const userInfo = await GlobalData.get("userInfo");
      if (userInfo) {
        this.token = userInfo.Token || null;
        this.userInfo = userInfo;
      }
      this.initialized = true;
    } catch (error) {
      this.token = null;
      this.userInfo = null;
      this.initialized = true; // 即使失败也标记为已初始化
    }
  }

  /**
   * 获取当前token
   */
  public async getToken(): Promise<string | null> {
    await this.ensureInitialized();
    return this.token;
  }

  /**
   * 获取用户信息
   */
  public async getUserInfo(): Promise<User | null> {
    await this.ensureInitialized();
    return this.userInfo;
  }

  /**
   * 检查token是否存在
   */
  public async hasToken(): Promise<boolean> {
    await this.ensureInitialized();
    return !!this.token;
  }

  /**
   * 设置token和用户信息
   */
  public async setToken(token: string, userInfo?: User): Promise<void> {
    await this.ensureInitialized();

    this.token = token;

    if (userInfo) {
      this.userInfo = { ...userInfo, Token: token };
    } else if (this.userInfo) {
      this.userInfo.Token = token;
    }

    try {
      if (this.userInfo) {
        await GlobalData.set("userInfo", this.userInfo);
      }
    } catch (error) {
      throw error;
    }
  }

  /**
   * 清除token和用户信息
   */
  public async clearToken(): Promise<void> {
    this.token = null;
    this.userInfo = null;

    try {
      await GlobalData.delete("userInfo");
    } catch (error) {
      // 静默处理错误
    }
  }

  /**
   * 获取请求头名称
   */
  public getHeaderName(): string {
    return "Authorization";
  }

  /**
   * 从响应中提取新token
   */
  public extractTokenFromResponse(responseData: any): string | null {
    return responseData.Data?.token || null;
  }
}

// 导出单例实例
export const tokenManager = TokenManager.getInstance();
