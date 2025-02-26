from airflow import DAG
from airflow.operators.python import PythonOperator
from datetime import datetime, timedelta
import os
import subprocess
from airflow.providers.postgres.hooks.postgres import PostgresHook

# Define default arguments for the DAG
default_args = {
    'owner': 'airflow',
    'depends_on_past': False,
    'start_date': datetime(2024, 2, 21),
    'email_on_failure': False,
    'email_on_retry': False,
    'retries': 1,
    'retry_delay': timedelta(minutes=5),
}

# Define the DAG
dag = DAG(
    'read_users_postgres_windows',
    default_args=default_args,
    description='Reads data from PostgreSQL and runs a backend task',
    schedule_interval=None,  # Manual trigger
    catchup=False
)

# Function to fetch users from PostgreSQL
def fetch_users():
    postgres_hook = PostgresHook(postgres_conn_id='my_postgres')  # Ensure this exists in Airflow connections
    conn = postgres_hook.get_conn()
    cursor = conn.cursor()

    cursor.execute("SELECT * FROM users;")
    rows = cursor.fetchall()

    for row in rows:
        print(f"User: {row}")

    cursor.close()
    conn.close()

# Function to run the backend application
# def run_backend_task():
#     app_directory = r"C:\Users\DKRAN\indrasol\bizradar\app"  # Use raw string for Windows paths
#     os.chdir(app_directory)
#     subprocess.run("python app.py", shell=True)  # Windows compatibility

# Task to read and log data
read_users_task = PythonOperator(
    task_id='read_users',
    python_callable=fetch_users,
    dag=dag,
)

# Task to run the backend application
# run_backend_task = PythonOperator(
#     task_id='run_backend_task',
#     python_callable=run_backend_task,
#     dag=dag,
# )

# Task dependencies
read_users_task 