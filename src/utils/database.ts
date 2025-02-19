import Database from '@tauri-apps/plugin-sql';

let db: Database | null = null;

export interface ConfigData {
  key: string;
  value: string;
}

export async function initDatabase() {
  if (db) return db;
  
  db = await Database.load('sqlite:myhelper.db');
  
  // 创建配置表
  await db.execute(`
    CREATE TABLE IF NOT EXISTS configs (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL
    )
  `);

  // 创建插件配置表
  await db.execute(`
    CREATE TABLE IF NOT EXISTS plugin_configs (
      plugin_id TEXT NOT NULL,
      key TEXT NOT NULL,
      value TEXT NOT NULL,
      PRIMARY KEY (plugin_id, key)
    )
  `);

  // 创建插件表
  await db.execute(`
    CREATE TABLE IF NOT EXISTS plugins (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      version TEXT NOT NULL,
      description TEXT,
      author TEXT,
      homepage TEXT,
      enabled BOOLEAN DEFAULT true,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
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
    'INSERT OR REPLACE INTO configs (key, value) VALUES ($1, $2)',
    [key, jsonValue]
  );
}

export async function getConfigValue(key: string): Promise<any | null> {
  const db = await getDatabase();
  const result = await db?.select<ConfigData[]>(
    'SELECT value FROM configs WHERE key = $1',
    [key]
  );
  
  if (result && result.length > 0) {
    return JSON.parse(result[0].value);
  }
  return null;
}

export async function deleteConfigValue(key: string) {
  const db = await getDatabase();
  await db?.execute('DELETE FROM configs WHERE key = $1', [key]);
}

export async function getAllConfigs(): Promise<Record<string, any>> {
  const db = await getDatabase();
  const result = await db?.select<ConfigData[]>('SELECT * FROM configs');
  
  const configs: Record<string, any> = {};
  if (result) {
    for (const row of result) {
      configs[row.key] = JSON.parse(row.value);
    }
  }
  return configs;
}

// 插件相关函数
export async function setPluginConfigValue(pluginId: string, key: string, value: any) {
  const db = await getDatabase();
  const jsonValue = JSON.stringify(value);
  
  await db?.execute(
    'INSERT OR REPLACE INTO plugin_configs (plugin_id, key, value) VALUES ($1, $2, $3)',
    [pluginId, key, jsonValue]
  );
}

export async function getPluginConfigValue(pluginId: string, key: string): Promise<any | null> {
  const db = await getDatabase();
  const result = await db?.select<ConfigData[]>(
    'SELECT value FROM plugin_configs WHERE plugin_id = $1 AND key = $2',
    [pluginId, key]
  );
  
  if (result && result.length > 0) {
    return JSON.parse(result[0].value);
  }
  return null;
}

export async function deletePluginConfigValue(pluginId: string, key: string) {
  const db = await getDatabase();
  await db?.execute(
    'DELETE FROM plugin_configs WHERE plugin_id = $1 AND key = $2',
    [pluginId, key]
  );
}

export async function getAllPluginConfigs(pluginId: string): Promise<Record<string, any>> {
  const db = await getDatabase();
  const result = await db?.select<ConfigData[]>(
    'SELECT key, value FROM plugin_configs WHERE plugin_id = $1',
    [pluginId]
  );
  
  const configs: Record<string, any> = {};
  if (result) {
    for (const row of result) {
      configs[row.key] = JSON.parse(row.value);
    }
  }
  return configs;
}

// 插件管理函数
export interface Plugin {
  id: string;
  name: string;
  version: string;
  description?: string;
  author?: string;
  homepage?: string;
  enabled: boolean;
  created_at: string;
  updated_at: string;
}

export async function addPlugin(plugin: Omit<Plugin, 'created_at' | 'updated_at'>) {
  const db = await getDatabase();
  await db?.execute(
    `INSERT INTO plugins 
     (id, name, version, description, author, homepage, enabled)
     VALUES ($1, $2, $3, $4, $5, $6, $7)`,
    [
      plugin.id,
      plugin.name,
      plugin.version,
      plugin.description,
      plugin.author,
      plugin.homepage,
      plugin.enabled
    ]
  );
}

export async function updatePlugin(plugin: Partial<Plugin> & { id: string }) {
  const db = await getDatabase();
  const updates: string[] = [];
  const values: any[] = [];
  let paramIndex = 1;

  if (plugin.name !== undefined) {
    updates.push(`name = $${paramIndex}`);
    values.push(plugin.name);
    paramIndex++;
  }
  if (plugin.version !== undefined) {
    updates.push(`version = $${paramIndex}`);
    values.push(plugin.version);
    paramIndex++;
  }
  if (plugin.description !== undefined) {
    updates.push(`description = $${paramIndex}`);
    values.push(plugin.description);
    paramIndex++;
  }
  if (plugin.author !== undefined) {
    updates.push(`author = $${paramIndex}`);
    values.push(plugin.author);
    paramIndex++;
  }
  if (plugin.homepage !== undefined) {
    updates.push(`homepage = $${paramIndex}`);
    values.push(plugin.homepage);
    paramIndex++;
  }
  if (plugin.enabled !== undefined) {
    updates.push(`enabled = $${paramIndex}`);
    values.push(plugin.enabled);
    paramIndex++;
  }

  updates.push(`updated_at = CURRENT_TIMESTAMP`);
  values.push(plugin.id);

  if (updates.length > 0) {
    await db?.execute(
      `UPDATE plugins SET ${updates.join(', ')} WHERE id = $${paramIndex}`,
      values
    );
  }
}

export async function getPlugin(id: string): Promise<Plugin | null> {
  const db = await getDatabase();
  const result = await db?.select<Plugin[]>(
    'SELECT * FROM plugins WHERE id = $1',
    [id]
  );
  
  return result && result.length > 0 ? result[0] : null;
}

export async function getAllPlugins(): Promise<Plugin[]> {
  const db = await getDatabase();
  const result = await db?.select<Plugin[]>('SELECT * FROM plugins');
  return result || [];
}

export async function deletePlugin(id: string) {
  const db = await getDatabase();
  await db?.execute('DELETE FROM plugins WHERE id = $1', [id]);
  // 同时删除插件的所有配置
  await db?.execute('DELETE FROM plugin_configs WHERE plugin_id = $1', [id]);
} 