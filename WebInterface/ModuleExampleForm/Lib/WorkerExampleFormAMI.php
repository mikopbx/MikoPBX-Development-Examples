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

use MikoPBX\Common\Handlers\CriticalErrorsHandler;
use MikoPBX\Core\Asterisk\AsteriskManager;
use MikoPBX\Core\System\Util;
use MikoPBX\Core\Workers\WorkerBase;

require_once 'Globals.php';

/**
 * AMI event listener worker.
 * Connects to Asterisk Manager Interface and processes UserEvent messages.
 */
class WorkerExampleFormAMI extends WorkerBase
{
    protected AsteriskManager $am;
    protected ExampleFormMain $templateMain;

    /**
     * Starts the AMI event listener loop.
     *
     * @param array $argv Command line arguments
     */
    public function start(array $argv): void
    {
        $this->templateMain = new ExampleFormMain();
        $this->am = Util::getAstManager();
        $this->setFilter();
        $this->am->addEventHandler('userevent', [$this, 'callback']);
        while (true) {
            $result = $this->am->waitUserEvent(true);
            if ($result === []) {
                usleep(100000);
                $this->am = Util::getAstManager();
                $this->setFilter();
            }
        }
    }

    /**
     * Configures AMI event filters.
     *
     * @return array Filter response from AMI
     */
    private function setFilter(): array
    {
        // Ping event for health check
        $pingTube = $this->makePingTubeName(self::class);
        $params = ['Operation' => 'Add', 'Filter' => 'UserEvent: ' . $pingTube];
        $this->am->sendRequestTimeout('Filter', $params);

        // Example: listen for Interception events on inbound calls
        $params = ['Operation' => 'Add', 'Filter' => 'UserEvent: Interception'];
        return $this->am->sendRequestTimeout('Filter', $params);
    }

    /**
     * Handles incoming AMI events.
     *
     * @param array $parameters AMI event parameters
     */
    public function callback(array $parameters): void
    {
        if ($this->replyOnPingRequest($parameters)) {
            return;
        }

        if (stripos($parameters['UserEvent'], 'Interception') === false) {
            return;
        }

        $this->templateMain->processAmiMessage($parameters);
    }
}

// Start worker process
$workerClassname = WorkerExampleFormAMI::class;
if (isset($argv) && count($argv) > 1) {
    cli_set_process_title($workerClassname);
    try {
        $worker = new $workerClassname();
        $worker->start($argv);
    } catch (\Throwable $e) {
        CriticalErrorsHandler::handleExceptionWithSyslog($e);
    }
}
