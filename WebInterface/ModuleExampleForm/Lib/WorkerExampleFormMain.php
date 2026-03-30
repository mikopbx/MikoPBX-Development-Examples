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
use MikoPBX\Core\System\BeanstalkClient;
use MikoPBX\Core\Workers\WorkerBase;

require_once 'Globals.php';

/**
 * Beanstalk queue listener worker.
 * Subscribes to a named tube and processes incoming messages.
 */
class WorkerExampleFormMain extends WorkerBase
{
    protected ExampleFormMain $templateMain;

    /**
     * Starts the Beanstalk queue listener loop.
     *
     * @param array $argv Command line arguments
     */
    public function start(array $argv): void
    {
        $this->templateMain = new ExampleFormMain();
        $client = new BeanstalkClient(self::class);
        $client->subscribe($this->makePingTubeName(self::class), [$this, 'pingCallBack']);
        $client->subscribe(self::class, [$this, 'beanstalkCallback']);
        while (true) {
            $client->wait();
        }
    }

    /**
     * Handles incoming Beanstalk messages.
     *
     * @param BeanstalkClient $message Beanstalk message wrapper
     */
    public function beanstalkCallback(BeanstalkClient $message): void
    {
        $receivedMessage = json_decode($message->getBody(), true);
        $this->templateMain->processBeanstalkMessage($receivedMessage);
    }
}

// Start worker process
$workerClassname = WorkerExampleFormMain::class;
if (isset($argv) && count($argv) > 1) {
    cli_set_process_title($workerClassname);
    try {
        $worker = new $workerClassname();
        $worker->start($argv);
    } catch (\Throwable $e) {
        CriticalErrorsHandler::handleExceptionWithSyslog($e);
    }
}
