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

use MikoPBX\Common\Models\PbxSettings;
use MikoPBX\Core\Asterisk\AsteriskManager;
use MikoPBX\Core\System\Processes;
use MikoPBX\Core\System\System;
use MikoPBX\Core\System\Util;
use MikoPBX\Core\Workers\Cron\WorkerSafeScriptsCore;
use MikoPBX\Modules\Config\ConfigClass;
use MikoPBX\PBXCoreREST\Lib\PBXApiResult;
use Modules\ModuleExampleAmi\Models\ModuleExampleAmi;

/**
 * Configuration class for AMI Example Module
 *
 * Handles:
 * - REST API endpoints for AMI commands
 * - Worker registration
 * - Asterisk manager.conf generation
 * - Module lifecycle hooks
 */
class ExampleAmiConf extends ConfigClass
{
    /**
     * Handle database model change events
     *
     * Restarts workers when PBX language changes to reload translations
     *
     * @param mixed $data Change event data
     */
    public function modelsEventChangeData($data): void
    {
        if (
            $data['model'] === PbxSettings::class
            && $data['recordId'] === 'PBXLanguage'
        ) {
            $templateMain = new ExampleAmiMain();
            $templateMain->startAllServices(true);
        }
    }

    /**
     * Get module workers for monitoring
     *
     * Registers the AMI events listener worker for automatic monitoring
     * and restart by WorkerSafeScriptsCore
     *
     * @return array<int, array<string, string>> Worker configurations
     */
    public function getModuleWorkers(): array
    {
        return [
            [
                'type'   => WorkerSafeScriptsCore::CHECK_BY_AMI,
                'worker' => WorkerExampleAmiAMI::class,
            ],
        ];
    }

    /**
     * Handle REST API requests
     *
     * Routes API requests to appropriate actions:
     * - sendCommand: Execute AMI commands
     * - check: Health check
     * - reload: Restart workers
     *
     * @param array<string, mixed> $request Request data with 'action' and 'data' keys
     * @return PBXApiResult API response object
     */
    public function moduleRestAPICallback(array $request): PBXApiResult
    {
        $action = $request['action'] ?? '';
        $data   = $request['data'] ?? [];

        return match ($action) {
            'sendCommand' => $this->sendAmiCommandAction($data),
            'check'       => $this->checkAction(),
            'reload'      => $this->reloadAction(),
            default       => $this->createErrorResult("Unknown action: {$action}")
        };
    }

    /**
     * Execute AMI command or action
     *
     * Supports two types of commands:
     * 1. CLI commands: "core show version", "pjsip show endpoints"
     * 2. AMI Actions: "Action: Ping", "Action: CoreStatus\nActionID: test123"
     *
     * @param array<string, mixed> $data Request data with 'command' key
     * @return PBXApiResult Response with command output
     */
    private function sendAmiCommandAction(array $data): PBXApiResult
    {
        $res = new PBXApiResult();
        $res->processor = __METHOD__;

        $command = $data['command'] ?? '';

        if (empty($command)) {
            $res->success = false;
            $res->messages['error'] = ['Command is required'];
            return $res;
        }

        $am = Util::getAstManager();
        $isAmiAction = stripos(trim($command), 'Action:') === 0;

        if ($isAmiAction) {
            $result = $this->sendNativeAmiAction($am, $command);
        } else {
            // NOTE: Using direct CLI execution because AMI "Command" action
            // doesn't reliably return output in Asterisk 20
            $result = $this->executeCliCommand($command);
        }

        $res->success = true;
        $res->data = [
            'command' => $command,
            'response' => $result,
            'timestamp' => date('Y-m-d H:i:s')
        ];

        return $res;
    }

    /**
     * Execute CLI command via Asterisk console
     *
     * Uses direct asterisk -rx execution because AMI Command action
     * doesn't reliably return output in Asterisk 20
     *
     * @param string $command CLI command to execute
     * @return array<string, mixed> Response with command output
     */
    private function executeCliCommand(string $command): array
    {
        $output = [];
        Processes::mwExec("/usr/sbin/asterisk -rx " . escapeshellarg($command), $output);

        return [
            'Response' => 'Success',
            'Message' => 'Command executed via CLI',
            'data' => $output
        ];
    }

    /**
     * Send native AMI protocol action
     *
     * Parses multi-line AMI action format ("Action: Ping\nActionID: 123")
     * and executes via Asterisk Manager Interface
     *
     * @param AsteriskManager $am Asterisk Manager connection
     * @param string $command Multi-line AMI action string
     * @return array<string, mixed> AMI response
     */
    private function sendNativeAmiAction(AsteriskManager $am, string $command): array
    {
        $lines = explode("\n", $command);
        $params = [];
        $action = '';

        foreach ($lines as $line) {
            $line = trim($line);
            if (empty($line)) {
                continue;
            }

            if (strpos($line, ':') !== false) {
                [$key, $value] = explode(':', $line, 2);
                $key = trim($key);
                $value = trim($value);

                if (strcasecmp($key, 'Action') === 0) {
                    $action = $value;
                } else {
                    $params[$key] = $value;
                }
            }
        }

        if (empty($action)) {
            return ['error' => 'No Action specified'];
        }

        return $am->sendRequestTimeout($action, $params);
    }

    /**
     * Perform module health check
     *
     * @return PBXApiResult Module status and worker health
     */
    private function checkAction(): PBXApiResult
    {
        $templateMain = new ExampleAmiMain();
        return $templateMain->checkModuleWorkProperly();
    }

    /**
     * Reload module workers
     *
     * Restarts all module workers without full module reload
     *
     * @return PBXApiResult Reload status
     */
    private function reloadAction(): PBXApiResult
    {
        $res = new PBXApiResult();
        $res->processor = __METHOD__;

        $templateMain = new ExampleAmiMain();
        $templateMain->startAllServices(true);

        $res->success = true;
        $res->data = ['message' => 'Services reloaded'];

        return $res;
    }

    /**
     * Create error response
     *
     * @param string $message Error message
     * @return PBXApiResult Error result object
     */
    private function createErrorResult(string $message): PBXApiResult
    {
        $res = new PBXApiResult();
        $res->processor = __METHOD__;
        $res->success = false;
        $res->messages['error'] = [$message];

        return $res;
    }


    /**
     * Generate Asterisk manager.conf configuration
     *
     * Creates AMI user section with credentials from module settings
     * Security: localhost-only access with full permissions (educational example)
     *
     * @return string Configuration section for manager.conf
     */
    public function generateManagerConf(): string
    {
        $settings = ModuleExampleAmi::findFirst();
        if ($settings === null) {
            return '';
        }

        $conf = "[{$settings->ami_user}]" . PHP_EOL;
        $conf .= "secret={$settings->ami_password}" . PHP_EOL;
        $conf .= 'deny=0.0.0.0/0.0.0.0' . PHP_EOL;
        $conf .= 'permit=127.0.0.1/255.255.255.255' . PHP_EOL;
        $conf .= 'read=all' . PHP_EOL;
        $conf .= 'write=all' . PHP_EOL;
        $conf .= PHP_EOL;

        return $conf;
    }

    /**
     * Handle module enable event
     *
     * Reloads Asterisk manager to apply AMI user and starts workers
     */
    public function onAfterModuleEnable(): void
    {
        System::invokeActions(['manager' => 0]);

        $templateMain = new ExampleAmiMain();
        $templateMain->startAllServices();
    }

    /**
     * Handle module disable event
     *
     * Reloads Asterisk manager to remove AMI user
     */
    public function onAfterModuleDisable(): void
    {
        System::invokeActions(['manager' => 0]);
    }
}