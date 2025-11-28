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
 * Get users from database with JOIN queries.
 *
 * Demonstrates complex database operations with filters and pagination.
 *
 * @package Modules\ModuleExampleRestAPIv2\Lib\RestAPI\Backend\Actions
 */
class GetUsersAction extends Injectable
{
    /**
     * Get users with extensions and SIP info.
     *
     * Supports filters: role, search
     * Supports pagination: limit, offset
     * Supports sorting: orderBy, orderDirection
     *
     * @param array $request Request data
     * @return PBXApiResult
     */
    public static function main(array $request): PBXApiResult
    {
        $res = new PBXApiResult();
        $res->processor = __METHOD__;

        try {
            $data = $request['data'] ?? [];
            $di = Di::getDefault();

            // Build query with JOINs
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
                ->leftJoin(Extensions::class, 'Users.id = Extensions.userid', 'Extensions')
                ->leftJoin(Sip::class, 'Extensions.number = Sip.extension', 'Sip');

            // Apply filters
            if (!empty($data['role'])) {
                $builder->andWhere('Users.role = :role:', ['role' => $data['role']]);
            }

            if (!empty($data['search'])) {
                $builder->andWhere(
                    'Users.username LIKE :search: OR Users.email LIKE :search:',
                    ['search' => '%' . $data['search'] . '%']
                );
            }

            // Apply pagination
            $limit = (int)($data['limit'] ?? 50);
            $offset = (int)($data['offset'] ?? 0);
            $builder->limit($limit, $offset);

            // Apply sorting
            $orderBy = $data['orderBy'] ?? 'Users.username';
            $orderDirection = $data['orderDirection'] ?? 'ASC';
            $builder->orderBy("{$orderBy} {$orderDirection}");

            $users = $builder->getQuery()->execute()->toArray();

            $res->success = true;
            $res->data = [
                'total_count' => count($users),
                'limit' => $limit,
                'offset' => $offset,
                'users' => $users,
            ];

        } catch (\Throwable $e) {
            $res->success = false;
            $res->messages['error'][] = 'Failed to get users: ' . $e->getMessage();
        }

        return $res;
    }
}
