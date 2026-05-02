# helpers.py - small useful functions used by other files

from datetime import datetime, timezone, timedelta

# India Standard Time is UTC+5:30
# Using an explicit timezone means this works correctly even when the server runs in UTC
# (Railway and Render both run in UTC by default)
IST = timezone(timedelta(hours=5, minutes=30))

def get_current_slot():
    # this function answers the question "what class period is happening right now?"
    # it returns two things: the day name and the slot number (1 to 6)
    # if its a break, weekend, or outside class hours the slot will be None

    now = datetime.now(IST)                    # always use IST, not the server's local time
    day = now.strftime("%A").upper()           # gets todays day in caps eg "MONDAY"

    # no classes on weekends so just return the day and None for slot
    if day in ("SATURDAY", "SUNDAY"):
        return day, None

    # convert the current time into total minutes since midnight
    # eg 8:30am = 8*60 + 30 = 510 minutes
    current_time = now.hour * 60 + now.minute

    # each slot has a start and end time in minutes
    # slot 1 = 8:30 to 9:30, slot 2 = 9:30 to 10:30, etc
    # note the gap between slot 4 (ends 12:30 = 750) and slot 5 (starts 1:30 = 810) thats lunch break
    slots = {
        1: (510, 570),   # 8:30 - 9:30
        2: (570, 630),   # 9:30 - 10:30
        3: (630, 690),   # 10:30 - 11:30
        4: (690, 750),   # 11:30 - 12:30
        5: (810, 870),   # 1:30 - 2:30
        6: (870, 930),   # 2:30 - 3:30
    }

    # check which slot window the current time falls in
    for slot_num, (start, end) in slots.items():
        if start <= current_time < end:
            return day, slot_num

    # if no slot matched then its either before school, lunch, or after school
    return day, None
