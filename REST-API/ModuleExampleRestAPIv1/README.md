# ModuleExampleRestAPIv1 - Pattern 1 (Simple Callback)

## Overview

This module demonstrates **Pattern 1: Simple Callback** - the simplest approach to REST API integration in MikoPBX modules.

Pattern 1 uses a single entry point method `moduleRestAPICallback()` that routes all API requests to appropriate handlers using simple match expressions.

**IMPORTANT UPDATE (2025)**: Pattern 1 now extends `ConfigClass` (not `PbxExtensionBase`) due to strict typing in MikoPBX core. ConfigClass already implements `RestAPIConfigInterface`, so `moduleRestAPICallback()` still works perfectly.

## What This Module Demonstrates

- ✅ Basic REST API integration via `moduleRestAPICallback()`
- ✅ Simple action routing with PHP 8 match expressions
- ✅ Request/response handling with PBXApiResult
- ✅ 4 example endpoints (check, status, reload, stats)
- ✅ UI with interactive API testing buttons
- ✅ Settings storage in database (Phalcon model)

## When to Use Pattern 1

**✅ Good for:**
- Simple modules with 3-5 API operations
- Quick prototypes and MVPs
- Internal tools and utilities
- Modules that don't need public documentation

**❌ Not suitable for:**
- Complex CRUD operations
- Modules requiring OpenAPI/Swagger documentation
- Advanced validation and schema requirements
- Production-ready public APIs

## Installation

### 1. Copy module to MikoPBX

```bash
cp -r ModuleExampleRestAPIv1 /storage/usbdisk1/mikopbx/custom_modules/
```

### 2. Install via Web UI

1. Navigate to **System** → **Modules**
2. Find "Example: REST API v1 (Legacy)"
3. Click **Install**
4. Enable the module

### 3. Access module page

Navigate to: `http://your-mikopbx/admin-cabinet/module-example-rest-apiv1/index`

## Testing the API

### Via Web UI

1. Open module page in admin cabinet
2. Click test buttons on the right panel:
   - **Check Status** - health check
   - **Get Status** - module settings and endpoints
   - **Reload Configuration** - trigger config reload
   - **Get Statistics** - usage metrics

3. View JSON responses in the response panel

### Via CURL

**Prerequisites:**
```bash
# Get authentication token
TOKEN=$(curl -X POST http://localhost/pbxcore/api/v3/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin"}' | jq -r '.data.accessToken')
```

**Check Status:**
```bash
curl -H "Authorization: Bearer $TOKEN" \
  http://localhost/pbxcore/api/modules/ModuleExampleRestAPIv1/check
```

**Get Status:**
```bash
curl -H "Authorization: Bearer $TOKEN" \
  http://localhost/pbxcore/api/modules/ModuleExampleRestAPIv1/status
```

**Reload Configuration:**
```bash
curl -X POST -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"force":true}' \
  http://localhost/pbxcore/api/modules/ModuleExampleRestAPIv1/reload
```

**Get Statistics:**
```bash
curl -H "Authorization: Bearer $TOKEN" \
  http://localhost/pbxcore/api/modules/ModuleExampleRestAPIv1/stats?period=today
```

## Pattern Explanation

### Architecture Flow

```
HTTP Request → RouterProvider → ModulesControllerBase
    ↓
ExampleRestAPIv1Conf::moduleRestAPICallback(array $request)
    ↓
match($request['action']) {
    'check'  => checkAction(),
    'status' => statusAction(),
    'reload' => reloadAction(),
    'stats'  => statsAction(),
}
    ↓
Return PBXApiResult
```

### Key Components

**1. Base Class (IMPORTANT - Updated 2025):**
```php
use MikoPBX\Modules\Config\ConfigClass;  // ← ConfigClass, not PbxExtensionBase!

class ExampleRestAPIv1Conf extends ConfigClass
{
    // ConfigClass implements RestAPIConfigInterface
    // moduleRestAPICallback() method works perfectly
}
```

**2. Single Entry Point:**
```php
public function moduleRestAPICallback(array $request): PBXApiResult
{
    $action = $request['action'] ?? '';
    $data   = $request['data'] ?? [];

    return match ($action) {
        'check' => $this->checkAction($data),
        // ... other actions
    };
}
```

**3. Request Structure:**
- `$request['action']` - Action name from URL
- `$request['data']` - Combined POST + GET parameters

**3. Response Format:**
```php
$result = new PBXApiResult();
$result->success = true;
$result->data = ['key' => 'value'];
return $result;
```

## Code Structure

```
ModuleExampleRestAPIv1/
├── Lib/
│   └── ExampleRestAPIv1Conf.php      # Main class with API handlers
├── App/
│   ├── Controllers/
│   │   ├── ExampleRestAPIv1BaseController.php
│   │   └── ExampleRestAPIv1Controller.php
│   └── Views/
│       └── index.volt                # UI with test buttons
├── Models/
│   └── ModuleExampleRestAPIv1.php    # Settings model
├── Messages/
│   ├── en.php                        # English translations
│   └── ru.php                        # Russian translations
└── public/assets/
    ├── css/module-rest-api-v1.css
    └── js/module-rest-api-v1.js      # API testing logic
```

## API Endpoints

All endpoints follow this pattern:
```
GET/POST /pbxcore/api/modules/ModuleExampleRestAPIv1/{action}
```

| Action | Method | Description |
|--------|--------|-------------|
| `check` | GET | Health check and module info |
| `status` | GET | Current settings and endpoint list |
| `reload` | POST | Reload configuration (accepts `force` param) |
| `stats` | GET | Usage statistics (accepts `period` param) |

## Extending This Module

### Adding New Actions

1. **Add action handler:**
```php
private function myNewAction(array $data): PBXApiResult
{
    $result = new PBXApiResult();
    $result->success = true;
    $result->data = ['message' => 'Hello from new action'];
    return $result;
}
```

2. **Register in match expression:**
```php
return match ($action) {
    'check'     => $this->checkAction($data),
    'myNewAction' => $this->myNewAction($data), // Add here
    default     => $this->createErrorResult("Unknown action")
};
```

3. **Add UI button (optional):**
```volt
<button class="ui button test-api-button" data-action="myNewAction">
    My New Action
</button>
```

4. **Add translations:**
```php
// Messages/en.php
'module_rest_api_v1_my_new_action_button' => 'My New Action',
```

## Troubleshooting

### Module not appearing in API

**Problem:** `/pbxcore/api/modules/ModuleExampleRestAPIv1/check` returns 404

**Solution:**
1. Check module is enabled in System → Modules
2. Clear cache: `rm -rf /tmp/cache/*`
3. Restart nginx: `systemctl restart nginx`

### Empty response from API

**Problem:** API returns null or empty

**Solution:**
1. Check PHP error logs: `/storage/usbdisk1/mikopbx/log/php/error.log`
2. Ensure `moduleRestAPICallback()` method exists
3. Verify match expression covers the action

### Buttons not working in UI

**Problem:** Clicking buttons shows no response

**Solution:**
1. Open browser console (F12)
2. Check for JavaScript errors
3. Verify `PbxApi.ModulesAPI` is loaded
4. Check network tab for failed requests

## Migration to Modern Patterns

When your module grows beyond 5-10 simple operations, consider migrating to:

- **Pattern 2 (Transitional):** Custom Controllers for organized structure
- **Pattern 4 (Modern):** Full REST API v3 with OpenAPI, validation, and auto-discovery

See `/Extensions/EXAMPLES/ModuleExampleRestAPIv2` and `/Extensions/EXAMPLES/ModuleExampleRestAPIv3` for examples.

## See Also

- [MODULE_API_PATTERNS.md](../../../docs/MODULE_API_PATTERNS.md) - All API patterns comparison
- [MODULE_API_TESTING_PLAN.md](../../../docs/MODULE_API_TESTING_PLAN.md) - Testing guide
- [PBXCoreREST/CLAUDE.md](../../../src/PBXCoreREST/CLAUDE.md) - REST API development guide

## License

GNU General Public License v3.0

## Support

- GitHub Issues: https://github.com/mikopbx/Core/issues
- Documentation: https://github.com/mikopbx/DevelopementDocs
