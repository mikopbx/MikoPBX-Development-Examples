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
 * GetListAction - Returns the list of tasks from the database
 *
 * WHY: Dedicated Action class for the GET /tasks collection endpoint.
 * Reads real rows from the Tasks model and demonstrates an optional,
 * safely-bound filter plus deterministic ordering.
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
     * @return PBXApiResult Response with the list of tasks
     */
    public static function main(array $data): PBXApiResult
    {
        $result = new PBXApiResult();

        // WHY: Build query parameters dynamically. Use bound parameters
        // (:status:) — never string concatenation — to avoid SQL injection.
        $parameters = ['order' => 'priority DESC, id DESC'];
        if (!empty($data['status'])) {
            $parameters['conditions'] = 'status = :status:';
            $parameters['bind']       = ['status' => $data['status']];
        }

        // Tasks::find() returns a Phalcon resultset; toArray() yields plain rows.
        $result->data    = Tasks::find($parameters)->toArray();
        $result->success = true;

        return $result;
    }
}
