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
    'BreadcrumbModuleExampleAmi' => 'Пример AMI терминала',
    'SubHeaderModuleExampleAmi' => 'Учебный модуль для работы с Asterisk Manager Interface',

    /**
     * Tab Headers
     */
    'module_ami_TabCommands' => 'Отправить AMI команду',
    'module_ami_TabEvents' => 'AMI события в реальном времени',

    /**
     * Command Section
     */
    'module_ami_CommandLabel' => 'AMI команда или Action',
    'module_ami_CommandPlaceholder' => 'Введите CLI команду (например: core show version) или AMI Action (Action: Ping)',
    'module_ami_SendButton' => 'Отправить',
    'module_ami_ClearResponseButton' => 'Очистить',
    'module_ami_ResponseLabel' => 'Ответ:',

    /**
     * Examples Section
     */
    'module_ami_ExamplesHeader' => 'Примеры команд',
    'module_ami_ExampleCLI' => 'CLI команды (через Action: Command)',
    'module_ami_ExampleCLI1' => 'pjsip show endpoints',
    'module_ami_ExampleCLI1Desc' => 'PJSIP устройства',
    'module_ami_ExampleCLI2' => 'pjsip show aors',
    'module_ami_ExampleCLI2Desc' => 'PJSIP адреса регистрации',
    'module_ami_ExampleCLI3' => 'core show channels',
    'module_ami_ExampleCLI3Desc' => 'Активные каналы',
    'module_ami_ExampleCLI4' => 'core show uptime',
    'module_ami_ExampleCLI4Desc' => 'Время работы системы',

    'module_ami_ExampleActions' => 'AMI Actions (нативные команды)',
    'module_ami_ExampleAction1' => 'Action: PJSIPShowEndpoints',
    'module_ami_ExampleAction1Desc' => 'Список PJSIP endpoints',
    'module_ami_ExampleAction2' => 'Action: CoreStatus',
    'module_ami_ExampleAction2Desc' => 'Статус ядра Asterisk',
    'module_ami_ExampleAction3' => 'Action: CoreShowChannels',
    'module_ami_ExampleAction3Desc' => 'Активные каналы',

    /**
     * Events Section
     */
    'module_ami_EventsToggle' => 'Включить мониторинг событий в реальном времени',
    'module_ami_EventsLogLabel' => 'Журнал событий',
    'module_ami_ClearEventsButton' => 'Очистить журнал',
    'module_ami_FullscreenToggle' => 'Полноэкранный режим',
    'module_ami_EventsHint' => 'События получаются в реальном времени через WebSocket EventBus',

    /**
     * Educational Info
     */
    'module_ami_EducationalHeader' => 'Учебный модуль',
    'module_ami_EducationalInfo1' => 'Этот модуль демонстрирует потоковую передачу AMI событий из Asterisk в браузер в реальном времени',
    'module_ami_EducationalInfo2' => 'События транслируются через EventBusProvider с использованием канала \'ami-events\'',
    'module_ami_EducationalInfo3' => 'Фронтенд подписывается через EventBus.subscribe(\'ami-events\', callback)',
    'module_ami_EducationalInfo4' => 'AMI команды отправляются через REST API Паттерн 1 (moduleRestAPICallback)',
    'module_ami_EducationalInfo5' => 'AMI учетные данные генерируются автоматически при установке модуля',

    /**
     * JavaScript Messages
     */
    'module_ami_ErrorNoCommand' => 'Пожалуйста, введите команду',
    'module_ami_SendingCommand' => 'Отправка команды...',
    'module_ami_UnknownError' => 'Неизвестная ошибка',
    'module_ami_ErrorPrefix' => 'Ошибка: ',
    'module_ami_NetworkError' => 'Ошибка сети - проверьте подключение',
    'module_ami_EventsEnabled' => 'Мониторинг AMI событий включен',
    'module_ami_EventsDisabled' => 'Мониторинг AMI событий отключен',
    'module_ami_Initialized' => 'ModuleExampleAmi инициализирован - слушаем AMI события на канале EventBus "ami-events"',
];
