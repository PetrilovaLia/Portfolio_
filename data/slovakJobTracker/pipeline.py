
import argparse
import time
from src.scraper import scrape, save_raw
from src.transform import transform, save_clean


def run(days: int = 30, skip_load: bool = False) -> None:
    start = time.perf_counter()
    print("=" * 50)
    print("  Slovak Job Market Tracker — ETL Pipeline")
    print("=" * 50)

    # Step 1 — Extract
    t0 = time.perf_counter()
    raw = scrape(days_back=days)
    save_raw(raw)
    print(f"  Extract: {time.perf_counter() - t0:.2f}s\n")

    # Step 2 — Transform
    t0 = time.perf_counter()
    jobs, skills = transform(raw)
    save_clean(jobs, skills)
    print(f"  Transform: {time.perf_counter() - t0:.2f}s\n")

    # Step 3 — Load (requires running PostgreSQL)
    if not skip_load:
        from src.load import run as load_run
        t0 = time.perf_counter()
        load_run()
        print(f"  Load: {time.perf_counter() - t0:.2f}s\n")
    else:
        print("  Load: skipped (--skip-load)\n")

    elapsed = time.perf_counter() - start
    print(f"Pipeline completed in {elapsed:.2f}s")
    print("=" * 50)


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--days", type=int, default=30)
    parser.add_argument("--skip-load", action="store_true")
    args = parser.parse_args()
    run(days=args.days, skip_load=args.skip_load)
