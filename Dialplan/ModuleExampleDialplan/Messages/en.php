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
     * Module metadata.
     *
     * MikoPBX builds the module's title and subtitle in the web UI from the
     * Breadcrumb<ModuleUniqueID> and SubHeader<ModuleUniqueID> keys. They are kept
     * here even though this example has no UI pages, so the module name is localised
     * wherever the Core surfaces it (module list, install screens).
     */
    'BreadcrumbModuleExampleDialplan' => 'Dialplan Generation Example',
    'SubHeaderModuleExampleDialplan' => 'Educational module: inject custom Asterisk dialplan from a ConfigClass',

    /**
     * Short feature descriptions (prefix module_exampledialplan_).
     */
    'module_exampledialplan_Description' => 'Demonstrates the extensions.conf hook family: a custom context, an internal include, an incoming-route pre-dial hook and a small IVR/announcement.',
    'module_exampledialplan_IvrTitle' => 'Demo announcement IVR',
    'module_exampledialplan_IvrHint' => 'Dial *761 from any internal phone to reach the example IVR menu.',
];
