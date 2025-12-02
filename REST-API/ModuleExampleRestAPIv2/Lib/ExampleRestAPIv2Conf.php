<?php

declare(strict_types=1);

namespace Modules\ModuleExampleRestAPIv2\Lib;

use MikoPBX\Modules\Config\ConfigClass;

/**
 * Module configuration class for REST API v2 example.
 *
 * Demonstrates REST API with backend worker architecture:
 * - GetController: GET requests (config, users, download)
 * - PostController: POST requests (create, update, delete)
 * - All operations processed asynchronously via ModuleRestAPIProcessor
 *
 * Extends ConfigClass which already implements RestAPIConfigInterface.
 *
 * @package Modules\ModuleExampleRestAPIv2\Lib
 */
class ExampleRestAPIv2Conf extends ConfigClass
{
    /**
     * Register REST API routes.
     *
     * Route format: [ControllerClass, ActionMethod, RequestTemplate, HttpMethod, RootUrl, NoAuth]
     *
     * Protected routes (require authentication):
     * - GET /pbxcore/api/module-example-rest-api-v2/{actionName}
     * - POST /pbxcore/api/module-example-rest-api-v2/{actionName}
     *
     * Public routes (NO authentication required):
     * - GET /pbxcore/api/module-example-rest-api-v2/public/{actionName}
     *
     * @return array Route definitions
     */
    public function getPBXCoreRESTAdditionalRoutes(): array
    {
        return [
            // Protected routes (NoAuth = false, default)
            ['\\Modules\\ModuleExampleRestAPIv2\\Lib\\RestAPI\\Controllers\\GetController', 'callAction', '/pbxcore/api/module-example-rest-api-v2/{actionName}', 'get', '', false],
            ['\\Modules\\ModuleExampleRestAPIv2\\Lib\\RestAPI\\Controllers\\PostController', 'callAction', '/pbxcore/api/module-example-rest-api-v2/{actionName}', 'post', '', false],
            // Public route (NoAuth = true) - no authentication required
            ['\\Modules\\ModuleExampleRestAPIv2\\Lib\\RestAPI\\Controllers\\PublicGetController', 'callAction', '/pbxcore/api/module-example-rest-api-v2/public/{actionName}', 'get', '', true],
        ];
    }
}
