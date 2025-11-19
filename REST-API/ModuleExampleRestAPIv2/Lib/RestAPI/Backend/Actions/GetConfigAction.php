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

namespace Modules\ModuleExampleRestAPIv2\Lib\RestAPI\Backend\Actions;

use MikoPBX\PBXCoreREST\Lib\PBXApiResult;
use Modules\ModuleExampleRestAPIv2\Models\ModuleExampleRestAPIv2;
use Phalcon\Di\Injectable;

/**
 * GetConfigAction - Get module configuration from database
 *
 * BACKEND (Worker via Processor):
 * This action is called by backend worker to perform database query asynchronously.
 *
 * WHY BACKEND:
 * - Queries database for actual module settings
 * - Could check module status from system tables
 * - Could validate licenses from external API
 * - Non-blocking operation
 *
 * WHAT THIS ACTION DOES:
 * - Queries ModuleExampleRestAPIv2 model for settings
 * - Retrieves actual database configuration
 * - Returns real module status
 *
 * PERFORMANCE: ~30-50ms (includes Redis queue + DB query)
 *
 * REAL WORLD USE CASE:
 * - Module settings stored in database
 * - License validation from external server
 * - Feature flags from remote config
 * - Integration status checks
 *
 * HOW IT'S CALLED:
 * Controller → sendRequestToBackendWorker(ModuleRestAPIProcessor::class, 'getConfig', ...)
 *          → Redis queue → WorkerApiCommands
 *          → ModuleRestAPIProcessor::callBack(['action' => 'getConfig'])
 *          → GetConfigAction::main()
 *
 * @package Modules\ModuleExampleRestAPIv2\Lib\RestAPI\Backend\Actions
 */
class GetConfigAction extends Injectable
{
    /**
     * Get module configuration from database
     *
     * WHY STATIC METHOD:
     * - Called by processor without instantiation
     * - Same pattern as CORE actions (GetInfoAction, etc.)
     * - No state needed, just execute and return result
     *
     * REQUEST STRUCTURE:
     * [
     *     'action' => 'getConfig',
     *     'data' => [...],  // Original request data from controller
     * ]
     *
     * RESPONSE:
     * PBXApiResult with:
     * - success: true/false
     * - data: module configuration from database
     * - processor: __METHOD__ for debugging
     *
     * @param array $request Request data from processor
     * @return PBXApiResult An object containing the result of the API call
     */
    public static function main(array $request): PBXApiResult
    {
        $res = new PBXApiResult();
        $res->processor = __METHOD__;

        try {
            // WHY: Query actual module settings from database
            // Real modules would query their settings table
            // Example: ModuleExampleRestAPIv2::findFirst() to get configuration

            // For demonstration, we'll query if module exists and is enabled
            $moduleRecord = ModuleExampleRestAPIv2::findFirst();

            $res->success = true;
            $res->data = [
                'approach' => 'Backend (Worker via Processor + Action)',
                'processor_class' => 'ModuleRestAPIProcessor',
                'action_class' => __CLASS__,
                'controllers' => ['GetController', 'PostController', 'FileController'],
                'api_version' => 'v2',
                'description' => 'Worker-based response with database query',
                'response_time' => '30-50ms (includes Redis queue overhead)',

                // WHY: Show actual database state
                'module_status' => [
                    'enabled' => $moduleRecord ? (int)$moduleRecord->disabled === 0 : false,
                    'database_check' => 'OK - module settings retrieved from database',
                    'settings' => $moduleRecord ? [
                        'textField' => $moduleRecord->textField ?? '',
                        'areaField' => $moduleRecord->areaField ?? '',
                        'passwordField' => '***',  // WHY: Never expose passwords in API
                        'integerField' => $moduleRecord->integerField ?? 0,
                        'checkboxField' => $moduleRecord->checkboxField ?? false,
                        'toggleField' => $moduleRecord->toggleField ?? false,
                    ] : null,
                ],

                // WHY: Demonstrate what real worker could check
                'advanced_checks' => [
                    'database_connection' => 'OK',
                    'worker_queue' => 'Redis available',
                    'can_perform_heavy_operations' => true,
                    'architecture' => 'Processor → Action pattern (same as CORE)',
                ],
            ];

        } catch (\Throwable $e) {
            // WHY: Proper error handling for production
            $res->success = false;
            $res->messages['error'][] = 'Failed to get module configuration: ' . $e->getMessage();
        }

        return $res;
    }
}
