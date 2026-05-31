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

namespace Modules\ModuleExampleDialplan\Setup;

use MikoPBX\Modules\Setup\PbxExtensionSetupBase;

/**
 * Module installer / uninstaller.
 *
 * This example module demonstrates how to inject custom Asterisk dialplan from a
 * module's ConfigClass, so it deliberately carries NO database models, web UI or
 * background workers. As a result the installer needs no custom logic at all:
 *
 *  - PbxExtensionSetupBase::installModule() handles version compatibility
 *    (min_pbx_version), license activation, file registration and DB migration.
 *  - PbxExtensionSetupBase::installDB() globs Models/*.php to build per-module
 *    tables. With no Models/ directory the glob is empty and installDB() is a
 *    no-op, which is exactly what a pure-dialplan module wants.
 *
 * Subclassing the base with an empty body is the canonical "minimal installer"
 * pattern (see Extensions/ModuleTemplate/Setup/PbxExtensionSetup.php). Override
 * installDB(), installFiles(), unInstallDB() etc. only when you actually have
 * extra setup work to perform.
 *
 * @package Modules\ModuleExampleDialplan\Setup
 */
class PbxExtensionSetup extends PbxExtensionSetupBase
{
}
