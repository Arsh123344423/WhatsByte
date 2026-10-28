from rest_framework.views import exception_handler
from rest_framework.response import Response
from rest_framework import status


def custom_exception_handler(exc, context):
    """
    Custom exception handler to standardize API error responses.
    """
    response = exception_handler(exc, context)

    if response is not None:
        custom_data = {
            "status": "error",
            "status_code": response.status_code,
            "message": "An error occurred while processing your request.",
            "errors": response.data,
        }

        # Format clearer message if available
        if isinstance(response.data, dict):
            if "detail" in response.data:
                custom_data["message"] = str(response.data["detail"])
            elif "non_field_errors" in response.data:
                custom_data["message"] = " ".join([str(err) for err in response.data["non_field_errors"]])
            else:
                first_key = next(iter(response.data))
                first_val = response.data[first_key]
                if isinstance(first_val, list) and len(first_val) > 0:
                    custom_data["message"] = f"{first_key}: {first_val[0]}"
                else:
                    custom_data["message"] = f"{first_key}: {first_val}"
        elif isinstance(response.data, list) and len(response.data) > 0:
            custom_data["message"] = str(response.data[0])

        response.data = custom_data

    return response
