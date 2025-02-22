from airflow import DAG
from airflow.operators.python import PythonOperator
from datetime import datetime, timedelta

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
    'hello_airflow',
    default_args=default_args,
    description='A simple Airflow DAG that prints Hello, Airflow!',
    schedule_interval='0 10 * * *',  # Runs daily at 10 AM
    catchup=False
)

# Define the Python function
def print_hello():
    print("Hello, Airflow!")

# Create a task using PythonOperator
task_hello = PythonOperator(
    task_id='print_hello_task',
    python_callable=print_hello,
    dag=dag,
)

# Set task dependencies (single task here)
task_hello
