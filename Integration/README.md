# External Integration Examples

This directory will contain examples for integrating MikoPBX with third-party services and systems.

## What is External Integration?

External integration allows MikoPBX to communicate with:
- CRM systems (Salesforce, HubSpot, etc.)
- Helpdesk platforms (Zendesk, Freshdesk, etc.)
- Messaging services (Slack, Telegram, etc.)
- Webhooks and HTTP APIs
- Custom SIP providers
- Business intelligence tools
- Payment gateways
- And more...

## Integration Patterns

### Pattern 1: Outbound Webhooks
MikoPBX sends events to external service via HTTP POST.

**Use cases**:
- Notify CRM of incoming/outgoing calls
- Send call recordings to cloud storage
- Update helpdesk tickets
- Post call events to Slack

### Pattern 2: Inbound API
External service calls MikoPBX REST API to trigger actions.

**Use cases**:
- Click-to-call from CRM
- Programmatic call origination
- Configuration management
- Status queries

### Pattern 3: Bidirectional Sync
Continuous synchronization between systems.

**Use cases**:
- Contact synchronization
- Call history sync
- Real-time presence updates
- Configuration backup/restore

### Pattern 4: Custom SIP Provider
Integration with specific SIP trunk provider features.

**Use cases**:
- Provider-specific authentication
- Custom header handling
- Specialized routing
- Provider API integration

## Coming Soon Examples

### ModuleExampleCRM
Complete CRM integration example demonstrating:
- Contact synchronization
- Call event webhooks
- Click-to-call functionality
- Call recording attachment
- Real-time notifications

### ModuleExampleWebhook
Generic webhook integration showing:
- Configurable HTTP endpoints
- Event filtering
- Retry logic and error handling
- Payload customization
- Authentication methods

### ModuleExampleSIP
Custom SIP provider integration featuring:
- Provider-specific configuration
- Authentication handling
- Custom dialplan rules
- Provider API calls
- Failover logic

## Integration Architecture

### Event Sources
Events that can trigger integrations:
- **Call Events**: New call, answered, hangup
- **System Events**: Configuration changes, service restarts
- **User Events**: Login, settings changes
- **CDR Events**: Call detail record created
- **Custom Events**: Module-specific triggers

### Communication Methods
- **HTTP/HTTPS** - REST API calls, webhooks
- **WebSocket** - Real-time bidirectional
- **AMQP** - Message queue integration
- **Database** - Direct DB sync
- **File-based** - CSV/JSON export/import

### Authentication Patterns
- **API Keys** - Simple token-based
- **OAuth 2.0** - Delegated authorization
- **JWT** - Stateless tokens
- **Basic Auth** - Username/password
- **Custom** - Provider-specific

## Best Practices

### ✅ DO
- Use async workers for external API calls
- Implement proper error handling and retries
- Add rate limiting to prevent API abuse
- Log all integration activities
- Store credentials securely
- Validate external data before processing
- Implement timeout mechanisms
- Add circuit breaker pattern for unstable services

### ❌ DON'T
- Don't make blocking HTTP calls in request handlers
- Don't store credentials in plain text
- Don't ignore API rate limits
- Don't skip input validation from external sources
- Don't assume external service is always available
- Don't expose sensitive data in webhooks
- Don't ignore SSL certificate validation

## Security Considerations

### Credential Storage
```php
// Store encrypted credentials
$this->di->get('config')->set('module_api_key',
    $this->di->get('crypt')->encrypt($apiKey)
);
```

### Webhook Validation
```php
// Validate webhook signatures
$signature = hash_hmac('sha256', $payload, $secret);
if (!hash_equals($signature, $receivedSignature)) {
    throw new SecurityException('Invalid signature');
}
```

### Input Sanitization
```php
// Sanitize external data
$data = $this->filter->sanitize($externalData, 'string');
```

## Common Integration Scenarios

### Scenario 1: CRM Call Popup
When call arrives, show caller info from CRM in agent's browser.

**Components**:
- AMI event listener for new calls
- CRM API lookup
- WebSocket push to browser
- JavaScript popup display

### Scenario 2: Call Recording Upload
After call ends, upload recording to cloud storage.

**Components**:
- CDR event trigger
- File conversion worker
- Cloud storage API
- Database update

### Scenario 3: Click-to-Call
User clicks phone number in CRM, call is initiated.

**Components**:
- CRM webhook receiver
- REST API authentication
- AMI call origination
- Status callback to CRM

## Testing Integrations

### Mock External Services
```php
// Use mock service in tests
if ($this->config->get('test_mode')) {
    $api = new MockCRMApi();
} else {
    $api = new RealCRMApi();
}
```

### Webhook Testing Tools
- **RequestBin** - Capture webhook payloads
- **ngrok** - Expose local dev server
- **Postman** - Test API calls
- **curl** - Command-line testing

## Related Documentation

- [MikoPBX REST API](../../src/PBXCoreREST/CLAUDE.md)
- [Worker Development](../Workers/README.md)
- [AMI Integration](../AMI/README.md)

---

**Status**: Examples coming soon. Check back for updates!
