from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.dependencies import get_current_user, get_session
from app.db.models import User
from app.services import FileScannerService, ScanResult

router = APIRouter(prefix="/library", tags=["library"])


@router.post("/scan")
async def scan_library(
    background_tasks: BackgroundTasks,
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user),
):
    """Start a library scan operation."""
    if current_user.role.value not in ["admin", "editor"]:
        raise HTTPException(status_code=403, detail="Insufficient permissions")

    def run_scan():
        scanner = FileScannerService(session, settings.music_library_path)
        result = scanner.scan()
        return result

    background_tasks.add_task(run_scan)

    return {"message": "Library scan started"}


@router.get("/scan/status")
async def get_scan_status(
    current_user: User = Depends(get_current_user),
):
    """Get the status of the current library scan."""
    # For now, return a simple status
    # In a production environment, you'd want to track scan jobs in the database
    return {"status": "idle", "message": "No scan in progress"}