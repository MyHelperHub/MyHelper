import Database from '@tauri-apps/plugin-sql';
import { PluginConfig, PluginStatus, PluginCategory } from '../interface/plugin';
import { WindowConfig } from '../interface/window';
import { NewWindowEnum } from '../interface/windowEnum';

let db: Database | null = null;

export interface ConfigData {
  key: string;
  value: string;
}

export interface WebConfigItem {
  id: number;
  logo: string;
  title: string;
  url: string;
}

export interface UserConfig {
  Avatar: string | null;
  Email: string;
  LastLoginTime: string;
  Status: boolean;
  Token: string;
  UserId: number;
  Username: string;
}

export interface AppConfig {
  appConfig: {
    dataList: any[];
  };
  quickInputConfig: {
    commonText: string[];
  };
  webConfig: {
    dataList: WebConfigItem[];
  };
  settingConfig: {
    clipboardListening: boolean;
  };
  userConfig: UserConfig;
}

export async function initDatabase() {
  if (db) return db;
  
  db = await Database.load('sqlite:myhelper.db');
  
  // 创建配置表
  await db.execute(`
    CREATE TABLE IF NOT EXISTS config (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL
    )
  `);

  // 创建插件配置表
  await db.execute(`
    CREATE TABLE IF NOT EXISTS plugin_config (
      window_id TEXT PRIMARY KEY,
      info TEXT NOT NULL,
      config TEXT NOT NULL,
      data TEXT NOT NULL
    )
  `);
  
  return db;
}

export async function getDatabase() {
  if (!db) {
    await initDatabase();
  }
  return db;
}

export async function setConfigValue(key: string, value: any) {
  const db = await getDatabase();
  const jsonValue = JSON.stringify(value);
  
  await db?.execute(
    'INSERT OR REPLACE INTO config (key, value) VALUES ($1, $2)',
    [key, jsonValue]
  );
}

export async function getConfigValue<T = any>(key: string): Promise<T | null> {
  const db = await getDatabase();
  const result = await db?.select<ConfigData[]>(
    'SELECT value FROM config WHERE key = $1',
    [key]
  );
  
  if (result && result.length > 0) {
    return JSON.parse(result[0].value);
  }
  return null;
}

export async function deleteConfigValue(key: string) {
  const db = await getDatabase();
  await db?.execute('DELETE FROM config WHERE key = $1', [key]);
}

export async function getAllConfigs(): Promise<AppConfig> {
  const db = await getDatabase();
  const result = await db?.select<ConfigData[]>('SELECT * FROM config');
  
  const defaultConfig: AppConfig = {
    appConfig: {
      dataList: []
    },
    quickInputConfig: {
      commonText: []
    },
    webConfig: {
      dataList: []
    },
    settingConfig: {
      clipboardListening: false
    },
    userConfig: {
      Avatar: null,
      Email: '',
      LastLoginTime: '',
      Status: false,
      Token: '',
      UserId: 0,
      Username: ''
    }
  };

  if (result) {
    for (const row of result) {
      const value = JSON.parse(row.value);
      switch (row.key) {
        case 'appConfig':
          defaultConfig.appConfig = value;
          break;
        case 'quickInputConfig':
          defaultConfig.quickInputConfig = value;
          break;
        case 'webConfig':
          defaultConfig.webConfig = value;
          break;
        case 'settingConfig':
          defaultConfig.settingConfig = value;
          break;
        case 'userConfig':
          defaultConfig.userConfig = value;
          break;
      }
    }
  }
  
  return defaultConfig;
}

// 插件相关函数
export async function addPlugin(plugin: PluginConfig) {
  const db = await getDatabase();
  await db?.execute(
    `INSERT INTO plugin_config (window_id, info, config, data)
     VALUES ($1, $2, $3, $4)`,
    [
      plugin.windowId,
      JSON.stringify(plugin.info),
      JSON.stringify(plugin.config),
      JSON.stringify(plugin.data)
    ]
  );
}

export async function updatePlugin(plugin: Partial<PluginConfig> & { windowId: string }) {
  const db = await getDatabase();
  const updates: string[] = [];
  const values: any[] = [];
  let paramIndex = 1;

  const fields = {
    info: plugin.info ? JSON.stringify(plugin.info) : undefined,
    config: plugin.config ? JSON.stringify(plugin.config) : undefined,
    data: plugin.data ? JSON.stringify(plugin.data) : undefined
  };

  for (const [key, value] of Object.entries(fields)) {
    if (value !== undefined) {
      updates.push(`${key} = $${paramIndex}`);
      values.push(value);
      paramIndex++;
    }
  }

  values.push(plugin.windowId);

  if (updates.length > 0) {
    await db?.execute(
      `UPDATE plugin_config SET ${updates.join(', ')} WHERE window_id = $${paramIndex}`,
      values
    );
  }
}

export async function getPlugin(windowId: string): Promise<PluginConfig | null> {
  const db = await getDatabase();
  const result = await db?.select<any[]>(
    'SELECT * FROM plugin_config WHERE window_id = $1',
    [windowId]
  );
  
  if (result && result.length > 0) {
    const plugin = result[0];
    const data = JSON.parse(plugin.data) as WindowConfig;
    const info = JSON.parse(plugin.info);
    const config = JSON.parse(plugin.config);
    
    return {
      windowId: plugin.window_id,
      title: data.title || '',
      size: data.size || [800, 600],
      position: data.position,
      alwaysOnTop: data.alwaysOnTop,
      resizable: data.resizable,
      icon: data.icon,
      loading: data.loading,
      data: {
        windowId: NewWindowEnum.MhPlugin,
        title: data.title || '',
        url: data.url || '',
        size: data.size || [800, 600],
        position: data.position,
        alwaysOnTop: data.alwaysOnTop,
        resizable: data.resizable,
        icon: data.icon,
        loading: data.loading
      },
      info: {
        installTime: info.installTime || new Date().toISOString(),
        status: info.status || PluginStatus.PUBLISHED,
        author: info.author || '',
        email: info.email || '',
        version: info.version || '0.0.1',
        description: info.description || '',
        downloads: info.downloads || 0,
        rating: info.rating || 0,
        tags: info.tags || [],
        category: info.category || PluginCategory.OTHER,
        createTime: info.createTime || new Date().toISOString(),
        updateTime: info.updateTime || new Date().toISOString()
      },
      config: {
        isEnabled: config?.isEnabled ?? true
      }
    };
  }
  return null;
}

export async function getAllPlugins(): Promise<PluginConfig[]> {
  const db = await getDatabase();
  const result = await db?.select<any[]>('SELECT * FROM plugin_config');
  
  return (result || []).map(plugin => {
    const data = JSON.parse(plugin.data) as WindowConfig;
    const info = JSON.parse(plugin.info);
    const config = JSON.parse(plugin.config);
    
    return {
      windowId: plugin.window_id,
      title: data.title || '',
      size: data.size || [800, 600],
      position: data.position,
      alwaysOnTop: data.alwaysOnTop,
      resizable: data.resizable,
      icon: data.icon,
      loading: data.loading,
      data: {
        windowId: NewWindowEnum.MhPlugin,
        title: data.title || '',
        url: data.url || '',
        size: data.size || [800, 600],
        position: data.position,
        alwaysOnTop: data.alwaysOnTop,
        resizable: data.resizable,
        icon: data.icon,
        loading: data.loading
      },
      info: {
        installTime: info.installTime || new Date().toISOString(),
        status: info.status || PluginStatus.PUBLISHED,
        author: info.author || '',
        email: info.email || '',
        version: info.version || '0.0.1',
        description: info.description || '',
        downloads: info.downloads || 0,
        rating: info.rating || 0,
        tags: info.tags || [],
        category: info.category || PluginCategory.OTHER,
        createTime: info.createTime || new Date().toISOString(),
        updateTime: info.updateTime || new Date().toISOString()
      },
      config: {
        isEnabled: config?.isEnabled ?? true
      }
    };
  });
}

export async function deletePlugin(windowId: string) {
  const db = await getDatabase();
  await db?.execute('DELETE FROM plugin_config WHERE window_id = $1', [windowId]);
} 