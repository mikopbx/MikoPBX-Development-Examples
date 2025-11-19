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
 * UpdateUserAction - Update existing user via backend worker
 *
 * BACKEND (Worker via Processor):
 * This action demonstrates user update with database transaction and validation.
 *
 * WHY BACKEND:
 * - Database write operation (transaction required)
 * - Validation before update (user exists, new data is valid)
 * - Audit logging (track who modified user and what changed)
 * - Side effects (update related records, sync external systems)
 * - Non-blocking operation
 *
 * WHAT THIS ACTION DOES:
 * - Validates user exists in database
 * - Validates new data (email format, role is valid, etc.)
 * - Checks if new username/email conflicts with other users
 * - Updates user record in database transaction
 * - Updates related records (extension, permissions)
 * - Logs changes for audit trail
 * - Returns updated user data
 *
 * PERFORMANCE: ~30-50ms for simple user update
 *
 * REAL WORLD USE CASE:
 * - Admin updates user profile via web interface
 * - User updates own profile
 * - Bulk user updates from external system
 * - Role/permission changes
 *
 * REQUEST STRUCTURE:
 * [
 *     'action' => 'updateUser',
 *     'data' => [
 *         'id' => 123,
 *         'name' => 'Jane Doe',        // Optional
 *         'role' => 'manager',         // Optional
 *         'email' => 'jane@example.com', // Optional
 *     ]
 * ]
 *
 * RESPONSE:
 * PBXApiResult with:
 * - success: true/false
 * - data: updated user data
 * - processor: __METHOD__ for debugging
 * - httpCode: 200 OK
 *
 * @package Modules\ModuleExampleRestAPIv2\Lib\RestAPI\Backend\Actions
 */
class UpdateUserAction extends Injectable
{
    /**
     * Update existing user
     *
     * WHY STATIC METHOD:
     * - Called by processor without instantiation
     * - Same pattern as CORE actions
     * - No state needed, just update user and return result
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
            if (empty($data['id'])) {
                $res->success = false;
                $res->messages['error'][] = 'User ID is required';
                return $res;
            }

            $userId = (int)$data['id'];

            // WHY: In real implementation, you would:
            // 1. Query database to check if user exists
            // 2. If not exists, return 404 error
            // 3. Validate new data (email format, role is valid)
            // 4. Check if new username/email conflicts with other users
            // 5. Begin database transaction
            // 6. Update user record with new values
            // 7. Update related records (extension, permissions)
            // 8. Commit transaction
            // 9. Log changes in audit table (old values → new values)

            // For demonstration, we'll simulate user update
            $updatedFields = [];
            if (!empty($data['name'])) {
                $updatedFields['name'] = $data['name'];
            }
            if (!empty($data['role'])) {
                $updatedFields['role'] = $data['role'];
            }
            if (!empty($data['email'])) {
                $updatedFields['email'] = $data['email'];
            }

            $res->success = true;
            $res->httpCode = 200; // OK
            $res->data = [
                'approach' => 'Backend (Worker via Processor + Action)',
                'processor_class' => 'ModuleRestAPIProcessor',
                'action_class' => __CLASS__,
                'operation' => 'UPDATE',
                'user' => [
                    'id' => $userId,
                    ...$updatedFields,
                    'updated_at' => date('Y-m-d H:i:s'),
                ],
                'message' => 'User updated successfully',
                'changes' => count($updatedFields) . ' field(s) updated',
            ];

        } catch (\Throwable $e) {
            // WHY: Proper error handling for production
            $res->success = false;
            $res->messages['error'][] = 'Failed to update user: ' . $e->getMessage();
        }

        return $res;
    }
}
