from typing import Any, Dict, List, Optional, Type, TypeVar, Union, Callable
from pydantic import BaseModel
from app.database.supabase import get_supabase_client, safe_supabase_operation
from app.utils.logger import log_info, log_error, log_debugger

T = TypeVar('T', bound=BaseModel)

async def fetch_one(
    table: str, 
    model_cls: Type[T], 
    column: str, 
    value: Any, 
    error_msg: str = "Failed to fetch record"
) -> Optional[T]:
    """
    Fetch a single record from Supabase and convert to a Pydantic model.
    
    Args:
        table: The name of the table to query
        model_cls: The Pydantic model class to convert the result to
        column: The column name to filter on
        value: The value to match
        error_msg: Custom error message
    
    Returns:
        An instance of the provided Pydantic model or None if not found
    """
    supabase = get_supabase_client()
    
    def op():
        return (
            supabase
            .from_(table)
            .select("*")
            .eq(column, value)
            .single()
            .execute()
        )
    
    result = await safe_supabase_operation(op, error_msg)
    
    if result and result.data:
        return model_cls(**result.data)
    
    return None

async def fetch_many(
    table: str, 
    model_cls: Type[T], 
    filters: Dict[str, Any] = None, 
    limit: int = None,
    order_column: str = None,
    order_desc: bool = False,
    error_msg: str = "Failed to fetch records"
) -> List[T]:
    """
    Fetch multiple records from Supabase and convert to Pydantic models.
    
    Args:
        table: The name of the table to query
        model_cls: The Pydantic model class to convert the results to
        filters: Optional dictionary of column:value pairs to filter on
        limit: Optional limit on the number of records to return
        order_column: Optional column to order by
        order_desc: If True, order in descending order
        error_msg: Custom error message
    
    Returns:
        List of instances of the provided Pydantic model
    """
    supabase = get_supabase_client()
    
    def op():
        query = supabase.from_(table).select("*")
        
        # Apply filters if provided
        if filters:
            for column, value in filters.items():
                query = query.eq(column, value)
        
        # Apply ordering if provided
        if order_column:
            query = query.order(order_column, desc=order_desc)
        
        # Apply limit if provided
        if limit:
            query = query.limit(limit)
        
        return query.execute()
    
    result = await safe_supabase_operation(op, error_msg)
    
    if result and result.data:
        return [model_cls(**item) for item in result.data]
    
    return []

async def insert_one(
    table: str, 
    data: Union[Dict[str, Any], BaseModel], 
    model_cls: Optional[Type[T]] = None,
    error_msg: str = "Failed to insert record"
) -> Optional[Any]:
    """
    Insert a single record into Supabase.
    
    Args:
        table: The name of the table to insert into
        data: The data to insert (dict or Pydantic model)
        model_cls: Optional Pydantic model class to convert the result to
        error_msg: Custom error message
    
    Returns:
        The inserted record (as Pydantic model if model_cls provided, else raw data)
    """
    supabase = get_supabase_client()
    
    # Convert Pydantic model to dict if needed
    if isinstance(data, BaseModel):
        data_dict = data.model_dump()
    else:
        data_dict = data
    
    def op():
        return (
            supabase
            .from_(table)
            .insert(data_dict)
            .select()
            .execute()
        )
    
    result = await safe_supabase_operation(op, error_msg)
    
    if result and result.data and len(result.data) > 0:
        if model_cls:
            return model_cls(**result.data[0])
        return result.data[0]
    
    return None

async def update_one(
    table: str, 
    column: str, 
    value: Any, 
    data: Union[Dict[str, Any], BaseModel],
    model_cls: Optional[Type[T]] = None,
    error_msg: str = "Failed to update record"
) -> Optional[Any]:
    """
    Update a single record in Supabase.
    
    Args:
        table: The name of the table to update
        column: The column name to filter on
        value: The value to match
        data: The data to update (dict or Pydantic model)
        model_cls: Optional Pydantic model class to convert the result to
        error_msg: Custom error message
    
    Returns:
        The updated record (as Pydantic model if model_cls provided, else raw data)
    """
    supabase = get_supabase_client()
    
    # Convert Pydantic model to dict if needed
    if isinstance(data, BaseModel):
        data_dict = data.model_dump()
    else:
        data_dict = data
    
    def op():
        return (
            supabase
            .from_(table)
            .update(data_dict)
            .eq(column, value)
            .select()
            .execute()
        )
    
    result = await safe_supabase_operation(op, error_msg)
    
    if result and result.data and len(result.data) > 0:
        if model_cls:
            return model_cls(**result.data[0])
        return result.data[0]
    
    return None

async def delete_one(
    table: str, 
    column: str, 
    value: Any,
    error_msg: str = "Failed to delete record"
) -> bool:
    """
    Delete a single record from Supabase.
    
    Args:
        table: The name of the table to delete from
        column: The column name to filter on
        value: The value to match
        error_msg: Custom error message
    
    Returns:
        True if deletion was successful, False otherwise
    """
    supabase = get_supabase_client()
    
    def op():
        return (
            supabase
            .from_(table)
            .delete()
            .eq(column, value)
            .execute()
        )
    
    result = await safe_supabase_operation(op, error_msg)
    
    # If we got here without an exception, delete was successful
    return True

async def execute_rpc(
    function_name: str,
    params: Dict[str, Any],
    model_cls: Optional[Type[T]] = None,
    error_msg: str = "Failed to execute RPC"
) -> Any:
    """
    Execute a Supabase RPC function.
    
    Args:
        function_name: Name of the PostgreSQL function to call
        params: Dictionary of parameters to pass to the function
        model_cls: Optional Pydantic model class to convert the result to
        error_msg: Custom error message
    
    Returns:
        The result from the RPC function
    """
    supabase = get_supabase_client()
    
    def op():
        return (
            supabase
            .rpc(function_name, params)
            .execute()
        )
    
    result = await safe_supabase_operation(op, error_msg)
    
    if result and result.data:
        if model_cls:
            if isinstance(result.data, list):
                return [model_cls(**item) for item in result.data]
            return model_cls(**result.data)
        return result.data
    
    return None

async def execute_raw_query(
    query_func: Callable,
    error_msg: str = "Failed to execute query"
) -> Any:
    """
    Execute a raw Supabase query with full flexibility.
    
    Args:
        query_func: Function that builds and returns the Supabase query
        error_msg: Custom error message
    
    Returns:
        The query result
    """
    return await safe_supabase_operation(query_func, error_msg)
