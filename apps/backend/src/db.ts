import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import initSqlJs, { Database, SqlJsStatic } from 'sql.js';

const require = createRequire(import.meta.url);

const dataDir = path.resolve(process.cwd(), 'apps/backend/data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const dbPath = path.join(dataDir, 'app.db');

let sqlJs: SqlJsStatic | null = null;
let db: Database | null = null;

const initDb = async () => {
  if (db) return db;
  if (!sqlJs) {
    const wasmPath = require.resolve('sql.js/dist/sql-wasm.wasm');
    sqlJs = await initSqlJs({
      locateFile: file => (file.endsWith('.wasm') ? wasmPath : file),
    });
  }

  if (fs.existsSync(dbPath)) {
    const fileBuffer = fs.readFileSync(dbPath);
    db = new sqlJs.Database(new Uint8Array(fileBuffer));
  } else {
    db = new sqlJs.Database();
  }

  db.exec(`
    CREATE TABLE IF NOT EXISTS projects (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      state TEXT NOT NULL,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );
  `);
  persistDb();
  return db;
};

const persistDb = () => {
  if (!db) return;
  const data = db.export();
  fs.writeFileSync(dbPath, Buffer.from(data));
};

export interface ProjectRow {
  id: string;
  name: string;
  state: string;
  created_at: string;
  updated_at: string;
}

const mapRows = (statement: ReturnType<Database['prepare']>): ProjectRow[] => {
  const rows: ProjectRow[] = [];
  while (statement.step()) {
    rows.push(statement.getAsObject() as ProjectRow);
  }
  statement.free();
  return rows;
};

export const insertProject = async (row: ProjectRow) => {
  const database = await initDb();
  database.run(
    'INSERT INTO projects (id, name, state, created_at, updated_at) VALUES (?, ?, ?, ?, ?);',
    [row.id, row.name, row.state, row.created_at, row.updated_at]
  );
  persistDb();
};

export const updateProjectRow = async (id: string, name: string, state: string) => {
  const database = await initDb();
  database.run('UPDATE projects SET name = ?, state = ?, updated_at = ? WHERE id = ?;', [
    name,
    state,
    new Date().toISOString(),
    id,
  ]);
  persistDb();
};

export const deleteProjectRow = async (id: string) => {
  const database = await initDb();
  database.run('DELETE FROM projects WHERE id = ?;', [id]);
  persistDb();
};

export const getProjectRow = async (id: string): Promise<ProjectRow | undefined> => {
  const database = await initDb();
  const stmt = database.prepare('SELECT * FROM projects WHERE id = ?;');
  stmt.bind([id]);
  const rows = mapRows(stmt);
  return rows[0];
};

export const listProjectRows = async (): Promise<ProjectRow[]> => {
  const database = await initDb();
  const stmt = database.prepare('SELECT * FROM projects ORDER BY updated_at DESC;');
  return mapRows(stmt);
};
