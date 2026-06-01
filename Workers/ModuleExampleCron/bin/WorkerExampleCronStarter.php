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
 * WorkerExampleCronStarter.php — the idempotent launcher invoked by cron.
 *
 * WHAT CRON RUNS:
 *   ExampleCronConf::createCronTasks() adds this exact crontab line:
 *
 *       * * * * * <php> -f <.../bin/WorkerExampleCronStarter.php> > /dev/null 2>&1
 *
 *   i.e. cron runs THIS file once a minute. It is deliberately tiny: its only
 *   job is to ask the core to (re)launch the real worker in a deduplicated way.
 *
 * WHY NOT LET CRON RUN THE WORKER DIRECTLY:
 *   If the crontab launched bin/../Lib/WorkerExampleCronMain.php straight away,
 *   a slow run could still be executing when the next minute's tick fired, and
 *   cron would happily start a second copy — workers would pile up. Routing
 *   through Processes::processPHPWorker() reuses the SAME guard the core uses
 *   for its own workers: it counts processes whose title equals the worker
 *   class name (via ps) and only spawns the missing instance. If the worker is
 *   already running, this call is a no-op. That is the "deduplicated, safe"
 *   launch the example is built to demonstrate.
 *
 * RELATIONSHIP TO THE CORE SUPERVISOR:
 *   The module also registers the same worker with WorkerSafeScriptsCore in
 *   CHECK_BY_PID_NOT_ALERT mode (see ExampleCronConf::getModuleWorkers()). That
 *   supervisor uses the identical processPHPWorker() launcher, so the cron line
 *   and the supervisor can coexist without ever doubling the worker.
 */

// Globals.php bootstraps the MikoPBX CLI environment: it wires up the
// dependency-injection container and the autoloader so "use MikoPBX\..." class
// names resolve. Every MikoPBX CLI/worker entry point starts with this require;
// it must precede any reference to a core class.
require_once 'Globals.php';

use MikoPBX\Core\System\Processes;
use Modules\ModuleExampleCron\Lib\WorkerExampleCronMain;

// Ask the core to ensure exactly one instance of our worker is running.
//   - 1st arg: the fully-qualified worker class name. processPHPWorker()
//              resolves its file path with Util::getFilePathByClassName() and
//              counts live processes by this title.
//   - 'start' (paramForPHPWorker): passed to the worker as $argv[1]; the worker
//              bootstrap only runs when it sees 'start'.
//   - 'start' (action): "start the deficit only" — spawn one instance solely if
//              none is currently alive. (Contrast with 'restart', which would
//              kill the running copy first; we want dedup, not a kill-restart.)
Processes::processPHPWorker(WorkerExampleCronMain::class, 'start', 'start');
