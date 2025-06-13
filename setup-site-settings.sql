-- Create SiteSettings table if it doesn't exist
USE [gec_graphics_book]
GO

IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='SiteSettings' AND xtype='U')
BEGIN
    CREATE TABLE SiteSettings (
        Id INT IDENTITY(1,1) PRIMARY KEY,
        SettingKey NVARCHAR(100) NOT NULL UNIQUE,
        SettingValue NVARCHAR(MAX),
        CreatedAt DATETIME DEFAULT GETDATE(),
        UpdatedAt DATETIME DEFAULT GETDATE()
    )

    -- Insert default scrolling message
    INSERT INTO SiteSettings (SettingKey, SettingValue)
    VALUES ('scrollingMessage', 'This is a scrolling message and the message is scrolling This is a scrolling message and the message is scrolling This is a scrolling message and the message is scrolling')
END
GO
