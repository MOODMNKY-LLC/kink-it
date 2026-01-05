# Discord Bot Permission Calculator

## Quick Reference

### Permission Values (Decimal)

| Permission | Decimal Value | Hex Value |
|------------|--------------|-----------|
| View Channels | 1024 | 0x400 |
| Read Message History | 65536 | 0x10000 |
| Send Messages | 2048 | 0x800 |
| Manage Webhooks | 536870912 | 0x20000000 |
| Embed Links | 16384 | 0x4000 |
| Attach Files | 32768 | 0x8000 |

### Permission Combinations

#### Minimum Required (Notifications Only)
```
View Channels (1024) + Send Messages (2048) + Read Message History (65536)
= 68608 (decimal)
= 0x10C00 (hex)
```

#### Recommended (Full Functionality)
```
View Channels (1024) + Send Messages (2048) + Read Message History (65536) + 
Manage Webhooks (536870912) + Embed Links (16384) + Attach Files (32768)
= 536951424 (decimal)
= 0x20010C00 (hex)
```

## Online Calculator

You can also use Discord's OAuth2 URL Generator in the Developer Portal, which automatically calculates the permission integer when you select permissions.

## Manual Calculation

To calculate manually, add the decimal values:

```javascript
const permissions = {
  VIEW_CHANNELS: 1024,
  SEND_MESSAGES: 2048,
  READ_MESSAGE_HISTORY: 65536,
  MANAGE_WEBHOOKS: 536870912,
  EMBED_LINKS: 16384,
  ATTACH_FILES: 32768,
}

// Minimum
const minimum = permissions.VIEW_CHANNELS + 
                permissions.SEND_MESSAGES + 
                permissions.READ_MESSAGE_HISTORY
// = 68608

// Recommended
const recommended = minimum + 
                   permissions.MANAGE_WEBHOOKS + 
                   permissions.EMBED_LINKS + 
                   permissions.ATTACH_FILES
// = 536951424
```

## Verify in OAuth2 URL

Your OAuth2 URL should include the permission integer:

```
https://discord.com/api/oauth2/authorize?client_id=YOUR_CLIENT_ID&permissions=536951424&scope=bot
```

Replace `536951424` with your calculated permission integer.


