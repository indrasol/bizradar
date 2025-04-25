# services/filter_service.py
from datetime import datetime, timedelta

def apply_filters_to_results(results, filters):
    """
    Apply filters to the cached search results.
    
    Args:
        results (list): List of result dictionaries
        filters (dict): Dictionary containing filter parameters
        
    Returns:
        list: Filtered results
    """
    filtered_results = []
    today = datetime.now().replace(hour=0, minute=0, second=0, microsecond=0)
    
    for result in results:
        # Skip if not a dictionary
        if not isinstance(result, dict):
            continue
            
        # Sanitize result to ensure no inf values
        for key in result:
            if isinstance(result[key], float) and (result[key] == float('inf') or result[key] == float('-inf')):
                result[key] = None  # Replace inf/-inf with None
        
        # Apply due date filter
        if filters.get('due_date_filter') and filters['due_date_filter'] != 'none':
            due_date_str = result.get('response_date') or result.get('dueDate')
            if due_date_str:
                try:
                    # Handle string dates with or without time component
                    due_date_str = str(due_date_str)
                    due_date = datetime.fromisoformat(due_date_str.replace('Z', '+00:00')) if 'T' in due_date_str else datetime.strptime(due_date_str, '%Y-%m-%d')
                    
                    # Skip expired opportunities for active_only
                    if filters['due_date_filter'] == 'active_only' and due_date < today:
                        continue
                    
                    # Apply other due date filters
                    if filters['due_date_filter'] == 'next_30_days' and (due_date > today + timedelta(days=30) or due_date < today):
                        continue
                    
                    if filters['due_date_filter'] == 'next_3_months' and (due_date > today + timedelta(days=90) or due_date < today):
                        continue
                    
                    if filters['due_date_filter'] == 'next_12_months' and (due_date > today + timedelta(days=365) or due_date < today):
                        continue
                    
                    if filters['due_date_filter'] == 'due_in_7_days' and (due_date > today + timedelta(days=7) or due_date < today):
                        continue
                except (ValueError, AttributeError, TypeError):
                    if filters['due_date_filter'] == 'active_only':
                        pass
                    else:
                        continue
            elif filters['due_date_filter'] != 'active_only':
                continue
        
        # Apply posted date filter
        if filters.get('posted_date_filter') and filters['posted_date_filter'] != 'all':
            posted_date_str = result.get('published_date') or result.get('posted')
            if posted_date_str:
                try:
                    posted_date_str = str(posted_date_str)
                    posted_date = datetime.fromisoformat(posted_date_str.replace('Z', '+00:00')) if 'T' in posted_date_str else datetime.strptime(posted_date_str, '%Y-%m-%d')
                    
                    if filters['posted_date_filter'] == 'past_day' and posted_date < today - timedelta(days=1):
                        continue
                    
                    if filters['posted_date_filter'] == 'past_week' and posted_date < today - timedelta(days=7):
                        continue
                    
                    if filters['posted_date_filter'] == 'past_month' and posted_date < today - timedelta(days=30):
                        continue
                    
                    if filters['posted_date_filter'] == 'past_year' and posted_date < today - timedelta(days=365):
                        continue
                except (ValueError, AttributeError, TypeError):
                    continue
            else:
                continue
        
        # Apply NAICS code filter
        if filters.get('naics_code') and filters['naics_code'].strip():
            naics_code = str(result.get('naics_code') or result.get('naicsCode') or '')
            if not naics_code or filters['naics_code'].strip().lower() not in naics_code.lower():
                continue
        
        # Apply opportunity type filter
        if filters.get('opportunity_type') and filters['opportunity_type'] != 'All':
            platform = result.get('platform', '')
            
            if filters['opportunity_type'] == 'Federal' and platform != 'sam.gov' and platform != 'sam_gov':
                continue
                
            if filters['opportunity_type'] == 'Freelancer' and (platform == 'sam.gov' or platform == 'sam_gov'):
                continue
        
        # If result passed all filters, add it to filtered results
        filtered_results.append(result)
    
    return filtered_results

def sort_results(results, sort_by):
    """
    Sort the results based on the specified sort criteria.
    
    Args:
        results (list): List of result dictionaries
        sort_by (str): Sort criteria ('relevance', 'ending_soon', or 'newest')
        
    Returns:
        list: Sorted results
    """
    if not results:
        return []
        
    if sort_by == 'ending_soon':
        # Sort by days until due date (ascending)
        today = datetime.now().replace(hour=0, minute=0, second=0, microsecond=0)
        
        def get_days_until_due(result):
            due_date_str = result.get('response_date') or result.get('dueDate')
            if due_date_str:
                try:
                    due_date_str = str(due_date_str)
                    due_date = datetime.fromisoformat(due_date_str.replace('Z', '+00:00')) if 'T' in due_date_str else datetime.strptime(due_date_str, '%Y-%m-%d')
                    return (due_date - today).days if due_date >= today else 9999  # Use 9999 instead of float('inf')
                except (ValueError, AttributeError, TypeError):
                    return 9999  # Use 9999 instead of float('inf')
            return 9999  # Use 9999 instead of float('inf')
        
        return sorted(results, key=get_days_until_due)
    
    elif sort_by == 'newest':
        # Sort by published date (descending)
        def get_published_date(result):
            published_date_str = result.get('published_date') or result.get('posted')
            if published_date_str:
                try:
                    published_date_str = str(published_date_str)
                    return datetime.fromisoformat(published_date_str.replace('Z', '+00:00')) if 'T' in published_date_str else datetime.strptime(published_date_str, '%Y-%m-%d')
                except (ValueError, AttributeError, TypeError):
                    return datetime(2000, 1, 1)  # Default to a very old date
            return datetime(2000, 1, 1)  # Default to a very old date
        
        return sorted(results, key=get_published_date, reverse=True)
    
    else:  # Default to 'relevance'
        return sorted(results, key=lambda x: x.get('relevance_score', 0), reverse=True)