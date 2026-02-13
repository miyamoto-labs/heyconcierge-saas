#!/usr/bin/env node
/**
 * Daily Check-in Reminder Cron Job
 * Run this daily at 9 AM to send reminders for tomorrow's check-ins
 * 
 * Usage:
 *   node cron_daily_reminders.js
 * 
 * Or add to crontab:
 *   0 9 * * * cd /path/to/heyconcierge/backend && node cron_daily_reminders.js
 */

const { sendCheckinReminders } = require('./reminder_service');

async function main() {
  console.log('🕐 Daily reminder cron job started');
  console.log('⏰ Time:', new Date().toLocaleString());
  
  try {
    const results = await sendCheckinReminders();
    
    console.log('\n📊 Results:');
    console.log(`   ✅ Sent: ${results.sent}`);
    console.log(`   ❌ Failed: ${results.failed}`);
    console.log(`   📋 Total: ${results.total}`);
    
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Cron job failed:', error.message);
    process.exit(1);
  }
}

main();
