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
 * Get module configuration from database.
 *
 * @package Modules\ModuleExampleRestAPIv2\Lib\RestAPI\Backend\Actions
 */
class GetConfigAction extends Injectable
{
    /**
     * Get module configuration.
     *
     * @param array $request Request data
     * @return PBXApiResult
     */
    public static function main(array $request): PBXApiResult
    {
        $res = new PBXApiResult();
        $res->processor = __METHOD__;

        try {
            $moduleRecord = ModuleExampleRestAPIv2::findFirst();

            $res->success = true;
            $res->data = [
                'api_version' => 'v2',
                'module_enabled' => $moduleRecord ? (int)$moduleRecord->disabled === 0 : false,
                'settings' => $moduleRecord ? [
                    'textField' => $moduleRecord->textField ?? '',
                    'areaField' => $moduleRecord->areaField ?? '',
                    'integerField' => $moduleRecord->integerField ?? 0,
                    'checkboxField' => $moduleRecord->checkboxField ?? false,
                    'toggleField' => $moduleRecord->toggleField ?? false,
                ] : null,
            ];

        } catch (\Throwable $e) {
            $res->success = false;
            $res->messages['error'][] = 'Failed to get config: ' . $e->getMessage();
        }

        return $res;
    }
}
