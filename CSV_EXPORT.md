# CSV Export Functionality

This guide explains the CSV export features available in LandlordHub for tax reporting and data backup.

## Features Overview

### 1. Expenses Export
- **Filtered by date range**: Export expenses for specific time periods
- **Tax-ready format**: Properly formatted for tax reporting
- **Currency formatting**: Amounts displayed as currency ($X.XX)
- **Complete data**: All expense details included

### 2. Date Range Filtering
- **Predefined ranges**: This Month, Last Month, This Quarter, This Year
- **Custom ranges**: Select any start and end date
- **Real-time filtering**: Table updates immediately when filter changes
- **Export integration**: Only filtered data is exported

### 3. Complete Data Export
- **Backup functionality**: Export all data for backup purposes
- **Multiple data types**: Properties, expenses, and maintenance tasks
- **Comprehensive format**: All fields included for complete data recovery

## CSV Export Formats

### Expenses Export Columns
```
Date, Property, Category, Description, Amount
2024-01-15, 123 Main St, Repairs, Plumbing repair, $150.00
2024-01-20, 123 Main St, Utilities, Electric bill, $85.50
```

### Complete Data Export Columns
```
Type, ID, [Type-specific fields...]
Property, uuid-123, Address, Monthly_Rent, Tenant_Name, ...
Expense, uuid-456, Date, Amount, Category, Description, ...
Maintenance, uuid-789, Task, Due_Date, Status, Notes, ...
```

## Usage Instructions

### 1. Filter Expenses by Date Range

#### Predefined Ranges
- **This Month**: Current calendar month
- **Last Month**: Previous calendar month  
- **This Quarter**: Current quarter (Q1, Q2, Q3, Q4)
- **This Year**: January 1st to December 31st

#### Custom Range
1. Click "Custom Range" button
2. Select start date
3. Select end date
4. Click "Apply Custom Range"

### 2. Export Filtered Expenses
1. Apply desired date range filter
2. Click "Export Filtered" button
3. CSV file downloads automatically
4. File named: `expenses_YYYY-MM-DD_to_YYYY-MM-DD.csv`

### 3. Export All Data
1. Click "Export All Data" button
2. Complete backup CSV downloads
3. File named: `landlordhub_backup_YYYY-MM-DD.csv`

## Tax Reporting Features

### Expense Categories
- **Repairs**: Maintenance and repair costs
- **Utilities**: Electric, gas, water bills
- **Insurance**: Property insurance premiums
- **Taxes**: Property taxes and assessments
- **Management**: Property management fees
- **Marketing**: Advertising and marketing costs
- **Legal**: Legal fees and court costs
- **Other**: Miscellaneous expenses

### Currency Formatting
- **Standard format**: $X,XXX.XX
- **Tax compliance**: Proper decimal formatting
- **Import ready**: Compatible with tax software

### Date Formatting
- **ISO format**: YYYY-MM-DD for consistency
- **Tax year alignment**: Easy to filter by tax year
- **Quarterly reports**: Support for quarterly tax reporting

## File Naming Convention

### Expenses Export
- **All expenses**: `expenses_all.csv`
- **Filtered**: `expenses_2024-01-01_to_2024-03-31.csv`
- **This month**: `expenses_2024-01-01_to_2024-01-31.csv`

### Complete Data Export
- **Backup**: `landlordhub_backup_2024-01-15.csv`
- **Timestamp**: Includes export date for versioning

## Data Security

### Privacy Protection
- **User isolation**: Only export your own data
- **Secure download**: Files downloaded directly to your device
- **No cloud storage**: Files not stored on external servers

### Data Integrity
- **Complete records**: All fields included in export
- **Consistent formatting**: Standardized data format
- **Error handling**: Graceful handling of missing data

## Integration with Tax Software

### QuickBooks Compatibility
- **CSV format**: Direct import into QuickBooks
- **Column mapping**: Standard expense fields
- **Currency format**: Properly formatted amounts

### TurboTax Integration
- **Schedule E**: Rental property expense reporting
- **Category mapping**: Standard tax categories
- **Date filtering**: Easy tax year filtering

### Excel/Google Sheets
- **Direct import**: Open CSV files in spreadsheet software
- **Pivot tables**: Create custom reports and analysis
- **Charts**: Visualize expense trends and patterns

## Advanced Features

### Data Analysis
- **Expense trends**: Track spending patterns over time
- **Category analysis**: Compare expense categories
- **Property comparison**: Analyze expenses by property
- **Tax optimization**: Identify deductible expenses

### Reporting Capabilities
- **Monthly reports**: Generate monthly expense summaries
- **Quarterly reports**: Create quarterly tax reports
- **Annual reports**: Year-end expense summaries
- **Custom periods**: Any date range for specific needs

## Troubleshooting

### Common Issues

**Export not working:**
- Check browser popup blockers
- Ensure JavaScript is enabled
- Try different browser or incognito mode

**File not downloading:**
- Check browser download settings
- Verify file permissions
- Clear browser cache and try again

**Data missing:**
- Check date range filters
- Verify data exists for selected period
- Refresh page and try again

### File Format Issues

**CSV not opening:**
- Use Excel, Google Sheets, or text editor
- Check file encoding (UTF-8)
- Verify file extension is .csv

**Data formatting:**
- Currency amounts properly formatted
- Dates in ISO format (YYYY-MM-DD)
- Text fields properly quoted

## Best Practices

### Regular Backups
- **Monthly exports**: Export data monthly for backup
- **Before major changes**: Export before system updates
- **Tax preparation**: Export before tax season
- **Year-end**: Complete backup at year-end

### Data Organization
- **Consistent naming**: Use consistent file naming
- **Folder structure**: Organize exports by year/month
- **Version control**: Keep multiple export versions
- **Documentation**: Note any data issues or changes

### Tax Preparation
- **Quarterly exports**: Export quarterly for estimated taxes
- **Category review**: Verify expense categories are correct
- **Receipt matching**: Cross-reference with uploaded receipts
- **Professional review**: Have accountant review exports

## Support and Help

### Getting Help
- **Documentation**: Refer to this guide for detailed instructions
- **Video tutorials**: Check help section for video guides
- **Community support**: Join user community for tips
- **Professional help**: Consult with tax professional

### Feature Requests
- **Suggestions**: Submit feature requests through support
- **Feedback**: Provide feedback on export functionality
- **Improvements**: Help improve the export system
- **Integration**: Request additional software integrations
