#!/usr/bin/env python3
"""
Test iCal sync with a sample iCal feed
"""

import requests
from icalendar import Calendar

# Sample Airbnb iCal URL (use your own for real test)
SAMPLE_ICAL_URL = "https://www.airbnb.com/calendar/ical/12345678.ics?s=abc123"

def test_fetch_parse():
    """Test fetching and parsing an iCal feed"""
    print("=" * 60)
    print("Testing iCal Fetch & Parse")
    print("=" * 60)
    
    # Option 1: Use your real iCal URL
    ical_url = input("\nEnter your iCal URL (or press Enter to use sample): ").strip()
    if not ical_url:
        print("⚠️  Using sample URL (will fail - need real URL)")
        ical_url = SAMPLE_ICAL_URL
    
    print(f"\n📡 Fetching: {ical_url[:60]}...")
    
    try:
        response = requests.get(ical_url, timeout=30)
        response.raise_for_status()
        print(f"✅ Fetched {len(response.text)} bytes")
        
        # Parse iCal
        cal = Calendar.from_ical(response.text)
        print("✅ Parsed iCal successfully")
        
        # Extract bookings
        bookings = []
        for component in cal.walk():
            if component.name == "VEVENT":
                summary = str(component.get('summary', 'Unnamed'))
                dtstart = component.get('dtstart')
                dtend = component.get('dtend')
                uid = str(component.get('uid', ''))
                
                if dtstart and dtend:
                    check_in = dtstart.dt if hasattr(dtstart, 'dt') else dtstart
                    check_out = dtend.dt if hasattr(dtend, 'dt') else dtend
                    
                    # Handle datetime vs date
                    if hasattr(check_in, 'date'):
                        check_in = check_in.date()
                    if hasattr(check_out, 'date'):
                        check_out = check_out.date()
                    
                    bookings.append({
                        'guest': summary,
                        'check_in': check_in.isoformat(),
                        'check_out': check_out.isoformat(),
                        'uid': uid[:40]
                    })
        
        print(f"\n✅ Found {len(bookings)} bookings:")
        print("-" * 60)
        for i, booking in enumerate(bookings[:5], 1):  # Show first 5
            print(f"{i}. {booking['guest']}")
            print(f"   Check-in:  {booking['check_in']}")
            print(f"   Check-out: {booking['check_out']}")
            print(f"   UID:       {booking['uid']}...")
            print()
        
        if len(bookings) > 5:
            print(f"   ... and {len(bookings) - 5} more")
        
        print("\n✅ Test passed! Ready to sync with Supabase.")
    
    except requests.exceptions.RequestException as e:
        print(f"\n❌ Failed to fetch iCal: {e}")
        print("\n💡 Make sure the URL is correct and accessible")
    
    except Exception as e:
        print(f"\n❌ Failed to parse iCal: {e}")
        print("\n💡 The iCal feed might be malformed")


if __name__ == '__main__':
    test_fetch_parse()
