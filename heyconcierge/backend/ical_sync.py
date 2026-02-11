#!/usr/bin/env python3
"""
HeyConcierge iCal Sync Service
Fetches iCal feeds from Airbnb/Booking.com and syncs bookings to Supabase
"""

import os
import sys
import requests
from datetime import datetime, timezone
from icalendar import Calendar
from supabase import create_client, Client
import logging

# Setup logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler('/tmp/heyconcierge-ical-sync.log'),
        logging.StreamHandler(sys.stdout)
    ]
)
logger = logging.getLogger(__name__)

# Supabase config
SUPABASE_URL = os.environ.get('SUPABASE_URL')
SUPABASE_KEY = os.environ.get('SUPABASE_SERVICE_KEY')  # Service role key for backend

if not SUPABASE_URL or not SUPABASE_KEY:
    logger.error("Missing SUPABASE_URL or SUPABASE_SERVICE_KEY environment variables")
    sys.exit(1)

supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)


def fetch_ical(url: str) -> str:
    """Fetch iCal feed from URL"""
    try:
        logger.info(f"Fetching iCal from: {url[:50]}...")
        response = requests.get(url, timeout=30)
        response.raise_for_status()
        return response.text
    except Exception as e:
        logger.error(f"Failed to fetch iCal: {e}")
        raise


def parse_ical(ical_text: str) -> list:
    """Parse iCal text and extract booking events"""
    try:
        cal = Calendar.from_ical(ical_text)
        bookings = []
        
        for component in cal.walk():
            if component.name == "VEVENT":
                # Extract event data
                summary = str(component.get('summary', 'Unnamed Guest'))
                dtstart = component.get('dtstart')
                dtend = component.get('dtend')
                uid = str(component.get('uid', ''))
                description = str(component.get('description', ''))
                
                if dtstart and dtend:
                    # Convert to date objects
                    check_in = dtstart.dt if hasattr(dtstart, 'dt') else dtstart
                    check_out = dtend.dt if hasattr(dtend, 'dt') else dtend
                    
                    # Handle datetime vs date
                    if hasattr(check_in, 'date'):
                        check_in = check_in.date()
                    if hasattr(check_out, 'date'):
                        check_out = check_out.date()
                    
                    # Detect platform from UID or summary
                    platform = 'other'
                    if 'airbnb' in uid.lower() or 'airbnb' in summary.lower():
                        platform = 'airbnb'
                    elif 'booking' in uid.lower() or 'booking' in summary.lower():
                        platform = 'booking'
                    
                    bookings.append({
                        'guest_name': summary,
                        'check_in_date': check_in.isoformat(),
                        'check_out_date': check_out.isoformat(),
                        'booking_reference': uid,
                        'platform': platform,
                        'notes': description,
                        'status': 'confirmed'
                    })
        
        logger.info(f"Parsed {len(bookings)} bookings from iCal")
        return bookings
    
    except Exception as e:
        logger.error(f"Failed to parse iCal: {e}")
        raise


def sync_bookings(property_id: str, bookings: list):
    """Upsert bookings to Supabase"""
    try:
        for booking in bookings:
            booking['property_id'] = property_id
            
            # Upsert (insert or update if exists)
            result = supabase.table('bookings').upsert(
                booking,
                on_conflict='property_id,booking_reference,platform'
            ).execute()
            
            logger.debug(f"Synced booking: {booking['guest_name']} ({booking['check_in_date']})")
        
        logger.info(f"Synced {len(bookings)} bookings for property {property_id}")
    
    except Exception as e:
        logger.error(f"Failed to sync bookings: {e}")
        raise


def update_sync_timestamp(property_id: str):
    """Update last_ical_sync timestamp for property"""
    try:
        supabase.table('properties').update({
            'last_ical_sync': datetime.now(timezone.utc).isoformat()
        }).eq('id', property_id).execute()
        
        logger.debug(f"Updated sync timestamp for property {property_id}")
    
    except Exception as e:
        logger.error(f"Failed to update sync timestamp: {e}")


def sync_all_properties():
    """Sync all properties with iCal URLs"""
    try:
        # Fetch all properties with iCal URLs
        result = supabase.table('properties').select('*').not_.is_('ical_url', 'null').execute()
        properties = result.data
        
        if not properties:
            logger.info("No properties with iCal URLs found")
            return
        
        logger.info(f"Found {len(properties)} properties to sync")
        
        success_count = 0
        error_count = 0
        
        for prop in properties:
            property_id = prop['id']
            property_name = prop['name']
            ical_url = prop['ical_url']
            
            logger.info(f"Syncing property: {property_name}")
            
            try:
                # Fetch and parse iCal
                ical_text = fetch_ical(ical_url)
                bookings = parse_ical(ical_text)
                
                # Sync to database
                sync_bookings(property_id, bookings)
                
                # Update timestamp
                update_sync_timestamp(property_id)
                
                success_count += 1
                logger.info(f"✅ Successfully synced {property_name}")
            
            except Exception as e:
                error_count += 1
                logger.error(f"❌ Failed to sync {property_name}: {e}")
        
        logger.info(f"Sync complete: {success_count} success, {error_count} errors")
    
    except Exception as e:
        logger.error(f"Fatal error in sync_all_properties: {e}")
        raise


if __name__ == '__main__':
    logger.info("=" * 60)
    logger.info("Starting HeyConcierge iCal Sync")
    logger.info("=" * 60)
    
    try:
        sync_all_properties()
        logger.info("✅ Sync completed successfully")
        sys.exit(0)
    
    except Exception as e:
        logger.error(f"💥 Sync failed: {e}")
        sys.exit(1)
