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

use MikoPBX\AdminCabinet\Controllers\BaseController;
use MikoPBX\Modules\PbxExtensionUtils;

/**
 * Base controller for ModuleExampleRestAPIv1
 *
 * WHY: Provides common functionality for all module controllers
 *
 * @package Modules\ModuleExampleRestAPIv1\App\Controllers
 */
class ModuleExampleRestAPIv1BaseController extends BaseController
{
    /**
     * Module unique identifier
     *
     * WHY: Used for asset paths and module directory resolution
     */
    protected string $moduleUniqueID = 'ModuleExampleRestAPIv1';

    /**
     * Module directory path
     */
    protected string $moduleDir;

    /**
     * Initialize controller
     *
     * WHY: Set up module directory and logo path for non-AJAX requests
     */
    public function initialize(): void
    {
        if ($this->request->isAjax() === false) {
            $this->moduleDir = PbxExtensionUtils::getModuleDir($this->moduleUniqueID);
            $this->view->logoImagePath = "{$this->url->get()}assets/img/cache/{$this->moduleUniqueID}/logo.svg";
        }
        parent::initialize();
    }
}
