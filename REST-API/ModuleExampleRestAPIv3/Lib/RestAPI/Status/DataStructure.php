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

namespace Modules\ModuleExampleRestAPIv3\Lib\RestAPI\Status;

use MikoPBX\PBXCoreREST\Lib\Common\AbstractDataStructure;
use MikoPBX\PBXCoreREST\Lib\Common\OpenApiSchemaProvider;

/**
 * Data structure for Status resource
 *
 * WHY: Provides OpenAPI schemas for public Status endpoint
 * Follows Single Source of Truth pattern for field definitions
 *
 * @package Modules\ModuleExampleRestAPIv3\Lib\RestAPI\Status
 */
class DataStructure extends AbstractDataStructure implements OpenApiSchemaProvider
{
    /**
     * Get OpenAPI schema for status list item (not used, but required by interface)
     *
     * @return array<string, mixed> OpenAPI schema definition
     */
    public static function getListItemSchema(): array
    {
        return self::getDetailSchema();
    }

    /**
     * Get OpenAPI schema for status detail response
     *
     * @return array<string, mixed> OpenAPI schema definition
     */
    public static function getDetailSchema(): array
    {
        return [
            'type' => 'object',
            'properties' => [
                'moduleName' => [
                    'type' => 'string',
                    'description' => 'rest_schema_status_moduleName',
                    'example' => 'ModuleExampleRestAPIv3'
                ],
                'moduleVersion' => [
                    'type' => 'string',
                    'description' => 'rest_schema_status_moduleVersion',
                    'example' => '1.0.0'
                ],
                'status' => [
                    'type' => 'string',
                    'description' => 'rest_schema_status_status',
                    'enum' => ['ok', 'degraded', 'error'],
                    'example' => 'ok'
                ],
                'timestamp' => [
                    'type' => 'string',
                    'format' => 'date-time',
                    'description' => 'rest_schema_status_timestamp',
                    'example' => '2025-01-15T10:30:00Z'
                ],
                'message' => [
                    'type' => 'string',
                    'description' => 'rest_schema_status_message',
                    'example' => 'Module is running normally'
                ]
            ]
        ];
    }

    /**
     * Get related schemas (none for Status resource)
     *
     * @return array<string, array<string, mixed>> Related schemas
     */
    public static function getRelatedSchemas(): array
    {
        return [];
    }

    /**
     * Get parameter definitions
     *
     * @return array<string, array<string, mixed>> Parameter definitions
     */
    public static function getParameterDefinitions(): array
    {
        return [
            'request' => [],
            'response' => [
                'moduleName' => [
                    'type' => 'string',
                    'description' => 'rest_schema_status_moduleName',
                    'readOnly' => true
                ],
                'moduleVersion' => [
                    'type' => 'string',
                    'description' => 'rest_schema_status_moduleVersion',
                    'readOnly' => true
                ],
                'status' => [
                    'type' => 'string',
                    'description' => 'rest_schema_status_status',
                    'enum' => ['ok', 'degraded', 'error'],
                    'readOnly' => true
                ],
                'timestamp' => [
                    'type' => 'string',
                    'format' => 'date-time',
                    'description' => 'rest_schema_status_timestamp',
                    'readOnly' => true
                ],
                'message' => [
                    'type' => 'string',
                    'description' => 'rest_schema_status_message',
                    'readOnly' => true
                ]
            ],
            'related' => []
        ];
    }
}
