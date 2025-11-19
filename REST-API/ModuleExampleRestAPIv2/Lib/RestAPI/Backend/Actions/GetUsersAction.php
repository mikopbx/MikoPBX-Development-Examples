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

use MikoPBX\Common\Models\Extensions;
use MikoPBX\Common\Models\Sip;
use MikoPBX\Common\Models\Users;
use MikoPBX\PBXCoreREST\Lib\PBXApiResult;
use Phalcon\Di\Di;
use Phalcon\Di\Injectable;

/**
 * GetUsersAction - Get users from database with complex JOIN queries
 *
 * BACKEND (Worker via Processor):
 * This action is called by backend worker to perform complex database queries asynchronously.
 *
 * WHY BACKEND:
 * - Complex database query with multiple JOINs
 * - Potentially slow query with large datasets
 * - Non-blocking operation allows multiple concurrent requests
 * - Can apply filters, sorting, pagination from request parameters
 *
 * WHAT THIS ACTION DOES:
 * - Queries Users table
 * - JOINs with Extensions table (user's extension numbers)
 * - JOINs with Sip table (SIP account details)
 * - Returns comprehensive user data with extension and SIP info
 *
 * PERFORMANCE: ~50-200ms (depends on dataset size and query complexity)
 *
 * REAL WORLD USE CASE:
 * - Admin panel user management
 * - Call center agent lists with extension status
 * - User directory with contact information
 * - Export user data for reporting
 *
 * QUERY STRUCTURE:
 * SELECT u.*, e.number as extension, s.host as sip_host
 * FROM Users u
 * LEFT JOIN Extensions e ON u.id = e.userid
 * LEFT JOIN Sip s ON e.number = s.extension
 * WHERE [filters from request]
 * ORDER BY [sort from request]
 * LIMIT [pagination from request]
 *
 * HOW IT'S CALLED:
 * Controller → sendRequestToBackendWorker(ModuleRestAPIProcessor::class, 'getUsers', ...)
 *          → Redis queue → WorkerApiCommands
 *          → ModuleRestAPIProcessor::callBack(['action' => 'getUsers'])
 *          → GetUsersAction::main()
 *
 * @package Modules\ModuleExampleRestAPIv2\Lib\RestAPI\Backend\Actions
 */
class GetUsersAction extends Injectable
{
    /**
     * Get users from database with JOINs
     *
     * WHY STATIC METHOD:
     * - Called by processor without instantiation
     * - Same pattern as CORE actions
     * - Accesses DI container statically via Di::getDefault()
     *
     * REQUEST STRUCTURE:
     * [
     *     'action' => 'getUsers',
     *     'data' => [
     *         'role' => 'admin',        // Optional: filter by role
     *         'search' => 'john',       // Optional: search in username/email
     *         'limit' => 50,            // Optional: pagination limit
     *         'offset' => 0,            // Optional: pagination offset
     *         'orderBy' => 'username',  // Optional: sort column
     *         'orderDirection' => 'ASC' // Optional: sort direction
     *     ]
     * ]
     *
     * RESPONSE:
     * PBXApiResult with:
     * - success: true/false
     * - data: array of users with extensions and SIP info
     * - processor: __METHOD__ for debugging
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

            // WHY: Get DI container to access modelsManager
            $di = Di::getDefault();

            // WHY: Build complex query with JOINs using Phalcon QueryBuilder
            // This demonstrates real database operations that justify worker pattern
            $builder = $di->get('modelsManager')->createBuilder()
                ->columns([
                    'Users.id',
                    'Users.username',
                    'Users.email',
                    'Extensions.number AS extension',
                    'Sip.host AS sip_host',
                    'Sip.port AS sip_port',
                ])
                ->from(['Users' => Users::class])
                ->leftJoin(
                    Extensions::class,
                    'Users.id = Extensions.userid',
                    'Extensions'
                )
                ->leftJoin(
                    Sip::class,
                    'Extensions.number = Sip.extension',
                    'Sip'
                );

            // WHY: Apply filters from request data
            // Real API would support search, role filtering, etc.
            if (!empty($data['role'])) {
                $builder->andWhere('Users.role = :role:', ['role' => $data['role']]);
            }

            if (!empty($data['search'])) {
                $builder->andWhere(
                    'Users.username LIKE :search: OR Users.email LIKE :search:',
                    ['search' => '%' . $data['search'] . '%']
                );
            }

            // WHY: Apply pagination from request data
            $limit = (int)($data['limit'] ?? 50);
            $offset = (int)($data['offset'] ?? 0);
            $builder->limit($limit, $offset);

            // WHY: Apply sorting from request data
            $orderBy = $data['orderBy'] ?? 'Users.username';
            $orderDirection = $data['orderDirection'] ?? 'ASC';
            $builder->orderBy("{$orderBy} {$orderDirection}");

            // WHY: Execute query and convert to array
            $query = $builder->getQuery();
            $users = $query->execute()->toArray();

            $res->success = true;
            $res->data = [
                'approach' => 'Backend (Worker via Processor + Action)',
                'processor_class' => 'ModuleRestAPIProcessor',
                'action_class' => __CLASS__,
                'total_count' => count($users),
                'pagination' => [
                    'limit' => $limit,
                    'offset' => $offset,
                ],
                'users' => $users,

                // WHY: Show query metadata for debugging
                'query_info' => [
                    'joins' => ['Extensions', 'Sip'],
                    'filters_applied' => array_keys(array_filter([
                        'role' => !empty($data['role']),
                        'search' => !empty($data['search']),
                    ])),
                    'estimated_time' => count($users) > 100 ? '100-200ms' : '50-100ms',
                    'architecture' => 'Processor → Action pattern with complex JOIN queries',
                ],
            ];

        } catch (\Throwable $e) {
            // WHY: Proper error handling for production
            $res->success = false;
            $res->messages['error'][] = 'Failed to get users: ' . $e->getMessage();
        }

        return $res;
    }
}
