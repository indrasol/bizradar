# services/helper.py
import math
from datetime import datetime, date

def json_serializable(obj):
    """Convert special values like inf, -inf, NaN, and more to JSON-compatible values."""
    if isinstance(obj, dict):
        # Handle dictionaries
        result = {}
        for k, v in obj.items():
            # Skip keys that might cause problems (starting with $ or containing dots)
            if isinstance(k, str) and (k.startswith('$') or '.' in k):
                continue
            # Process the value recursively
            processed_value = json_serializable(v)
            result[k] = processed_value
        return result
    elif isinstance(obj, list):
        # Handle lists
        return [json_serializable(item) for item in obj]
    elif isinstance(obj, (datetime, date)):
        # Handle dates
        return obj.isoformat()
    elif isinstance(obj, float):
        # Handle special float values
        if math.isinf(obj):
            return None if obj > 0 else None
        elif math.isnan(obj):
            return None
        return obj
    elif hasattr(obj, '__dict__'):
        # Handle custom objects by converting to dict
        return json_serializable(obj.__dict__)
    elif obj is None or isinstance(obj, (str, int, bool)):
        # Pass through common JSON-compatible types
        return obj
    else:
        # Convert anything else to string
        try:
            return str(obj)
        except:
            return None