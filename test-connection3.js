const sql = require('mssql');

const connectionString = "Server=WAIN05260\\SQLEXPRESS;Database=gec_graphics_book;Trusted_Connection=Yes;TrustServerCertificate=True;";

async function testConnection() {
    try {
        console.log('Connection string:', connectionString);
        console.log('Attempting to connect to SQL Server...');
        await sql.connect(connectionString);
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
