const Database = require("better-sqlite3");
const path = require("path");

const DB_PATH = path.join(__dirname, "eduuno.db");

const db = new Database(DB_PATH);

// Mejora de rendimiento: escribe en lote, no por cada operación
db.pragma("journal_mode = WAL");

db.exec(`
  CREATE TABLE IF NOT EXISTS quiz_results (
    id         INTEGER PRIMARY KEY AUTOINCREMENT,
    theme      TEXT    NOT NULL,
    score      INTEGER NOT NULL,
    total      INTEGER NOT NULL,
    passed     INTEGER NOT NULL,
    created_at TEXT    NOT NULL
  );

  CREATE TABLE IF NOT EXISTS quiz_answers (
    id              INTEGER PRIMARY KEY AUTOINCREMENT,
    quiz_result_id  INTEGER NOT NULL,
    question_text   TEXT    NOT NULL,
    selected_index  INTEGER NOT NULL,
    correct_index   INTEGER NOT NULL,
    is_correct      INTEGER NOT NULL,
    FOREIGN KEY (quiz_result_id) REFERENCES quiz_results(id)
  );
`);

module.exports = db;
