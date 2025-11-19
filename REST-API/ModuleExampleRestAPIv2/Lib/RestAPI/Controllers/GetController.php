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

namespace Modules\ModuleExampleRestAPIv2\Lib\RestAPI\Controllers;

use MikoPBX\PBXCoreREST\Controllers\Modules\ModulesControllerBase;
use Modules\ModuleExampleRestAPIv2\Lib\RestAPI\Backend\ModuleRestAPIProcessor;

/**
 * GetController - Backend (Worker) approach for GET operations
 *
 * SIMPLIFIED ARCHITECTURE:
 * All operations delegated to backend worker via ACTION_MAP.
 * No private methods - clean mapping from URL action to backend processor action.
 *
 * AVAILABLE ACTIONS:
 * - config: Get module configuration (GetConfigAction)
 * - users: Query users with JOINs (GetUsersAction)
 * - download: Download files (DownloadFileAction)
 *
 * ADDING NEW ACTIONS:
 * Just add to ACTION_MAP - no need for new methods!
 *
 * @package Modules\ModuleExampleRestAPIv2\Lib\RestAPI\Controllers
 */
class GetController extends ModulesControllerBase
{
    /**
     * Action mapping: URL action => Backend processor action
     *
     * WHY: Single source of truth for action routing
     * Adding new action = add one line to this map
     */
    private const ACTION_MAP = [
        'config' => 'getConfig',      // GetConfigAction::main()
        'users' => 'getUsers',        // GetUsersAction::main()
        'download' => 'downloadFile', // DownloadFileAction::main()
    ];

    /**
     * Route actions to backend worker
     *
     * WHY: Simplified routing - no private methods needed
     * All actions delegated to backend worker via ACTION_MAP
     *
     * EXAMPLE REQUESTS:
     * curl 'http://127.0.0.1/pbxcore/api/module-example-rest-api-v2/config'
     * curl 'http://127.0.0.1/pbxcore/api/module-example-rest-api-v2/users'
     * curl -O 'http://127.0.0.1/pbxcore/api/module-example-rest-api-v2/download?filename=example.txt'
     *
     * @param string $actionName Action name from URL
     * @return void
     */
    public function callAction(string $actionName): void
    {
        // Validate action exists
        if (!isset(self::ACTION_MAP[$actionName])) {
            $this->response->setPayloadError("Unknown action: {$actionName}");
            $this->response->send();
            return;
        }

        // Send request to backend worker
        $this->sendRequestToBackendWorker(
            ModuleRestAPIProcessor::class,
            self::ACTION_MAP[$actionName],
            $_REQUEST,
            '',
            30,
            0
        );
    }
}
