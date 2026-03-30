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

use MikoPBX\Core\System\Processes;
use MikoPBX\Core\Workers\Cron\WorkerSafeScriptsCore;
use MikoPBX\Modules\PbxExtensionBase;
use MikoPBX\Modules\PbxExtensionUtils;
use MikoPBX\PBXCoreREST\Lib\PBXApiResult;

class ExampleFormMain extends PbxExtensionBase
{
    /**
     * Processes AMI event data received by the AMI worker.
     *
     * @param array $parameters AMI event parameters
     */
    public function processAmiMessage(array $parameters): void
    {
        $message = implode(' ', $parameters);
        $this->logger->writeInfo($message);
    }

    /**
     * Processes Beanstalk queue message received by the queue worker.
     *
     * @param array $parameters Decoded message data
     */
    public function processBeanstalkMessage(array $parameters): void
    {
        $message = implode(' ', $parameters);
        $this->logger->writeInfo($message);
    }

    /**
     * Checks module health and returns status via REST API.
     *
     * @return PBXApiResult API response with success status
     */
    public function checkModuleWorkProperly(): PBXApiResult
    {
        $res = new PBXApiResult();
        $res->processor = __METHOD__;
        $res->success = true;
        return $res;
    }

    /**
     * Starts or restarts all module workers.
     *
     * @param bool $restart True to force restart, false to start if not running
     */
    public function startAllServices(bool $restart = false): void
    {
        $moduleEnabled = PbxExtensionUtils::isEnabled($this->moduleUniqueId);
        if (!$moduleEnabled) {
            return;
        }
        $configClass = new ExampleFormConf();
        $workersToRestart = $configClass->getModuleWorkers();

        if ($restart) {
            foreach ($workersToRestart as $moduleWorker) {
                Processes::processPHPWorker($moduleWorker['worker']);
            }
        } else {
            $safeScript = new WorkerSafeScriptsCore();
            foreach ($workersToRestart as $moduleWorker) {
                if ($moduleWorker['type'] === WorkerSafeScriptsCore::CHECK_BY_AMI) {
                    $safeScript->checkWorkerAMI($moduleWorker['worker']);
                } else {
                    $safeScript->checkWorkerBeanstalk($moduleWorker['worker']);
                }
            }
        }
    }
}
