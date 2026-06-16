import os
import shutil
from pathlib import Path
from uuid import UUID


STORAGE_DIR = Path(os.getenv("SONGGPT_STORAGE_DIR", "/data/storage"))
SONG_FILE_TYPES = {
    "abc": "text/vnd.abc",
    "mid": "audio/midi",
    "midi": "audio/midi",
}


def song_directory(song_id: UUID) -> Path:
    return STORAGE_DIR / "songs" / str(song_id)


def save_song_file(song_id: UUID, source_path: str, extension: str) -> Path:
    destination_dir = song_directory(song_id)
    destination_dir.mkdir(parents=True, exist_ok=True)
    destination = destination_dir / f"{song_id}.{extension}"
    shutil.copyfile(source_path, destination)
    return destination


def get_song_file(song_id: UUID, file_type: str) -> Path:
    extension = "mid" if file_type == "midi" else file_type
    return song_directory(song_id) / f"{song_id}.{extension}"


def content_type_for(file_type: str) -> str:
    return SONG_FILE_TYPES[file_type]
