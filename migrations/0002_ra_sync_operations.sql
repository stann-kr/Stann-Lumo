-- Additive operational state; existing performances and poster links are preserved.
CREATE TABLE IF NOT EXISTS ra_sync_state (
  id INTEGER PRIMARY KEY CHECK (id = 1),
  performances_revision INTEGER NOT NULL DEFAULT 0,
  edit_token TEXT,
  last_status TEXT NOT NULL DEFAULT 'never',
  last_started_at INTEGER,
  last_completed_at INTEGER,
  last_success_at INTEGER,
  last_error_code TEXT,
  last_fetched INTEGER NOT NULL DEFAULT 0,
  last_inserted INTEGER NOT NULL DEFAULT 0,
  last_skipped_excluded INTEGER NOT NULL DEFAULT 0,
  scheduled_slot INTEGER,
  retry_attempts INTEGER NOT NULL DEFAULT 0,
  next_retry_at INTEGER,
  lease_token TEXT,
  lease_expires_at INTEGER
);
INSERT OR IGNORE INTO ra_sync_state (id) VALUES (1);

CREATE TABLE IF NOT EXISTS ra_event_exclusions (
  ra_event_id TEXT PRIMARY KEY NOT NULL,
  title TEXT NOT NULL DEFAULT '',
  excluded_at INTEGER NOT NULL
);

-- Every writer, including poster changes and cron, invalidates stale admin snapshots.
CREATE TRIGGER IF NOT EXISTS performances_revision_insert AFTER INSERT ON performances
BEGIN
  UPDATE ra_sync_state SET performances_revision = performances_revision + 1 WHERE id = 1;
END;
CREATE TRIGGER IF NOT EXISTS performances_revision_update AFTER UPDATE ON performances
BEGIN
  UPDATE ra_sync_state SET performances_revision = performances_revision + 1 WHERE id = 1;
END;
CREATE TRIGGER IF NOT EXISTS performances_revision_delete AFTER DELETE ON performances
BEGIN
  UPDATE ra_sync_state SET performances_revision = performances_revision + 1 WHERE id = 1;
END;
