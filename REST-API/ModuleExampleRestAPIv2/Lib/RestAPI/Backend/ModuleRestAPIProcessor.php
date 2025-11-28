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
 * Backend processor for worker operations.
 *
 * Routes requests from WorkerApiCommands to specific Action classes.
 * Called via sendRequestToBackendWorker() from controllers.
 *
 * @package Modules\ModuleExampleRestAPIv2\Lib\RestAPI\Backend
 */
class ModuleRestAPIProcessor extends Injectable
{
    /**
     * Process request from worker queue.
     *
     * @param array $request Request with 'action' and 'data' keys
     * @return PBXApiResult Response to send back to client
     */
    public static function callBack(array $request): PBXApiResult
    {
        $action = $request['action'] ?? '';
        $res = new PBXApiResult();
        $res->processor = __METHOD__;

        switch ($action) {
            case 'getConfig':
                $res = GetConfigAction::main($request);
                break;

            case 'getUsers':
                $res = GetUsersAction::main($request);
                break;

            case 'downloadFile':
                $res = DownloadFileAction::main($request);
                break;

            case 'createUser':
                $res = CreateUserAction::main($request);
                break;

            case 'updateUser':
                $res = UpdateUserAction::main($request);
                break;

            case 'deleteUser':
                $res = DeleteUserAction::main($request);
                break;

            default:
                $res->success = false;
                $res->messages['error'][] = "Unknown action: {$action}";
        }

        $res->function = $action;

        return $res;
    }
}
