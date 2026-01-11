# PowerShell script to send messages to Discord webhook
# Usage: .\send-discord-webhook.ps1 -WebhookUrl "URL" -Message "Your message"

param(
    [Parameter(Mandatory=$true)]
    [string]$WebhookUrl,
    
    [Parameter(Mandatory=$true)]
    [string]$Message
)

$body = @{
    content = $Message
} | ConvertTo-Json

try {
    $response = Invoke-RestMethod -Uri $WebhookUrl -Method POST -Body $body -ContentType 'application/json'
    Write-Host "Message sent successfully!" -ForegroundColor Green
} catch {
    Write-Host "Error sending message: $_" -ForegroundColor Red
    exit 1
}
