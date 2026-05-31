#!/usr/bin/php
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

/**
 * example-agi.php — a minimal, working PHP-AGI script for MikoPBX.
 *
 * USAGE
 *   This script is not meant to be run by hand. Asterisk launches it through
 *   the AGI() dialplan application. The module's ConfigClass
 *   (Lib/ExampleAgiConf.php) injects a context that does exactly that:
 *
 *       exten => _X.,1,AGI(/.../ModuleExampleAgi/agi-bin/example-agi.php)
 *
 *   When Asterisk runs an AGI script it:
 *     1. spawns this PHP process,
 *     2. writes the call's "agi_*" environment (channel, callerid, ...) to the
 *        script's STDIN as a header block,
 *     3. then exchanges commands/answers over STDIN/STDOUT.
 *   The MikoPBX AGI class reads that header in its constructor and exposes it
 *   as $agi->request['agi_callerid'], $agi->request['agi_channel'], etc.
 *
 * HOW TO DEBUG
 *   See DevelopementDocs/module-developement/debuging/debug-php-agi.md — it
 *   explains how to attach a debugger and how to read the verbose() output in
 *   the Asterisk console (`asterisk -rvvvvv`).
 *
 * WHAT THIS DEMO SHOWS
 *   A realistic "enrich the call with a lookup" pattern:
 *     - read the incoming CallerID number from the AGI request,
 *     - resolve it against a small in-script directory (a real module would hit
 *       a database, a phone book or an external CRM here),
 *     - publish the result back into the channel as a variable the dialplan can
 *       branch on, and log a human-readable line to the Asterisk console.
 */

// Globals.php bootstraps the MikoPBX CLI environment: it wires up the
// dependency-injection container and the class autoloader so that
// "use MikoPBX\Core\..." classes resolve. Every MikoPBX AGI/CLI script starts
// with this require. It must come before we instantiate any core class.
require_once 'Globals.php';

use MikoPBX\Core\Asterisk\AGI;
use MikoPBX\Core\System\Util;

/**
 * A tiny in-script "directory": maps a CallerID number to a department name.
 *
 * In production you would replace this lookup with a database query, a call to
 * the Phone Book module, or an external API request. Keeping it inline here lets
 * the example run with zero external dependencies.
 *
 * @var array<string, string> $directory
 */
$directory = [
    '74952293042' => 'Sales',
    '74950000001' => 'Support',
    '1001'        => 'Reception',
];

try {
    // Instantiating AGI() reads the request header from STDIN (see AGIBase).
    $agi = new AGI();

    // The caller's number arrives as the "agi_callerid" request field.
    // We fall back to an empty string if Asterisk did not provide it.
    $callerNumber = $agi->request['agi_callerid'] ?? '';

    // verbose() prints to the Asterisk console when verbosity is high enough.
    // It is the AGI-friendly equivalent of a log line and the first thing you
    // watch while debugging (see debug-php-agi.md).
    $agi->verbose('ModuleExampleAgi: incoming call from "' . $callerNumber . '"');

    // Perform the lookup. Unknown numbers map to a neutral default so the
    // dialplan always has a defined value to branch on.
    $department = $directory[$callerNumber] ?? 'Unknown';

    // Publish the result back to the channel. set_variable() creates a channel
    // variable that the dialplan can read as ${EXAMPLE_AGI_DEPARTMENT}
    // immediately after AGI() returns. (Do not confuse set_variable() with the
    // separate set_var() method — set_variable() is the SET VARIABLE primitive.)
    $agi->set_variable('EXAMPLE_AGI_DEPARTMENT', $department);

    // noop() drops a marker into the dialplan trace. Handy when you want the
    // outcome to appear in the same place as the dialplan's own NoOp lines.
    $agi->noop('ModuleExampleAgi: resolved "' . $callerNumber . '" to department "' . $department . '"');
} catch (\Throwable $e) {
    // Never let an AGI script die silently: a fatal here would just drop the
    // call with no trace. Log to the system log under the module id so the
    // failure is discoverable, exactly as the core CTI example does.
    Util::sysLogMsg('ModuleExampleAgi', $e->getMessage(), LOG_ERR);
}
