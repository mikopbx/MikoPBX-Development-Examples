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

use MikoPBX\PBXCoreREST\Lib\PBXApiResult;
use Modules\ModuleExampleRestAPIv3\Lib\RestAPI\Status\Actions\GetStatusAction;
use Phalcon\Di\Injectable;

/**
 * Processor - Routes requests to Action classes for Status resource
 *
 * WHY: Follows the same Processor + Actions pattern as Tasks resource
 * This demonstrates consistency across all module REST API resources
 *
 * @package Modules\ModuleExampleRestAPIv3\Lib\RestAPI\Status
 */
class Processor extends Injectable
{
    /**
     * Processes the Status request
     *
     * @param array<string, mixed> $request The request data containing 'action' and other parameters
     * @return PBXApiResult An object containing the result of the API call
     */
    public static function callBack(array $request): PBXApiResult
    {
        $res = new PBXApiResult();
        $res->processor = __METHOD__;
        $action = $request['action'] ?? '';

        switch ($action) {
            case 'getStatus':
                $res = GetStatusAction::main($request['data'] ?? []);
                break;

            default:
                $res->messages['error'][] = "Unknown action - $action in " . __CLASS__;
                break;
        }

        $res->function = $action;
        return $res;
    }
}
