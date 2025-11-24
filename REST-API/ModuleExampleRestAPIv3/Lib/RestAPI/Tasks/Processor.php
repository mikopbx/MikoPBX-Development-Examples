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

namespace Modules\ModuleExampleRestAPIv3\Lib\RestAPI\Tasks;

use MikoPBX\PBXCoreREST\Lib\PBXApiResult;
use Modules\ModuleExampleRestAPIv3\Lib\RestAPI\Tasks\Actions\{
    GetListAction,
    GetRecordAction,
    SaveRecordAction,
    DeleteRecordAction,
    GetDefaultAction,
    DownloadFileAction,
    UploadFileAction
};
use Phalcon\Di\Injectable;

/**
 * Processor - Routes requests to Action classes
 *
 * PATTERN: Processor + Actions architecture (Core pattern)
 * - Processor class: Defines available operations and routing via callBack()
 * - Action classes: Contain business logic for each operation
 * - Benefits: Clean separation, easy testing, consistent with Core
 *
 * HOW IT WORKS:
 * 1. BaseRestController receives HTTP request
 * 2. Calls Processor::callBack() with action name and data
 * 3. Processor routes to appropriate Action class
 * 4. Action returns PBXApiResult
 *
 * @package Modules\ModuleExampleRestAPIv3\Lib\RestAPI\Tasks
 */
class Processor extends Injectable
{
    /**
     * Processes the Tasks request.
     *
     * @param array<string, mixed> $request The request data containing 'action' and other parameters
     *
     * @return PBXApiResult An object containing the result of the API call
     */
    public static function callBack(array $request): PBXApiResult
    {
        $res = new PBXApiResult();
        $res->processor = __METHOD__;
        $action = $request['action'] ?? '';

        switch ($action) {
            case 'getList':
                $res = GetListAction::main($request['data'] ?? []);
                break;

            case 'getRecord':
                $res = GetRecordAction::main($request['data'] ?? []);
                break;

            case 'create':
            case 'update':
            case 'patch':
                // WHY: Create, Update, and Patch all use SaveRecordAction
                // SaveRecordAction checks if ID exists to determine create vs update
                $res = SaveRecordAction::main($request['data'] ?? []);
                break;

            case 'delete':
                $res = DeleteRecordAction::main($request['data'] ?? []);
                break;

            case 'getDefault':
                $res = GetDefaultAction::main($request['data'] ?? []);
                break;

            case 'download':
                $res = DownloadFileAction::main($request['data'] ?? []);
                break;

            case 'uploadFile':
                $res = UploadFileAction::main($request['data'] ?? []);
                break;

            default:
                $res->messages['error'][] = "Unknown action - $action in " . __CLASS__;
                break;
        }

        $res->function = $action;
        return $res;
    }
}
