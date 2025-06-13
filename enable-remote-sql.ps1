# Enable TCP/IP protocol
$smo = 'Microsoft.SqlServer.Management.Smo.'
$wmi = new-object ($smo + 'Wmi.ManagedComputer')
$uri = "ManagedComputer[@Name='WAIN05260']/ ServerInstance[@Name='SQLEXPRESS']/ServerProtocol[@Name='Tcp']"
$Tcp = $wmi.GetSmoObject($uri)
$Tcp.IsEnabled = $true
$Tcp.Alter()

# Configure Windows Firewall
New-NetFirewallRule -DisplayName "SQL Server" -Direction Inbound -Protocol TCP -LocalPort 1433 -Action Allow
New-NetFirewallRule -DisplayName "SQL Server Browser" -Direction Inbound -Protocol UDP -LocalPort 1434 -Action Allow

# Configure Node.js server port
New-NetFirewallRule -DisplayName "Node.js Server" -Direction Inbound -Protocol TCP -LocalPort 3000 -Action Allow

Write-Host "Configuration complete. Please restart SQL Server for changes to take effect."
