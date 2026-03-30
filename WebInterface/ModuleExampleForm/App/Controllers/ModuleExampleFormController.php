<?php

declare(strict_types=1);

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

namespace Modules\ModuleExampleForm\App\Controllers;

use MikoPBX\AdminCabinet\Controllers\BaseController;
use MikoPBX\AdminCabinet\Providers\AssetProvider;
use MikoPBX\Common\Models\Providers;
use Modules\ModuleExampleForm\App\Forms\ModuleExampleFormForm;
use Modules\ModuleExampleForm\Models\ModuleExampleForm;

class ModuleExampleFormController extends BaseController
{
    private string $moduleUniqueID = 'ModuleExampleForm';

    public function initialize(): void
    {
        $this->view->logoImagePath = $this->url->get() . 'assets/img/cache/' . $this->moduleUniqueID . '/logo.svg';
        $this->view->submitMode = null;
        parent::initialize();
    }

    /**
     * Index page — shows module status and link to settings.
     */
    public function indexAction(): void
    {
        $headerCollectionCSS = $this->assets->collection(AssetProvider::HEADER_CSS);
        $headerCollectionCSS->addCss('css/cache/' . $this->moduleUniqueID . '/module-example-form-index.css', true);

        $footerCollectionJS = $this->assets->collection(AssetProvider::FOOTER_JS);
        $footerCollectionJS->addJs('js/cache/' . $this->moduleUniqueID . '/module-example-form-index.js', true);

        $this->view->pick('Modules/' . $this->moduleUniqueID . '/ModuleExampleForm/index');
    }

    /**
     * Modify page — renders form with all element types.
     */
    public function modifyAction(): void
    {
        $footerCollectionJS = $this->assets->collection(AssetProvider::FOOTER_JS);
        $footerCollectionJS
            ->addJs('js/pbx/main/form.js', true)
            ->addJs('js/cache/' . $this->moduleUniqueID . '/module-example-form-modify.js', true);

        $settings = ModuleExampleForm::findFirst();
        if ($settings === null) {
            $settings = new ModuleExampleForm();
        }

        $options = $this->buildFormOptions();

        $this->view->form = new ModuleExampleFormForm($settings, $options);
        $this->view->pick('Modules/' . $this->moduleUniqueID . '/ModuleExampleForm/modify');
    }

    /**
     * Builds options array for the form dropdowns.
     *
     * @return array Form options with dropdown data
     */
    private function buildFormOptions(): array
    {
        $options = [];

        // Static dropdown options — hardcoded priority levels
        $options['priorities'] = [
            'low'      => $this->translation->_('module_template_PriorityLow'),
            'medium'   => $this->translation->_('module_template_PriorityMedium'),
            'high'     => $this->translation->_('module_template_PriorityHigh'),
            'critical' => $this->translation->_('module_template_PriorityCritical'),
        ];
        $options['selectPlaceholder'] = $this->translation->_('module_template_SelectPlaceholder');

        // Provider dropdown — populated from database
        $providersList = [];
        foreach (Providers::find() as $provider) {
            $providersList[$provider->uniqid] = $provider->getRepresent();
        }
        $options['providers'] = $providersList;
        $options['providerPlaceholder'] = $this->translation->_('module_template_ProviderPlaceholder');

        return $options;
    }

    /**
     * Saves posted form data to the database.
     */
    public function saveAction(): void
    {
        if (!$this->request->isPost()) {
            return;
        }
        $data = $this->request->getPost();
        $record = ModuleExampleForm::findFirstById($data['id'] ?? null);
        if ($record === null) {
            $record = new ModuleExampleForm();
        }
        foreach ($record as $key => $value) {
            switch ($key) {
                case 'id':
                    break;
                case 'checkbox_field':
                case 'toggle_field':
                    if (array_key_exists($key, $data)) {
                        $record->$key = ($data[$key] === 'on') ? '1' : '0';
                    } else {
                        $record->$key = '0';
                    }
                    break;
                default:
                    if (array_key_exists($key, $data)) {
                        $record->$key = $data[$key];
                    } else {
                        $record->$key = '';
                    }
            }
        }

        $this->saveEntity($record);
    }

    /**
     * Deletes a record by ID.
     *
     * @param string $recordId Record identifier
     */
    public function deleteAction(string $recordId): void
    {
        $record = ModuleExampleForm::findFirstById($recordId);
        if ($record !== null) {
            $this->deleteEntity($record, 'module-example-form/module-example-form/index');
        }
    }
}
