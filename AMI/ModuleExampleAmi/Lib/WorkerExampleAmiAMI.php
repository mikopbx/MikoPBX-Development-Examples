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

use MikoPBX\Common\Handlers\CriticalErrorsHandler;
use MikoPBX\Common\Providers\EventBusProvider;
use MikoPBX\Core\Asterisk\AsteriskManager;
use MikoPBX\Core\System\Util;
use MikoPBX\Core\Workers\WorkerBase;
use Phalcon\Di\Di;

require_once 'Globals.php';

/**
 * Background worker for AMI events streaming
 *
 * Listens to Asterisk Manager Interface events and broadcasts them
 * to frontend via EventBus for real-time display
 */
class WorkerExampleAmiAMI extends WorkerBase
{
    /**
     * AMI connection instance
     */
    protected AsteriskManager $am;

    /**
     * Start AMI events listener worker
     *
     * Flow: Connect to AMI → Register filters → Listen for events → Broadcast via EventBus
     *
     * @param array<int, string> $argv Command line arguments
     */
    public function start(array $argv): void
    {
        $this->am = Util::getAstManager();
        $this->setFilter();
        $this->am->addEventHandler("*", [$this, "callback"]);

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
     * Configure AMI event filters
     *
     * Subscribes to specific Asterisk events for display in frontend
     * Without explicit filters, AMI only sends login/ping responses
     */
    private function setFilter(): void
    {
        // Subscribe to worker ping events
        $pingTube = $this->makePingTubeName(self::class);
        $params   = ['Operation' => 'Add', 'Filter' => 'UserEvent: ' . $pingTube];
        $this->am->sendRequestTimeout('Filter', $params);

        // Subscribe to call-related events for educational purposes
        $interestingEvents = [
            'Newchannel',        // New call channel created
            'Newstate',          // Channel state changed
            'DialBegin',         // Dial started
            'DialEnd',           // Dial ended
            'Hangup',            // Call ended
            'PeerStatus',        // SIP peer status
            'ExtensionStatus',   // Extension state changed
            'Hold',              // Call on hold
            'Unhold',            // Call off hold
            'Bridge',            // Channels bridged
        ];

        foreach ($interestingEvents as $event) {
            $params = ['Operation' => 'Add', 'Filter' => "Event: $event"];
            $this->am->sendRequestTimeout('Filter', $params);
        }
    }

    /**
     * Process AMI event and broadcast to frontend
     *
     * Publishes events to 'ami-events' EventBus channel for real-time
     * display in web interface
     *
     * @param array<string, mixed> $parameters Event data from Asterisk
     */
    public function callback(array $parameters): void
    {
        if ($this->replyOnPingRequest($parameters)) {
            return;
        }

        $di = Di::getDefault();
        $di->get(EventBusProvider::SERVICE_NAME)->publish('ami-events', [
            'event' => $parameters['Event'] ?? 'Unknown',
            'data' => $parameters,
            'timestamp' => date('Y-m-d H:i:s')
        ]);
    }

}

// Start worker process
$workerClassname = WorkerExampleAmiAMI::class;
if (isset($argv) && count($argv) > 1) {
    cli_set_process_title($workerClassname);
    try {
        $worker = new $workerClassname();
        $worker->start($argv);
    } catch (\Throwable $e) {
        CriticalErrorsHandler::handleExceptionWithSyslog($e);
    }
}