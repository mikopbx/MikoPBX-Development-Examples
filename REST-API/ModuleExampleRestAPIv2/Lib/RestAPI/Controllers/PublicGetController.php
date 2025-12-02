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
 * Controller for PUBLIC GET requests (no authentication required).
 *
 * WHY: Demonstrates how external modules can add PUBLIC endpoints
 * that don't require any authentication (no Bearer token, no localhost restriction).
 *
 * USE CASES FOR PUBLIC ENDPOINTS:
 * - Health checks and status monitoring
 * - Webhook receivers (e.g., payment callbacks, SMS delivery reports)
 * - OAuth2 callbacks
 * - Public API information endpoints
 *
 * SECURITY CONSIDERATIONS:
 * - PUBLIC endpoints are accessible by anyone on the network
 * - Never expose sensitive data through PUBLIC endpoints
 * - Consider rate limiting for production use
 * - Validate all input data carefully
 *
 * HOW IT WORKS:
 * - Registered via getPBXCoreRESTAdditionalRoutes() with NoAuth=true (6th parameter)
 * - Routes: /pbxcore/api/module-example-rest-api-v2/public/{actionName}
 *
 * @package Modules\ModuleExampleRestAPIv2\Lib\RestAPI\Controllers
 */
class PublicGetController extends ModulesControllerBase
{
    /**
     * URL action => processor action mapping for PUBLIC endpoints.
     */
    private const ACTION_MAP = [
        'status' => 'getStatus',
    ];

    /**
     * Route action to backend worker.
     *
     * @param string $actionName Action name from URL
     */
    public function callAction(string $actionName): void
    {
        if (!isset(self::ACTION_MAP[$actionName])) {
            $this->response->setPayloadError("Unknown action: {$actionName}");
            $this->response->send();
            return;
        }

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
