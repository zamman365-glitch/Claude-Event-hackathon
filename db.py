"""
db.py
SQLite FTS5 database management and full-text retrieval for MP Bhumi Vikas Rules 2012.
"""

from __future__ import annotations
import re
import sqlite3
from pathlib import Path
from typing import Any, Dict, List, Optional

from data_prep import clean_and_split_rules, normalize_whitespace

DEFAULT_DB_PATH = Path("data/bhumi_vikas.db")
DEFAULT_JSONL_PATH = Path("data/bhumi_vikas_rules.jsonl")


def get_db_connection(db_path: Path = DEFAULT_DB_PATH) -> sqlite3.Connection:
    conn = sqlite3.connect(str(db_path))
    conn.row_factory = sqlite3.Row
    return conn


def init_database(
    jsonl_path: Path = DEFAULT_JSONL_PATH,
    db_path: Path = DEFAULT_DB_PATH,
    force: bool = False,
) -> None:
    """Initializes SQLite database and populates FTS5 virtual table."""
    if db_path.exists() and not force:
        return

    db_path.parent.mkdir(parents=True, exist_ok=True)
    if db_path.exists():
        db_path.unlink()

    conn = get_db_connection(db_path)
    cur = conn.cursor()

    cur.execute("""
        CREATE TABLE rules (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            rule TEXT NOT NULL UNIQUE,
            title TEXT NOT NULL,
            part TEXT NOT NULL,
            page_start INTEGER NOT NULL,
            page_end INTEGER NOT NULL,
            text TEXT NOT NULL,
            text_norm TEXT NOT NULL,
            is_embedded INTEGER NOT NULL DEFAULT 0,
            parent_rule TEXT
        );
    """)

    cur.execute("""
        CREATE VIRTUAL TABLE rules_fts USING fts5(
            rule,
            title,
            part,
            text,
            content='rules',
            content_rowid='id',
            tokenize='unicode61 remove_diacritics 2'
        );
    """)

    cur.execute("""
        CREATE TRIGGER rules_ai AFTER INSERT ON rules BEGIN
            INSERT INTO rules_fts(rowid, rule, title, part, text)
            VALUES (new.id, new.rule, new.title, new.part, new.text);
        END;
    """)

    rules_data = clean_and_split_rules(jsonl_path)
    for r in rules_data:
        cur.execute(
            """
            INSERT INTO rules (rule, title, part, page_start, page_end, text, text_norm, is_embedded, parent_rule)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
            """,
            (
                r["rule"],
                r["title"],
                r["part"],
                r["page_start"],
                r["page_end"],
                r["text"],
                r["text_norm"],
                1 if r.get("is_embedded") else 0,
                r.get("parent_rule"),
            ),
        )

    conn.commit()
    conn.close()


def search_rules(
    query: str,
    top_k: int = 4,
    db_path: Path = DEFAULT_DB_PATH,
) -> List[Dict[str, Any]]:
    """
    Retrieves the most relevant rules using hybrid exact-rule booster and SQLite FTS5 BM25 ranking.
    """
    if not db_path.exists():
        init_database(db_path=db_path)

    conn = get_db_connection(db_path)
    cur = conn.cursor()

    results: List[Dict[str, Any]] = []
    seen_rules = set()

    # 1. Exact rule number extraction check (e.g., 'Rule 56', 'Rule 12-A', 'Rule 17', '2(5)(c)')
    rule_matches = re.findall(
        r"\b(?:rule|niyam|धारा|नियम)?\s*([0-9]{1,3}(?:[A-Za-z\-\(\)]+)?)\b",
        query,
        re.IGNORECASE,
    )
    for r_cand in rule_matches:
        cand_clean = r_cand.strip().upper()
        # Direct lookup or normalized lookup
        cur.execute(
            "SELECT rule, title, part, page_start, page_end, text, text_norm FROM rules WHERE UPPER(rule) = ?",
            (cand_clean,),
        )
        row = cur.fetchone()
        if not row and "-" in cand_clean:
            # Try without hyphen or with space
            cur.execute(
                "SELECT rule, title, part, page_start, page_end, text, text_norm FROM rules WHERE UPPER(rule) = ?",
                (cand_clean.replace("-", ""),),
            )
            row = cur.fetchone()

        if row and row["rule"] not in seen_rules:
            seen_rules.add(row["rule"])
            results.append(dict(row))

    # 2. Extract key bigram/trigram phrases for high-priority matching
    phrases = []
    lower_q = query.lower()
    for phrase_cand in [
        "application for building permission", "application for development",
        "documents go with", "accompanying application",
        "development permission", "building permission", "development plan",
        "front open space", "rear open space", "side open space",
        "open space", "farm house", "farmhouse", "low voltage", "electric line",
        "deemed approval", "deemed permission", "sign and submit", "signing of plans",
        "documents go with", "alteration in plan", "sanctioned plan", "deviation from sanctioned plan",
        "limitation period", "miss the deadline", "has not replied", "fails to intimate",
        "duration of sanction", "validity of permission",
        "lifts in a building", "lift", "lifts", "fee", "fees"
    ]:
        if phrase_cand in lower_q:
            phrases.append(f'"{phrase_cand}"')

    # 3. SQLite FTS5 search
    clean_terms = re.findall(r"[A-Za-z0-9]+", query)
    stopwords = {
        "what", "is", "the", "for", "and", "in", "on", "a", "an", "to",
        "how", "much", "many", "does", "do", "my", "can", "if", "i", "which",
        "who", "with", "from", "at", "tall", "faces", "street", "wide"
    }
    search_terms = [t for t in clean_terms if t.lower() not in stopwords]

    fts_queries = []
    if phrases:
        fts_queries.append(" AND ".join(phrases))
        fts_queries.append(" OR ".join(phrases))
    if search_terms:
        fts_queries.append(" OR ".join(f'"{t}"' for t in search_terms[:8]))

    for fts_q in fts_queries:
        if len(results) >= top_k:
            break
        cur.execute(
            """
            SELECT r.rule, r.title, r.part, r.page_start, r.page_end, r.text, r.text_norm,
                   bm25(rules_fts, 5.0, 10.0, 2.0, 1.0) AS rank
            FROM rules_fts f
            JOIN rules r ON f.rowid = r.id
            WHERE rules_fts MATCH ?
            ORDER BY rank
            LIMIT ?
            """,
            (fts_q, top_k * 2),
        )
        for row in cur.fetchall():
            if row["rule"] not in seen_rules:
                seen_rules.add(row["rule"])
                results.append({
                    "rule": row["rule"],
                    "title": row["title"],
                    "part": row["part"],
                    "page_start": row["page_start"],
                    "page_end": row["page_end"],
                    "text": row["text"],
                    "text_norm": row["text_norm"],
                })

    conn.close()
    return results[:top_k]


def get_rule_by_number(rule_no: str, db_path: Path = DEFAULT_DB_PATH) -> Optional[Dict[str, Any]]:
    """Fetches a specific rule by its number."""
    if not db_path.exists():
        init_database(db_path=db_path)
    conn = get_db_connection(db_path)
    cur = conn.cursor()
    cur.execute(
        "SELECT rule, title, part, page_start, page_end, text, text_norm FROM rules WHERE UPPER(rule) = UPPER(?)",
        (rule_no.strip(),),
    )
    row = cur.fetchone()
    conn.close()
    return dict(row) if row else None


def get_all_rules(db_path: Path = DEFAULT_DB_PATH) -> List[Dict[str, Any]]:
    """
    Returns every rule chunk with rule_no, sub_rule, title, part, page_start, page_end.
    """
    if not db_path.exists():
        init_database(db_path=db_path)
    conn = get_db_connection(db_path)
    cur = conn.cursor()
    cur.execute(
        "SELECT id, rule, is_embedded, parent_rule, title, part, page_start, page_end FROM rules ORDER BY id"
    )
    rows = cur.fetchall()
    conn.close()

    result = []
    for r in rows:
        rule_str = r["rule"]
        is_emb = bool(r["is_embedded"])
        p_rule = r["parent_rule"]

        result.append({
            "rule_no": rule_str,
            "sub_rule": rule_str if is_emb else None,
            "title": r["title"],
            "part": r["part"],
            "page_start": r["page_start"],
            "page_end": r["page_end"],
        })
    return result


def search_rules_with_snippets(
    query: str,
    top_k: int = 10,
    db_path: Path = DEFAULT_DB_PATH,
) -> List[Dict[str, Any]]:
    """
    Searches rules using FTS5 index and returns rule_no, title, page_start, page_end, and snippet.
    """
    chunks = search_rules(query, top_k=top_k, db_path=db_path)
    results = []
    q_words = [w.lower() for w in re.findall(r"[A-Za-z0-9]+", query) if len(w) > 2]

    for c in chunks:
        text = c.get("text", "")
        # Find best window around matching words
        idx = -1
        for w in q_words:
            found = text.lower().find(w)
            if found != -1:
                idx = found
                break

        if idx != -1:
            start = max(0, idx - 40)
            end = min(len(text), idx + 160)
            snippet = ("..." if start > 0 else "") + text[start:end].replace("\n", " ").strip() + ("..." if end < len(text) else "")
        else:
            snippet = text[:180].replace("\n", " ").strip() + ("..." if len(text) > 180 else "")

        results.append({
            "rule_no": c["rule"],
            "title": c["title"],
            "page_start": c["page_start"],
            "page_end": c["page_end"],
            "snippet": snippet,
        })
    return results


if __name__ == "__main__":
    init_database(force=True)
    print("Database initialized successfully.")
    sample_queries = [
        "Rule 56 front open space for 9 m road",
        "validity of permission renewal",
        "farm house agricultural land minimum plot size FAR",
        "Rule 12-A deemed approval",
    ]
    for q in sample_queries:
        res = search_rules(q, top_k=2)
        print(f"Query: '{q}' -> Found {len(res)} results:")
        for r in res:
            print(f"   Rule {r['rule']}: {r['title']} (p. {r['page_start']}-{r['page_end']})")
