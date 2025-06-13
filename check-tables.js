const db = require('./js/db-connection');

async function checkTables() {
    try {
        console.log('Connecting to database...');
        await db.connect();
        console.log('Connected successfully!');
        
        const result = await db.query(`
            SELECT TABLE_NAME 
            FROM INFORMATION_SCHEMA.TABLES 
            WHERE TABLE_TYPE = 'BASE TABLE'
            AND TABLE_NAME IN ('Products', 'Folders', 'Orders', 'OrderItems')
        `);
        console.log('Query result:', result.recordset);
        console.log('Existing tables:', result.recordset.map(r => r.TABLE_NAME));
        process.exit(0);
    } catch (error) {
        console.error('Error:', error.message);
        console.error('Stack:', error.stack);
        process.exit(1);
    }
}

checkTables();
