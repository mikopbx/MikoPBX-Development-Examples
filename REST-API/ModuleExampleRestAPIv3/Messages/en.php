<?php
return [
    'module_rest_api_v3' => 'Example: REST API v3',
    'module_rest_api_v3_description' => 'Pattern 3 (Auto-Discovery) - modern REST API v3 with OpenAPI, automatic controller discovery, and validation',
    'SubHeaderModuleExampleRestAPIv3' => 'Pattern 3 (Auto-Discovery) - recommended approach with automatic controller discovery via PHP 8 attributes, OpenAPI 3.1 schema generation, and Processor+Actions architecture',
    'BreadcrumbModuleExampleRestAPIv3' => 'REST API v3 - еxample',

    // REST API tag translation
    'rest_tag_ModuleExampleRESTAPIV3Tasks' => 'Module Example REST API v3 - Tasks',

    // REST API endpoint translations
    'rest_tasks_GetList' => 'Get tasks list',
    'rest_tasks_GetListDesc' => 'Returns list of all tasks with pagination and filtering support',
    'rest_tasks_Create' => 'Create task',
    'rest_tasks_CreateDesc' => 'Creates a new task',
    'rest_tasks_GetRecord' => 'Get task',
    'rest_tasks_GetRecordDesc' => 'Returns information about a specific task by ID',
    'rest_tasks_Update' => 'Update task',
    'rest_tasks_UpdateDesc' => 'Full update of an existing task (replaces all fields)',
    'rest_tasks_Patch' => 'Partially update task',
    'rest_tasks_PatchDesc' => 'Partial update of an existing task (updates only specified fields)',
    'rest_tasks_Delete' => 'Delete task',
    'rest_tasks_DeleteDesc' => 'Deletes a task by ID',
    'rest_tasks_GetDefault' => 'Get default values',
    'rest_tasks_GetDefaultDesc' => 'Returns default values for creating a new task',
    'rest_tasks_Download' => 'Download file',
    'rest_tasks_DownloadDesc' => 'Downloads file attached to a task',
    'rest_tasks_UploadFile' => 'Upload file',
    'rest_tasks_UploadFileDesc' => 'Upload file to attach to a task (mp3, wav, pdf, png, jpeg - max 10MB)',

    // REST API parameter translations
    'rest_param_tasks_title' => 'Title',
    'rest_param_tasks_status' => 'Status',
    'rest_param_tasks_priority' => 'Priority',
    'rest_param_tasks_attachment' => 'Attachment',
    'rest_param_tasks_filename' => 'Filename',

    // REST API schema field descriptions
    'rest_schema_tasks_id' => 'Unique task identifier',
    'rest_schema_tasks_title' => 'Task title',
    'rest_schema_tasks_status' => 'Task status (pending, in_progress, completed)',
    'rest_schema_tasks_priority' => 'Task priority (0-10, higher is more important)',
    'rest_schema_tasks_attachment' => 'Path to attached file',
    'rest_schema_tasks_filename' => 'Custom filename for downloaded file',
    'rest_schema_tasks_file' => 'File data (binary)',
    'rest_schema_tasks_created_at' => 'Task creation timestamp',
    'rest_schema_tasks_updated_at' => 'Task last update timestamp',

    // REST API response messages
    'rest_response_201_uploaded' => 'File uploaded successfully',
    'rest_response_413_too_large' => 'File too large (maximum 10MB allowed)',

    // PUBLIC Status endpoint translations
    'rest_tag_ModuleExampleRESTAPIV3Status' => 'Module Example REST API v3 - Public Status',
    'rest_status_GetStatus' => 'Get module status',
    'rest_status_GetStatusDesc' => 'Returns module status information. This is a PUBLIC endpoint - no authentication required.',
    'rest_response_200_status' => 'Module status retrieved successfully',

    // Status schema field descriptions
    'rest_schema_status_moduleName' => 'Module unique identifier',
    'rest_schema_status_moduleVersion' => 'Module version number',
    'rest_schema_status_status' => 'Module operational status (ok, degraded, error)',
    'rest_schema_status_timestamp' => 'Current server timestamp',
    'rest_schema_status_message' => 'Human-readable status message',

    // UI - Public endpoint section
    'mod_restapiv3_PublicEndpointTitle' => 'Public Endpoint (No Authentication)',
    'mod_restapiv3_PublicEndpointDesc' => 'This module demonstrates how to create PUBLIC REST API endpoints that are accessible without authentication.',
    'mod_restapiv3_PublicEndpointUsage1' => 'Health checks and monitoring systems',
    'mod_restapiv3_PublicEndpointUsage2' => 'Webhook receivers (payment callbacks, SMS notifications)',
    'mod_restapiv3_PublicEndpointUsage3' => 'OAuth2 callbacks and public API info',
    'mod_restapiv3_TestPublicEndpoint' => 'Test Public Endpoint',
    'mod_restapiv3_PublicEndpointHowItWorks' => 'How it works: Add #[ResourceSecurity(..., requirements: [SecurityType::PUBLIC])] attribute to the controller class. The endpoint will be automatically registered as public during route discovery.',
];
