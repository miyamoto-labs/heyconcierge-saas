#!/usr/bin/env python3
"""Calendar helper - parse dates and calculate differences."""
import sys
from datetime import datetime, timedelta
import re

DAYS = {"monday": 0, "tuesday": 1, "wednesday": 2, "thursday": 3, "friday": 4, "saturday": 5, "sunday": 6}

def parse_natural(text: str) -> datetime:
    text = text.lower().strip()
    now = datetime.now()
    
    if text == "today":
        return now
    if text == "tomorrow":
        return now + timedelta(days=1)
    if text == "yesterday":
        return now - timedelta(days=-1)
    
    # "next <day>"
    m = re.match(r'next\s+(\w+)', text)
    if m and m.group(1) in DAYS:
        target = DAYS[m.group(1)]
        days_ahead = (target - now.weekday()) % 7
        if days_ahead == 0: days_ahead = 7
        return now + timedelta(days=days_ahead)
    
    # "N days/weeks/months from now"
    m = re.match(r'(\d+)\s+(day|week|month)s?\s+from\s+now', text)
    if m:
        n = int(m.group(1))
        unit = m.group(2)
        if unit == "day": return now + timedelta(days=n)
        if unit == "week": return now + timedelta(weeks=n)
        if unit == "month": return now + timedelta(days=n * 30)
    
    # "in N days/weeks"
    m = re.match(r'in\s+(\d+)\s+(day|week|month)s?', text)
    if m:
        n = int(m.group(1))
        unit = m.group(2)
        if unit == "day": return now + timedelta(days=n)
        if unit == "week": return now + timedelta(weeks=n)
        if unit == "month": return now + timedelta(days=n * 30)
    
    # Try ISO format
    for fmt in ("%Y-%m-%d", "%d/%m/%Y", "%m/%d/%Y", "%B %d, %Y", "%b %d, %Y"):
        try:
            return datetime.strptime(text, fmt)
        except ValueError:
            continue
    
    raise ValueError(f"Cannot parse date: '{text}'")

def date_diff(d1: str, d2: str) -> str:
    dt1 = parse_natural(d1)
    dt2 = parse_natural(d2)
    delta = abs((dt2 - dt1).days)
    weeks = delta // 7
    return f"📅 {dt1.strftime('%Y-%m-%d')} → {dt2.strftime('%Y-%m-%d')}\n⏱️  {delta} days ({weeks} weeks, {delta % 7} days)"

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: ./calendar_helper.py <date_text> | diff <date1> <date2>")
        sys.exit(1)
    
    if sys.argv[1] == "diff" and len(sys.argv) >= 4:
        print(date_diff(sys.argv[2], sys.argv[3]))
    else:
        text = " ".join(sys.argv[1:])
        result = parse_natural(text)
        print(f"📅 {text} → {result.strftime('%A, %B %d, %Y')}")
        days = (result - datetime.now()).days
        if days > 0:
            print(f"⏱️  {days} days from now")
        elif days < 0:
            print(f"⏱️  {abs(days)} days ago")
