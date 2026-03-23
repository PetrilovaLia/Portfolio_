import json
import re
from datetime import datetime
from pathlib import Path


LOCATION_MAP = {
    "hybrid – bratislava": "Bratislava",
    "remote": "Remote",
}


def normalise_location(raw: str) -> str:
    key = raw.strip().lower()
    return LOCATION_MAP.get(key, raw.strip().title())


def validate(posting: dict) -> bool:
    required = {"id", "title", "company", "location", "salary_min", "salary_max",
                "skills", "posted_at"}
    return required.issubset(posting.keys()) and isinstance(posting["skills"], list)


def transform(raw_postings: list[dict]) -> tuple[list[dict], list[dict]]:
    """
      - job_postings: one row per job
      - job_skills:   one row per (job_id, skill) pair

    Returns (job_postings, job_skills).
    """
    job_postings = []
    job_skills = []
    seen = set()          # dedup key: (company, title, date)
    skipped = 0

    for raw in raw_postings:
        if not validate(raw):
            skipped += 1
            continue

        posted_date = raw["posted_at"][:10]           # YYYY-MM-DD
        dedup_key = (raw["company"], raw["title"], posted_date)
        if dedup_key in seen:
            skipped += 1
            continue
        seen.add(dedup_key)

        salary_mid = (raw["salary_min"] + raw["salary_max"]) / 2

        job = {
            "id":           raw["id"],
            "title":        raw["title"].strip(),
            "company":      raw["company"].strip(),
            "location":     normalise_location(raw["location"]),
            "salary_min":   raw["salary_min"],
            "salary_max":   raw["salary_max"],
            "salary_mid":   round(salary_mid, 2),
            "description":  raw.get("description", "").strip(),
            "source":       raw.get("source", "unknown"),
            "posted_at":    raw["posted_at"],
            "posted_date":  posted_date,
        }
        job_postings.append(job)

        for skill in raw["skills"]:
            job_skills.append({
                "job_id":    raw["id"],
                "skill":     skill.strip(),
                "posted_date": posted_date,
            })

    print(f"[transform] {len(job_postings)} valid postings, "
          f"{skipped} skipped (invalid or duplicate)")
    print(f"[transform] {len(job_skills)} skill rows produced")
    return job_postings, job_skills


def save_clean(job_postings: list[dict], job_skills: list[dict],
               output_dir: str = "data") -> None:
    Path(output_dir).mkdir(parents=True, exist_ok=True)
    for name, data in [("clean_jobs.json", job_postings),
                        ("clean_skills.json", job_skills)]:
        path = Path(output_dir) / name
        with open(path, "w", encoding="utf-8") as f:
            json.dump(data, f, ensure_ascii=False, indent=2)
        print(f"[transform] Saved → {path}")


if __name__ == "__main__":
    with open("data/raw_jobs.json", encoding="utf-8") as f:
        raw = json.load(f)

    jobs, skills = transform(raw)
    save_clean(jobs, skills)
