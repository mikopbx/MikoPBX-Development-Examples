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
 * GetListAction - Returns list of all tasks
 *
 * WHY: Dedicated Action class for GET /tasks collection endpoint
 * Handles retrieving and returning multiple task records
 *
 * REAL IMPLEMENTATION WOULD:
 * - Query Tasks model: $tasks = Tasks::find()
 * - Apply filtering from $data (status, priority, etc.)
 * - Implement pagination (limit, offset)
 * - Return array of task objects
 *
 * @package Modules\ModuleExampleRestAPIv3\Lib\RestAPI\Tasks\Actions
 */
class GetListAction
{
    /**
     * Execute action
     *
     * WHY: Static method allows invocation without instantiation
     * Processor can call directly: GetListAction::main($data)
     *
     * @param array<string, mixed> $data Request data (query params, filters)
     * @return PBXApiResult Response with list of tasks
     */
    public static function main(array $data): PBXApiResult
    {
        $result = new PBXApiResult();
        $result->success = true;

        // WHY: Example data - real implementation would query database
        // $tasks = Tasks::find()->toArray();
        $result->data = [
            ['id' => 1, 'title' => 'Example Task 1', 'status' => 'pending', 'priority' => 5],
            ['id' => 2, 'title' => 'Example Task 2', 'status' => 'in_progress', 'priority' => 8],
        ];

        return $result;
    }
}
