import json
import random
import uuid
from datetime import datetime, timedelta
from pathlib import Path

COMPANIES = [
    "Softec", "Atos IT Solutions", "Accenture Slovakia", "IBM Slovakia",
    "Datamolino", "Exponea", "Sygic", "Pixel Federation", "ESET",
    "Asseco Central Europe", "PosAm", "Soitron", "T-Systems Slovakia",
    "GoodRequest", "Vacuumlabs", "InQool", "Progressus",
]

TITLES = [
    "Junior Data Engineer", "Data Engineer", "ETL Developer",
    "Junior BI Developer", "Data Analyst", "Junior Data Analyst",
    "SQL Developer", "Junior Python Developer", "Data Pipeline Engineer",
    "Analytics Engineer",
]

LOCATIONS = ["Bratislava", "Košice", "Žilina", "Banská Bystrica", "Remote", "Hybrid – Bratislava"]

SKILLS_POOL = [
    "Python", "SQL", "PostgreSQL", "Docker", "Apache Airflow",
    "Apache Spark", "dbt", "Kafka", "Pandas", "NumPy",
    "Git", "Linux", "AWS", "Azure", "Snowflake",
    "Power BI", "Tableau", "Looker", "FastAPI", "Databricks",
]

SKILL_WEIGHTS = [
    0.85, 0.80, 0.55, 0.45, 0.40,
    0.30, 0.25, 0.20, 0.60, 0.35,
    0.70, 0.50, 0.30, 0.25, 0.20,
    0.25, 0.20, 0.15, 0.15, 0.15,
]

DESCRIPTIONS = [
    "Hľadáme nadšeného data engineera, ktorý pomôže budovať naše dátové pipelines.",
    "Pridaj sa k nášmu analytickému tímu a pracuj na zaujímavých dátových projektoch.",
    "Budujeme moderný data stack a potrebujeme šikovného junior developera.",
    "Práca na ETL procesoch, reportingových dashboardoch a optimalizácii databáz.",
    "Pomáhaj nám transformovať surové dáta na hodnotné business insighty.",
]


def generate_job_posting(posted_date: datetime) -> dict:
    """Generate a single realistic job posting."""
    skills = [
        skill for skill, weight in zip(SKILLS_POOL, SKILL_WEIGHTS)
        if random.random() < weight
    ]
    # Always keep at least 3 skills
    if len(skills) < 3:
        skills = random.sample(SKILLS_POOL, 3)

    salary_min = random.choice([1800, 2000, 2200, 2400, 2600, 2800, 3000])
    salary_max = salary_min + random.choice([400, 600, 800, 1000])

    return {
        "id": str(uuid.uuid4()),
        "title": random.choice(TITLES),
        "company": random.choice(COMPANIES),
        "location": random.choice(LOCATIONS),
        "salary_min": salary_min,
        "salary_max": salary_max,
        "skills": skills,
        "description": random.choice(DESCRIPTIONS),
        "posted_at": posted_date.isoformat(),
        "source": "profesia.sk",
    }


def scrape(days_back: int = 30, postings_per_day: int = None) -> list[dict]:
    """
    Simulate scraping job postings for the last `days_back` days.
    Returns a list of raw job posting dicts.
    """
    today = datetime.now()
    postings = []

    for day_offset in range(days_back):
        date = today - timedelta(days=day_offset)
        # Fewer postings on weekends (realistic)
        is_weekend = date.weekday() >= 5
        n = postings_per_day or random.randint(3, 8) if not is_weekend else random.randint(0, 3)
        for _ in range(n):
            postings.append(generate_job_posting(date))

    print(f"[scraper] Generated {len(postings)} raw job postings ({days_back} days)")
    return postings


def save_raw(postings: list[dict], output_path: str = "data/raw_jobs.json") -> None:
    """Persist raw scraped data to disk (landing zone)."""
    Path(output_path).parent.mkdir(parents=True, exist_ok=True)
    with open(output_path, "w", encoding="utf-8") as f:
        json.dump(postings, f, ensure_ascii=False, indent=2)
    print(f"[scraper] Saved raw data → {output_path}")


if __name__ == "__main__":
    raw = scrape(days_back=30)
    save_raw(raw)
