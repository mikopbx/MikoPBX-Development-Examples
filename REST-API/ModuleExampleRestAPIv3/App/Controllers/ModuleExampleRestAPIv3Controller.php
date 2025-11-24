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

namespace Modules\ModuleExampleRestAPIv3\App\Controllers;

use MikoPBX\AdminCabinet\Providers\AssetProvider;

/**
 * Web UI controller for ModuleExampleRestAPIv3
 *
 * WHY: Provides web interface for testing REST API v3 endpoints
 * Demonstrates interactive API testing with all HTTP methods
 *
 * RESPONSIBILITIES:
 * - Load JavaScript and CSS assets for the UI
 * - Provide interactive buttons for testing CRUD operations
 * - Demonstrate file upload and download functionality
 * - Show API responses in real-time
 *
 * PATTERN: Standard MikoPBX web controller
 * - Extends ModuleExampleRestAPIv3BaseController (auto-generated)
 * - indexAction() renders the main module page
 * - Registers CSS/JS assets via AssetProvider
 *
 * @package Modules\ModuleExampleRestAPIv3\App\Controllers
 */
class ModuleExampleRestAPIv3Controller extends ModuleExampleRestAPIv3BaseController
{
    /**
     * Render module's main page with API testing interface
     *
     * WHY: Provides interactive web UI for testing all REST API endpoints
     * Loads necessary JavaScript libraries for file upload (Resumable.js)
     */
    public function indexAction(): void
    {
        // WHY: Load module's CSS for styling the test interface
        $headerCSS = $this->assets->collection(AssetProvider::HEADER_CSS);
        $headerCSS->addCss('css/cache/' . $this->moduleUniqueID . '/module-rest-api-v3.css', true);

        $footerJS = $this->assets->collection(AssetProvider::FOOTER_JS);

        // WHY: Add dependencies for file upload functionality
        // - resumable.js: Chunked file upload library (same as used for sound files)
        // - files-api.js: Core's file upload API wrapper with EventBus integration
        $footerJS->addJs('js/vendor/resumable.js', true);
        $footerJS->addJs('js/pbx/PbxAPI/files-api.js', true);

        // WHY: Load module's own JavaScript for interactive API testing
        // Compiled from public/assets/js/src/module-rest-api-v3.js via Babel
        $footerJS->addJs('js/cache/' . $this->moduleUniqueID . '/module-rest-api-v3.js', true);

        // WHY: Pass module ID to view for dynamic asset paths
        $this->view->moduleUniqueID = $this->moduleUniqueID;

        // WHY: Pass API base path to JavaScript for endpoint construction
        // JavaScript will use this to build full URLs like: /pbxcore/api/v3/module-example-rest-api-v3/tasks/1
        $this->view->apiV3BasePath = '/pbxcore/api/v3/module-example-rest-api-v3/tasks';
    }
}
