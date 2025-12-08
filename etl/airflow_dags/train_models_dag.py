# GENERATOR: FULL_PLATFORM
# ASSUMPTIONS: Airflow installed, DATABASE_URL in env, train_models.py available
# HOW TO RUN: Place in Airflow dags folder, trigger via Airflow UI or CLI

from datetime import datetime, timedelta
from airflow import DAG
from airflow.operators.python import PythonOperator
from airflow.operators.bash import BashOperator
import os
import sys

# Add ML service to path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '../../services/ml_service'))

from train.train_models import load_training_data, train_segmentation_model, train_churn_model, train_ltv_model
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
    'train_models_nightly',
    default_args=default_args,
    description='Train ML models (segmentation, churn, LTV)',
    schedule_interval='0 3 * * *',  # Daily at 3 AM (after feature build)
    start_date=datetime(2024, 1, 1),
    catchup=False,
    tags=['ml', 'training'],
)

def train_models_task(**context):
    """Train all ML models"""
    brand_id = context.get('dag_run').conf.get('brand_id') if context.get('dag_run') else None
    
    print("Loading training data...")
    df = load_training_data(brand_id)
    print(f"Loaded {len(df)} profiles")
    
    if len(df) < 10:
        print("WARNING: Not enough training data. Skipping model training.")
        return
    
    print("Training segmentation model...")
    seg_result = train_segmentation_model(df)
    print(f"Segmentation model saved: {seg_result['model_file']}")
    
    print("Training churn model...")
    churn_result = train_churn_model(df)
    print(f"Churn model saved: {churn_result['model_file']}")
    
    print("Training LTV model...")
    ltv_result = train_ltv_model(df)
    print(f"LTV model saved: {ltv_result['model_file']}")
    
    print("Training complete!")

train_models = PythonOperator(
    task_id='train_models',
    python_callable=train_models_task,
    dag=dag,
)

train_models

