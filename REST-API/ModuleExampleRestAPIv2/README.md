# ModuleExampleRestAPIv2 - Pattern 2 (Transitional)

## Overview

Demonstrates **Pattern 2: Custom Controllers via ConfigClass** - good middle ground between simple callbacks and full v3 API.

## Key Features

- ✅ Custom controller organization (Get/Post/File)
- ✅ Route registration via `getPBXCoreRESTAdditionalRoutes()`
- ✅ Extends `ConfigClass` for automatic interface implementation
- ✅ Namespace isolation (`/modules/ModuleExampleRestAPIv2/`)
- ✅ Better than Pattern 1, simpler than Pattern 4

## Important: ConfigClass vs PbxExtensionBase

**Pattern 2 MUST extend `ConfigClass`, not `PbxExtensionBase`:**

```php
// ✅ CORRECT - Production pattern
class ExampleRestAPIv2Conf extends ConfigClass
{
    public function getPBXCoreRESTAdditionalRoutes(): array { ... }
    // ConfigClass already implements RestAPIConfigInterface
}

// ❌ WRONG - Will cause errors
class ExampleRestAPIv2Conf extends PbxExtensionBase implements RestAPIConfigInterface
{
    public function getPBXCoreRESTAdditionalRoutes(): array { ... }
    // Must implement 3 more methods manually!
}
```

**Why ConfigClass?**
- Already implements `RestAPIConfigInterface`
- Provides empty stub implementations for all hooks
- Used by all production modules (ModuleAutoDialer, ModuleUsersUI, etc.)
- You only override what you need

## Installation

```bash
cp -r ModuleExampleRestAPIv2 /storage/usbdisk1/mikopbx/custom_modules/
```

Enable via System → Modules

## API Endpoints

All endpoints: `/pbxcore/api/modules/ModuleExampleRestAPIv2/{Controller}/{action}`

### GET Operations
```bash
# Get Config
curl http://localhost/pbxcore/api/modules/ModuleExampleRestAPIv2/Get/config

# Get Users List
curl http://localhost/pbxcore/api/modules/ModuleExampleRestAPIv2/Get/users

# Get User by ID
curl http://localhost/pbxcore/api/modules/ModuleExampleRestAPIv2/Get/user?id=123
```

### POST Operations
```bash
# Create Record
curl -X POST http://localhost/pbxcore/api/modules/ModuleExampleRestAPIv2/Post/create \
  -d '{"name":"Test","value":"123"}'

# Update Record
curl -X POST http://localhost/pbxcore/api/modules/ModuleExampleRestAPIv2/Post/update \
  -d '{"id":"123","name":"Updated"}'

# Delete Record
curl -X POST http://localhost/pbxcore/api/modules/ModuleExampleRestAPIv2/Post/delete \
  -d '{"id":"123"}'
```

### File Operations
```bash
# Download File
curl http://localhost/pbxcore/api/modules/ModuleExampleRestAPIv2/File/download?filename=test.log

# Serve Static File
curl http://localhost/pbxcore/api/modules/ModuleExampleRestAPIv2/File/static?path=public/file.pdf
```

## Architecture

```
ModuleExampleRestAPIv2/
├── Lib/
│   ├── ExampleRestAPIv2Conf.php          # Extends ConfigClass
│   └── RestAPI/Controllers/              # Custom controllers
│       ├── GetController.php
│       ├── PostController.php
│       └── FileController.php
├── Models/ModuleExampleRestAPIv2.php     # Settings model
└── App/
    ├── Controllers/                       # UI controllers
    └── Views/index.volt                   # Test interface
```

## Key Concepts

### 1. ConfigClass Benefits
- Implements all required interfaces (REST, System, WebUI, Asterisk)
- Provides empty implementations for ~30 hook methods
- Only override methods you actually use
- Production-proven pattern

### 2. Route Registration
Routes registered in `getPBXCoreRESTAdditionalRoutes()`:
```php
return [
    [GetController::class, 'callAction', '/pbxcore/api/modules/ModuleExampleRestAPIv2/Get/{actionName}', 'get', '/'],
    [PostController::class, 'callAction', '/pbxcore/api/modules/ModuleExampleRestAPIv2/Post/{actionName}', 'post', '/'],
];
```

### 3. Controller Organization
Each controller handles specific operations:
- `GetController` - Read operations (config, users, user)
- `PostController` - Write operations (create, update, delete)
- `FileController` - File operations (download, static)

### 4. Namespace Isolation
Path `/modules/ModuleExampleRestAPIv2/` prevents conflicts with Core and other modules

## When to Use

**✅ Use Pattern 2 for:**
- Modules with 5-15 API operations
- When you need better organization than Pattern 1
- Transitioning from Pattern 1 to Pattern 4
- Modules that don't need OpenAPI docs yet

**❌ Don't use Pattern 2 for:**
- Simple 1-3 operations (use Pattern 1)
- Complex CRUD with validation (use Pattern 4)
- New modules requiring OpenAPI (use Pattern 4)

## Comparison with Other Patterns

| Feature | Pattern 1 | Pattern 2 | Pattern 4 |
|---------|-----------|-----------|-----------|
| Base Class | PbxExtensionBase | **ConfigClass** | ConfigClass |
| Interface | None | ConfigClass provides | Auto-discovery |
| Routing | match() | Custom controllers | #[HttpMapping] |
| Organization | Single method | Controller classes | Processor + Actions |
| OpenAPI | ❌ | ❌ | ✅ |
| Production Ready | Simple only | ✅ **Balanced** | ✅ Full-featured |

## Production Examples

Production modules using Pattern 2:
- **ModuleAutoDialer** - Dialer API with 16 endpoints
- **ModuleBackup** - Backup management API
- **ModuleUsersUI** - User management with ACL

All extend `ConfigClass` and override only `getPBXCoreRESTAdditionalRoutes()`.

## See Also

- [MODULE_API_PATTERNS.md](../../../docs/MODULE_API_PATTERNS.md) - All patterns comparison
- [PBXCoreREST/CLAUDE.md](../../../src/PBXCoreREST/CLAUDE.md) - API development guide
- [ConfigClass.php](/Users/nb/PhpstormProjects/mikopbx/Core/src/Modules/Config/ConfigClass.php) - Base class reference
