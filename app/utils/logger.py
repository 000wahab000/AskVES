# logger.py - centralised logging for AskVES
# wraps Python's built-in logging module so every module can import and use
# log_info / log_error without caring about handler setup

import logging

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s [%(levelname)s] %(message)s',
    datefmt='%H:%M:%S'
)
_logger = logging.getLogger('askves')

def log_info(msg):
    _logger.info(msg)

def log_error(msg):
    _logger.error(msg)
