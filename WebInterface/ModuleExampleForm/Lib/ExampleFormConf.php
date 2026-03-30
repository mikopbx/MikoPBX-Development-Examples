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

namespace Modules\ModuleExampleForm\Lib;

use MikoPBX\Common\Models\PbxSettings;
use MikoPBX\Core\Workers\Cron\WorkerSafeScriptsCore;
use MikoPBX\Modules\Config\ConfigClass;
use MikoPBX\PBXCoreREST\Lib\PBXApiResult;

class ExampleFormConf extends ConfigClass
{
    /**
     * Receives information about main database changes.
     *
     * @param mixed $data Change event data with keys: model, recordId, changedFields
     */
    public function modelsEventChangeData(mixed $data): void
    {
        // Example: restart workers when PBX language changes
        if (
            $data['model'] === PbxSettings::class
            && $data['recordId'] === 'PBXLanguage'
        ) {
            $templateMain = new ExampleFormMain();
            $templateMain->startAllServices(true);
        }
    }

    /**
     * Returns module workers for WorkerSafeScriptsCore to supervise.
     *
     * @return array Worker definitions with type and class
     */
    public function getModuleWorkers(): array
    {
        return [
            [
                'type'   => WorkerSafeScriptsCore::CHECK_BY_BEANSTALK,
                'worker' => WorkerExampleFormMain::class,
            ],
            [
                'type'   => WorkerSafeScriptsCore::CHECK_BY_AMI,
                'worker' => WorkerExampleFormAMI::class,
            ],
        ];
    }

    /**
     * Processes REST API callback requests under root rights.
     *
     * @param array $request Request data with 'action' key
     * @return PBXApiResult API response
     */
    public function moduleRestAPICallback(array $request): PBXApiResult
    {
        $res = new PBXApiResult();
        $res->processor = __METHOD__;
        $action = strtoupper($request['action']);
        switch ($action) {
            case 'CHECK':
                $templateMain = new ExampleFormMain();
                $res = $templateMain->checkModuleWorkProperly();
                break;
            case 'RELOAD':
                $templateMain = new ExampleFormMain();
                $templateMain->startAllServices(true);
                $res->success = true;
                break;
            default:
                $res->success = false;
                $res->messages[] = 'API action not found in moduleRestAPICallback ModuleExampleForm';
        }

        return $res;
    }

    /**
     * Adds custom items to the sidebar menu.
     *
     * @param array $menuItems Menu items array passed by reference
     */
    public function onBeforeHeaderMenuShow(array &$menuItems): void
    {
        $menuItems['module_template_AdditionalMenuItem'] = [
            'caption'  => 'module_template_AdditionalMenuItem',
            'iconclass' => '',
            'submenu'  => [
                '/module-example-form/additional-page' => [
                    'caption'  => 'module_template_AdditionalSubMenuItem',
                    'iconclass' => 'gear',
                    'action'   => 'index',
                    'param'    => '',
                    'style'    => '',
                ],
            ],
        ];
    }
}
