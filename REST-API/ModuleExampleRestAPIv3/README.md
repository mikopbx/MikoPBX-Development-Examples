# ModuleExampleRestAPIv3

**Modern REST API v3 Module Example for MikoPBX (Pattern 3: Auto-Discovery)**

[Русская версия](README.ru.md)

## Overview

This module demonstrates **Pattern 3 (Auto-Discovery)** - the recommended approach for building REST API endpoints in MikoPBX using PHP 8.3 attributes and automatic controller discovery.

## MikoPBX REST API Patterns

MikoPBX supports 3 REST API patterns for module development:

### Pattern 1: Basic REST API
- Manual route registration in `moduleRestAPICallback()`
- Simple, direct approach for basic endpoints
- Good for learning and simple use cases

### Pattern 2: Extended REST API
- Namespace isolation with module prefix
- Manual registration but with better organization
- Prevents endpoint conflicts between modules

### Pattern 3: Modern Auto-Discovery (THIS MODULE)
- **Automatic controller discovery** via `#[ApiResource]` attributes
- **OpenAPI 3.1** schema auto-generation from DataStructure classes
- **Processor + Actions** architecture for clean code separation
- **Recommended for all new development**

## Key Features

- ✅ **Auto-Discovery** - Controllers automatically discovered from `Lib/RestAPI/` directory
- ✅ **PHP 8 Attributes** - Declarative routing using `#[ApiResource]`, `#[ApiOperation]`, etc.
- ✅ **OpenAPI 3.1** - Automatic OpenAPI specification generation
- ✅ **7-Phase Pattern** - Structured data processing (sanitization → validation → save)
- ✅ **File Operations** - Chunked file upload with Resumable.js and secure download
- ✅ **Security Integration** - JWT Bearer token authentication
- ✅ **Multilingual** - Translation support for API documentation
- ✅ **Clean Architecture** - Clear separation of concerns

## Architecture

### Directory Structure

```
ModuleExampleRestAPIv3/
├── Lib/RestAPI/                    # REST API components
│   └── Tasks/                      # Resource namespace
│       ├── Controller.php          # HTTP interface with attributes
│       ├── Processor.php           # Request router
│       ├── DataStructure.php       # Schema & validation
│       └── Actions/                # Business logic
│           ├── GetListAction.php
│           ├── GetRecordAction.php
│           ├── SaveRecordAction.php
│           ├── DeleteRecordAction.php
│           ├── GetDefaultAction.php
│           ├── DownloadFileAction.php
│           └── UploadFileAction.php
├── Models/Tasks.php                # Phalcon ORM model
├── Setup/PbxExtensionSetup.php    # Module installer
├── Messages/                       # Translations
│   ├── en.php
│   └── ru.php
└── App/                            # Web UI for testing
    ├── Controllers/ModuleExampleRestAPIv3Controller.php
    ├── Views/ModuleExampleRestAPIv3/index.volt
    └── public/assets/js/
```

### Why This Pattern?

**Benefits:**
- All resource components in one folder (`Lib/RestAPI/Tasks/`)
- Semantically clear: "Tasks" = resource namespace
- Easy to scale: add new resources as siblings
- Automatic route registration - no manual configuration needed
- OpenAPI documentation generated from code

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
| GET | `/tasks/{id}:download` | download | Download file attached to task |
| POST | `/tasks/{id}:uploadFile` | uploadFile | Upload file to attach to task |

### Authentication

All endpoints require JWT Bearer token authentication:

```bash
curl -H "Authorization: Bearer YOUR_JWT_TOKEN" \
     https://your-mikopbx.com/pbxcore/api/v3/module-example-rest-api-v3/tasks
```

**Security Types:**
- `SecurityType::LOCALHOST` - Access from localhost without token
- `SecurityType::BEARER_TOKEN` - JWT token required for remote access

## File Upload & Download

### Upload File

**Chunked upload using Resumable.js:**

```bash
# Files are uploaded via Core's upload API first
POST /pbxcore/api/v3/files:upload

# Then attached to task (resource-level custom method)
POST /pbxcore/api/v3/module-example-rest-api-v3/tasks/1:uploadFile
```

**Features:**
- Chunked upload support for large files
- Progress tracking via EventBus
- Automatic file type validation
- Max file size: 10MB (configurable)
- Supported formats: mp3, wav, pdf, png, jpeg

### Download File

```bash
# Download file from task
curl -H "Authorization: Bearer YOUR_TOKEN" \
     https://your-mikopbx.com/pbxcore/api/v3/module-example-rest-api-v3/tasks/1:download \
     -o downloaded_file.pdf

# Download with custom filename
curl -H "Authorization: Bearer YOUR_TOKEN" \
     "https://your-mikopbx.com/pbxcore/api/v3/module-example-rest-api-v3/tasks/1:download?filename=report.pdf" \
     -o report.pdf
```

**Security Features:**
- Directory whitelist prevents path traversal attacks
- File validation (existence, readability)
- Proper MIME type detection
- Range requests support for audio/video

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
   - Click "View API Documentation" link
   - Or directly: `/admin-cabinet/api-keys/openapi#/operations/getTasksList`

2. **Authorize:**
   - Click "Authorize" button
   - Enter JWT Bearer token
   - Click "Authorize"

3. **Try it:**
   - Select operation (e.g., "Get tasks list")
   - Click "Try it out"
   - Click "Execute"
   - View request/response

## Best Practices

### ✅ DO:
- Use `#[ApiParameterRef]` to reference DataStructure definitions
- Follow 7-phase pattern in SaveRecordAction
- Apply defaults ONLY on CREATE (never UPDATE/PATCH)
- Use `isset()` checks for PATCH support
- Add WHY comments in complex logic
- Include module namespace in path: `/module-{name}/{resource}`

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
- Check that controller is in `Lib/RestAPI/` directory

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

### File upload not working?
- Check file size doesn't exceed 10MB limit
- Verify file type is in allowed list (mp3, wav, pdf, png, jpeg)
- Ensure Core's FilesAPI is properly loaded
- Check browser console for JavaScript errors

## License

GPLv3 - see [MikoPBX License](https://github.com/mikopbx/Core/blob/master/LICENSE)
