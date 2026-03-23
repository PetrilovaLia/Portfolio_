"""
transform.py — Čistí a normalizuje surové pracovné ponuky.

Kroky:
  1. Validácia povinných polí
  2. Normalizácia lokácií
  3. Výpočet salary_mid (priemer min/max)
  4. Deduplikácia podľa (company, title, dátum)
  5. Rozdelenie skills do samostatnej tabuľky
"""

import json
from pathlib import Path

from src.logger import get_logger

log = get_logger("transform")

LOCATION_MAP = {
    "hybrid – bratislava": "Bratislava",
    "remote":              "Remote",
}

REQUIRED_FIELDS = {"id", "title", "company", "location",
                   "salary_min", "salary_max", "skills", "posted_at"}


def normalise_location(raw: str) -> str:
    return LOCATION_MAP.get(raw.strip().lower(), raw.strip().title())


def validate(posting: dict) -> bool:
    return (
        REQUIRED_FIELDS.issubset(posting.keys())
        and isinstance(posting["skills"], list)
        and len(posting["skills"]) > 0
    )


def transform(raw_postings: list[dict]) -> tuple[list[dict], list[dict]]:
    """
    Vráti dvojicu (job_postings, job_skills).

    job_postings — jedna ponuka = jeden riadok
    job_skills   — jeden skill = jeden riadok (normalizovaná tabuľka)
    """
    job_postings = []
    job_skills   = []
    seen         = set()
    skipped      = 0

    for raw in raw_postings:
        if not validate(raw):
            skipped += 1
            continue

        posted_date = raw["posted_at"][:10]

        dedup_key = (raw["company"], raw["title"], posted_date)
        if dedup_key in seen:
            skipped += 1
            continue
        seen.add(dedup_key)

        job_postings.append({
            "id":          raw["id"],
            "title":       raw["title"].strip(),
            "company":     raw["company"].strip(),
            "location":    normalise_location(raw["location"]),
            "salary_min":  raw["salary_min"],
            "salary_max":  raw["salary_max"],
            "salary_mid":  round((raw["salary_min"] + raw["salary_max"]) / 2, 2),
            "source":      raw.get("source", "unknown"),
            "posted_at":   raw["posted_at"],
            "posted_date": posted_date,
        })

        for skill in raw["skills"]:
            job_skills.append({
                "job_id":      raw["id"],
                "skill":       skill.strip(),
                "posted_date": posted_date,
            })

    log.info(f"{len(job_postings)} platných ponúk, {skipped} preskočených")
    log.info(f"{len(job_skills)} skill riadkov")
    return job_postings, job_skills


def save_clean(job_postings: list[dict], job_skills: list[dict],
               output_dir: str = "data") -> None:
    Path(output_dir).mkdir(parents=True, exist_ok=True)
    for name, data in [("clean_jobs.json", job_postings),
                       ("clean_skills.json", job_skills)]:
        path = Path(output_dir) / name
        with open(path, "w", encoding="utf-8") as f:
            json.dump(data, f, ensure_ascii=False, indent=2)
        log.info(f"Uložené → {path}")


if __name__ == "__main__":
    with open("data/raw_jobs.json", encoding="utf-8") as f:
        raw = json.load(f)

    jobs, skills = transform(raw)
    save_clean(jobs, skills)