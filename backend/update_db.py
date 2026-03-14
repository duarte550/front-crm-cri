import os
from db import get_db_connection

def update_schema():
    conn = get_db_connection()
    try:
        with conn.cursor() as cursor:
            print("Checking if priority column exists in task_rules...")
            cursor.execute("DESCRIBE cri_cra_dev.crm.task_rules")
            columns = [row.col_name for row in cursor.fetchall()]
            
            if 'priority' not in columns:
                print("Adding priority column...")
                cursor.execute("ALTER TABLE cri_cra_dev.crm.task_rules ADD COLUMN priority STRING COMMENT 'Prioridade da tarefa (Alta, Média, Baixa).'")
                print("Column added successfully.")
            else:
                print("Column priority already exists.")
    except Exception as e:
        print(f"Error updating schema: {e}")
    finally:
        conn.close()

if __name__ == "__main__":
    update_schema()
