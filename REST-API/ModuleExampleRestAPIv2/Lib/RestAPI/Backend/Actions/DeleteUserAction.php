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
 * DeleteUserAction - Delete user via backend worker
 *
 * BACKEND (Worker via Processor):
 * This action demonstrates user deletion with cascading operations and audit logging.
 *
 * WHY BACKEND:
 * - Database write operation (transaction with cascading deletes)
 * - Validation before deletion (user exists, no active dependencies)
 * - Cascading operations (delete extensions, SIP accounts, permissions)
 * - Audit logging (preserve deletion record for compliance)
 * - Optional archival (backup user data before deletion)
 * - Non-blocking operation
 *
 * WHAT THIS ACTION DOES:
 * - Validates user exists in database
 * - Checks for active dependencies (ongoing calls, owned resources)
 * - Archives user data for compliance/recovery
 * - Begins database transaction
 * - Deletes related records (extensions, SIP accounts, permissions, call history)
 * - Deletes user record
 * - Commits transaction
 * - Logs deletion in audit table
 * - Returns deletion confirmation
 *
 * PERFORMANCE: ~50-100ms (depends on amount of related data to delete)
 *
 * REAL WORLD USE CASE:
 * - Admin removes terminated employee from system
 * - Bulk user cleanup operations
 * - User account deactivation/deletion workflow
 * - GDPR compliance (right to be forgotten)
 *
 * REQUEST STRUCTURE:
 * [
 *     'action' => 'deleteUser',
 *     'data' => [
 *         'id' => 123,
 *         'archive' => true,   // Optional: archive before delete
 *     ]
 * ]
 *
 * RESPONSE:
 * PBXApiResult with:
 * - success: true/false
 * - data: deletion confirmation
 * - processor: __METHOD__ for debugging
 * - httpCode: 200 OK
 *
 * @package Modules\ModuleExampleRestAPIv2\Lib\RestAPI\Backend\Actions
 */
class DeleteUserAction extends Injectable
{
    /**
     * Delete user with cascading operations
     *
     * WHY STATIC METHOD:
     * - Called by processor without instantiation
     * - Same pattern as CORE actions
     * - No state needed, just delete user and return result
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
            $shouldArchive = !empty($data['archive']);

            // WHY: In real implementation, you would:
            // 1. Query database to check if user exists
            // 2. If not exists, return 404 error
            // 3. Check for active dependencies:
            //    - Active calls for user's extensions
            //    - Owned resources (conference rooms, IVR menus)
            //    - Scheduled callbacks
            // 4. If dependencies exist, return error or force delete
            // 5. Archive user data if requested:
            //    - Export user settings to JSON
            //    - Copy to archive table
            //    - Store in file for backup
            // 6. Begin database transaction
            // 7. Delete related records in order:
            //    - Extensions (CASCADE will delete SIP accounts)
            //    - Permissions
            //    - Call history (optional, or just NULL the user_id)
            //    - User preferences
            // 8. Delete user record
            // 9. Commit transaction
            // 10. Log deletion in audit table with timestamp and admin who deleted

            // For demonstration, we'll simulate user deletion
            $deletedRecords = [
                'extensions' => rand(1, 5),
                'permissions' => rand(5, 15),
                'preferences' => 1,
            ];

            $res->success = true;
            $res->httpCode = 200; // OK
            $res->data = [
                'approach' => 'Backend (Worker via Processor + Action)',
                'processor_class' => 'ModuleRestAPIProcessor',
                'action_class' => __CLASS__,
                'operation' => 'DELETE',
                'user' => [
                    'id' => $userId,
                    'deleted_at' => date('Y-m-d H:i:s'),
                ],
                'cascading_deletes' => $deletedRecords,
                'total_records_deleted' => array_sum($deletedRecords) + 1, // +1 for user itself
                'archived' => $shouldArchive,
                'message' => 'User deleted successfully with all related data',
            ];

        } catch (\Throwable $e) {
            // WHY: Proper error handling for production
            $res->success = false;
            $res->messages['error'][] = 'Failed to delete user: ' . $e->getMessage();
        }

        return $res;
    }
}
