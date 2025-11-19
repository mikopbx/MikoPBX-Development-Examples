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

namespace Modules\ModuleExampleRestAPIv3\Lib\RestAPI\Tasks\Actions;

use MikoPBX\PBXCoreREST\Lib\PBXApiResult;

/**
 * GetDefaultAction - Returns default task values
 *
 * WHY: Provides default field values for creating new tasks
 * Useful for populating forms with sensible defaults
 *
 * @package Modules\ModuleExampleRestAPIv3\Lib\RestAPI\Tasks\Actions
 */
class GetDefaultAction
{
    /**
     * Execute action
     *
     * @param array<string, mixed> $data Request data (not used)
     * @return PBXApiResult Response with default task values
     */
    public static function main(array $data): PBXApiResult
    {
        $result = new PBXApiResult();
        $result->success = true;

        // WHY: Returns default values from DataStructure
        $result->data = [
            'title' => '',
            'status' => 'pending',
            'priority' => 5
        ];

        return $result;
    }
}
