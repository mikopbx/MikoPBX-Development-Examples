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

namespace Modules\ModuleExampleAmi\App\Controllers;

use MikoPBX\AdminCabinet\Controllers\BaseController;
use MikoPBX\AdminCabinet\Providers\AssetProvider;
use MikoPBX\Modules\PbxExtensionUtils;

/**
 * Controller for AMI Example Module
 *
 * Educational module demonstrating:
 * - Sending AMI commands to Asterisk
 * - Receiving real-time AMI events via EventBus
 * - No settings form - uses auto-generated AMI credentials
 */
class ModuleExampleAmiController extends BaseController
{
    private string $moduleUniqueID = 'ModuleExampleAmi';
    private string $moduleDir;

    /**
     * Initialize controller
     * Sets up module-specific paths and view variables
     */
    public function initialize(): void
    {
        $this->moduleDir = PbxExtensionUtils::getModuleDir($this->moduleUniqueID);
        $this->view->logoImagePath = $this->url->get().'assets/img/cache/'.$this->moduleUniqueID.'/logo.svg';
        $this->view->submitMode = null;
        parent::initialize();
    }

    /**
     * Render main AMI Terminal page
     *
     * Features:
     * - Command tab: Send CLI commands and AMI Actions
     * - Events tab: Real-time AMI event monitoring with syntax highlighting
     */
    public function indexAction(): void
    {
        // Add module-specific CSS
        $headerCollectionCSS = $this->assets->collection(AssetProvider::HEADER_CSS);
        $headerCollectionCSS->addCss('css/cache/'.$this->moduleUniqueID.'/module-example-ami-index.css', true);

        // Add module-specific JavaScript
        $footerCollectionJS = $this->assets->collection(AssetProvider::FOOTER_JS);
        $footerCollectionJS->addJs('js/cache/'.$this->moduleUniqueID.'/module-example-ami-index.js', true);

        // Render module view
        $this->view->pick('Modules/'.$this->moduleUniqueID.'/ModuleExampleAmi/index');
    }
}