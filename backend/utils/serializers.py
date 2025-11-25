from bson import ObjectId

def serialize_doc(doc):
    """Converts a single MongoDB document to JSON-friendly format."""
    if not doc:
        return None
    doc["_id"] = str(doc["_id"])
    return doc

def serialize_list(cursor):
    """Converts a list of MongoDB documents."""
    return [serialize_doc(doc) for doc in cursor]
