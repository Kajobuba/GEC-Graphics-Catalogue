const db = require('./js/db-connection');

async function testDatabase() {
    try {
        console.log('Testing database connection...');
        await db.connect();
        
        // Check if Orders table exists
        console.log('\nChecking if Orders table exists...');
        const ordersTableResult = await db.query(`
            SELECT TABLE_NAME 
            FROM INFORMATION_SCHEMA.TABLES 
            WHERE TABLE_TYPE = 'BASE TABLE'
            AND TABLE_NAME = 'Orders'
        `);
        
        if (ordersTableResult.recordset.length > 0) {
            console.log('✓ Orders table exists');
        } else {
            console.log('✗ Orders table does not exist');
        }
        
        // Check if OrderItems table exists
        console.log('\nChecking if OrderItems table exists...');
        const orderItemsTableResult = await db.query(`
            SELECT TABLE_NAME 
            FROM INFORMATION_SCHEMA.TABLES 
            WHERE TABLE_TYPE = 'BASE TABLE'
            AND TABLE_NAME = 'OrderItems'
        `);
        
        if (orderItemsTableResult.recordset.length > 0) {
            console.log('✓ OrderItems table exists');
        } else {
            console.log('✗ OrderItems table does not exist');
        }
        
        // List all tables
        console.log('\nAll tables in database:');
        const allTablesResult = await db.query(`
            SELECT TABLE_NAME 
            FROM INFORMATION_SCHEMA.TABLES 
            WHERE TABLE_TYPE = 'BASE TABLE'
            ORDER BY TABLE_NAME
        `);
        
        allTablesResult.recordset.forEach(table => {
            console.log(`  - ${table.TABLE_NAME}`);
        });
        
    } catch (error) {
        console.error('Database test failed:', error);
    }
}

testDatabase();
