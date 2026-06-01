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

namespace Modules\ModuleExampleCron\Lib;

use MikoPBX\Common\Handlers\CriticalErrorsHandler;
use MikoPBX\Core\System\Directories;
use MikoPBX\Core\System\Util;
use MikoPBX\Core\Workers\WorkerBase;

require_once 'Globals.php';

/**
 * Class WorkerExampleCronMain
 *
 * The scheduled worker that performs the module's observable unit of work.
 *
 * WHY EXTEND WorkerBase:
 *   WorkerBase is the canonical base class for every MikoPBX background process.
 *   It wires the dependency-injection container, registers signal handlers
 *   (SIGTERM / SIGUSR1) for clean restarts, enforces a PID-directory pre-flight
 *   check, and declares the public contract `start(array $argv): void` that the
 *   core launcher invokes. We only have to implement start().
 *
 * SHORT-LIVED vs. PERSISTENT:
 *   Many MikoPBX workers loop forever (`while (true) { ... }`) and stay resident.
 *   This demo intentionally does the opposite: it does ONE observable action and
 *   returns. That is a perfectly valid CHECK_BY_PID_NOT_ALERT worker — the core
 *   supervisor will simply launch a fresh copy on its next pass (and the crontab
 *   line does the same once a minute). Because the work is quick, at most one
 *   copy is ever alive, which is what makes the process-title dedup effective.
 *
 * DEDUP — HOW PILE-UPS ARE PREVENTED:
 *   The launcher (Processes::processPHPWorker) and the supervisor
 *   (checkPidNotAlert) both detect a running instance via
 *   Processes::getPidOfProcess(self::class), which greps `ps -A -o pid,args`
 *   for the process *title*. WorkerBase::startWorker() sets that title with
 *   cli_set_process_title(static::class) before calling start(). So if a
 *   previous run is still executing when the next tick fires, the new launch
 *   finds the title already present and does nothing. Identifying the worker by
 *   its class-name title is the entire dedup mechanism — keep the bootstrap at
 *   the bottom of this file intact so the title is set.
 *
 * @package Modules\ModuleExampleCron\Lib
 */
class WorkerExampleCronMain extends WorkerBase
{
    /**
     * Number of instances the core should keep alive.
     *
     * Processes::processPHPWorker() reads this default property by reflection to
     * decide how many copies to maintain. Keeping it at 1 makes the dedup
     * unambiguous: exactly one instance, never a pool.
     */
    public int $maxProc = 1;

    /**
     * Worker entry point invoked by the core launcher.
     *
     * The launcher only proceeds when $argv[1] === 'start' (see the bootstrap
     * block below), and it sets the process title to this class name *before*
     * calling start(), which is what makes the worker discoverable by ps for
     * dedup and supervision.
     *
     * The body here is the module's actual job: append one human-readable
     * timestamp line to the module's heartbeat log. A real module would do
     * meaningful periodic work (rotate data, poll an API, recompute a cache);
     * writing a line is simply the smallest thing that is *observable* on the
     * server so a learner can confirm "the schedule fired".
     *
     * @param array $argv Command-line arguments passed by the launcher.
     *
     * @return void
     */
    public function start(array $argv): void
    {
        // Resolve this module's own log directory under the system logs root.
        // Directories::getDir(CORE_LOGS_DIR) returns the runtime-configured logs
        // path (e.g. /storage/usbdisk1/mikopbx/log on a real install), so the
        // module log lives at <logsDir>/ModuleExampleCron/. Util::mwMkdir is the
        // core helper that creates the directory tree with the right ownership.
        $logDir = Directories::getDir(Directories::CORE_LOGS_DIR) . '/ModuleExampleCron';
        Util::mwMkdir($logDir);

        $logFile = $logDir . '/heartbeat.log';

        // Build one observable line: ISO-8601 timestamp + our PID. The PID lets a
        // reader confirm that each run is a fresh, separate process (and that
        // they never overlap — proof the dedup works).
        $line = sprintf(
            '[%s] ModuleExampleCron heartbeat — scheduled worker ran (pid=%d)%s',
            date('Y-m-d H:i:s'),
            getmypid(),
            PHP_EOL
        );

        // Append, never truncate, so the file accumulates one line per run.
        file_put_contents($logFile, $line, FILE_APPEND | LOCK_EX);

        // Nothing else to do — returning here ends the process. The core
        // supervisor / crontab will start the next run on the next tick.
    }
}

// ---------------------------------------------------------------------------
// Worker bootstrap.
//
// When the core launches a worker it runs:  php -f <thisFile> start
// The guard below mirrors every MikoPBX worker: only act when invoked with the
// 'start' argument, set the process title to the class name (this is what the
// dedup/supervision ps-grep matches on), construct the worker and run it. Any
// throwable is funnelled to the core's CriticalErrorsHandler so it reaches the
// system log / Sentry instead of vanishing.
// ---------------------------------------------------------------------------
$workerClassname = WorkerExampleCronMain::class;
if (isset($argv) && count($argv) > 1) {
    cli_set_process_title($workerClassname);
    try {
        $worker = new $workerClassname();
        $worker->start($argv);
    } catch (\Throwable $e) {
        CriticalErrorsHandler::handleExceptionWithSyslog($e);
    }
}
