# Dialplan Customization Examples

This directory will contain examples for customizing Asterisk dialplan in MikoPBX modules.

## What is Dialplan?

**Dialplan** is Asterisk's call routing and control logic. It defines:
- How calls are routed
- What happens when someone dials a number
- IVR menus and voice prompts
- Call forwarding and transfer logic
- Voicemail handling
- Conference rooms
- And all other call flow logic

In MikoPBX, dialplan is generated dynamically from configuration and can be extended by modules.

## Dialplan Extension Points

Modules can inject custom dialplan at various stages:

### 1. **Before Routing** (`beforeInternalRoute`)
Execute logic before MikoPBX processes incoming call.

**Use cases**:
- Custom caller ID lookup
- Blacklist/whitelist checking
- Call recording setup
- Custom variables

### 2. **After Routing** (`afterInternalRoute`)
Execute logic after MikoPBX determines call destination.

**Use cases**:
- Pre-answer announcements
- Call screening
- Time-based routing
- Custom forwarding logic

### 3. **Custom Contexts**
Create entirely new dialplan contexts.

**Use cases**:
- Custom IVR menus
- Special number ranges
- External integrations
- AGI applications

## Coming Soon Examples

### ModuleExampleIVR
Complete IVR menu example demonstrating:
- Multi-level menu structure
- DTMF input handling
- Text-to-speech integration
- Database-driven menus
- Timeout and invalid input handling

### ModuleExampleRouting
Advanced call routing scenarios:
- Time-based routing (business hours)
- Skill-based routing
- Geographic routing
- Load balancing
- Failover handling

### ModuleExampleAGI
Asterisk Gateway Interface examples:
- PHP AGI script basics
- Database queries during call
- External API calls
- Dynamic call control
- TTS and speech recognition

## Dialplan Syntax Basics

### Example Context
```asterisk
[custom-context]
exten => _X.,1,NoOp(Call to ${EXTEN})
    same => n,Set(CALLERID(name)=Custom Name)
    same => n,Dial(PJSIP/${EXTEN})
    same => n,Hangup()
```

### Common Applications
- **Dial()** - Connect to destination
- **Playback()** - Play audio file
- **VoiceMail()** - Send to voicemail
- **Queue()** - Place in call queue
- **Goto()** - Jump to another context
- **GotoIf()** - Conditional branching
- **Set()** - Set channel variable
- **AGI()** - Execute AGI script

## MikoPBX Dialplan Generation

MikoPBX generates dialplan in stages:

### Stage 1: Pre-generate
Modules prepare data needed for dialplan generation.

### Stage 2: Generate
Core generates base dialplan from configuration.

### Stage 3: Post-generate
Modules inject custom dialplan snippets.

### Module Hook Example
```php
public function generateDialplan(): string
{
    $conf = "[custom-context]\n";
    $conf .= "exten => 777,1,NoOp(Custom extension)\n";
    $conf .= "  same => n,Playback(hello-world)\n";
    $conf .= "  same => n,Hangup()\n";
    return $conf;
}
```

## Best Practices

### ✅ DO
- Use meaningful context names
- Add NoOp() for debugging/logging
- Handle all possible call outcomes
- Set appropriate timeouts
- Validate DTMF input
- Use channel variables for data passing
- Document complex logic
- Test edge cases thoroughly

### ❌ DON'T
- Don't create dialplan loops
- Don't forget hangup handling
- Don't hardcode phone numbers
- Don't skip error handling
- Don't ignore security (toll fraud)
- Don't create unreachable code
- Don't use deprecated applications

## Common Dialplan Patterns

### Pattern 1: IVR Menu
```asterisk
[ivr-main]
exten => s,1,Answer()
    same => n,Set(TIMEOUT(digit)=5)
    same => n,Set(TIMEOUT(response)=10)
    same => n(menu),Background(main-menu)
    same => n,WaitExten()

exten => 1,1,Goto(sales,s,1)
exten => 2,1,Goto(support,s,1)
exten => 3,1,Goto(operator,s,1)

exten => i,1,Playback(invalid)
    same => n,Goto(s,menu)

exten => t,1,Playback(timeout)
    same => n,Goto(s,menu)
```

### Pattern 2: Time-Based Routing
```asterisk
[time-routing]
exten => _X.,1,NoOp(Time-based routing)
    same => n,GotoIfTime(9:00-17:00,mon-fri,*,*?open,${EXTEN},1)
    same => n,Goto(closed,${EXTEN},1)

[open]
exten => _X.,1,Dial(PJSIP/${EXTEN})

[closed]
exten => _X.,1,Playback(closed)
    same => n,VoiceMail(${EXTEN})
```

### Pattern 3: Call Screening
```asterisk
[screening]
exten => _X.,1,NoOp(Screening call from ${CALLERID(num)})
    same => n,AGI(check-blacklist.php,${CALLERID(num)})
    same => n,GotoIf($["${BLACKLISTED}" = "1"]?blocked:allowed)
    same => n(blocked),Playback(ss-noservice)
    same => n,Hangup()
    same => n(allowed),Dial(PJSIP/${EXTEN})
```

## Variables and Functions

### Channel Variables
```asterisk
${EXTEN}          - Dialed extension
${CALLERID(num)}  - Caller ID number
${CALLERID(name)} - Caller ID name
${CHANNEL}        - Channel name
${UNIQUEID}       - Unique call ID
```

### Dialplan Functions
```asterisk
${DB(family/key)}           - Database lookup
${IFTIME()}                 - Time condition
${FILTER()}                 - Filter characters
${TOUPPER()}                - Convert to uppercase
${LEN()}                    - String length
```

## AGI Integration

### PHP AGI Script Template
```php
#!/usr/bin/php
<?php
require_once 'phpagi.php';

$agi = new AGI();

// Read variables
$extension = $agi->get_variable('EXTEN');
$callerid = $agi->get_variable('CALLERID(num)');

// Execute logic
$result = performLookup($callerid);

// Set variables
$agi->set_variable('LOOKUP_RESULT', $result);

// Execute dialplan commands
$agi->exec('Playback', 'hello-world');
```

## Security Considerations

### Prevent Toll Fraud
- Restrict international dialing
- Implement rate limiting
- Monitor unusual call patterns
- Require authentication for costly operations
- Use separate contexts for different privilege levels

### Input Validation
```asterisk
; Validate extension format
exten => _X.,1,NoOp(Validating ${EXTEN})
    same => n,GotoIf($[${LEN(${EXTEN})} > 10]?invalid:valid)
    same => n(invalid),Playback(invalid)
    same => n,Hangup()
    same => n(valid),Dial(PJSIP/${EXTEN})
```

## Testing Dialplan

### Dialplan Validation
```bash
# Check syntax
asterisk -rx "dialplan show"

# Reload dialplan
asterisk -rx "dialplan reload"

# Show specific context
asterisk -rx "dialplan show custom-context"
```

### Call Testing
```bash
# Originate test call
asterisk -rx "channel originate Local/777@custom-context application Playback hello-world"
```

## Related Documentation

- [Asterisk Dialplan](https://docs.asterisk.org/Configuration/Dialplan/)
- [Asterisk Applications](https://docs.asterisk.org/Asterisk_18_Documentation/API_Documentation/Dialplan_Applications/)
- [Asterisk Functions](https://docs.asterisk.org/Asterisk_18_Documentation/API_Documentation/Dialplan_Functions/)
- [MikoPBX Asterisk Integration](../../src/Core/Asterisk/CLAUDE.md)
- [AGI Examples](https://github.com/asterisk/agi-examples)

---

**Status**: Examples coming soon. Check back for updates!
