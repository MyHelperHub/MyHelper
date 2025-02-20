import Database from "@tauri-apps/plugin-sql";
import { ConfigData } from "../interface/database";

let db: Database | null = null;

export async function initDatabase() {
  if (db) return db;

  db = await Database.load("sqlite:myhelper.db");

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
    "INSERT OR REPLACE INTO config (key, value) VALUES ($1, $2)",
    [key, jsonValue],
  );
}

export async function getConfigValue<T = any>(key: string): Promise<T | null> {
  const db = await getDatabase();
  const result = await db?.select<ConfigData[]>(
    "SELECT value FROM config WHERE key = $1",
    [key],
  );

  if (result && result.length > 0) {
    return JSON.parse(result[0].value);
  }
  return null;
}

export async function deleteConfigValue(key: string) {
  const db = await getDatabase();
  await db?.execute("DELETE FROM config WHERE key = $1", [key]);
}

export async function executeQuery<T = any>(
  query: string,
  params: any[] = [],
): Promise<T[]> {
  const db = await getDatabase();
  return (await db?.select<T[]>(query, params)) || [];
}

export async function executeCommand(
  query: string,
  params: any[] = [],
): Promise<void> {
  const db = await getDatabase();
  await db?.execute(query, params);
}
