# GENERATOR: FULL_PLATFORM
# ASSUMPTIONS: Airflow installed, DATABASE_URL in env, feature_builder.py available
# HOW TO RUN: Place in Airflow dags folder, trigger via Airflow UI or CLI

from datetime import datetime, timedelta
from airflow import DAG
from airflow.operators.python import PythonOperator
from airflow.operators.bash import BashOperator
import os
import sys

# Add ML service to path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '../../services/ml_service'))

from train.feature_builder import build_features_for_profile, save_features_to_db
import psycopg2
from psycopg2.extras import RealDictCursor
from dotenv import load_dotenv

load_dotenv()

default_args = {
    'owner': 'constintel',
    'depends_on_past': False,
    'email_on_failure': False,
    'email_on_retry': False,
    'retries': 1,
    'retry_delay': timedelta(minutes=5),
}

dag = DAG(
    'feature_build_daily',
    default_args=default_args,
    description='Build features for all customer profiles',
    schedule_interval='0 2 * * *',  # Daily at 2 AM
    start_date=datetime(2024, 1, 1),
    catchup=False,
    tags=['ml', 'features'],
)

def get_all_profile_ids(brand_id=None):
    """Get all profile IDs from database"""
    conn = psycopg2.connect(
        os.getenv("DATABASE_URL"),
        cursor_factory=RealDictCursor
    )
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

def build_features_task(**context):
    """Build features for all profiles"""
    brand_id = context.get('dag_run').conf.get('brand_id') if context.get('dag_run') else None
    profile_ids = get_all_profile_ids(brand_id)
    
    print(f"Building features for {len(profile_ids)} profiles...")
    
    for profile_id in profile_ids:
        try:
            features = build_features_for_profile(profile_id, brand_id)
            save_features_to_db(profile_id, features)
            print(f"✓ Features built for profile {profile_id}")
        except Exception as e:
            print(f"✗ Error building features for {profile_id}: {e}")
            continue
    
    print("Feature build complete!")

build_features = PythonOperator(
    task_id='build_features',
    python_callable=build_features_task,
    dag=dag,
)

build_features

