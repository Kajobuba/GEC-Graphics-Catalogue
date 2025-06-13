Import-Module SQLPS -DisableNameChecking
$smo = 'Microsoft.SqlServer.Management.Smo.'
$wmi = new-object ($smo + 'Wmi.ManagedComputer')
$uri = "ManagedComputer[@Name='$env:COMPUTERNAME']/ServerInstance[@Name='SQLEXPRESS']/ServerProtocol[@Name='Tcp']"
$Tcp = $wmi.GetSmoObject($uri)
$IpAll = $Tcp.IPAddresses | Where-Object { $_.Name -eq 'IPAll' }
Write-Host "TCP Enabled:", $Tcp.IsEnabled
Write-Host "TCP Dynamic Ports:", $IpAll.IPAddressProperties | Where-Object { $_.Name -eq 'TcpDynamicPorts' } | Select-Object Value
Write-Host "TCP Port:", $IpAll.IPAddressProperties | Where-Object { $_.Name -eq 'TcpPort' } | Select-Object Value
