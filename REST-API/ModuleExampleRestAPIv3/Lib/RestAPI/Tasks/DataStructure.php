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

namespace Modules\ModuleExampleRestAPIv3\Lib\RestAPI\Tasks;

use MikoPBX\PBXCoreREST\Lib\Common\AbstractDataStructure;
use MikoPBX\PBXCoreREST\Lib\Common\OpenApiSchemaProvider;

/**
 * Data structure for Task resource
 *
 * WHY: Provides OpenAPI schemas for Tasks REST API endpoints
 * Implements Single Source of Truth pattern for all field definitions
 *
 * RESPONSIBILITIES:
 * - Define all task fields with types, validation, and examples
 * - Generate OpenAPI schemas for list and detail views
 * - Provide related schemas for nested objects
 * - Supply sanitization rules for request validation
 *
 * @package Modules\ModuleExampleRestAPIv3\Lib\RestAPI\Tasks
 */
class DataStructure extends AbstractDataStructure implements OpenApiSchemaProvider
{
    /**
     * Get OpenAPI schema for task list item representation
     *
     * ✨ Inherits field definitions from getParameterDefinitions() - Single Source of Truth.
     * This schema matches the structure returned by GetListAction.
     * Used for GET /api/v3/modules/example-rest-api-v3/tasks endpoint.
     *
     * @return array<string, mixed> OpenAPI schema definition
     */
    public static function getListItemSchema(): array
    {
        $definitions = self::getParameterDefinitions();
        $requestFields = $definitions['request'] ?? [];
        $responseFields = $definitions['response'] ?? [];

        $properties = [];

        // ✨ Combine request (writable) and response-only fields
        foreach ($requestFields as $field => $definition) {
            $properties[$field] = $definition;
        }

        foreach ($responseFields as $field => $definition) {
            $properties[$field] = $definition;
        }

        return [
            'type' => 'object',
            'properties' => $properties
        ];
    }

    /**
     * Get OpenAPI schema for detailed task record representation
     *
     * ✨ For Tasks resource, detail schema is same as list (all fields shown in both views)
     * Some resources may have different schemas (list = summary, detail = full data)
     *
     * @return array<string, mixed> OpenAPI schema definition
     */
    public static function getDetailSchema(): array
    {
        return self::getListItemSchema();
    }

    /**
     * Get related schemas for OpenAPI components
     *
     * ✨ Inherits from getParameterDefinitions()['related'] section - Single Source of Truth.
     * Returns schemas for nested objects used in task responses.
     *
     * @return array<string, array<string, mixed>> Related schemas
     */
    public static function getRelatedSchemas(): array
    {
        $definitions = self::getParameterDefinitions();
        return $definitions['related'] ?? [];
    }

    /**
     * Get all field definitions with complete metadata
     *
     * Single Source of Truth for ALL field definitions.
     * Each field includes type, validation, sanitization, and examples.
     *
     * @return array<string, array<string, mixed>> Complete field definitions
     */
    private static function getAllFieldDefinitions(): array
    {
        return [
            // ========== WRITABLE FIELDS (Request + Response) ==========
            // These fields can be set in POST/PUT/PATCH requests

            'title' => [
                'type' => 'string',
                'description' => 'rest_schema_tasks_title',
                'minLength' => 1,
                'maxLength' => 255,
                'required' => true,
                'example' => 'Complete project documentation'
            ],

            'status' => [
                'type' => 'string',
                'description' => 'rest_schema_tasks_status',
                'enum' => ['pending', 'in_progress', 'completed'],
                'default' => 'pending',
                'example' => 'in_progress'
            ],

            'priority' => [
                'type' => 'integer',
                'description' => 'rest_schema_tasks_priority',
                'minimum' => 0,
                'maximum' => 10,
                'default' => 5,
                'example' => 7
            ],

            'attachment' => [
                'type' => 'string',
                'description' => 'rest_schema_tasks_attachment',
                'maxLength' => 500,
                'example' => '/storage/usbdisk1/mikopbx/tmp/task_document.pdf'
            ],

            'filename' => [
                'type' => 'string',
                'description' => 'rest_schema_tasks_filename',
                'maxLength' => 255,
                'example' => 'project_documentation.pdf'
            ],

            'file' => [
                'type' => 'string',
                'format' => 'binary',
                'description' => 'rest_schema_tasks_file',
                'example' => '(binary file data)'
            ],

            // ========== RESPONSE-ONLY FIELDS ==========
            // These fields are only in API responses, not in requests

            'id' => [
                'type' => 'integer',
                'description' => 'rest_schema_tasks_id',
                'readOnly' => true,
                'example' => 42
            ],

            'created_at' => [
                'type' => 'string',
                'format' => 'date-time',
                'description' => 'rest_schema_tasks_created_at',
                'readOnly' => true,
                'example' => '2025-01-15T10:30:00Z'
            ],

            'updated_at' => [
                'type' => 'string',
                'format' => 'date-time',
                'description' => 'rest_schema_tasks_updated_at',
                'readOnly' => true,
                'example' => '2025-01-16T14:45:00Z'
            ]
        ];
    }

    /**
     * Get parameter definitions (Single Source of Truth)
     *
     * WHY: Centralizes task parameter definitions for validation and OpenAPI schemas.
     * Separates writable fields (for requests) from response-only fields.
     *
     * STRUCTURE:
     * - request: Fields that can be in POST/PUT/PATCH bodies (title, status, priority)
     * - response: Read-only fields only in responses (id, created_at, updated_at)
     * - related: Nested object schemas referenced by $ref
     *
     * @return array<string, array<string, mixed>> Parameter definitions
     */
    public static function getParameterDefinitions(): array
    {
        $allFields = self::getAllFieldDefinitions();

        // Separate writable fields (for requests) and response-only fields
        $writableFields = [];
        $responseOnlyFields = [];

        foreach ($allFields as $fieldName => $fieldDef) {
            if (!empty($fieldDef['readOnly'])) {
                $responseOnlyFields[$fieldName] = $fieldDef;
            } else {
                // For request section, use rest_param_* descriptions
                $requestField = $fieldDef;
                $requestField['description'] = str_replace('rest_schema_', 'rest_param_', $fieldDef['description']);
                $writableFields[$fieldName] = $requestField;
            }
        }

        return [
            // ========== REQUEST PARAMETERS ==========
            // Used in API requests (POST/PUT/PATCH body, GET query parameters)
            // Referenced by ApiParameterRef in Controller
            'request' => $writableFields,

            // ========== RESPONSE-ONLY FIELDS ==========
            // Only in API responses, not in requests
            'response' => $responseOnlyFields,

            // ========== RELATED SCHEMAS ==========
            // Nested object schemas referenced by $ref in OpenAPI
            // Example: If tasks had subtasks, define SubTask schema here
            'related' => [
                // Currently no nested objects in Tasks resource
                // Example structure:
                // 'TaskAttachment' => [
                //     'type' => 'object',
                //     'properties' => [
                //         'filename' => ['type' => 'string'],
                //         'size' => ['type' => 'integer']
                //     ]
                // ]
            ]
        ];
    }

    // getSanitizationRules() inherited from AbstractDataStructure
    // Auto-generated from getParameterDefinitions() - Single Source of Truth
}
