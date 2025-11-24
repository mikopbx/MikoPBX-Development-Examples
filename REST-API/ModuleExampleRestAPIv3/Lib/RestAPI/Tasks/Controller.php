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

use MikoPBX\PBXCoreREST\Controllers\BaseRestController;
use MikoPBX\PBXCoreREST\Lib\Common\CommonDataStructure;
use MikoPBX\PBXCoreREST\Attributes\{
    ApiResource,
    ApiOperation,
    ApiParameterRef,
    ApiResponse,
    ApiDataSchema,
    HttpMapping,
    SecurityType,
    ResourceSecurity
};

/**
 * Controller - Reference REST API Controller for Modules (NEW PATTERN 2025)
 *
 * WHY: Demonstrates modern PHP 8 attribute-based routing for module REST APIs
 * Uses declarative attributes instead of imperative route registration
 *
 * ARCHITECTURE (NEW PATTERN):
 * - Lib/RestAPI/{Resource}/Controller.php: HTTP interface layer with attributes
 * - Lib/RestAPI/{Resource}/Processor.php: Business logic processing
 * - Lib/RestAPI/{Resource}/DataStructure.php: Schema definitions
 * - Lib/RestAPI/{Resource}/Actions/*.php: Action implementations
 *
 * WHY THIS PATTERN:
 * ✅ All resource components in one folder (3 levels instead of 5)
 * ✅ Semantically clear: "Tasks" = resource namespace
 * ✅ Easy to scale: add new resources as siblings
 * ✅ No Frontend/Backend split - simpler navigation
 *
 * HOW IT WORKS:
 * 1. #[ApiResource] marks this as an auto-discoverable REST controller
 * 2. ControllerDiscovery scans Lib/RestAPI for *Controller.php files
 * 3. Routes are registered automatically by RouterProvider
 * 4. Processor class routes requests to dedicated Action classes
 *
 * @package Modules\ModuleExampleRestAPIv3\Lib\RestAPI\Tasks
 */
#[ApiResource(
    path: '/pbxcore/api/v3/module-example-rest-api-v3/tasks',
    tags: ['Module Example REST API v3 - Tasks'],
    description: 'Task management operations for ModuleExampleRestAPIv3',
    processor: Processor::class
)]
#[HttpMapping(
    mapping: [
        'GET'    => ['getList', 'getRecord', 'getDefault', 'download'],
        'POST'   => ['create', 'uploadFile'],
        'PUT'    => ['update'],
        'PATCH'  => ['patch'],
        'DELETE' => ['delete']
    ],
    resourceLevelMethods: ['getRecord', 'update', 'patch', 'delete', 'download', 'uploadFile'],
    collectionLevelMethods: ['getList', 'create', 'getDefault'],
    customMethods: ['getDefault', 'download', 'uploadFile'],
    idPattern: '[^/:]+' // Exclude colon to allow custom methods like /tasks/1:download
)]
#[ResourceSecurity('module-example-rest-api-v3-tasks', requirements: [SecurityType::LOCALHOST, SecurityType::BEARER_TOKEN])]
class Controller extends BaseRestController
{
    /**
     * The processor class to handle requests
     * @var string
     */
    protected string $processorClass = Processor::class;

    /**
     * Get list of all tasks with pagination and filtering
     *
     * @route GET /pbxcore/api/v3/module-example-rest-api-v3/tasks
     */
    #[ApiDataSchema(
        schemaClass: DataStructure::class,
        type: 'list',
        isArray: true
    )]
    #[ApiOperation(
        summary: 'rest_tasks_GetList',
        description: 'rest_tasks_GetListDesc',
        operationId: 'getTasksList'
    )]
    #[ApiParameterRef('limit', dataStructure: CommonDataStructure::class)]
    #[ApiParameterRef('offset', dataStructure: CommonDataStructure::class)]
    #[ApiParameterRef('search', dataStructure: CommonDataStructure::class, example: 'documentation')]
    #[ApiParameterRef('order', dataStructure: CommonDataStructure::class, enum: ['title', 'status', 'priority'])]
    #[ApiParameterRef('orderWay', dataStructure: CommonDataStructure::class)]
    #[ApiParameterRef('status')]
    #[ApiResponse(200, 'rest_response_200_list')]
    #[ApiResponse(401, 'rest_response_401')]
    #[ApiResponse(500, 'rest_response_500')]
    public function getList(): void {}

    /**
     * Get a specific task by ID
     *
     * @route GET /pbxcore/api/v3/module-example-rest-api-v3/tasks/{id}
     */
    #[ApiDataSchema(schemaClass: DataStructure::class, type: 'detail')]
    #[ApiOperation(
        summary: 'rest_tasks_GetRecord',
        description: 'rest_tasks_GetRecordDesc',
        operationId: 'getTaskById'
    )]
    #[ApiResponse(200, 'rest_response_200_record')]
    #[ApiResponse(401, 'rest_response_401')]
    #[ApiResponse(404, 'rest_response_404')]
    #[ApiResponse(500, 'rest_response_500')]
    public function getRecord(): void {}

    /**
     * Create a new task
     *
     * @route POST /pbxcore/api/v3/module-example-rest-api-v3/tasks
     */
    #[ApiDataSchema(schemaClass: DataStructure::class, type: 'detail')]
    #[ApiOperation(
        summary: 'rest_tasks_Create',
        description: 'rest_tasks_CreateDesc',
        operationId: 'createTask'
    )]
    #[ApiParameterRef('title', required: true)]
    #[ApiParameterRef('status')]
    #[ApiParameterRef('priority')]
    #[ApiResponse(201, 'rest_response_201')]
    #[ApiResponse(400, 'rest_response_400')]
    #[ApiResponse(401, 'rest_response_401')]
    #[ApiResponse(422, 'rest_response_422')]
    #[ApiResponse(500, 'rest_response_500')]
    public function create(): void {}

    /**
     * Update an existing task (full replacement)
     *
     * @route PUT /pbxcore/api/v3/module-example-rest-api-v3/tasks/{id}
     */
    #[ApiDataSchema(schemaClass: DataStructure::class, type: 'detail')]
    #[ApiOperation(
        summary: 'rest_tasks_Update',
        description: 'rest_tasks_UpdateDesc',
        operationId: 'updateTask'
    )]
    #[ApiParameterRef('title', required: true)]
    #[ApiParameterRef('status')]
    #[ApiParameterRef('priority')]
    #[ApiResponse(200, 'rest_response_200_record')]
    #[ApiResponse(400, 'rest_response_400')]
    #[ApiResponse(401, 'rest_response_401')]
    #[ApiResponse(404, 'rest_response_404')]
    #[ApiResponse(422, 'rest_response_422')]
    #[ApiResponse(500, 'rest_response_500')]
    public function update(): void {}

    /**
     * Partially update an existing task
     *
     * @route PATCH /pbxcore/api/v3/module-example-rest-api-v3/tasks/{id}
     */
    #[ApiDataSchema(schemaClass: DataStructure::class, type: 'detail')]
    #[ApiOperation(
        summary: 'rest_tasks_Patch',
        description: 'rest_tasks_PatchDesc',
        operationId: 'patchTask'
    )]
    #[ApiParameterRef('title')]
    #[ApiParameterRef('status')]
    #[ApiParameterRef('priority')]
    #[ApiResponse(200, 'rest_response_200_record')]
    #[ApiResponse(400, 'rest_response_400')]
    #[ApiResponse(401, 'rest_response_401')]
    #[ApiResponse(404, 'rest_response_404')]
    #[ApiResponse(422, 'rest_response_422')]
    #[ApiResponse(500, 'rest_response_500')]
    public function patch(): void {}

    /**
     * Delete a task
     *
     * @route DELETE /pbxcore/api/v3/module-example-rest-api-v3/tasks/{id}
     */
    #[ApiOperation(
        summary: 'rest_tasks_Delete',
        description: 'rest_tasks_DeleteDesc',
        operationId: 'deleteTask'
    )]
    #[ApiResponse(200, 'rest_response_200_delete')]
    #[ApiResponse(401, 'rest_response_401')]
    #[ApiResponse(404, 'rest_response_404')]
    #[ApiResponse(500, 'rest_response_500')]
    public function delete(): void {}

    /**
     * Get default values for creating a new task
     *
     * @route GET /pbxcore/api/v3/module-example-rest-api-v3/tasks:getDefault
     */
    #[ApiDataSchema(schemaClass: DataStructure::class, type: 'detail')]
    #[ApiOperation(
        summary: 'rest_tasks_GetDefault',
        description: 'rest_tasks_GetDefaultDesc',
        operationId: 'getDefaultTask'
    )]
    #[ApiResponse(200, 'rest_response_200_record')]
    #[ApiResponse(401, 'rest_response_401')]
    #[ApiResponse(500, 'rest_response_500')]
    public function getDefault(): void {}

    /**
     * Download file attached to a task
     *
     * @route GET /pbxcore/api/v3/module-example-rest-api-v3/tasks/{id}:download
     */
    #[ApiOperation(
        summary: 'rest_tasks_Download',
        description: 'rest_tasks_DownloadDesc',
        operationId: 'downloadTaskFile'
    )]
    #[ApiParameterRef('filename', dataStructure: DataStructure::class, required: false)]
    #[ApiResponse(200, 'rest_response_200_file_download')]
    #[ApiResponse(401, 'rest_response_401')]
    #[ApiResponse(403, 'rest_response_403')]
    #[ApiResponse(404, 'rest_response_404')]
    #[ApiResponse(500, 'rest_response_500')]
    public function download(): void {}

    /**
     * Upload file to attach to a task
     *
     * @route POST /pbxcore/api/v3/module-example-rest-api-v3/tasks/{id}:uploadFile
     */
    #[ApiOperation(
        summary: 'rest_tasks_UploadFile',
        description: 'rest_tasks_UploadFileDesc',
        operationId: 'uploadTaskFile',
        requestBody: [
            'required' => true,
            'content' => [
                'multipart/form-data' => [
                    'schema' => [
                        'type' => 'object',
                        'properties' => [
                            'file' => [
                                'type' => 'string',
                                'format' => 'binary',
                                'description' => 'File to upload (mp3, wav, pdf, png, jpeg - max 10MB)'
                            ]
                        ]
                    ]
                ]
            ]
        ]
    )]
    #[ApiResponse(200, 'rest_response_200_chunk_received')]
    #[ApiResponse(201, 'rest_response_201_uploaded')]
    #[ApiResponse(202, 'rest_response_202_merging')]
    #[ApiResponse(400, 'rest_response_400')]
    #[ApiResponse(401, 'rest_response_401')]
    #[ApiResponse(413, 'rest_response_413_too_large')]
    #[ApiResponse(500, 'rest_response_500')]
    public function uploadFile(): void {}
}
