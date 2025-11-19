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

namespace Modules\ModuleExampleRestAPIv1\App\Controllers;

use MikoPBX\AdminCabinet\Providers\AssetProvider;
use Modules\ModuleExampleRestAPIv1\App\Forms\ModuleExampleRestAPIv1Form;
use Modules\ModuleExampleRestAPIv1\Models\ModuleExampleRestAPIv1;

/**
 * Main controller for ModuleExampleRestAPIv1
 *
 * WHY: Handles page rendering and asset registration
 *
 * @package Modules\ModuleExampleRestAPIv1\App\Controllers
 */
class ModuleExampleRestAPIv1Controller extends ModuleExampleRestAPIv1BaseController
{
    /**
     * Index action - main module page
     *
     * WHY: Display module interface with API testing buttons
     *
     * Route: /admin-cabinet/module-example-rest-apiv1/index
     */
    public function indexAction(): void
    {
        // Register CSS
        $headerCSS = $this->assets->collection(AssetProvider::HEADER_CSS);
        $headerCSS->addCss('css/cache/' . $this->moduleUniqueID . '/module-rest-api-v1.css', true);

        // Register JS
        $footerJS = $this->assets->collection(AssetProvider::FOOTER_JS);
        $footerJS->addJs('js/cache/' . $this->moduleUniqueID . '/module-rest-api-v1.js', true);

        // Load module settings
        $record = ModuleExampleRestAPIv1::findFirst();
        if ($record === null) {
            $record = new ModuleExampleRestAPIv1();
        }

        // Pass data to view
        $this->view->form = new ModuleExampleRestAPIv1Form($record);
        $this->view->moduleUniqueID = $this->moduleUniqueID;
        $this->view->submitMode = null;

        // API endpoints for testing
        $this->view->apiEndpoints = [
            'check'  => '/pbxcore/api/modules/ModuleExampleRestAPIv1/check',
            'status' => '/pbxcore/api/modules/ModuleExampleRestAPIv1/status',
            'reload' => '/pbxcore/api/modules/ModuleExampleRestAPIv1/reload',
            'stats'  => '/pbxcore/api/modules/ModuleExampleRestAPIv1/stats',
        ];
    }

    /**
     * Save settings action
     *
     * WHY: Handle settings form submission
     */
    public function saveAction(): void
    {
        if (!$this->request->isPost()) {
            return;
        }

        $data = $this->request->getPost();

        // Get or create record
        $record = ModuleExampleRestAPIv1::findFirst();
        if ($record === null) {
            $record = new ModuleExampleRestAPIv1();
        }

        // Update fields
        foreach ($record as $key => $value) {
            if ($key === 'id') {
                continue;
            }

            if (array_key_exists($key, $data)) {
                $record->$key = $data[$key];
            }
        }

        // Save
        if ($record->save() === false) {
            $errors = $record->getMessages();
            $this->flash->error(implode('<br>', $errors));
            $this->view->success = false;
            return;
        }

        $this->flash->success($this->translation->_('ms_SuccessfulSaved'));
        $this->view->success = true;
    }
}
