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

namespace Modules\ModuleExampleRestAPIv1\Lib;

use MikoPBX\Modules\Config\ConfigClass;
use MikoPBX\PBXCoreREST\Lib\PBXApiResult;

/**
 * Example Module: REST API v1 (Simple Callback Pattern)
 *
 * Demonstrates Pattern 1: Simple Callback via moduleRestAPICallback()
 *
 * WHY: This is the simplest pattern for module REST API integration.
 * It's suitable for modules with 3-5 simple operations that don't require
 * complex validation or processing.
 *
 * WHEN TO USE:
 * - Simple modules with few API operations
 * - Quick prototypes and MVPs
 * - Internal tools and utilities
 * - When you don't need OpenAPI documentation
 *
 * WHEN NOT TO USE:
 * - Complex CRUD operations
 * - When you need OpenAPI/Swagger docs
 * - When you need advanced validation
 * - Production-ready public APIs
 *
 * IMPORTANT: Pattern 1 now extends ConfigClass (not PbxExtensionBase) due to
 * strict typing in PbxExtensionState::$configClass. ConfigClass already implements
 * RestAPIConfigInterface, so we can still use moduleRestAPICallback() method.
 *
 * @package Modules\ModuleExampleRestAPIv1\Lib
 */
class ExampleRestAPIv1Conf extends ConfigClass
{
    /**
     * Module unique identifier
     * WHY: Used for routing and identification
     */
    public const MODULE_ID = 'ModuleExampleRestAPIv1';

    /**
     * REST API callback handler (Pattern 1)
     *
     * This method is automatically called for all requests to:
     * - GET  /pbxcore/api/modules/ModuleExampleRestAPIv1/{actionName}
     * - POST /pbxcore/api/modules/ModuleExampleRestAPIv1/{actionName}
     *
     * WHY: Single entry point for all module API operations
     * Simple routing via match expression
     *
     * @param array $request Request data with keys:
     *                       - 'action' => string Action name from URL
     *                       - 'data'   => array  POST/GET parameters
     * @return PBXApiResult
     */
    public function moduleRestAPICallback(array $request): PBXApiResult
    {
        $action = $request['action'] ?? '';
        $data   = $request['data'] ?? [];

        // WHY: match expression for clean routing (PHP 8.0+)
        return match ($action) {
            'check'  => $this->checkAction($data),
            'status' => $this->statusAction($data),
            'reload' => $this->reloadAction($data),
            'stats'  => $this->statsAction($data),
            default  => $this->createErrorResult("Unknown action: {$action}")
        };
    }

    /**
     * Check module status
     *
     * Endpoint: GET /pbxcore/api/modules/ModuleExampleRestAPIv1/check
     *
     * WHY: Health check endpoint for monitoring
     *
     * @param array $data Request parameters
     * @return PBXApiResult
     */
    private function checkAction(array $data): PBXApiResult
    {
        $result = new PBXApiResult();
        $result->success = true;
        $result->data = [
            'module' => self::MODULE_ID,
            'version' => $this->getModuleVersion(),
            'status' => 'operational',
            'pattern' => 'Pattern 1 (Simple Callback)',
            'timestamp' => date('Y-m-d H:i:s'),
        ];

        return $result;
    }

    /**
     * Get module status and settings
     *
     * Endpoint: GET /pbxcore/api/modules/ModuleExampleRestAPIv1/status
     *
     * WHY: Return current module configuration
     *
     * @param array $data Request parameters
     * @return PBXApiResult
     */
    private function statusAction(array $data): PBXApiResult
    {
        $result = new PBXApiResult();
        $result->success = true;

        // Get module settings from database
        $settings = $this->getModuleSettings();

        $result->data = [
            'enabled' => true,
            'settings' => $settings,
            'api_pattern' => 'Pattern 1 (Simple Callback)',
            'endpoints' => [
                'check'  => '/pbxcore/api/modules/ModuleExampleRestAPIv1/check',
                'status' => '/pbxcore/api/modules/ModuleExampleRestAPIv1/status',
                'reload' => '/pbxcore/api/modules/ModuleExampleRestAPIv1/reload',
                'stats'  => '/pbxcore/api/modules/ModuleExampleRestAPIv1/stats',
            ],
        ];

        return $result;
    }

    /**
     * Reload module configuration
     *
     * Endpoint: POST /pbxcore/api/modules/ModuleExampleRestAPIv1/reload
     *
     * WHY: Trigger configuration reload without full restart
     *
     * @param array $data Request parameters (can contain 'force' => bool)
     * @return PBXApiResult
     */
    private function reloadAction(array $data): PBXApiResult
    {
        $result = new PBXApiResult();

        $force = filter_var($data['force'] ?? false, FILTER_VALIDATE_BOOLEAN);

        // Simulate configuration reload
        // In real module, this would trigger actual reload logic
        $reloaded = $this->reloadConfiguration($force);

        if ($reloaded) {
            $result->success = true;
            $result->data = [
                'message' => 'Configuration reloaded successfully',
                'force' => $force,
                'timestamp' => date('Y-m-d H:i:s'),
            ];
        } else {
            $result->success = false;
            $result->messages['error'] = ['Failed to reload configuration'];
        }

        return $result;
    }

    /**
     * Get module statistics
     *
     * Endpoint: GET /pbxcore/api/modules/ModuleExampleRestAPIv1/stats
     *
     * WHY: Provide usage statistics and metrics
     *
     * @param array $data Request parameters (can contain 'period' => string)
     * @return PBXApiResult
     */
    private function statsAction(array $data): PBXApiResult
    {
        $result = new PBXApiResult();
        $result->success = true;

        $period = $data['period'] ?? 'today';

        // Simulate statistics gathering
        $result->data = [
            'period' => $period,
            'api_calls' => [
                'check'  => rand(10, 100),
                'status' => rand(5, 50),
                'reload' => rand(1, 10),
                'stats'  => rand(5, 30),
            ],
            'total_calls' => rand(50, 200),
            'uptime' => '99.9%',
            'last_reload' => date('Y-m-d H:i:s', strtotime('-2 hours')),
        ];

        return $result;
    }

    /**
     * Get module settings from database
     *
     * WHY: Centralized settings retrieval
     * NOTE: Renamed to getModuleSettings() to avoid conflict with parent's getSettings(): void
     *
     * @return array Module settings
     */
    private function getModuleSettings(): array
    {
        // In real module, load from ModuleExampleRestAPIv1 model
        return [
            'enabled' => true,
            'api_enabled' => true,
            'log_level' => 'info',
            'cache_enabled' => false,
        ];
    }

    /**
     * Reload module configuration
     *
     * WHY: Simulate configuration reload logic
     *
     * @param bool $force Force reload flag
     * @return bool Success status
     */
    private function reloadConfiguration(bool $force): bool
    {
        // In real module, this would:
        // 1. Validate new configuration
        // 2. Apply changes
        // 3. Restart affected services
        // 4. Clear caches if needed

        // Simulate reload
        return true;
    }

    /**
     * Get module version from module.json
     *
     * WHY: Version is stored in module.json, not as class property
     *
     * @return string Module version or 'unknown' if not found
     */
    private function getModuleVersion(): string
    {
        $moduleJson = $this->moduleDir . '/module.json';

        if (file_exists($moduleJson)) {
            $jsonString = file_get_contents($moduleJson);
            $moduleDescription = json_decode($jsonString, true);

            return $moduleDescription['version'] ?? 'unknown';
        }

        return 'unknown';
    }

    /**
     * Create error result
     *
     * WHY: Consistent error response format
     *
     * @param string $message Error message
     * @return PBXApiResult
     */
    private function createErrorResult(string $message): PBXApiResult
    {
        $result = new PBXApiResult();
        $result->success = false;
        $result->messages['error'] = [$message];

        return $result;
    }
}
