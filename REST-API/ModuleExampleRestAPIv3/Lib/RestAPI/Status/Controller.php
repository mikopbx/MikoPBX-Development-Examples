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

namespace Modules\ModuleExampleRestAPIv3\Lib\RestAPI\Status;

use MikoPBX\PBXCoreREST\Controllers\BaseRestController;
use MikoPBX\PBXCoreREST\Attributes\{
    ApiResource,
    ApiOperation,
    ApiResponse,
    ApiDataSchema,
    HttpMapping,
    SecurityType,
    ResourceSecurity
};

/**
 * Public Status Controller - Example of PUBLIC endpoint in external module
 *
 * WHY: Demonstrates how external modules can add PUBLIC endpoints
 * that don't require any authentication (no Bearer token, no localhost restriction)
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
 * @package Modules\ModuleExampleRestAPIv3\Lib\RestAPI\Status
 */
#[ApiResource(
    path: '/pbxcore/api/v3/module-example-rest-api-v3/status',
    tags: ['Module Example REST API v3 - Public Status'],
    description: 'Public status endpoint (no authentication required)',
    processor: Processor::class
)]
#[HttpMapping(
    mapping: [
        'GET' => ['getStatus']
    ],
    resourceLevelMethods: [],
    collectionLevelMethods: [],
    customMethods: ['getStatus']
)]
#[ResourceSecurity('module-example-rest-api-v3-status', requirements: [SecurityType::PUBLIC])]
class Controller extends BaseRestController
{
    /**
     * The processor class to handle requests
     * @var string
     */
    protected string $processorClass = Processor::class;

    /**
     * Get module status (PUBLIC - no authentication required)
     *
     * This endpoint demonstrates PUBLIC access from external module.
     * It returns basic status information without requiring any authentication.
     *
     * @route GET /pbxcore/api/v3/module-example-rest-api-v3/status:getStatus
     */
    #[ApiDataSchema(schemaClass: DataStructure::class, type: 'detail')]
    #[ApiOperation(
        summary: 'rest_status_GetStatus',
        description: 'rest_status_GetStatusDesc',
        operationId: 'getModuleStatus'
    )]
    #[ApiResponse(200, 'rest_response_200_status')]
    #[ApiResponse(500, 'rest_response_500')]
    public function getStatus(): void {}
}
