import Dexie from "dexie";

const PERSISTENCE_DB_NAME = "excalidraw:selfplus";
const PERSISTENCE_SCHEMA_VERSION = 1;
const PERSISTENCE_TABLE = "kv";

/**
 * Minimal key-value IndexedDB wrapper powered by Dexie.
 *
 * We keep a single table so storage keys stay compatible with the existing
 * workspace/board key naming strategy.
 */
class DrawingPersistenceDatabase extends Dexie {
  constructor() {
    super(PERSISTENCE_DB_NAME);

    this.version(PERSISTENCE_SCHEMA_VERSION).stores({
      [PERSISTENCE_TABLE]: "key",
    });

    this.kv = this.table(PERSISTENCE_TABLE);
  }
}

const db = new DrawingPersistenceDatabase();
let ensureReadyPromise = null;

/**
 * Ensures IndexedDB is open before regular reads/writes happen.
 */
export const ensurePersistenceReady = async () => {
  if (!ensureReadyPromise) {
    ensureReadyPromise = db.open().catch(() => undefined);
  }

  await ensureReadyPromise;
};

/**
 * Reads one raw JSON string by persistence key.
 */
export const getPersistedValue = async (key) => {
  await ensurePersistenceReady();

  try {
    const entry = await db.kv.get(key);
    return typeof entry?.value === "string" ? entry.value : undefined;
  } catch {
    return undefined;
  }
};

/**
 * Writes one raw JSON string by persistence key.
 */
export const setPersistedValue = async (key, value) => {
  await ensurePersistenceReady();

  try {
    await db.kv.put({ key, value });
  } catch {
    // Ignore DB write errors (quota, unsupported environment, etc).
  }
};

/**
 * Deletes one key from persistence storage.
 */
export const removePersistedValue = async (key) => {
  await ensurePersistenceReady();

  try {
    await db.kv.delete(key);
  } catch {
    // Ignore DB delete errors.
  }
};
