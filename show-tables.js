const sql = require('mssql');

const config = {
    server: 'localhost\\SQLEXPRESS',
    database: 'gec_graphics_book',
    options: {
        trustServerCertificate: true,
        trustedConnection: true
    }
};

async function showTables() {
    try {
        await sql.connect(config);
        
        // Query for tables and their columns
        const result = await sql.query(`
            SELECT 
                t.TABLE_NAME,
                c.COLUMN_NAME,
                c.DATA_TYPE,
                c.CHARACTER_MAXIMUM_LENGTH,
                c.IS_NULLABLE,
                c.COLUMN_DEFAULT
            FROM 
                INFORMATION_SCHEMA.TABLES t
                JOIN INFORMATION_SCHEMA.COLUMNS c ON t.TABLE_NAME = c.TABLE_NAME
            WHERE 
                t.TABLE_TYPE = 'BASE TABLE'
            ORDER BY 
                t.TABLE_NAME, c.ORDINAL_POSITION;
        `);
        
        console.log('Database Tables and Columns:');
        console.log('============================');
        
        let currentTable = '';
        result.recordset.forEach(row => {
            if (currentTable !== row.TABLE_NAME) {
                currentTable = row.TABLE_NAME;
                console.log(`\n${currentTable}:`);
                console.log('-----------------');
            }
            console.log(`${row.COLUMN_NAME} (${row.DATA_TYPE}${row.CHARACTER_MAXIMUM_LENGTH ? `(${row.CHARACTER_MAXIMUM_LENGTH})` : ''}) ${row.IS_NULLABLE === 'YES' ? 'NULL' : 'NOT NULL'} ${row.COLUMN_DEFAULT ? `DEFAULT ${row.COLUMN_DEFAULT}` : ''}`);
        });

    } catch (err) {
        console.error('Error:', err);
    } finally {
        await sql.close();
    }
}

showTables();
