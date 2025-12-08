# GENERATOR: SANDBOX/ML_PHASE1
# Build features for all profiles
# HOW TO RUN: python train/build_all_features.py

import os
import sys
sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))

from feature_builder import build_features_for_profile, save_features_to_db
import psycopg2
from psycopg2.extras import RealDictCursor
from dotenv import load_dotenv

load_dotenv()

def get_db_connection():
    db_url = os.getenv("DATABASE_URL", "postgresql://constintel:constintel@localhost:5432/constintel")
    # Remove schema parameter for psycopg2
    if "?schema=" in db_url:
        db_url = db_url.split("?")[0]
    return psycopg2.connect(
        db_url,
        cursor_factory=RealDictCursor
    )

def get_all_profile_ids(brand_id=None):
    """Get all profile IDs from database"""
    conn = get_db_connection()
    cursor = conn.cursor()
    
    try:
        if brand_id:
            cursor.execute("SELECT id FROM customer_profile WHERE brand_id = %s", [brand_id])
        else:
            cursor.execute("SELECT id FROM customer_profile")
        
        profiles = cursor.fetchall()
        return [p['id'] for p in profiles]
    finally:
        cursor.close()
        conn.close()

if __name__ == "__main__":
    import argparse
    
    parser = argparse.ArgumentParser()
    parser.add_argument("--brand-id", default="test-brand")
    args = parser.parse_args()
    
    print("🔧 Building features for all profiles...")
    profile_ids = get_all_profile_ids(args.brand_id)
    print(f"Found {len(profile_ids)} profiles")
    
    success = 0
    errors = 0
    
    for i, profile_id in enumerate(profile_ids):
        try:
            features = build_features_for_profile(profile_id, args.brand_id)
            save_features_to_db(profile_id, features)
            success += 1
            if (i + 1) % 50 == 0:
                print(f"  Processed {i + 1}/{len(profile_ids)} profiles...")
        except Exception as e:
            errors += 1
            if errors < 5:  # Only print first few errors
                print(f"  Error for profile {profile_id}: {e}")
    
    print(f"\n✅ Feature building complete!")
    print(f"  Success: {success}")
    print(f"  Errors: {errors}")

