CREATE TABLE IF NOT EXISTS users (
  id               INTEGER PRIMARY KEY AUTOINCREMENT,
  name             TEXT NOT NULL,
  email            TEXT UNIQUE NOT NULL,
  password_hash    TEXT NOT NULL,
  onboarding_done  INTEGER DEFAULT 0,
  created_at       TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS daily_logs (
  user_id     INTEGER REFERENCES users(id) ON DELETE CASCADE,
  log_date    TEXT NOT NULL DEFAULT (date('now')),
  calories    REAL DEFAULT 0,
  protein     REAL DEFAULT 0,
  carbs       REAL DEFAULT 0,
  fat         REAL DEFAULT 0,
  water       REAL DEFAULT 0,
  steps       INTEGER DEFAULT 0,
  sleep_hours REAL DEFAULT 0,
  mood        INTEGER,
  PRIMARY KEY (user_id, log_date)
);

CREATE TABLE IF NOT EXISTS meals (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id     INTEGER REFERENCES users(id) ON DELETE CASCADE,
  name        TEXT NOT NULL,
  calories    REAL DEFAULT 0,
  protein     REAL DEFAULT 0,
  carbs       REAL DEFAULT 0,
  fat         REAL DEFAULT 0,
  meal_type   TEXT,
  image_url   TEXT,
  log_date    TEXT NOT NULL DEFAULT (date('now')),
  logged_at   TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS workouts (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id     INTEGER REFERENCES users(id) ON DELETE CASCADE,
  name        TEXT NOT NULL,
  duration    INTEGER DEFAULT 0,
  calories    REAL DEFAULT 0,
  notes       TEXT,
  log_date    TEXT NOT NULL DEFAULT (date('now')),
  logged_at   TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS sleep_logs (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id     INTEGER REFERENCES users(id) ON DELETE CASCADE,
  sleep_date  TEXT NOT NULL DEFAULT (date('now')),
  bedtime     TEXT,
  wake_time   TEXT,
  duration    REAL DEFAULT 0,
  quality     INTEGER,
  notes       TEXT,
  logged_at   TEXT DEFAULT CURRENT_TIMESTAMP
);