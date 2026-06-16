import tempfile
from uuid import UUID

from app.daos.songs import SongsDAO
from app.internal.config import log
from app.internal.storage import (
    SONG_FILE_TYPES,
    content_type_for,
    get_song_file,
    save_song_file,
)
from app.internal.SongGPT import SongGPT
from app.schemas.songs import SongCreate, SongCreateInput, SongList, SongRead
from fastapi import APIRouter, HTTPException, Query, status
from fastapi.responses import FileResponse

router = APIRouter()


@router.get("/", status_code=status.HTTP_200_OK, response_model=SongList)
async def list_songs(
    limit: int = Query(default=6, ge=1, le=50),
    offset: int = Query(default=0, ge=0),
):
    return SongsDAO().list(limit=limit, offset=offset)


@router.get("/{song_id}", status_code=status.HTTP_200_OK, response_model=SongRead)
async def get_song(song_id: UUID):
    song = SongsDAO().get(song_id)
    if not song:
        raise HTTPException(status_code=404, detail="Song not found.")
    return song


@router.get("/{song_id}/files/{file_type}", status_code=status.HTTP_200_OK)
async def get_song_file_response(song_id: UUID, file_type: str):
    if file_type not in SONG_FILE_TYPES:
        raise HTTPException(status_code=404, detail="File type not found.")
    file_path = get_song_file(song_id, file_type)
    if not file_path.exists():
        raise HTTPException(status_code=404, detail="Song file not found.")
    return FileResponse(
        file_path,
        media_type=content_type_for(file_type),
        filename=file_path.name,
    )


@router.post("/", status_code=status.HTTP_200_OK)
async def create_song(payload: SongCreateInput):
    songGPT = SongGPT()
    with tempfile.TemporaryDirectory(prefix="songgpt-") as workdir:
        log.info("Generating ABC...")
        response, abc, abc_file_path, score = songGPT.generate_abc(
            system_message=payload.system_message,
            prompt=payload.prompt,
            output_dir=workdir,
        )
        log.info("Generated ABC")
        midi_file_path = songGPT.abc_to_midi(abc_file_path)

        song = SongCreate(**payload.dict(), abc=abc, response=response, score=score)
        song_id = SongsDAO().create(song)
        save_song_file(song_id, abc_file_path, "abc")
        save_song_file(song_id, midi_file_path, "mid")
    return song_id
