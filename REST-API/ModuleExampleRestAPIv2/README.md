# ModuleExampleRestAPIv2

## Overview

Educational example demonstrating **REST API with Backend Worker Architecture** in MikoPBX modules.

All API operations are processed asynchronously via `ModuleRestAPIProcessor` and Action classes.

## Features

- Custom controller organization (GetController, PostController)
- Route registration via `getPBXCoreRESTAdditionalRoutes()`
- Backend worker processing via Redis queue
- Action classes for business logic separation
- File download with symlink approach

## Installation

1. Copy module to MikoPBX:
```bash
cp -r ModuleExampleRestAPIv2 /storage/usbdisk1/mikopbx/custom_modules/
```

2. Enable via System → Modules

## API Endpoints

Base URL: `/pbxcore/api/module-example-rest-api-v2/`

### GET Operations

```bash
# Get module configuration
curl http://pbx/pbxcore/api/module-example-rest-api-v2/config

# Get users list with JOINs
curl http://pbx/pbxcore/api/module-example-rest-api-v2/users

# View file content (JSON)
curl http://pbx/pbxcore/api/module-example-rest-api-v2/download?filename=example.txt

# Download file (returns URL)
curl http://pbx/pbxcore/api/module-example-rest-api-v2/download?filename=example.txt&mode=download
```

### POST Operations

```bash
# Create user
curl -X POST http://pbx/pbxcore/api/module-example-rest-api-v2/create \
  -d 'name=Test User'

# Update user
curl -X POST http://pbx/pbxcore/api/module-example-rest-api-v2/update \
  -d 'id=123&name=Updated User'

# Delete user
curl -X POST http://pbx/pbxcore/api/module-example-rest-api-v2/delete \
  -d 'id=123'
```

## Architecture

```
Request → Controller → sendRequestToBackendWorker()
       → Redis Queue → WorkerApiCommands
       → ModuleRestAPIProcessor::callBack()
       → Action::main() → Response
```

### File Structure

```
ModuleExampleRestAPIv2/
├── Lib/
│   ├── ExampleRestAPIv2Conf.php           # Route registration
│   └── RestAPI/
│       ├── Controllers/
│       │   ├── GetController.php          # GET requests routing
│       │   └── PostController.php         # POST requests routing
│       └── Backend/
│           ├── ModuleRestAPIProcessor.php # Worker router
│           └── Actions/
│               ├── GetConfigAction.php    # Query config
│               ├── GetUsersAction.php     # Query users with JOINs
│               ├── CreateUserAction.php   # Create user
│               ├── UpdateUserAction.php   # Update user
│               ├── DeleteUserAction.php   # Delete user
│               └── DownloadFileAction.php # File download
├── Models/
│   └── ModuleExampleRestAPIv2.php         # Database model
├── App/
│   ├── Controllers/                        # UI controllers
│   └── Views/index.volt                    # Test interface
├── Messages/
│   ├── en.php                              # English translations
│   └── ru.php                              # Russian translations
└── downloads/
    └── example.txt                         # Test file
```

## Key Concepts

### 1. Route Registration

Routes defined in `ExampleRestAPIv2Conf::getPBXCoreRESTAdditionalRoutes()`:

```php
return [
    [GetController::class, 'callAction', '/pbxcore/api/module-example-rest-api-v2/{actionName}', 'get', ''],
    [PostController::class, 'callAction', '/pbxcore/api/module-example-rest-api-v2/{actionName}', 'post', ''],
];
```

### 2. Controller → Backend Worker

Controllers delegate all work to backend worker:

```php
$this->sendRequestToBackendWorker(
    ModuleRestAPIProcessor::class,
    self::ACTION_MAP[$actionName],
    $_REQUEST
);
```

### 3. Action Classes

Each action is a separate class with `main()` method:

```php
class GetConfigAction extends Injectable
{
    public static function main(array $request): PBXApiResult
    {
        // Business logic here
    }
}
```

### 4. File Download

Two modes supported:
- `mode=view` - Returns JSON with file content
- `mode=download` - Creates symlink, returns URL for browser download

## Requirements

- MikoPBX 2025.1.1 or later
