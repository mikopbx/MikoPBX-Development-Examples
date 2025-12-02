<?php
return [
    // Module info
    'module_rest_api_v2' => 'Example: REST API v2',
    'module_rest_api_v2_description' => 'REST API with backend worker architecture',
    'SubHeaderModuleExampleRestAPIv2' => 'Demonstrates REST API implementation with asynchronous backend processing',
    'BreadcrumbModuleExampleRestAPIv2' => 'REST API v2 - example',

    // Test interface
    'mod_restapi2_InfoTitle' => 'Backend Worker Architecture',
    'mod_restapi2_InfoDescription' => 'All operations processed asynchronously via ModuleRestAPIProcessor (~30-50ms)',
    'mod_restapi2_GetOperations' => 'GET Operations',
    'mod_restapi2_PostOperations' => 'POST Operations',
    'mod_restapi2_FileOperations' => 'File Operations',
    'mod_restapi2_ApiResponse' => 'API Response',
    'mod_restapi2_ClickToTest' => 'Click button to test...',

    // Buttons
    'mod_restapi2_BtnGetConfig' => 'Get Config',
    'mod_restapi2_BtnGetUsers' => 'Get Users',
    'mod_restapi2_BtnCreateUser' => 'Create User',
    'mod_restapi2_BtnUpdateUser' => 'Update User',
    'mod_restapi2_BtnDeleteUser' => 'Delete User',
    'mod_restapi2_BtnShowContent' => 'Show Content',
    'mod_restapi2_BtnDownloadFile' => 'Download File',

    // Public endpoint
    'mod_restapi2_PublicEndpointTitle' => 'Public Endpoint (No Authentication)',
    'mod_restapi2_PublicEndpointDesc' => 'This endpoint is accessible without any authentication. No Bearer token or localhost restriction required.',
    'mod_restapi2_PublicEndpointUsage1' => 'Health check for monitoring systems',
    'mod_restapi2_PublicEndpointUsage2' => 'Webhook receivers (payment callbacks, SMS delivery reports)',
    'mod_restapi2_PublicEndpointUsage3' => 'OAuth2 callbacks and public status pages',
    'mod_restapi2_TestPublicEndpoint' => 'Test Public Status',
    'mod_restapi2_PublicEndpointHowItWorks' => 'How it works: Register route in getPBXCoreRESTAdditionalRoutes() with NoAuth=true (6th parameter). The endpoint will be accessible without any authentication.',
];
