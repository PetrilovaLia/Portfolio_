"""
tests/test_transform.py — Unit testy pre transform logiku.
"""

import pytest
from src.transform import validate, normalise_location, transform

# ── Pomocné fixtures ─────────────────────────────────────────────────────────

def make_posting(**kwargs) -> dict:
    """Vráti platnú ponuku, prípadne s prepísanými hodnotami."""
    base = {
        "id":         "abc-123",
        "title":      "Junior Data Engineer",
        "company":    "Softec",
        "location":   "Bratislava",
        "salary_min": 2000,
        "salary_max": 3000,
        "skills":     ["Python", "SQL"],
        "posted_at":  "2026-03-23T10:00:00",
        "source":     "profesia.sk",
    }
    base.update(kwargs)
    return base


# ── validate() ───────────────────────────────────────────────────────────────

def test_validate_platna_ponuka():
    assert validate(make_posting()) is True

def test_validate_chybajuce_pole():
    ponuka = make_posting()
    del ponuka["title"]
    assert validate(ponuka) is False

def test_validate_prazdne_skills():
    assert validate(make_posting(skills=[])) is False

def test_validate_skills_nie_su_list():
    assert validate(make_posting(skills="Python")) is False


# ── normalise_location() ─────────────────────────────────────────────────────

def test_normalise_hybrid():
    assert normalise_location("Hybrid – Bratislava") == "Bratislava"

def test_normalise_remote():
    assert normalise_location("Remote") == "Remote"

def test_normalise_kosice():
    assert normalise_location("košice") == "Košice"

def test_normalise_medzery():
    assert normalise_location("  Bratislava  ") == "Bratislava"


# ── transform() ──────────────────────────────────────────────────────────────

def test_transform_salary_mid():
    jobs, _ = transform([make_posting(salary_min=2000, salary_max=3000)])
    assert jobs[0]["salary_mid"] == 2500.0

def test_transform_skills_su_rozdelene():
    _, skills = transform([make_posting(skills=["Python", "SQL", "Docker"])])
    assert len(skills) == 3
    assert all(s["job_id"] == "abc-123" for s in skills)

def test_transform_deduplikacia():
    # Dve identické ponuky (rovnaká firma, titul, dátum) → len jedna prejde
    p1 = make_posting()
    p2 = make_posting()
    jobs, _ = transform([p1, p2])
    assert len(jobs) == 1

def test_transform_neplatna_ponuka_je_preskocena():
    platna = make_posting()
    neplatna = make_posting(skills=[])
    jobs, _ = transform([platna, neplatna])
    assert len(jobs) == 1

def test_transform_posted_date():
    jobs, _ = transform([make_posting(posted_at="2026-03-23T10:00:00")])
    assert jobs[0]["posted_date"] == "2026-03-23"