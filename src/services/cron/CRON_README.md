# Cron Task System Documentation

## Overview

This application includes a cron task system for automating SAP Business One synchronization once daily at midnight, with automatic Telegram reporting.

## Architecture

### Core Components

1. **CronService** (`src/services/cron/CronService.ts`)
   - Singleton service that manages all cron tasks
   - Provides task registration, starting, stopping, and monitoring
   - Handles error logging and execution tracking

2. **SAPSyncCronTask** (`src/services/SAPSyncCronTask.ts`)
   - Dedicated task for SAP product synchronization
   - Processes products in batches to avoid memory issues
   - Handles authentication automatically via the SAP service
   - **NEW**: Automatically sends Telegram reports with Excel files

3. **CronTasks** (`src/services/cron/CronTasks.ts`)
   - Configuration and registration of the daily sync task
   - Environment-based task enabling/disabling

4. **TelegramBotMessageSender** (`src/services/telegram-bot/TelegramBotMessageSender.ts`)
   - **NEW**: Sends detailed cron task reports to Telegram
   - Generates Excel files with sync results
   - Includes summary and detailed breakdowns

## Authentication Flow

The SAP service uses an intelligent authentication system:

1. **Initial Request**: Attempts to fetch data without explicit authentication
2. **Unauthorized Response**: If SAP returns error 301 (unauthorized)
3. **Auto-Login**: Calls login endpoint with credentials
4. **Cookie Storage**: Session cookies are automatically stored in CookieJar
5. **Retry**: Re-attempts the original request with session cookies
6. **Future Requests**: All subsequent requests include stored cookies
7. **Auto-Refresh**: If cookies expire, the flow repeats automatically

## Available Cron Tasks

### Daily SAP Sync
- **Name**: `sap-daily-sync`
- **Default Schedule**: Daily at midnight (`0 0 * * *`)
- **Environment Variable**: `SAP_DAILY_SYNC_SCHEDULE`
- **Enable/Disable**: `SAP_DAILY_SYNC_ENABLED=true/false`
- **Description**: Daily product synchronization from SAP Business One
- **NEW**: Automatically sends Telegram reports with Excel files

## Environment Variables

Add these to your `.env` file:

```bash
# Cron Task Configuration
SAP_DAILY_SYNC_SCHEDULE=0 0 * * *                    # Daily at midnight
SAP_DAILY_SYNC_ENABLED=true                          # Enable daily sync

# Timezone for cron tasks
TZ=UTC                                               # Default timezone

# SAP Connection (update these with your actual values)
SAP_URL=https://your-sap-server.com
SAP_COMPANY_DB=your-company-db
SAP_USERNAME=your-username
SAP_PASSWORD=your-password

# NEW: Telegram Bot Configuration
TG_REPORTS_BOT_TOKEN=your_telegram_bot_token
TG_REPORTS_GROUP_ID=your_telegram_chat_id
```

## Telegram Integration

### What Gets Sent
After each cron task execution, a comprehensive report is automatically sent to your Telegram group:

1. **Summary Message**: 
   - Task name and status (✅ SUCCESS / ❌ FAILED)
   - Execution duration
   - Reference ID for tracking
   - Start and end times

2. **Excel File** with multiple sheets:
   - **Filename**: `cron-YYYY-MM-DD.xlsx` (based on execution date)
   - **Summary Sheet**: Overall task statistics
   - **Updated Products**: Products that were successfully updated
   - **Not Found in Warehouse**: Products not found in SAP warehouse
   - **Failed Updates**: Products that failed to update with reasons
   - **Optimized Formatting**: Proper column widths for easy reading

### Excel Report Structure
```
📊 SAP Sync Summary:
• Total Processed: 150
• Updated: 45
• Not Found: 5
• Failed: 2
```

### Sample Telegram Message
```
🕐 Cron Task Report

Task: sap-daily-sync
Status: ✅ SUCCESS
Duration: 15s
Reference ID: cron-sap-daily-sync-1234567890
Start Time: 2024-01-15T00:00:00.000Z
End Time: 2024-01-15T00:00:15.000Z

📊 SAP Sync Summary:
• Total Processed: 150
• Updated: 45
• Not Found: 5
• Failed: 2
```

## Cron Schedule Format

The system uses standard cron format: `minute hour day month day-of-week`

### Common Examples:
- `0 0 * * *` = Daily at midnight
- `0 2 * * *` = Daily at 2 AM
- `0 9 * * *` = Daily at 9 AM
- `0 18 * * *` = Daily at 6 PM
- `0 0 * * 1-5` = Weekdays at midnight
- `0 0 * * 0` = Sundays at midnight

## Monitoring and Logging

### Console Logs
The system provides detailed logging with prefixes:
- `[CRON]` - General cron service logs
- `[SAP-SYNC]` - SAP synchronization specific logs
- `[TELEGRAM]` - Telegram report sending logs

### Log Format
```
[CRON] Starting task: sap-daily-sync (cron-sap-daily-sync-1234567890)
[SAP-SYNC] Starting product synchronization (cron-sap-daily-sync-1234567890)
[SAP-SYNC] Processing batch 1 (cron-sap-daily-sync-1234567890)
[SAP-SYNC] Synchronization completed (cron-sap-daily-sync-1234567890): { totalProcessed: 150, updated: 45, notFound: 5, failed: 2, duration: '15000ms' }
[SAP-SYNC] Telegram report sent successfully (cron-sap-daily-sync-1234567890)
[CRON] Task "sap-daily-sync" completed successfully in 15000ms (cron-sap-daily-sync-1234567890)
```

## Error Handling

### Automatic Retry
- If SAP authentication fails (error 301), the system automatically re-authenticates and retries
- Failed product updates are logged but don't stop the entire sync process

### Graceful Degradation
- Individual product failures don't affect other products
- Batch processing ensures memory efficiency
- Delays between batches prevent overwhelming the SAP system
- **NEW**: Telegram report failures don't break the main sync process

### Error Reporting
- **NEW**: Failed cron tasks send error reports to Telegram
- Error details are included in the Excel report
- Stack traces and error messages are preserved

## Performance Considerations

### Batch Processing
- Products are processed in batches of 20 to avoid memory issues
- 1-second delay between batches to prevent overwhelming SAP
- Parallel processing within batches for efficiency

### Memory Management
- Results are collected incrementally
- Failed products are logged but don't accumulate in memory
- Each batch is processed independently

### Telegram Integration
- **NEW**: Excel files are generated in memory (no disk I/O)
- Reports are sent asynchronously to avoid blocking the main sync
- Large reports are automatically compressed by Telegram

## Security

### Authentication
- SAP credentials are stored in environment variables
- Session cookies are managed automatically
- SSL certificate validation can be disabled for internal SAP systems

### Telegram Security
- **NEW**: Bot tokens are stored in environment variables
- Chat IDs are validated before sending
- No sensitive data is included in reports

## Testing

### Test Telegram Integration
Run the test script to verify Telegram functionality:

```bash
node test-telegram-cron.js
```

This will:
1. Check environment variables
2. Send a test report to Telegram
3. Verify the Excel file generation
4. Confirm message delivery

## Troubleshooting

### Common Issues

1. **Task Not Running**
   - Check if task is enabled via environment variable
   - Verify cron schedule format
   - Check application logs for initialization errors

2. **SAP Authentication Failures**
   - Verify SAP credentials in environment variables
   - Check SAP server connectivity
   - Review authentication logs

3. **Telegram Report Failures**
   - **NEW**: Verify `TG_REPORTS_BOT_TOKEN` and `TG_REPORTS_GROUP_ID`
   - Check bot permissions in Telegram group
   - Ensure bot can send documents
   - Review Telegram API error logs

4. **Memory Issues**
   - Reduce batch size in `SAPSyncCronTask.ts`
   - Increase delay between batches
   - Monitor memory usage during sync

### Debug Mode
Enable detailed logging by setting:
```bash
NODE_ENV=development
```

## How to Use

1. **Set Environment Variables:**
   ```bash
   SAP_DAILY_SYNC_ENABLED=true
   SAP_DAILY_SYNC_SCHEDULE=0 0 * * *
   TG_REPORTS_BOT_TOKEN=your_bot_token
   TG_REPORTS_GROUP_ID=your_chat_id
   ```

2. **Start Application:**
   ```bash
   yarn dev
   # or
   yarn start
   ```

3. **Monitor Results:**
   - Watch console for cron activity logs
   - Check Telegram group for automatic reports
   - Review Excel files for detailed breakdowns

## Future Enhancements

1. **Database Logging**: Store sync results in database for historical analysis
2. **Email Notifications**: Send alerts for failed syncs
3. **Metrics Dashboard**: Web interface for monitoring sync performance
4. **Dynamic Scheduling**: Allow schedule changes via API
5. **Retry Policies**: Configurable retry strategies for failed operations
6. **Advanced Telegram Features**: 
   - Custom report templates
   - Multiple chat destinations
   - Interactive bot commands
   - Real-time status updates