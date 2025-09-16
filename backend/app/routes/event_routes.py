from fastapi import APIRouter, Request
import json

events_router = APIRouter(tags=["events"])   # ← export name is `router`

@events_router.post("/events")
async def ingest(req: Request):
    "To log session info , geo details and event details"
    data = await req.json()
    print("EVENT:", json.dumps(data, indent=2))
    return {"ok": True}
