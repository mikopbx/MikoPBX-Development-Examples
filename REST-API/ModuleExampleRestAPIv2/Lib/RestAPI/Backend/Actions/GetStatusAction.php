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

/**
 * GetStatusAction - Returns module status (PUBLIC endpoint).
 *
 * WHY: Demonstrates a PUBLIC endpoint implementation in external module using Pattern 2.
 * This endpoint doesn't require any authentication.
 *
 * USE CASES:
 * - Health check endpoint for monitoring systems
 * - Status page integration
 * - Load balancer health probes
 * - Public API information
 *
 * SECURITY NOTE:
 * - Only return non-sensitive information
 * - Don't expose internal system details
 * - Consider rate limiting in production
 *
 * @package Modules\ModuleExampleRestAPIv2\Lib\RestAPI\Backend\Actions
 */
class GetStatusAction
{
    /**
     * Module unique ID.
     */
    private const MODULE_UNIQUE_ID = 'ModuleExampleRestAPIv2';

    /**
     * Module version.
     */
    private const MODULE_VERSION = '1.0.0';

    /**
     * Execute action.
     *
     * @param array<string, mixed> $request Request data (not used for status)
     * @return PBXApiResult Response with module status
     */
    public static function main(array $request): PBXApiResult
    {
        $result = new PBXApiResult();
        $result->processor = __METHOD__;
        $result->success = true;

        $result->data = [
            'moduleName' => self::MODULE_UNIQUE_ID,
            'moduleVersion' => self::MODULE_VERSION,
            'apiPattern' => 'Pattern 2 - Extended REST API',
            'status' => 'ok',
            'timestamp' => date('c'),
            'message' => 'Module is running normally. This is a PUBLIC endpoint example (Pattern 2).',
        ];

        return $result;
    }
}
