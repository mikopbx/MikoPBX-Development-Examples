# ModuleExampleRestAPIv3

**Modern REST API v3 Module Example for MikoPBX (Pattern 2025)**

[Русская версия](README.ru.md)

## Overview

This module demonstrates the **modern recommended approach** for building REST API endpoints in MikoPBX using PHP 8.3 attributes and automatic controller discovery. It showcases the new architectural pattern introduced in 2025 that significantly simplifies REST API development for modules.

## Key Features

- ✅ **Auto-Discovery** - Controllers are automatically discovered from `Lib/RestAPI/` directory
- ✅ **PHP 8 Attributes** - Declarative routing using `#[ApiResource]`, `#[ApiOperation]`, etc.
- ✅ **OpenAPI 3.1** - Automatic OpenAPI specification generation
- ✅ **7-Phase Pattern** - Structured data processing (sanitization → validation → save)
- ✅ **Security Integration** - JWT Bearer token authentication
- ✅ **Multilingual** - Translation support for API documentation
- ✅ **Clean Architecture** - Clear separation of concerns

## Architecture (New Pattern 2025)

### Directory Structure

```
ModuleExampleRestAPIv3/
├── Lib/RestAPI/                    # REST API components (NEW)
│   └── Tasks/                      # Resource namespace
│       ├── Controller.php          # HTTP interface with attributes
│       ├── Processor.php           # Request router
│       ├── DataStructure.php       # Schema & validation
│       └── Actions/                # Business logic
│           ├── GetListAction.php
│           ├── GetRecordAction.php
│           ├── SaveRecordAction.php
│           ├── DeleteRecordAction.php
│           └── GetDefaultAction.php
├── Messages/                       # Translations
│   ├── en.php
│   └── ru.php
└── App/Views/                      # Frontend UI
    └── ModuleExampleRestAPIv3/
        └── index.volt
```

### Why This Pattern?

**✅ Benefits:**
- All resource components in one folder (3 levels instead of 5)
- Semantically clear: "Tasks" = resource namespace
- Easy to scale: add new resources as siblings
- No Frontend/Backend split - simpler navigation
- Automatic route registration - no manual router config

**❌ Old Pattern (2024):**
```
API/
├── Controllers/
│   └── Tasks/
│       └── RestController.php
└── Lib/
    └── Tasks/
        └── TasksProcessor.php
```

**✅ New Pattern (2025):**
```
Lib/RestAPI/
└── Tasks/
    ├── Controller.php
    ├── Processor.php
    ├── DataStructure.php
    └── Actions/
```

## Request Flow

```
┌─────────────┐
│ HTTP Request│
│ GET /tasks  │
└──────┬──────┘
       │
       ▼
┌─────────────────────────────────────────────────────────┐
│ Controller.php (#[ApiResource])                         │
│ - Attributes define routes, security, parameters        │
│ - Validates JWT token (SecurityType::BEARER_TOKEN)      │
│ - Extracts ID from URL (/tasks/{id})                    │
│ - Sanitizes input data                                  │
└──────┬──────────────────────────────────────────────────┘
       │
       ▼ sendRequestToBackendWorker()
┌─────────────────────────────────────────────────────────┐
│ Redis Queue                                             │
│ - Action: 'getRecord'                                   │
│ - Data: ['id' => 'TASK-123', ...]                       │
│ - Processor: 'Processor::callBack'                      │
└──────┬──────────────────────────────────────────────────┘
       │
       ▼ WorkerApiCommands
┌─────────────────────────────────────────────────────────┐
│ Processor.php                                           │
│ - Routes action to appropriate Action class             │
│ - switch($action) { case 'getRecord': ... }             │
└──────┬──────────────────────────────────────────────────┘
       │
       ▼ GetRecordAction::main($data)
┌─────────────────────────────────────────────────────────┐
│ Actions/GetRecordAction.php                             │
│                                                         │
│ PHASE 1: Sanitization                                  │
│   - Clean user input                                    │
│                                                         │
│ PHASE 2: Required Validation                           │
│   - Check mandatory fields                              │
│                                                         │
│ PHASE 3: Determine Operation                           │
│   - Find record by ID                                   │
│                                                         │
│ PHASE 4: Apply Defaults (CREATE only)                  │
│   - Skip for GET/UPDATE/PATCH                           │
│                                                         │
│ PHASE 5: Schema Validation                             │
│   - Validate against DataStructure                      │
│                                                         │
│ PHASE 6: Execute Business Logic                        │
│   - Retrieve data from database/models                  │
│                                                         │
│ PHASE 7: Format Response                               │
│   - Transform to API format                             │
└──────┬──────────────────────────────────────────────────┘
       │
       ▼ Uses DataStructure
┌─────────────────────────────────────────────────────────┐
│ DataStructure.php                                       │
│ - Field definitions (types, constraints, defaults)      │
│ - Sanitization rules                                    │
│ - Validation schemas                                    │
│ - Response formatting                                   │
└──────┬──────────────────────────────────────────────────┘
       │
       ▼ PBXApiResult
┌─────────────────────────────────────────────────────────┐
│ Response                                                │
│ {                                                       │
│   "result": true,                                       │
│   "data": {                                             │
│     "id": "TASK-123",                                   │
│     "title": "Example Task",                            │
│     "status": "pending"                                 │
│   }                                                     │
│ }                                                       │
└─────────────────────────────────────────────────────────┘
```

## API Endpoints

### Base URL
```
/pbxcore/api/v3/module-example-rest-api-v3/tasks
```

### Available Operations

| Method | Endpoint | Action | Description |
|--------|----------|--------|-------------|
| GET | `/tasks` | getList | Get list of all tasks with pagination |
| GET | `/tasks/{id}` | getRecord | Get specific task by ID |
| POST | `/tasks` | create | Create new task |
| PUT | `/tasks/{id}` | update | Full update (replaces all fields) |
| PATCH | `/tasks/{id}` | patch | Partial update (only specified fields) |
| DELETE | `/tasks/{id}` | delete | Delete task by ID |
| GET | `/tasks:getDefault` | getDefault | Get default values for new task |

### Authentication

All endpoints require JWT Bearer token authentication:

```bash
curl -H "Authorization: Bearer YOUR_JWT_TOKEN" \
     https://your-mikopbx.com/pbxcore/api/v3/module-example-rest-api-v3/tasks
```

**Security Types:**
- `SecurityType::LOCALHOST` - Access from localhost without token
- `SecurityType::BEARER_TOKEN` - JWT token required for remote access

## File Structure Explained

### 1. Controller.php
**Purpose:** HTTP interface layer with OpenAPI attributes

```php
#[ApiResource(
    path: '/pbxcore/api/v3/module-example-rest-api-v3/tasks',
    tags: ['Module Example REST API v3 - Tasks'],
    processor: Processor::class
)]
#[ResourceSecurity('module-example-rest-api-v3-tasks', requirements: [
    SecurityType::LOCALHOST,
    SecurityType::BEARER_TOKEN
])]
class Controller extends BaseRestController
{
    #[ApiOperation(summary: 'rest_tasks_GetList')]
    #[ApiParameterRef('limit')]
    public function getList(): void {}
}
```

**Key Features:**
- Attributes define routes, security, parameters
- Empty methods (implementation in Actions)
- Automatic OpenAPI generation
- Translation keys for documentation

### 2. Processor.php
**Purpose:** Routes requests to Action classes

```php
public static function callBack(array $request): PBXApiResult
{
    $action = $request['action'] ?? '';

    switch ($action) {
        case 'getRecord':
            return GetRecordAction::main($request['data'] ?? []);
        case 'create':
        case 'update':
        case 'patch':
            return SaveRecordAction::main($request['data'] ?? []);
        // ...
    }
}
```

**Pattern:** Simple switch statement routing to Action classes

### 3. DataStructure.php
**Purpose:** Single source of truth for field definitions

```php
public static function getParameterDefinitions(): array
{
    return [
        'request' => [
            'title' => [
                'type' => 'string',
                'minLength' => 1,
                'maxLength' => 255,
                'sanitize' => 'text',
                'required' => true
            ],
            'status' => [
                'type' => 'string',
                'enum' => ['pending', 'in_progress', 'completed'],
                'default' => 'pending'
            ]
        ],
        'response' => [
            'id' => ['type' => 'integer'],
            'title' => ['type' => 'string'],
            'status' => ['type' => 'string']
        ]
    ];
}
```

**Benefits:**
- All constraints in one place
- Auto-generate sanitization rules
- Controllers reference with `#[ApiParameterRef]`
- No duplicate definitions

### 4. Actions/
**Purpose:** Business logic implementation

Each Action implements one operation:
- `GetListAction` - Retrieve multiple records
- `GetRecordAction` - Retrieve single record
- `SaveRecordAction` - Create/Update/Patch record (7-phase pattern)
- `DeleteRecordAction` - Delete record
- `GetDefaultAction` - Get default values

**7-Phase SaveRecordAction Pattern:**

```php
public static function main(array $data): PBXApiResult
{
    // PHASE 1: SANITIZATION - Security first
    $sanitizedData = self::sanitizeInputData($data, ...);

    // PHASE 2: REQUIRED VALIDATION - Fail fast
    $errors = self::validateRequiredFields($sanitizedData, ...);

    // PHASE 3: DETERMINE OPERATION - New vs existing
    $isNewRecord = empty($sanitizedData['id']);

    // PHASE 4: APPLY DEFAULTS - CREATE only!
    if ($isNewRecord) {
        $sanitizedData = DataStructure::applyDefaults($sanitizedData);
    }

    // PHASE 5: SCHEMA VALIDATION - After defaults
    $schemaErrors = DataStructure::validateInputData($sanitizedData);

    // PHASE 6: SAVE - Transaction wrapper
    $model = self::executeInTransaction(fn() => ...);

    // PHASE 7: RESPONSE - Consistent format
    return $result;
}
```

## Development Guide

### Adding a New Resource

1. **Create resource directory:**
```bash
mkdir -p Lib/RestAPI/Projects/Actions
```

2. **Create Controller.php:**
```php
#[ApiResource(
    path: '/pbxcore/api/v3/module-example-rest-api-v3/projects',
    tags: ['Module Example REST API v3 - Projects'],
    processor: Processor::class
)]
#[ResourceSecurity('projects', requirements: [SecurityType::BEARER_TOKEN])]
class Controller extends BaseRestController { }
```

3. **Create Processor.php:**
```php
public static function callBack(array $request): PBXApiResult
{
    switch ($request['action'] ?? '') {
        case 'getList': return GetListAction::main($request['data'] ?? []);
        // ...
    }
}
```

4. **Create DataStructure.php:**
```php
public static function getParameterDefinitions(): array
{
    return [
        'request' => [ /* field definitions */ ],
        'response' => [ /* response structure */ ]
    ];
}
```

5. **Create Actions:**
```php
class GetListAction {
    public static function main(array $data): PBXApiResult { }
}
```

6. **Add translations:**
```php
// Messages/en.php
'rest_projects_GetList' => 'Get projects list',
'rest_tag_ModuleExampleRESTAPIV3Projects' => 'Projects',
```

### Testing

1. **Access OpenAPI UI:**
   - Navigate to module page
   - Click "Open OpenAPI Tools" button
   - Or directly: `/admin-cabinet/api-keys/openapi#/operations/getTasksList`

2. **Authorize:**
   - Click "Authorize" button
   - Enter JWT Bearer token
   - Click "Authorize"

3. **Try it:**
   - Select operation (e.g., "Get tasks list")
   - Click "Try it"
   - View request/response

## Best Practices

### ✅ DO:
- Use `#[ApiParameterRef]` to reference DataStructure definitions
- Follow 7-phase pattern in SaveRecordAction
- Apply defaults ONLY on CREATE (never UPDATE/PATCH)
- Use `isset()` checks for PATCH support
- Add WHY comments in complex logic
- Include module namespace in path: `/modules/{module-name}/{resource}`

### ❌ DON'T:
- Define sanitization rules inline (use DataStructure)
- Apply defaults on UPDATE/PATCH operations
- Skip required validation
- Create endpoints without security attributes
- Use generic paths like `/tasks` (conflicts with Core)

## Troubleshooting

### Routes not registering?
- Check controller filename ends with `Controller.php`
- Verify `#[ApiResource]` attribute present
- Ensure `processor` parameter points to valid Processor class

### ID parameter not reaching Action?
- Check Processor passes `$request['data']` not entire `$request`
- Verify `handleCRUDRequest()` adds ID to request data

### Authentication not working?
- Add `#[ResourceSecurity]` attribute to controller
- Import `SecurityType` and `ResourceSecurity` in use block
- Verify JWT token in Authorization header

### OpenAPI not showing translations?
- Add translation keys to Messages/en.php and Messages/ru.php
- Format: `rest_{resource}_{Operation}` for summaries
- Format: `rest_tag_{ModuleName}{Resource}` for tags

## References

- [MikoPBX REST API Guide](../../project-modules-api-refactoring/src/PBXCoreREST/CLAUDE.md)
- [Google API Design Guide](https://cloud.google.com/apis/design)
- [OpenAPI 3.1 Specification](https://spec.openapis.org/oas/v3.1.0)

## License

GPLv3 - see [MikoPBX License](https://github.com/mikopbx/Core/blob/master/LICENSE)
