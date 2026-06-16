import re
import subprocess
from pathlib import Path
from typing import Dict, List

from fastapi import APIRouter, status

router = APIRouter()
SOUNDFONT_DIRS = [Path("app/data/soundfonts"), Path("/usr/share/sounds/sf2")]


def find_soundfonts() -> List[str]:
    soundfonts = []
    for directory in SOUNDFONT_DIRS:
        if directory.exists():
            soundfonts.extend(
                path.name
                for path in directory.iterdir()
                if path.suffix.lower() in {".sf2", ".sf3"}
            )
    return sorted(set(soundfonts))


def soundfont_path(soundfont: str) -> Path:
    if "/" in soundfont or "\\" in soundfont:
        raise FileNotFoundError(soundfont)
    for directory in SOUNDFONT_DIRS:
        path = directory / soundfont
        if path.exists():
            return path
    raise FileNotFoundError(soundfont)


@router.get("/", status_code=status.HTTP_200_OK, response_model=List[str])
async def list_soundfonts():
    return find_soundfonts()


@router.get(
    "/{soundfont}/instruments",
    status_code=status.HTTP_200_OK,
    response_model=List[Dict],
)
async def list_instruments(soundfont: str):
    path = soundfont_path(soundfont)
    process = subprocess.run(
        ["fluidsynth", str(path), "-a", "null", "-n", "-q"],
        input="inst 1\n",
        capture_output=True,
        check=True,
        text=True,
        timeout=10,
    )

    INSTR_REGEX = r"\n?(?P<bank>\d{3})-(?P<num>\d{3}) (?P<instrument>[\w\d\- ]+)\n"
    matches = [m.groupdict() for m in re.finditer(INSTR_REGEX, process.stdout)]
    return [
        {
            "name": m["instrument"],
            "bank": int(m["bank"]),
            "program_number": int(m["num"]),
        }
        for m in matches
    ]
