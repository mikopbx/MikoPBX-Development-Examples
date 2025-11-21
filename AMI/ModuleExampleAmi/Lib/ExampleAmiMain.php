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

namespace Modules\ModuleExampleAmi\Lib;

use MikoPBX\Core\System\Processes;
use MikoPBX\Modules\PbxExtensionBase;
use MikoPBX\Modules\PbxExtensionUtils;
use MikoPBX\PBXCoreREST\Lib\PBXApiResult;

/**
 * Main module class for AMI Example
 *
 * Handles module lifecycle operations:
 * - Health checks
 * - Worker management
 */
class ExampleAmiMain extends PbxExtensionBase
{
    /**
     * Perform module health check
     *
     * @return PBXApiResult Module status and metadata
     */
    public function checkModuleWorkProperly(): PBXApiResult
    {
        $res = new PBXApiResult();
        $res->processor = __METHOD__;
        $res->success = true;
        $res->data = [
            'module' => 'ModuleExampleAmi',
            'status' => 'operational',
            'pattern' => 'AMI Events Streaming Example',
            'timestamp' => date('Y-m-d H:i:s')
        ];

        return $res;
    }

    /**
     * Start or restart module workers
     *
     * Manages worker lifecycle using processPHPWorker which handles
     * both restart and start-if-not-running scenarios
     *
     * @param bool $restart Whether to restart workers (unused, kept for compatibility)
     */
    public function startAllServices(bool $restart = false): void
    {
        $moduleEnabled = PbxExtensionUtils::isEnabled($this->moduleUniqueId);
        if (!$moduleEnabled) {
            return;
        }

        $configClass = new ExampleAmiConf();
        $workersToRestart = $configClass->getModuleWorkers();

        foreach ($workersToRestart as $moduleWorker) {
            Processes::processPHPWorker($moduleWorker['worker']);
        }
    }
}