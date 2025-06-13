require('dotenv').config();
const express = require('express');
const app = express();
const path = require('path');
const fileUpload = require('express-fileupload');
const cors = require('cors');
const db = require('./js/db-connection');

// Middleware
app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.originalUrl}`);
    next();
});
app.use(cors());
app.use(express.static(__dirname));
app.use(fileUpload());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Test database connection with retry
async function testConnection(retries = 3) {
    for (let i = 0; i < retries; i++) {
        try {
            console.log(`Attempting to connect to SQL Server (attempt ${i + 1}/${retries})...`);
            await db.connect();
            
            // Check SQL Server version
            const versionResult = await db.query('SELECT @@VERSION as version');
            console.log('SQL Server version:', versionResult.recordset[0].version);
              // Check if required tables exist
            const tablesResult = await db.query(`
                SELECT TABLE_NAME 
                FROM INFORMATION_SCHEMA.TABLES 
                WHERE TABLE_TYPE = 'BASE TABLE'
                AND TABLE_NAME IN ('Products', 'Folders', 'Orders', 'OrderItems', 'SiteSettings')
            `);
            
            const existingTables = tablesResult.recordset.map(r => r.TABLE_NAME);
            console.log('Found tables:', existingTables.join(', '));
            
            if (!existingTables.includes('Folders')) {
                console.error('Folders table is missing! Please run sql_setup.sql first.');
                return false;
            }
            
            if (!existingTables.includes('SiteSettings')) {
                console.log('SiteSettings table missing. Creating it...');
                try {
                    await db.query(`
                        CREATE TABLE SiteSettings (
                            [Key] NVARCHAR(100) PRIMARY KEY,
                            Value NVARCHAR(MAX) NOT NULL,
                            UpdatedAt DATETIME DEFAULT GETDATE()
                        )
                    `);
                    
                    // Insert default scrolling message
                    await db.query(`
                        INSERT INTO SiteSettings ([Key], Value)
                        VALUES ('scrolling_message', 'Welcome to GEC - Global Engineering Center. We provide quality engineering services.')
                    `);
                    
                    console.log('SiteSettings table created successfully.');
                } catch (createError) {
                    console.error('Error creating SiteSettings table:', createError);
                }
            }
            
            if (!existingTables.includes('Orders') || !existingTables.includes('OrderItems')) {
                console.log('Orders or OrderItems table missing. Creating them...');
                try {
                    // Create Orders table
                    await db.query(`
                        IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='Orders' AND xtype='U')
                        BEGIN
                            CREATE TABLE Orders (
                                Id INT IDENTITY(1,1) PRIMARY KEY,
                                CustomerEmail NVARCHAR(255) NOT NULL,
                                CustomerName NVARCHAR(255) NOT NULL,
                                Branch NVARCHAR(100) NOT NULL,
                                DeliveryDate DATE NOT NULL,
                                SharedLink NVARCHAR(MAX),
                                Remarks NVARCHAR(MAX),
                                TotalHours INT NOT NULL,
                                CreatedAt DATETIME DEFAULT GETDATE()
                            )
                        END
                    `);
                    
                    // Create OrderItems table
                    await db.query(`
                        IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='OrderItems' AND xtype='U')
                        BEGIN
                            CREATE TABLE OrderItems (
                                Id INT IDENTITY(1,1) PRIMARY KEY,
                                OrderId INT NOT NULL,
                                ProductId INT NOT NULL,
                                Quantity INT NOT NULL,
                                Hours INT NOT NULL,
                                FOREIGN KEY (OrderId) REFERENCES Orders(Id),
                                FOREIGN KEY (ProductId) REFERENCES Products(Id)
                            )
                        END
                    `);
                    
                    console.log('Orders and OrderItems tables created successfully.');
                } catch (createError) {
                    console.error('Error creating tables:', createError);
                }
            }
            
            return true;
        } catch (err) {
            console.error(`Database connection error (attempt ${i + 1}/${retries}):`, err);
            if (i < retries - 1) {
                console.log('Retrying in 5 seconds...');
                await new Promise(resolve => setTimeout(resolve, 5000));
            }
        }
    }
    return false;
}

// Global error handler
app.use((err, req, res, next) => {
    console.error('Global error:', err);
    res.status(500).json({ 
        success: false, 
        message: 'Internal server error',
        error: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
});

// Favicon handler
app.get('/favicon.ico', (req, res) => {
    res.status(204).end();
});

// API endpoints
app.get('/api/products', async (req, res) => {
    try {
        console.log('Fetching products with folder information');
        const result = await db.query(`
            SELECT p.Id, p.Title, p.Description, p.Category, p.Type, p.Subcategory, p.Hours, 
                   p.ImageData, p.ImageName, p.ImageContentType,
                   p.CreatedAt, p.FolderId, p.HoursVisible,
                   f.Name as FolderName
            FROM Products p
            LEFT JOIN Folders f ON p.FolderId = f.Id
            ORDER BY p.CreatedAt DESC
        `);
          const products = result.recordset.map(product => ({
            ...product,
            imageUrl: product.ImageData ? 
                'data:' + product.ImageContentType + ';base64,' + product.ImageData.toString('base64') 
                : null,
            hoursVisible: product.HoursVisible !== undefined ? Boolean(product.HoursVisible) : true
        }));
        
        res.json(products);
    } catch (err) {
        console.error('Error getting products:', err);
        res.status(500).json({ 
            success: false, 
            message: 'Error retrieving products',
            error: process.env.NODE_ENV === 'development' ? err.message : undefined
        });
    }
});

app.post('/api/upload-product', async (req, res) => {
    try {
        if (!req.files || !req.files.image) {
            return res.status(400).json({ success: false, message: 'No image uploaded' });
        }

        const { title, description, category, type, subcategory, hours, folderId } = req.body;
        const image = req.files.image;

        console.log('Uploading product with folder:', { title, folderId });

        await db.query(`
            INSERT INTO Products (Title, Description, Category, Type, Subcategory, Hours, ImageData, ImageName, ImageContentType, FolderId) 
            VALUES (@param0, @param1, @param2, @param3, @param4, @param5, @param6, @param7, @param8, @param9)
        `, [
            title, description, category, type, subcategory, parseInt(hours),
            image.data, image.name, image.mimetype, folderId || null
        ]);

        res.json({ success: true, message: 'Product uploaded successfully' });
    } catch (err) {
        console.error('Error uploading product:', err);
        res.status(500).json({ success: false, message: 'Error uploading product' });
    }
});

app.post('/api/bulk-upload', async (req, res) => {
    try {
        if (!req.files || !req.files.images) {
            return res.status(400).json({ success: false, message: 'No images uploaded' });
        }

        const { category, type, subcategory } = req.body;
        const products = JSON.parse(req.body.products);
        const images = Array.isArray(req.files.images) ? req.files.images : [req.files.images];

        if (products.length !== images.length) {
            return res.status(400).json({ 
                success: false, 
                message: 'Number of products does not match number of images' 
            });
        }

        try {
            for (let i = 0; i < products.length; i++) {
                const product = products[i];
                const image = images[i];
                
                await db.query(`
                    INSERT INTO Products (Title, Description, Category, Type, Subcategory, Hours, ImageData, ImageName, ImageContentType) 
                    VALUES (@param0, @param1, @param2, @param3, @param4, @param5, @param6, @param7, @param8)
                `, [
                    product.title, product.description, category, type, subcategory,
                    product.hours || 12, image.data, image.name, image.mimetype
                ]);
            }
            
            res.json({ success: true, message: 'Products uploaded successfully' });
        } catch (err) {
            throw err;
        }
    } catch (err) {
        console.error('Bulk upload error:', err);
        res.status(500).json({ 
            success: false, 
            message: 'Error uploading products', 
            error: err.message 
        });
    }
});

app.delete('/api/product/:id', async (req, res) => {
    try {
        await db.query('DELETE FROM Products WHERE Id = @param0', [req.params.id]);
        res.json({ success: true, message: 'Product deleted successfully' });
    } catch (err) {
        console.error('Error deleting product:', err);
        res.status(500).json({ success: false, message: 'Error deleting product' });
    }
});

// Remove duplicate logging middleware

// Update product endpoint
app.put('/api/product/:id', async (req, res) => {
    try {
        console.log('PUT endpoint for /api/product/:id triggered');
        console.log('Request params:', req.params);
        console.log('Request body:', req.body);
        
        const { Title, Description, Hours, hoursVisible, FolderId } = req.body;
        
        // Validate required fields
        if (!Title || !Description || Hours === undefined) {
            return res.status(400).json({ 
                success: false, 
                message: 'Missing required fields: Title, Description, and Hours are required',
                error: 'Validation error'
            });
        }
        
        console.log(`Updating product ${req.params.id}:`, req.body);
        
        // Build update query with indexed parameters - more robust approach
        let updateQuery = `
            UPDATE Products 
            SET Title = @param0, 
                Description = @param1, 
                Hours = @param2`;
        
        const params = [Title, Description, parseInt(Hours)];
        let paramIndex = 3;
        
        // Add hoursVisible to update if provided
        if (hoursVisible !== undefined) {
            updateQuery += `, HoursVisible = @param${paramIndex}`;
            params.push(hoursVisible ? 1 : 0);
            paramIndex++;
        }
        
        // Handle FolderId (allow null values)
        updateQuery += `, FolderId = @param${paramIndex}`;
        params.push(FolderId === '' ? null : FolderId);
        paramIndex++;
        
        updateQuery += ` WHERE Id = @param${paramIndex}`;
        params.push(parseInt(req.params.id));
        
        console.log('Executing query:', updateQuery);
        console.log('With params:', params);
        console.log('Params type check:', Array.isArray(params), params.length);
        
        // Validate params before calling query
        if (!Array.isArray(params)) {
            console.error('Params is not an array:', typeof params, params);
            return res.status(500).json({
                success: false,
                message: 'Internal server error: Invalid parameters format'
            });
        }
        
        // Execute the query with indexed parameters
        const result = await db.query(updateQuery, params);
        console.log('Query executed successfully:', result);
        
        res.json({ 
            success: true, 
            message: 'Product updated successfully',
            productId: req.params.id
        });
    } catch (err) {
        console.error('Error updating product:', err);
        console.error('Error stack:', err.stack);
        res.status(500).json({
            success: false, 
            message: 'Error updating product',
            error: err.message
        });
    }
});

// Folder API endpoints
app.get('/api/folders', async (req, res) => {
    try {
        const result = await db.query('SELECT * FROM Folders ORDER BY CreatedAt DESC');
        // Normalize property names to match frontend expectations
        const folders = result.recordset.map(folder => ({
            id: folder.Id,
            name: folder.Name,
            createdAt: folder.CreatedAt
        }));
        res.json(folders);
    } catch (err) {
        console.error('Error getting folders:', err);
        res.status(500).json({ error: err.message });
    }
});

app.post('/api/folders', async (req, res) => {
    try {
        const { id, name } = req.body;
        
        if (!name || name.trim() === '') {
            return res.status(400).json({ success: false, error: 'Folder name is required' });
        }

        // Check for duplicate names
        const existingFolder = await db.query('SELECT Id FROM Folders WHERE Name = @param0', [name.trim()]);
        if (existingFolder.recordset.length > 0) {
            return res.status(400).json({ success: false, error: 'A folder with this name already exists' });
        }

        // Insert new folder
        await db.query(`
            INSERT INTO Folders (Id, Name, CreatedAt) 
            VALUES (@param0, @param1, GETDATE())`, 
            [id, name.trim()]
        );

        res.json({ success: true, message: 'Folder created successfully' });
    } catch (err) {
        console.error('Error creating folder:', err);
        res.status(500).json({ success: false, error: err.message });
    }
});

app.put('/api/folders/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { name } = req.body;
        await db.query('UPDATE Folders SET Name = @param1 WHERE Id = @param0', [id, name]);
        res.json({ success: true, message: 'Folder updated successfully' });
    } catch (err) {
        console.error('Error updating folder:', err);
        res.status(500).json({ error: err.message });
    }
});

app.delete('/api/folders/:id', async (req, res) => {
    try {
        const { id } = req.params;
        
        // First, remove folder assignments from products
        await db.query('UPDATE Products SET FolderId = NULL WHERE FolderId = @param0', [id]);
        
        // Then delete the folder
        await db.query('DELETE FROM Folders WHERE Id = @param0', [id]);
        
        res.json({ success: true, message: 'Folder deleted successfully' });
    } catch (err) {
        console.error('Error deleting folder:', err);
        res.status(500).json({ error: err.message });
    }
});

// Update product folder endpoint
app.put('/api/products/:id/folder', async (req, res) => {
    try {
        const { id } = req.params;
        const { folderId } = req.body;
        await db.query('UPDATE Products SET FolderId = @param1 WHERE Id = @param0', [id, folderId]);
        res.json({ success: true, message: 'Product folder updated successfully' });
    } catch (err) {
        console.error('Error updating product folder:', err);
        res.status(500).json({ error: err.message });
    }
});

// Health check endpoint
app.get('/api/health', (req, res) => {
    res.json({ 
        status: 'OK', 
        timestamp: new Date().toISOString(),
        service: 'Website API'
    });
});

// Order API endpoints
app.post('/api/orders', async (req, res) => {
    try {
        console.log('Order request received:', JSON.stringify(req.body, null, 2));
        
        const { customerEmail, customerName, branch, deliveryDate, sharedLink, remarks, items } = req.body;
        
        // Validate required fields
        if (!customerEmail || !customerName || !branch || !deliveryDate || !items) {
            console.error('Missing required fields:', { customerEmail, customerName, branch, deliveryDate, items: items ? 'present' : 'missing' });
            return res.status(400).json({ 
                success: false, 
                message: 'Missing required fields' 
            });
        }
        
        if (!Array.isArray(items) || items.length === 0) {
            console.error('Items is not a valid array:', items);
            return res.status(400).json({ 
                success: false, 
                message: 'Items must be a non-empty array' 
            });
        }
        
        console.log('Processing order for:', customerEmail, 'with', items.length, 'items');
        
        // Calculate total hours (frontend sends 'hours' field instead of 'price')
        const totalHours = items.reduce((total, item) => {
            console.log('Processing item:', item);
            return total + (item.quantity * item.hours);
        }, 0);
        
        console.log('Total hours calculated:', totalHours);
        
        // Start a transaction
        const transaction = await db.transaction();
        
        try {
            // Insert order
            const orderResult = await transaction.request()
                .input('customerEmail', customerEmail)
                .input('customerName', customerName)
                .input('branch', branch)
                .input('deliveryDate', deliveryDate)
                .input('sharedLink', sharedLink)
                .input('remarks', remarks)
                .input('totalHours', totalHours)
                .query(`
                    INSERT INTO Orders 
                    (CustomerEmail, CustomerName, Branch, DeliveryDate, SharedLink, Remarks, TotalHours)
                    OUTPUT INSERTED.Id
                    VALUES 
                    (@customerEmail, @customerName, @branch, @deliveryDate, @sharedLink, @remarks, @totalHours)
                `);
            
            const orderId = orderResult.recordset[0].Id;
              // Insert order items
            for (const item of items) {
                await transaction.request()
                    .input('orderId', orderId)
                    .input('productId', item.productId)
                    .input('quantity', item.quantity)
                    .input('hours', item.hours)
                    .query(`
                        INSERT INTO OrderItems (OrderId, ProductId, Quantity, Hours)
                        VALUES (@orderId, @productId, @quantity, @hours)
                    `);
            }
            
            // Commit transaction
            await transaction.commit();
            
            res.json({ 
                success: true, 
                message: 'Order placed successfully',
                orderId: orderId
            });
        } catch (err) {
            await transaction.rollback();
            throw err;
        }
    } catch (err) {
        console.error('Error creating order:', err);
        res.status(500).json({ 
            success: false, 
            message: 'Error creating order',
            error: err.message
        });
    }
});

app.get('/api/orders', async (req, res) => {
    try {
        const result = await db.query(`
            SELECT 
                o.*,
                (
                    SELECT JSON_QUERY((
                        SELECT oi.Id as orderItemId,
                               oi.ProductId,
                               p.Title as productTitle,
                               oi.Quantity,
                               oi.Hours,
                               p.ImageData,
                               p.ImageContentType
                        FROM OrderItems oi
                        JOIN Products p ON oi.ProductId = p.Id
                        WHERE oi.OrderId = o.Id
                        FOR JSON PATH
                    ))
                ) as Items
            FROM Orders o
            ORDER BY o.CreatedAt DESC
        `);
        
        // Transform the results
        const orders = result.recordset.map(order => ({
            ...order,
            items: JSON.parse(order.Items || '[]').map(item => ({
                ...item,
                imageUrl: item.ImageData ? 
                    'data:' + item.ImageContentType + ';base64,' + item.ImageData.toString('base64') 
                    : null
            }))
        }));
        
        res.json(orders);
    } catch (err) {
        console.error('Error fetching orders:', err);
        res.status(500).json({ 
            success: false, 
            message: 'Error fetching orders',
            error: err.message
        });
    }
});

// Site Settings API Endpoints
app.get('/api/site-settings/scrolling-message', async (req, res) => {
    try {
        const result = await db.query(`
            SELECT Value as message FROM SiteSettings 
            WHERE [Key] = 'scrolling_message'
        `);
        
        if (result.recordset.length === 0) {
            // Return a default message if none exists
            return res.json({ success: true, message: 'Welcome to GEC - Global Engineering Center' });
        }
        
        res.json({ success: true, message: result.recordset[0].message });
    } catch (error) {
        console.error('Error fetching scrolling message:', error);
        res.status(500).json({ success: false, error: 'Internal server error' });
    }
});

app.put('/api/site-settings/scrolling-message', express.json(), async (req, res) => {
    const { message } = req.body;
    
    if (!message) {
        return res.status(400).json({ success: false, error: 'Message is required' });
    }
    
    try {
        const result = await db.query(`
            IF EXISTS (SELECT 1 FROM SiteSettings WHERE [Key] = 'scrolling_message')
                UPDATE SiteSettings 
                SET Value = @param0,
                    UpdatedAt = GETDATE()
                WHERE [Key] = 'scrolling_message'
            ELSE
                INSERT INTO SiteSettings ([Key], Value, UpdatedAt)
                VALUES ('scrolling_message', @param0, GETDATE())
        `, [message]);
        
        res.json({ success: true, message: 'Scrolling message updated successfully' });
    } catch (error) {
        console.error('Error updating scrolling message:', error);
        res.status(500).json({ success: false, error: 'Internal server error' });
    }
});

// Graceful shutdown
process.on('SIGTERM', async () => {
    console.log('Received SIGTERM. Closing database connection...');
    try {
        await db.close();
        console.log('Database connection closed successfully');
        process.exit(0);
    } catch (err) {
        console.error('Error closing database connection:', err);
        process.exit(1);
    }
});

// Initialize server after database connection
async function startServer() {
    const dbConnected = await testConnection();
    if (!dbConnected) {
        console.error('Failed to connect to database after multiple attempts');
        process.exit(1);
    }
    
    const PORT = process.env.PORT || 3000;
    const HOST = '0.0.0.0';  // Listen on all network interfaces

    const server = app.listen(PORT, HOST, () => {
        console.log(`Server running on http://${HOST}:${PORT}`);
    });

    server.on('error', (error) => {
        if (error.code === 'EADDRINUSE') {
            console.error(`Port ${PORT} is already in use. Please choose a different port or stop the other process.`);
        } else {
            console.error('Server error:', error);
        }
        process.exit(1);
    });

    process.on('uncaughtException', async (error) => {
        console.error('Uncaught Exception:', error);
        // Graceful shutdown
        await db.close();
        server.close(() => {
            console.log('Server closed due to error');
            process.exit(1);
        });
    });
}

startServer();
