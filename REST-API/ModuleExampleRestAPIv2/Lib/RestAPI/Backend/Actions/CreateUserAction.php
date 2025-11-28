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
use Phalcon\Di\Injectable;

/**
 * Create user action (demonstration).
 *
 * In real implementation would create user in database with validation.
 *
 * @package Modules\ModuleExampleRestAPIv2\Lib\RestAPI\Backend\Actions
 */
class CreateUserAction extends Injectable
{
    /**
     * Create new user.
     *
     * @param array $request Request with 'data' containing 'name' and optional 'role', 'email'
     * @return PBXApiResult
     */
    public static function main(array $request): PBXApiResult
    {
        $res = new PBXApiResult();
        $res->processor = __METHOD__;

        try {
            $data = $request['data'] ?? [];

            if (empty($data['name'])) {
                $res->success = false;
                $res->messages['error'][] = 'Name is required';
                return $res;
            }

            // Demonstration: simulate user creation
            $userId = rand(1000, 9999);

            $res->success = true;
            $res->httpCode = 201;
            $res->data = [
                'user' => [
                    'id' => $userId,
                    'name' => $data['name'],
                    'role' => $data['role'] ?? 'user',
                    'email' => $data['email'] ?? null,
                    'created_at' => date('Y-m-d H:i:s'),
                ],
                'message' => 'User created successfully',
            ];

        } catch (\Throwable $e) {
            $res->success = false;
            $res->messages['error'][] = 'Failed to create user: ' . $e->getMessage();
        }

        return $res;
    }
}
