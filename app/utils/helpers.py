"""Time helpers for class slot detection."""

from datetime import datetime, timezone, timedelta

IST = timezone(timedelta(hours=5, minutes=30))


def get_current_slot():
    """Return (weekday uppercase, slot int or None) in IST."""
    now = datetime.now(IST)
    day = now.strftime("%A").upper()

    if day in ("SATURDAY", "SUNDAY"):
        return day, None

    current_time = now.hour * 60 + now.minute

    slots = {
        1: (510, 570),
        2: (570, 630),
        3: (630, 690),
        4: (690, 750),
        5: (810, 870),
        6: (870, 930),
    }

    for slot_num, (start, end) in slots.items():
        if start <= current_time < end:
            return day, slot_num

    return day, None
