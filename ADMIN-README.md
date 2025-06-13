# Admin Page Product Management

## Features Added

1. **Enhanced Edit Product Modal**:
   - Product details displayed in a table format
   - Product ID field (read-only)
   - Title and Description fields
   - Hours field with visibility toggle checkbox
   - Current product image preview
   - Save/Cancel buttons

2. **Click-to-Edit Functionality**:
   - Entire product card is clickable to open edit modal
   - Edit and Delete buttons prevent event propagation

3. **Server-Side Updates**:
   - Added PUT endpoint to update product details
   - Database updates for product information

## How to Use

1. **Start the Server**:
   ```powershell
   & "C:\Program Files\nodejs\node.exe" server.js
   ```

2. **Access the Admin Page**:
   - Open a web browser and navigate to: `http://localhost:3000/admin.html`

3. **Edit Products**:
   - Click on any product card to open the edit modal
   - The edit modal shows product details in a table format
   - Edit the product details as needed
   - Use the "Display Hours" checkbox to toggle hours visibility
   - Click "Save Changes" to update the product or "Cancel" to discard changes

4. **Product ID**:
   - The Product ID field shows the database ID of the product
   - This field is read-only and cannot be edited

## Server Setup Instructions

### Prerequisites
1. **Required Software**:
   - Node.js (v14 or later)
   - SQL Server Express 2019 or later
   - Microsoft ODBC Driver for SQL Server

2. **System Requirements**:
   - Windows operating system
   - Minimum 4GB RAM
   - At least 1GB free disk space

### Installation Steps

1. **Install Node.js**:
   - Download Node.js installer (nodejs.msi) from the installation files
   - Run the installer and follow the setup wizard
   - Verify installation by running `node --version` in PowerShell

2. **Install SQL Server Express**:
   - Download SQL Server Express installer
   - Run the installer with basic settings
   - Enable TCP/IP protocol in SQL Server Configuration Manager
   - Set SQL Server to start automatically

3. **Install ODBC Driver**:
   - Run the included `msodbcsql.msi` installer
   - Follow the installation prompts
   - Restart the system after installation

### Database Setup

1. **Configure SQL Server**:
   - Run PowerShell as Administrator
   - Execute `enable-remote-sql.ps1` to enable remote connections
   - Run `setup-sql-user.ps1` to create necessary database user

2. **Initialize Database**:
   - Run `sql_setup.sql` to create the database schema
   - Run `pg_setup.sql` to set up additional tables
   - Execute `setup-site-settings.sql` for website configurations

### Website Configuration

1. **Install Dependencies**:
   ```powershell
   npm install
   ```

2. **Configure Database Connection**:
   - Open `server.js`
   - Update database connection settings if needed:
     - Server name (default: localhost)
     - Database name
     - Username and password

3. **Verify Setup**:
   - Run `node test-connection.js` to verify database connectivity
   - Run `node check-tables.js` to verify database schema

### Starting the Website

1. **Start the Server**:
   - Use the provided start script:
     ```powershell
     .\start-server.bat
     ```
   - Or run directly with Node.js:
     ```powershell
     node server.js
     ```

2. **Access the Website**:
   - Open a web browser
   - Navigate to `http://localhost:3000`
   - Admin panel: `http://localhost:3000/admin.html`

### Troubleshooting Guide

1. **Database Connection Issues**:
   - Verify SQL Server is running
   - Check Windows Services
   - Run `test-connection.js` for detailed error messages
   - Ensure firewall allows SQL Server connections

2. **Node.js Server Issues**:
   - Check if port 3000 is available
   - Run `debug-server.js` for detailed logging
   - Verify all npm dependencies are installed

3. **Website Access Issues**:
   - Check if server is running
   - Verify firewall settings
   - Check for correct file permissions

### Security Notes

1. **Before Deployment**:
   - Change default database passwords
   - Update admin credentials
   - Configure firewall rules
   - Enable HTTPS if needed

2. **Regular Maintenance**:
   - Keep Node.js updated
   - Update SQL Server security patches
   - Backup database regularly
   - Monitor server logs

### Additional Resources

- Check `server.js` comments for configuration options
- Refer to `test-endpoints.html` for API testing
- Use `show-tables.js` to inspect database structure

## Troubleshooting

1. **Server Connection Issues**:
   - Make sure SQL Server Express is running
   - Check the database connection in db-connection.js

2. **Product Updates Failing**:
   - Check the server console for error messages
   - Verify that the product ID is valid

3. **Modal Not Displaying Correctly**:
   - Make sure all CSS and JavaScript is properly loaded
   - Check for any console errors in the developer tools

4. **Changes Not Saving**:
   - Confirm the PUT endpoint is working by checking server logs
   - Check for any error messages in the browser console
