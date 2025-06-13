const sql = require('mssql');

const config = {
    server: 'WAIN05260\\SQLEXPRESS',
    database: 'gec_graphics_book',
    authentication: {
        type: 'default',
        options: {
            trustedConnection: true
        }
    },
    options: {
        encrypt: false,
        trustServerCertificate: true,
        enableArithAbort: true,
        integratedSecurity: true
    }
};

async function testConnection() {
    try {
        console.log('Config:', JSON.stringify(config, null, 2));
        console.log('Attempting to connect to SQL Server...');
        await sql.connect(config);
        console.log('Connected successfully!');
        const result = await sql.query`SELECT @@VERSION AS Version`;
        console.log('SQL Server Version:', result.recordset[0].Version);
        await sql.close();
        console.log('Connection closed');
    } catch (err) {
        console.error('Error details:', {
            message: err.message,
            code: err.code,
            state: err.state,
            stack: err.stack
        });
    }
}

testConnection();
