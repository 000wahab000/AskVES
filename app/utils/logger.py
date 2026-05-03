"""Thin wrapper around stdlib logging."""

import logging

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s [%(levelname)s] %(message)s',
    datefmt='%H:%M:%S'
)
_logger = logging.getLogger('askves')


def log_info(msg):
    """Log INFO."""
    _logger.info(msg)


def log_error(msg):
    """Log ERROR."""
    _logger.error(msg)
