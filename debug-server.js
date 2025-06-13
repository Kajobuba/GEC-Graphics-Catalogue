const express = require('express');
const app = express();

app.use(express.json());

app.post('/api/test-orders', (req, res) => {
    console.log('Received request body:', JSON.stringify(req.body, null, 2));
    
    try {
        const { customerEmail, customerName, branch, deliveryDate, sharedLink, remarks, items } = req.body;
        
        console.log('Extracted fields:');
        console.log('customerEmail:', customerEmail);
        console.log('customerName:', customerName);
        console.log('branch:', branch);
        console.log('deliveryDate:', deliveryDate);
        console.log('sharedLink:', sharedLink);
        console.log('remarks:', remarks);
        console.log('items:', items);
        
        if (!items || !Array.isArray(items)) {
            throw new Error('Items is not an array or is missing');
        }
        
        // Calculate total hours (frontend sends 'hours' field instead of 'price')
        const totalHours = items.reduce((total, item) => {
            console.log('Processing item:', item);
            console.log('Item quantity:', item.quantity, 'Item hours:', item.hours);
            return total + (item.quantity * item.hours);
        }, 0);
        
        console.log('Total hours calculated:', totalHours);
        
        res.json({ 
            success: true, 
            message: 'Test successful',
            totalHours: totalHours,
            itemCount: items.length
        });
        
    } catch (error) {
        console.error('Error in test endpoint:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Test failed',
            error: error.message
        });
    }
});

const port = 3001;
app.listen(port, () => {
    console.log(`Test server running at http://localhost:${port}`);
});
