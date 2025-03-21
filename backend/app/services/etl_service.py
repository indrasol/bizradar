# backend/app/utils/etl_service.py
import os
import httpx
import logging
import psycopg2
import psycopg2.extras
from typing import Dict, Any, List, Optional
from utils.db_utils import get_db_connection

logger = logging.getLogger(__name__)

class ETLService:
    """
    Service for ETL-related operations including:
    - Triggering GitHub workflows
    - Managing ETL history records
    - Fetching ETL statistics
    """
    
    @staticmethod
    async def trigger_workflow(job_type: str = "") -> Dict[str, Any]:
        """
        Trigger GitHub Actions workflow and create an initial record
        
        Args:
            job_type: Type of job to run (freelancer, sam_gov, or empty for all)
            
        Returns:
            Dictionary with trigger results
        """
        try:
            github_token = os.getenv("GITHUB_TOKEN")
            if not github_token:
                raise ValueError("GitHub token not configured")
                
            # GitHub repository details
            owner = os.getenv("GITHUB_OWNER")
            repo = os.getenv("GITHUB_REPO")
            workflow_id = "data-collection-jobs.yml"
            
            # Create initial record in database with trigger_type = 'ui-manual'
            conn = get_db_connection()
            cursor = conn.cursor(cursor_factory=psycopg2.extras.DictCursor)
            
            insert_query = '''
            INSERT INTO etl_history 
                (status, trigger_type) 
            VALUES 
                ('triggered', 'ui-manual')
            RETURNING id, time_fetched
            '''
            
            cursor.execute(insert_query)
            result = cursor.fetchone()
            record_id = result['id']
            time_fetched = result['time_fetched']
            conn.commit()
            
            # Prepare API request to GitHub
            url = f"https://api.github.com/repos/{owner}/{repo}/actions/workflows/{workflow_id}/dispatches"
            
            headers = {
                "Accept": "application/vnd.github+json",
                "Authorization": f"Bearer {github_token}",
                "X-GitHub-Api-Version": "2022-11-28"
            }
            
            data = {
                "ref": "main",  # or your default branch
                "inputs": {
                    "job": job_type
                }
            }
            
            async with httpx.AsyncClient() as client:
                response = await client.post(url, json=data, headers=headers)
                
                if response.status_code in [204, 200]:  # 204 No Content is success for this endpoint
                    logger.info(f"Successfully triggered workflow: {workflow_id}")
                    
                    # Update record with status
                    update_query = '''
                    UPDATE etl_history 
                    SET status = 'triggered' 
                    WHERE id = %s
                    '''
                    cursor.execute(update_query, (record_id,))
                    conn.commit()
                    
                    cursor.close()
                    conn.close()
                    
                    return {
                        "success": True, 
                        "message": f"Successfully triggered {'all jobs' if not job_type else job_type + ' job'}",
                        "record_id": record_id,
                        "time_triggered": time_fetched.isoformat()
                    }
                else:
                    error_detail = response.text
                    logger.error(f"GitHub API error: {error_detail}")
                    
                    # Update record with error status
                    update_query = '''
                    UPDATE etl_history 
                    SET status = 'failed' 
                    WHERE id = %s
                    '''
                    cursor.execute(update_query, (record_id,))
                    conn.commit()
                    
                    cursor.close()
                    conn.close()
                    
                    raise ValueError(f"Failed to trigger workflow: {error_detail}")
        
        except Exception as e:
            logger.error(f"Error triggering workflow: {str(e)}")
            raise
    
    @staticmethod
    def get_etl_records(
        page: int = 1, 
        limit: int = 50, 
        status: Optional[str] = None,
        search: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Get ETL history records with filtering and pagination
        
        Args:
            page: Page number (starting at 1)
            limit: Number of records per page
            status: Filter by status
            search: Search query string
            
        Returns:
            Dictionary with records and pagination info
        """
        try:
            conn = get_db_connection()
            cursor = conn.cursor(cursor_factory=psycopg2.extras.DictCursor)
            
            # Start building the query
            query = "SELECT * FROM etl_history"
            count_query = "SELECT COUNT(*) FROM etl_history"
            params = []
            where_conditions = []
            
            # Add filtering conditions
            if status:
                where_conditions.append("status = %s")
                params.append(status)
                
            if search:
                # Search in relevant text fields
                where_conditions.append("(CAST(id AS TEXT) LIKE %s OR status LIKE %s OR trigger_type LIKE %s)")
                search_pattern = f"%{search}%"
                params.extend([search_pattern, search_pattern, search_pattern])
                
            # Add WHERE clause if needed
            if where_conditions:
                query += " WHERE " + " AND ".join(where_conditions)
                count_query += " WHERE " + " AND ".join(where_conditions)
                
            # Add sorting and pagination
            query += " ORDER BY time_fetched DESC LIMIT %s OFFSET %s"
            final_params = params + [limit, (page - 1) * limit]
            
            # Execute queries
            cursor.execute(count_query, params)
            total_count = cursor.fetchone()[0]
            
            cursor.execute(query, final_params)
            records = cursor.fetchall()
            
            # Convert to list of dictionaries
            result = []
            for record in records:
                result.append({
                    "id": record["id"],
                    "time_fetched": record["time_fetched"].isoformat() if record["time_fetched"] else None,
                    "total_records": record["total_records"],
                    "sam_gov_count": record["sam_gov_count"],
                    "sam_gov_new_count": record["sam_gov_new_count"],
                    "freelancer_count": record["freelancer_count"],
                    "freelancer_new_count": record["freelancer_new_count"],
                    "status": record["status"],
                    "trigger_type": record["trigger_type"] if "trigger_type" in record else "ui-manual"
                })
                
            cursor.close()
            conn.close()
            
            return {
                "records": result,
                "pagination": {
                    "page": page,
                    "limit": limit,
                    "total_records": total_count,
                    "total_pages": (total_count + limit - 1) // limit
                }
            }
            
        except Exception as e:
            logger.error(f"Error fetching ETL records: {str(e)}")
            raise