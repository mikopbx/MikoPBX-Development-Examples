# AMI Integration Examples

This directory contains examples demonstrating integration with **Asterisk Manager Interface (AMI)** in MikoPBX modules.

## What is AMI?

**Asterisk Manager Interface (AMI)** is a system monitoring and management interface provided by Asterisk. It allows you to:

- Monitor call events in real-time
- Originate calls programmatically
- Retrieve system status and statistics
- Control call flow and channels
- Execute Asterisk CLI commands
- Subscribe to events (call start, hangup, DTMF, etc.)

## Available Examples

### [ModuleExampleAmi](ModuleExampleAmi/) - Basic AMI Usage
**Status**: ✅ Production-ready

Complete example demonstrating core AMI operations:

**Features**:
- ✅ Connect to Asterisk AMI
- ✅ Send AMI actions/commands
- ✅ Handle AMI responses
- ✅ Subscribe to AMI events
- ✅ Originate calls
- ✅ Retrieve channel status
- ✅ Error handling and reconnection

**Use when**: You need to integrate with Asterisk for call control or monitoring

---

## Quick Start

### 1. Study the Example

```bash
cd ModuleExampleAmi
cat README.md
```

### 2. Key Components

The example demonstrates:
- `BeanstalkClient` usage for AMI communication
- Event subscription and handling
- Originate call requests
- Status queries
- Best practices for error handling

### 3. Copy to Your Module

Use the AMI integration patterns in your own module.

## Common Use Cases

### "I need to monitor call events in real-time"
→ [ModuleExampleAmi](ModuleExampleAmi/) shows event subscription

### "I want to originate calls programmatically"
→ [ModuleExampleAmi](ModuleExampleAmi/) demonstrates call origination

### "I need to check channel status"
→ [ModuleExampleAmi](ModuleExampleAmi/) includes status queries

### "I want to execute Asterisk CLI commands"
→ [ModuleExampleAmi](ModuleExampleAmi/) shows command execution

## AMI Architecture in MikoPBX

MikoPBX provides a wrapper around AMI with the following benefits:

1. **Automatic Reconnection** - Handles connection drops gracefully
2. **Event Queue** - Beanstalkd-based event processing
3. **Async Processing** - Non-blocking event handling
4. **Error Recovery** - Built-in retry logic
5. **Integration** - Seamless integration with module lifecycle

## Best Practices

### ✅ DO

- Use `BeanstalkClient` for reliable AMI communication
- Handle events asynchronously in background workers
- Implement proper error handling and timeouts
- Subscribe only to events you actually need
- Clean up subscriptions when module is disabled

### ❌ DON'T

- Don't block the main thread waiting for AMI responses
- Don't subscribe to all events (performance impact)
- Don't forget to handle connection failures
- Don't make synchronous AMI calls in HTTP request handlers
- Don't ignore AMI errors

## Event Types

Common AMI events you can subscribe to:

- **Newchannel** - New call channel created
- **Hangup** - Call ended
- **NewConnectedLine** - Caller ID updated
- **DTMF** - DTMF digit pressed
- **Hold** - Call on hold
- **Unhold** - Call resumed from hold
- **Bridge** - Two channels bridged
- **VarSet** - Channel variable changed
- **UserEvent** - Custom user events

See [Asterisk AMI Events](https://docs.asterisk.org/Asterisk_18_Documentation/API_Documentation/AMI_Events/) for full list.

## AMI Actions

Common AMI actions you can execute:

- **Originate** - Initiate a call
- **Hangup** - Terminate a call
- **Status** - Get channel status
- **Command** - Execute CLI command
- **Redirect** - Transfer a call
- **Setvar** - Set channel variable
- **Park** - Park a call
- **Bridge** - Bridge two channels

See [Asterisk AMI Actions](https://docs.asterisk.org/Asterisk_18_Documentation/API_Documentation/AMI_Actions/) for full list.

## Integration Patterns

### Pattern 1: Event Listener
Subscribe to events and process them asynchronously.

**Example**: CDR processing, call logging, webhooks

### Pattern 2: Call Control
Originate calls and control call flow.

**Example**: Click-to-call, automated dialing, IVR navigation

### Pattern 3: Status Monitoring
Query system status and channel information.

**Example**: Dashboard widgets, real-time statistics

## Related Documentation

- [Asterisk AMI Documentation](https://docs.asterisk.org/Configuration/Interfaces/Asterisk-Manager-Interface-AMI/)
- [MikoPBX Development Docs](https://github.com/mikopbx/DevelopementDocs)
- [MikoPBX Core Workers](https://github.com/mikopbx/Core/tree/develop/src/Core/Workers)

## Coming Soon

- **ModuleExampleCDR** - Advanced CDR processing with AMI
- **ModuleExampleEventListener** - Real-time event processing patterns
- **ModuleExampleCallControl** - Advanced call control scenarios

---

⭐ **TL;DR**: Use [ModuleExampleAmi](ModuleExampleAmi/) to learn AMI integration basics
