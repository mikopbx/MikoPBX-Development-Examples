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

namespace Modules\ModuleExampleAgi\Setup;

use MikoPBX\Modules\Setup\PbxExtensionSetupBase;

/**
 * Class PbxExtensionSetup
 *
 * Module installer / uninstaller entry point.
 *
 * WHY this class exists:
 *   MikoPBX discovers every module through a class named `PbxExtensionSetup`
 *   living in the module's `Setup` namespace. The core invokes its lifecycle
 *   hooks (installDB, installFiles, registerNewModule, unInstallDB, ...) during
 *   install, enable, disable and delete operations.
 *
 *   This particular demo module has no database tables, no web UI and no
 *   background workers — it only injects a piece of dialplan and ships an
 *   AGI script. Therefore the default behaviour provided by
 *   PbxExtensionSetupBase is everything we need, and the class body stays empty.
 *
 *   Keeping the class (even empty) is mandatory: it is the contract the core
 *   relies on to register the module under the unique id `ModuleExampleAgi`.
 *
 * @package Modules\ModuleExampleAgi\Setup
 */
class PbxExtensionSetup extends PbxExtensionSetupBase
{
}
