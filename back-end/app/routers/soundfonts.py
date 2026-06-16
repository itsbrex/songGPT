import os
import re
import shlex
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
    command = f"fluidsynth {path} -a file -n -q"
    input_str = "inst 1"

    args = shlex.split(command)
    process = subprocess.Popen(
        args, stdin=subprocess.PIPE, stdout=subprocess.PIPE, text=True
    )
    output, _ = process.communicate(input=input_str)
    process.kill()
    try:
        os.remove("fluidsynth.wav")
    except FileNotFoundError:
        pass

    INSTR_REGEX = r"\n?(?P<bank>\d{3})-(?P<num>\d{3}) (?P<instrument>[\w\d\- ]+)\n"
    matches = [m.groupdict() for m in re.finditer(INSTR_REGEX, output)]
    return [
        {
            "name": m["instrument"],
            "bank": int(m["bank"]),
            "program_number": int(m["num"]),
        }
        for m in matches
    ]
