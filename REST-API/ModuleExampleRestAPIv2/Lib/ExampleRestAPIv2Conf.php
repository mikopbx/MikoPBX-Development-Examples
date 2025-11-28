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
     * Routes: /pbxcore/api/module-example-rest-api-v2/{actionName}
     *
     * @return array Route definitions [controller, method, path, httpMethod, prefix]
     */
    public function getPBXCoreRESTAdditionalRoutes(): array
    {
        return [
            ['\\Modules\\ModuleExampleRestAPIv2\\Lib\\RestAPI\\Controllers\\GetController', 'callAction', '/pbxcore/api/module-example-rest-api-v2/{actionName}', 'get', ''],
            ['\\Modules\\ModuleExampleRestAPIv2\\Lib\\RestAPI\\Controllers\\PostController', 'callAction', '/pbxcore/api/module-example-rest-api-v2/{actionName}', 'post', ''],
        ];
    }
}
