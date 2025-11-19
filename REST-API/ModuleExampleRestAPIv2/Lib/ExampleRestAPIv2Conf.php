<?php

declare(strict_types=1);

namespace Modules\ModuleExampleRestAPIv2\Lib;

use MikoPBX\Modules\Config\ConfigClass;

/**
 * Example Module: REST API v2 (Backend Worker Architecture)
 *
 * Demonstrates custom REST API controllers with backend worker processing.
 * All operations are handled asynchronously via ModuleRestAPIProcessor.
 *
 * ARCHITECTURE:
 * - All controllers delegate to backend worker
 * - ModuleRestAPIProcessor routes to specific Actions
 * - Actions perform database queries, file generation, validation
 * - Non-blocking async operations via Redis queue
 *
 * CONTROLLERS:
 * - GetController: Database queries (config, users)
 * - PostController: Write operations (create, update, delete)
 * - FileController: File generation and download
 *
 * WHY: This approach provides better organization through dedicated controller classes.
 * ConfigClass already implements RestAPIConfigInterface with empty stubs,
 * so we only override what we need.
 *
 * IMPORTANT: Uses ConfigClass (not PbxExtensionBase) because:
 * - ConfigClass already implements RestAPIConfigInterface
 * - Provides empty implementations for all interface methods
 * - We only need to override getPBXCoreRESTAdditionalRoutes()
 *
 * @package Modules\ModuleExampleRestAPIv2\Lib
 */
class ExampleRestAPIv2Conf extends ConfigClass
{
    /**
     * Register custom REST API routes
     *
     * WHY: HTTP method determines controller - no duplication in URL
     * GET requests → GetController
     * POST requests → PostController
     *
     * Routes will be available at:
     * /pbxcore/api/module-example-rest-api-v2/{action}
     *
     * @return array Route definitions
     */
    public function getPBXCoreRESTAdditionalRoutes(): array
    {
        return [
            // GET operations: config, users, download
            ['\\Modules\\ModuleExampleRestAPIv2\\Lib\\RestAPI\\Controllers\\GetController', 'callAction', '/pbxcore/api/module-example-rest-api-v2/{actionName}', 'get', ''],

            // POST operations: create, update, delete
            ['\\Modules\\ModuleExampleRestAPIv2\\Lib\\RestAPI\\Controllers\\PostController', 'callAction', '/pbxcore/api/module-example-rest-api-v2/{actionName}', 'post', ''],
        ];
    }

    // No need to implement other RestAPIConfigInterface methods!
    // ConfigClass already provides empty implementations:
    // - moduleRestAPICallback() - not used in this example, workers use direct Processor
    // - onBeforeExecuteRestAPIRoute() - empty hook
    // - onAfterExecuteRestAPIRoute() - empty hook
}
