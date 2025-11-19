<?php
/*
 * MikoPBX - free phone system for small business
 * Copyright © 2017-2025 Alexey Portnov and Nikolay Beketov
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation; either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License along with this program.
 * If not, see <https://www.gnu.org/licenses/>.
 */

declare(strict_types=1);

namespace Modules\ModuleExampleRestAPIv3\Lib;

use MikoPBX\Modules\Config\ConfigClass;

/**
 * Example Module: REST API v3 (Modern Pattern 4)
 *
 * Demonstrates Pattern 4: Modern Auto-Discovery with OpenAPI
 *
 * WHY: This is the recommended pattern for all new modules. It provides:
 * - Automatic controller discovery via ControllerDiscovery::discoverModuleControllers()
 * - OpenAPI 3.1 schema auto-generation
 * - PHP 8 attributes for declarative routing
 * - Namespace isolation to prevent endpoint conflicts
 * - Processor + Actions architecture for clean separation
 *
 * WHEN TO USE:
 * - All new module development
 * - Production-ready public APIs
 * - When you need OpenAPI/Swagger documentation
 * - Complex CRUD operations with validation
 * - Modules requiring proper API versioning
 *
 * HOW IT WORKS:
 * 1. Controllers in API/Controllers/ are discovered automatically
 * 2. PHP 8 attributes define routes and schemas (#[ApiResource], #[HttpMapping])
 * 3. Processor enums route to dedicated Action classes
 * 4. DataStructure classes define validation schemas
 * 5. OpenAPI spec is generated from attributes
 *
 * IMPORTANT: Pattern 4 uses ConfigClass (not PbxExtensionBase) because:
 * - ConfigClass already implements RestAPIConfigInterface
 * - Provides empty implementations for all interface methods
 * - Controllers are discovered automatically, no manual route registration needed
 * - We don't need to override any methods unless we want custom behavior
 *
 * IMPORTANT DIFFERENCES FROM PATTERN 1:
 * - NO moduleRestAPICallback() method needed
 * - Controllers discovered via directory scan + #[ApiResource] attribute
 * - Routes registered via RouterProvider automatically
 * - Schema extracted from DataStructure classes
 *
 * @package Modules\ModuleExampleRestAPIv3\Lib
 */
class ExampleRestAPIv3Conf extends ConfigClass
{
    // No methods needed!
    // ConfigClass already implements RestAPIConfigInterface with empty stubs
    // Pattern 4 controllers are discovered automatically via ControllerDiscovery
    // No manual route registration required
}
