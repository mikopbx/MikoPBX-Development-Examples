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
     * Метаданные модуля.
     */
    'BreadcrumbModuleExampleDialplan' => 'Пример генерации диалплана',
    'SubHeaderModuleExampleDialplan' => 'Учебный модуль: добавление своего диалплана Asterisk из ConfigClass',

    /**
     * Короткие описания возможностей (префикс module_exampledialplan_).
     */
    'module_exampledialplan_Description' => 'Демонстрирует семейство хуков extensions.conf: собственный контекст, include во внутренний план, хук перед набором для входящих маршрутов и небольшое IVR/объявление.',
    'module_exampledialplan_IvrTitle' => 'Демонстрационное IVR с объявлением',
    'module_exampledialplan_IvrHint' => 'Наберите *761 с любого внутреннего телефона, чтобы попасть в пример IVR-меню.',
];
