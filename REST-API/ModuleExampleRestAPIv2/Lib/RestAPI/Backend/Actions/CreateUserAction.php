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
 * CreateUserAction - Create new user via backend worker
 *
 * BACKEND (Worker via Processor):
 * This action demonstrates user creation with database transaction and validation.
 *
 * WHY BACKEND:
 * - Database write operation (transaction required)
 * - Complex validation (username uniqueness, email format, password strength)
 * - Audit logging (track who created user and when)
 * - Side effects (create extension, send welcome email, etc.)
 * - Non-blocking operation
 *
 * WHAT THIS ACTION DOES:
 * - Validates input data (required fields, formats)
 * - Checks username/email uniqueness
 * - Hashes password (if provided)
 * - Creates user record in database
 * - Creates related records (extension, permissions)
 * - Logs audit entry
 * - Returns created user data
 *
 * PERFORMANCE: ~30-50ms for simple user creation
 *
 * REAL WORLD USE CASE:
 * - Admin creates new user via web interface
 * - API integration creates multiple users
 * - Self-registration workflow
 * - User provisioning from external system
 *
 * REQUEST STRUCTURE:
 * [
 *     'action' => 'createUser',
 *     'data' => [
 *         'name' => 'John Doe',
 *         'role' => 'admin',
 *         'email' => 'john@example.com',  // Optional
 *         'password' => 'secret123',       // Optional
 *     ]
 * ]
 *
 * RESPONSE:
 * PBXApiResult with:
 * - success: true/false
 * - data: created user with id
 * - processor: __METHOD__ for debugging
 * - httpCode: 201 Created
 *
 * @package Modules\ModuleExampleRestAPIv2\Lib\RestAPI\Backend\Actions
 */
class CreateUserAction extends Injectable
{
    /**
     * Create new user
     *
     * WHY STATIC METHOD:
     * - Called by processor without instantiation
     * - Same pattern as CORE actions
     * - No state needed, just create user and return result
     *
     * @param array $request Request data from processor
     * @return PBXApiResult An object containing the result of the API call
     */
    public static function main(array $request): PBXApiResult
    {
        $res = new PBXApiResult();
        $res->processor = __METHOD__;

        try {
            // WHY: Extract request data
            $data = $request['data'] ?? [];

            // WHY: Validate required fields
            if (empty($data['name'])) {
                $res->success = false;
                $res->messages['error'][] = 'Name is required';
                return $res;
            }

            // WHY: In real implementation, you would:
            // 1. Check username/email uniqueness in database
            // 2. Validate email format
            // 3. Hash password with password_hash()
            // 4. Begin database transaction
            // 5. Create user record
            // 6. Create extension record
            // 7. Set user permissions
            // 8. Commit transaction
            // 9. Log audit entry

            // For demonstration, we'll simulate user creation
            $userId = rand(1000, 9999);

            $res->success = true;
            $res->httpCode = 201; // Created
            $res->data = [
                'approach' => 'Backend (Worker via Processor + Action)',
                'processor_class' => 'ModuleRestAPIProcessor',
                'action_class' => __CLASS__,
                'operation' => 'CREATE',
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
            // WHY: Proper error handling for production
            $res->success = false;
            $res->messages['error'][] = 'Failed to create user: ' . $e->getMessage();
        }

        return $res;
    }
}
