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
use Modules\ModuleExampleRestAPIv3\Models\Tasks;

/**
 * GetRecordAction - Returns single task by ID
 *
 * WHY: Dedicated Action class for GET /tasks/{id} resource endpoint
 * Handles retrieving and returning a single task record
 *
 * @package Modules\ModuleExampleRestAPIv3\Lib\RestAPI\Tasks\Actions
 */
class GetRecordAction
{
    /**
     * Execute action
     *
     * @param array<string, mixed> $data Request data with 'id' parameter
     * @return PBXApiResult Response with single task
     */
    public static function main(array $data): PBXApiResult
    {
        $result = new PBXApiResult();

        $id = $data['id'] ?? null;
        if (!$id) {
            $result->messages['error'][] = 'Task ID is required';
            return $result;
        }

        // WHY: Example data - real implementation would query database
        // $task = Tasks::findByUniqid($id);
        $result->data = [
            'id' => (int)$id,
            'title' => "Example Task {$id}",
            'status' => 'pending',
            'priority' => 5
        ];
        $result->success = true;

        return $result;
    }
}
