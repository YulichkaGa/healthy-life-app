CREATE TABLE IF NOT EXISTS users (
  id               SERIAL PRIMARY KEY,
  name             TEXT NOT NULL,
  email            TEXT UNIQUE NOT NULL,
  password_hash    TEXT NOT NULL,
  onboarding_done  BOOLEAN DEFAULT FALSE,
  created_at       TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS daily_logs (
  user_id     INTEGER REFERENCES users(id) ON DELETE CASCADE,
  log_date    DATE NOT NULL DEFAULT CURRENT_DATE,
  calories    NUMERIC DEFAULT 0,
  protein     NUMERIC DEFAULT 0,
  carbs       NUMERIC DEFAULT 0,
  fat         NUMERIC DEFAULT 0,
  water       NUMERIC DEFAULT 0,
  steps       INTEGER DEFAULT 0,
  sleep_hours NUMERIC DEFAULT 0,
  mood        INTEGER,
  PRIMARY KEY (user_id, log_date)
);

CREATE TABLE IF NOT EXISTS meals (
  id          SERIAL PRIMARY KEY,
  user_id     INTEGER REFERENCES users(id) ON DELETE CASCADE,
  name        TEXT NOT NULL,
  calories    NUMERIC DEFAULT 0,
  protein     NUMERIC DEFAULT 0,
  carbs       NUMERIC DEFAULT 0,
  fat         NUMERIC DEFAULT 0,
  meal_type   TEXT,
  image_url   TEXT,
  log_date    DATE NOT NULL DEFAULT CURRENT_DATE,
  logged_at   TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS workouts (
  id          SERIAL PRIMARY KEY,
  user_id     INTEGER REFERENCES users(id) ON DELETE CASCADE,
  name        TEXT NOT NULL,
  duration    INTEGER DEFAULT 0,
  calories    NUMERIC DEFAULT 0,
  notes       TEXT,
  log_date    DATE NOT NULL DEFAULT CURRENT_DATE,
  logged_at   TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS sleep_logs (
  id          SERIAL PRIMARY KEY,
  user_id     INTEGER REFERENCES users(id) ON DELETE CASCADE,
  sleep_date  DATE NOT NULL DEFAULT CURRENT_DATE,
  bedtime     TIME,
  wake_time   TIME,
  duration    NUMERIC DEFAULT 0,
  quality     INTEGER,
  notes       TEXT,
  logged_at   TIMESTAMPTZ DEFAULT NOW()
);