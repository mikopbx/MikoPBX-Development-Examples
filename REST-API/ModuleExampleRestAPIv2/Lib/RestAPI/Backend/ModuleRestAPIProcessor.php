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

namespace Modules\ModuleExampleRestAPIv2\Lib\RestAPI\Backend;

use MikoPBX\PBXCoreREST\Lib\PBXApiResult;
use Modules\ModuleExampleRestAPIv2\Lib\RestAPI\Backend\Actions\GetConfigAction;
use Modules\ModuleExampleRestAPIv2\Lib\RestAPI\Backend\Actions\GetUsersAction;
use Modules\ModuleExampleRestAPIv2\Lib\RestAPI\Backend\Actions\DownloadFileAction;
use Modules\ModuleExampleRestAPIv2\Lib\RestAPI\Backend\Actions\CreateUserAction;
use Modules\ModuleExampleRestAPIv2\Lib\RestAPI\Backend\Actions\UpdateUserAction;
use Modules\ModuleExampleRestAPIv2\Lib\RestAPI\Backend\Actions\DeleteUserAction;
use Phalcon\Di\Injectable;

/**
 * ModuleRestAPIProcessor - Backend processor for Worker operations
 *
 * WHY THIS CLASS EXISTS:
 * Backend approach requires backend worker to process requests asynchronously.
 * This processor acts as a router that delegates to specific Action classes based on the action name.
 *
 * HOW IT WORKS:
 * 1. Controller calls sendRequestToBackendWorker():
 *    $this->sendRequestToBackendWorker(
 *        \Modules\ModuleExampleRestAPIv2\Lib\RestAPI\Backend\ModuleRestAPIProcessor::class,
 *        'getConfig',
 *        $_REQUEST,
 *        'ModuleExampleRestAPIv2',
 *        30,
 *        0
 *    );
 *
 * 2. Request is queued to Redis with structure:
 *    [
 *        'processor' => ModuleRestAPIProcessor::class,
 *        'data' => [
 *            'action' => 'getConfig',
 *            'asyncChannelId' => 'unique-id',
 *            'data' => $_REQUEST
 *        ]
 *    ]
 *
 * 3. WorkerApiCommands picks up request from Redis queue
 *
 * 4. WorkerApiCommands calls this processor:
 *    $processorClass = $request['processor']; // ModuleRestAPIProcessor::class
 *    $res = $processorClass::callBack($request['data']);
 *
 * 5. This callBack() method routes to specific Action class:
 *    - 'getConfig' → GetConfigAction::main()
 *    - 'getUsers' → GetUsersAction::main()
 *    - 'downloadFile' → DownloadFileAction::main()
 *    - 'createUser' → CreateUserAction::main()
 *    - 'updateUser' → UpdateUserAction::main()
 *    - 'deleteUser' → DeleteUserAction::main()
 *
 * 6. Action performs heavy operation (DB query, file generation)
 *
 * 7. Returns PBXApiResult or fpassthru format
 *
 * 8. Response sent back via Redis to waiting controller
 *
 * 9. BaseController.handleResponse() sends to client
 *
 * APPROACH COMPARISON:
 * - Frontend (Controller):
 *   Request → Controller → Method → Response (5-10ms, blocking)
 *
 * - Backend (Worker via Processor):
 *   Request → Controller → Redis → WorkerApiCommands → Processor::callBack() → Action::main() → Response
 *   (30-50ms overhead, non-blocking)
 *
 * ARCHITECTURE BENEFITS:
 * - Separation of concerns: Controller handles HTTP, Processor routes, Actions execute
 * - Easy to add new actions: Just create new Action class and add case to switch
 * - Testable: Each Action can be tested independently
 * - Same pattern as CORE (SysinfoManagementProcessor, etc.)
 *
 * @package Modules\ModuleExampleRestAPIv2\Lib\RestAPI\Backend
 */
class ModuleRestAPIProcessor extends Injectable
{
    /**
     * Processes REST API requests for Backend (Worker)
     *
     * WHY STATIC METHOD:
     * - WorkerApiCommands calls it statically: $processorClass::callBack()
     * - No need for instance, just routing logic
     * - Same pattern as all CORE processors
     *
     * REQUEST STRUCTURE:
     * [
     *     'action' => 'getConfig',           // Action name to execute
     *     'data' => [...],                   // Original request data from controller
     *     'asyncChannelId' => 'unique-id',   // For async response routing
     * ]
     *
     * RESPONSE:
     * Returns PBXApiResult with:
     * - success: true/false
     * - data: response data or fpassthru format for files
     * - messages: errors or warnings
     * - processor: __METHOD__ for debugging
     * - function: action name for debugging
     *
     * @param array $request Request from worker queue
     * @return PBXApiResult Response to send back to client
     */
    public static function callBack(array $request): PBXApiResult
    {
        // WHY: Extract action name from request
        $action = $request['action'] ?? '';

        // WHY: Create initial result with processor metadata
        $res = new PBXApiResult();
        $res->processor = __METHOD__;

        // WHY: Route to specific Action class based on action name
        // Each Action is a separate class with static main() method
        // This follows CORE pattern (GetInfoAction, GetExternalIpInfoAction, etc.)
        switch ($action) {
            case 'getConfig':
                // WHY: Get module configuration from database
                // Action queries ModuleExampleRestAPIv2 model
                $res = GetConfigAction::main($request);
                break;

            case 'getUsers':
                // WHY: Get users with complex JOIN query
                // Action queries Users + Extensions + Sip tables
                $res = GetUsersAction::main($request);
                break;

            case 'downloadFile':
                // WHY: Generate and download file
                // Action returns fpassthru format for file streaming
                $res = DownloadFileAction::main($request);
                break;

            case 'createUser':
                // WHY: Create new user with validation and database transaction
                // Action validates data, checks uniqueness, creates user record
                $res = CreateUserAction::main($request);
                break;

            case 'updateUser':
                // WHY: Update existing user with validation
                // Action validates user exists, updates record, logs changes
                $res = UpdateUserAction::main($request);
                break;

            case 'deleteUser':
                // WHY: Delete user with cascading operations
                // Action deletes related records, archives data, logs deletion
                $res = DeleteUserAction::main($request);
                break;

            default:
                // WHY: Return error if action not recognized
                $res->success = false;
                $res->messages['error'][] = "Unknown action - $action in " . __CLASS__;
                $res->data = [
                    'available_actions' => ['getConfig', 'getUsers', 'downloadFile', 'createUser', 'updateUser', 'deleteUser'],
                    'requested_action' => $action,
                ];
        }

        // WHY: Add action name to response for debugging
        $res->function = $action;

        return $res;
    }
}
