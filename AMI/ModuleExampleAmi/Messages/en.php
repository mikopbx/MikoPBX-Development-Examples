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

return [
    /**
     * Module metadata
     */
    'BreadcrumbModuleExampleAmi' => 'AMI Terminal Example',
    'SubHeaderModuleExampleAmi' => 'Educational module for Asterisk Manager Interface',

    /**
     * Tab Headers
     */
    'module_ami_TabCommands' => 'Send AMI Command',
    'module_ami_TabEvents' => 'Real-time AMI Events',

    /**
     * Command Section
     */
    'module_ami_CommandLabel' => 'AMI Command or Action',
    'module_ami_CommandPlaceholder' => 'Enter CLI command (e.g.: core show version) or AMI Action (Action: Ping)',
    'module_ami_SendButton' => 'Send',
    'module_ami_ClearResponseButton' => 'Clear',
    'module_ami_ResponseLabel' => 'Response:',

    /**
     * Examples Section
     */
    'module_ami_ExamplesHeader' => 'Command Examples',
    'module_ami_ExampleCLI' => 'CLI Commands (via Action: Command)',
    'module_ami_ExampleCLI1' => 'pjsip show endpoints',
    'module_ami_ExampleCLI1Desc' => 'PJSIP devices',
    'module_ami_ExampleCLI2' => 'pjsip show aors',
    'module_ami_ExampleCLI2Desc' => 'PJSIP address of records',
    'module_ami_ExampleCLI3' => 'core show channels',
    'module_ami_ExampleCLI3Desc' => 'Active channels',
    'module_ami_ExampleCLI4' => 'core show uptime',
    'module_ami_ExampleCLI4Desc' => 'System uptime',

    'module_ami_ExampleActions' => 'AMI Actions (native commands)',
    'module_ami_ExampleAction1' => 'Action: PJSIPShowEndpoints',
    'module_ami_ExampleAction1Desc' => 'List PJSIP endpoints',
    'module_ami_ExampleAction2' => 'Action: CoreStatus',
    'module_ami_ExampleAction2Desc' => 'Asterisk core status',
    'module_ami_ExampleAction3' => 'Action: CoreShowChannels',
    'module_ami_ExampleAction3Desc' => 'Active channels',

    /**
     * Events Section
     */
    'module_ami_EventsToggle' => 'Enable real-time events monitoring',
    'module_ami_EventsLogLabel' => 'Events Log',
    'module_ami_ClearEventsButton' => 'Clear Log',
    'module_ami_FullscreenToggle' => 'Fullscreen mode',
    'module_ami_EventsHint' => 'Events are received in real-time via WebSocket EventBus',

    /**
     * Educational Info
     */
    'module_ami_EducationalHeader' => 'Educational Module',
    'module_ami_EducationalInfo1' => 'This module demonstrates real-time AMI event streaming from Asterisk to browser',
    'module_ami_EducationalInfo2' => 'Events are broadcast via EventBusProvider using \'ami-events\' channel',
    'module_ami_EducationalInfo3' => 'Frontend subscribes via EventBus.subscribe(\'ami-events\', callback)',
    'module_ami_EducationalInfo4' => 'AMI commands are sent via REST API Pattern 1 (moduleRestAPICallback)',
    'module_ami_EducationalInfo5' => 'AMI credentials are auto-generated during module installation',

    /**
     * JavaScript Messages
     */
    'module_ami_ErrorNoCommand' => 'Please enter a command',
    'module_ami_SendingCommand' => 'Sending command...',
    'module_ami_UnknownError' => 'Unknown error',
    'module_ami_ErrorPrefix' => 'Error: ',
    'module_ami_NetworkError' => 'Network error - please check connection',
    'module_ami_EventsEnabled' => 'AMI events monitoring enabled',
    'module_ami_EventsDisabled' => 'AMI events monitoring disabled',
    'module_ami_Initialized' => 'ModuleExampleAmi initialized - listening for AMI events on EventBus channel "ami-events"',
];
