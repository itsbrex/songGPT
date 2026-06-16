import logging
import os

LOG_LEVEL = os.environ.get("LOGLEVEL", "DEBUG")

log = logging.getLogger(os.getenv("LOGGER", "gunicorn.error"))
log.setLevel(LOG_LEVEL)
