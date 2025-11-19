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
 * DeleteRecordAction - Deletes a task
 *
 * WHY: Dedicated Action class for DELETE /tasks/{id} endpoint
 * Handles safe deletion with validation
 *
 * @package Modules\ModuleExampleRestAPIv3\Lib\RestAPI\Tasks\Actions
 */
class DeleteRecordAction
{
    /**
     * Execute action
     *
     * @param array<string, mixed> $data Request data with 'id' parameter
     * @return PBXApiResult Response confirming deletion
     */
    public static function main(array $data): PBXApiResult
    {
        $result = new PBXApiResult();

        $id = $data['id'] ?? null;
        if (!$id) {
            $result->messages['error'][] = 'Task ID is required';
            return $result;
        }

        // WHY: Example - real implementation would:
        // $task = Tasks::findByUniqid($id);
        // if (!$task) {
        //     $result->messages['error'][] = 'Task not found';
        //     return $result;
        // }
        // $task->delete();

        $result->success = true;
        $result->data = ['id' => $id, 'deleted' => true];

        return $result;
    }
}
