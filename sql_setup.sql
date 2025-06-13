-- Create the database if it doesn't exist
IF NOT EXISTS (SELECT name FROM master.dbo.sysdatabases WHERE name = N'gec_graphics_book')
BEGIN
    CREATE DATABASE [gec_graphics_book]
END
GO

USE [gec_graphics_book]
GO

-- Create Products table if it doesn't exist
IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='Products' AND xtype='U')
BEGIN
    CREATE TABLE Products (
        Id INT IDENTITY(1,1) PRIMARY KEY,
        Title NVARCHAR(255) NOT NULL,
        Description NVARCHAR(MAX),
        Category NVARCHAR(100) NOT NULL,
        Type NVARCHAR(100) NOT NULL,
        Subcategory NVARCHAR(100) NOT NULL,
        Hours INT DEFAULT 12,
        ImageData VARBINARY(MAX),
        ImageName NVARCHAR(255),
        ImageContentType NVARCHAR(100),
        CreatedAt DATETIME DEFAULT GETDATE(),
        FolderId NVARCHAR(100)
    )
END
GO

-- Create index for faster queries
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_Products_Category_Type_Subcategory')
BEGIN
    CREATE INDEX IX_Products_Category_Type_Subcategory
    ON Products(Category, Type, Subcategory)
END
GO

-- Create Folders table if it doesn't exist
IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='Folders' AND xtype='U')
BEGIN
    CREATE TABLE Folders (
        Id NVARCHAR(100) PRIMARY KEY,
        Name NVARCHAR(255) NOT NULL,
        CreatedAt DATETIME DEFAULT GETDATE()
    )
END
GO

-- Create Orders table if it doesn't exist
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
GO

-- Create OrderItems table if it doesn't exist
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
GO