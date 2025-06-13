const sql = require('mssql/msnodesqlv8');

const config = {
    driver: 'msnodesqlv8',
    server: '(local)\\SQLEXPRESS',
    database: 'gec_graphics_book',
    options: {
        trustedConnection: true,
        enableArithAbort: true,
        trustServerCertificate: true,
        driver: 'ODBC Driver 18 for SQL Server'
    }
};

async function testConnection() {
    try {
        console.log('Config:', JSON.stringify(config, null, 2));
        console.log('Attempting to connect to SQL Server...');
        const pool = await sql.connect(config);
        console.log('Connected to SQL Server');
        const result = await pool.request().query('SELECT @@VERSION as version');
        console.log('SQL Server version:', result.recordset[0].version);
        await sql.close();
        console.log('Connection closed');
    } catch (err) {
        console.error('Error details:', {
            message: err.message,
            code: err.code,
            state: err.state,
            originalError: err.originalError,
            stack: err.stack
        });
        throw err;
    }
}

testConnection().catch(console.error);
