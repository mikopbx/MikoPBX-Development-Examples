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

use MikoPBX\Core\System\Configs\CronConf;
use MikoPBX\Core\System\Util;
use MikoPBX\Core\Workers\Cron\WorkerSafeScriptsCore;
use MikoPBX\Modules\Config\ConfigClass;

/**
 * Class ExampleCronConf
 *
 * The single ConfigClass for the "scheduled work" demo module.
 *
 * A ConfigClass is the one hook point a module uses to influence the running
 * system. MikoPBX collects the output of a fixed, well-known set of methods
 * from every enabled module's ConfigClass while it (re)generates system
 * configuration. NEVER invent a method name here — the core only ever calls the
 * exact methods declared on ConfigClass / SystemConfigInterface. The two hooks
 * this module overrides are both real members of SystemConfigInterface:
 *   - createCronTasks(array &$tasks): void   — contribute crontab lines
 *   - getModuleWorkers(): array              — register supervised workers
 *
 * WHAT THIS MODULE TEACHES — TWO COMPLEMENTARY WAYS TO RUN PERIODIC WORK:
 *
 *   1. createCronTasks()  → a classic time-driven crontab line. The line below
 *      fires once a minute and asks the core to (re)launch our worker. Cron is
 *      the right tool when you want work pinned to a wall-clock schedule.
 *
 *   2. getModuleWorkers() → registers the SAME worker class with
 *      WorkerSafeScriptsCore in CHECK_BY_PID_NOT_ALERT mode. That core
 *      supervisor runs every minute (see CronConf) and, for a PID-monitored
 *      worker, RE-SPAWNS it only if no process with that title is alive.
 *
 *   Both paths funnel through the very same idempotent launcher
 *   (Processes::processPHPWorker(..., 'start', 'start')), so they never stack:
 *   if the worker is already running, the launch is a no-op. This is the
 *   "deduplicated, safe-mode" guarantee the example is built to demonstrate.
 *
 * @see \MikoPBX\Modules\Config\SystemConfigInterface::createCronTasks()
 * @see \MikoPBX\Modules\Config\SystemConfigInterface::getModuleWorkers()
 * @see \MikoPBX\Core\System\Configs\CronConf::generateConfig()  — where the core
 *      calls createCronTasks() on every enabled module and writes the crontab.
 *
 * @package Modules\ModuleExampleCron\Lib
 */
class ExampleCronConf extends ConfigClass
{
    /**
     * Register this module's periodic crontab line.
     *
     * HOW THE CORE USES THIS HOOK:
     *   CronConf::generateConfig() builds the system crontab from scratch. After
     *   appending its own "must-have" core lines it does, verbatim:
     *
     *       $tasks = [];
     *       PBXConfModulesProvider::hookModulesMethod(
     *           SystemConfigInterface::CREATE_CRON_TASKS, [&$tasks]
     *       );
     *       $conf = implode('', array_merge($mast_have, $tasks));
     *       Util::fileWriteContent('/var/spool/cron/crontabs/root', $conf);
     *
     *   So every string we push onto $tasks becomes one line in
     *   /var/spool/cron/crontabs/root. Each entry MUST be a complete crontab
     *   line and MUST end with a newline (PHP_EOL) — the core concatenates the
     *   array with no separators, exactly like the core's own lines do.
     *
     * THE LINE WE ADD:
     *   "* * * * * <php> -f <bin/WorkerExampleCronStarter.php> > /dev/null 2>&1"
     *
     *   - schedule "* * * * *" = every minute. A real module would use a
     *     coarser schedule (every 5 minutes, or "0 1 * * *" for nightly); we use
     *     every-minute purely so the effect is observable within a minute during
     *     testing.
     *   - We resolve the php binary with Util::which('php') rather than
     *     hard-coding /usr/bin/php — the path differs across MikoPBX builds.
     *   - $this->moduleDir is supplied by ConfigClass and resolves to this
     *     module's absolute install directory, so the path stays correct no
     *     matter where modules live on disk.
     *   - We redirect stdout+stderr to /dev/null: cron would otherwise try to
     *     mail any output, and these workers log to their own file anyway.
     *
     * WHY A TINY "STARTER" SCRIPT INSTEAD OF THE WORKER DIRECTLY:
     *   The starter (bin/WorkerExampleCronStarter.php) calls the core's
     *   Processes::processPHPWorker() launcher, which counts running processes
     *   by title and only spawns the missing instance. That gives us the same
     *   dedup the core uses for its own workers — a minute-by-minute cron tick
     *   can never pile up overlapping worker copies. Launching the worker file
     *   straight from cron would bypass that guard.
     *
     * @param array $tasks The crontab lines being assembled (passed by reference).
     *
     * @return void
     */
    public function createCronTasks(array &$tasks): void
    {
        // Absolute path to the idempotent launcher shipped with this module.
        $starterScript = $this->moduleDir . '/bin/WorkerExampleCronStarter.php';

        // Resolve the PHP CLI binary for the current MikoPBX build.
        $phpPath = Util::which('php');

        // One crontab line, fired every minute, terminated with a newline.
        $tasks[] = '* * * * * ' . $phpPath . ' -f ' . $starterScript . ' > /dev/null 2>&1' . PHP_EOL;
    }

    /**
     * Register this module's background worker with the core supervisor.
     *
     * HOW THE CORE USES THIS HOOK:
     *   WorkerSafeScriptsCore::prepareWorkersList() merges the arrays returned by
     *   every module's getModuleWorkers() into its own table of supervised
     *   workers. The supervisor itself is launched once a minute by the crontab
     *   line CronConf writes for WorkerSafeScriptsCore. On each pass it walks the
     *   table and, per worker type, decides whether the worker needs (re)starting.
     *
     * WHY CHECK_BY_PID_NOT_ALERT:
     *   The three supported supervision strategies are:
     *     - CHECK_BY_BEANSTALK — ping the worker over a Beanstalk tube (for
     *       long-lived queue listeners).
     *     - CHECK_BY_AMI       — ping over an Asterisk Manager UserEvent.
     *     - CHECK_BY_PID_NOT_ALERT — simply check whether a process with the
     *       worker's title is alive (via ps), and respawn it if not. Crucially,
     *       this mode does NOT raise an administrator alert when the process is
     *       absent — perfect for a short-lived job that is *expected* to start,
     *       do its work, and exit. (A "must always be running" daemon would also
     *       use this mode but would loop forever instead of exiting.)
     *
     *   Concretely, checkPidNotAlert() does:
     *       $pid = Processes::getPidOfProcess($workerClassName);   // ps by title
     *       if ($pid === '' && ...safety gates...) {
     *           Processes::processPHPWorker($workerClassName);     // respawn
     *       }
     *   getPidOfProcess() matches the title our worker sets with
     *   cli_set_process_title(self::class), which is exactly how a second launch
     *   is suppressed while one is already running — the dedup that prevents
     *   pile-ups.
     *
     * RELATIONSHIP TO createCronTasks():
     *   This module deliberately wires the SAME worker through BOTH the explicit
     *   crontab line AND the core supervisor so a learner can compare them. In
     *   production you would normally pick one. Both eventually call the same
     *   idempotent processPHPWorker() launcher, so registering both is safe and
     *   never doubles up the worker.
     *
     * THE 'worker' VALUE:
     *   It MUST be the fully-qualified class name (use ::class) of a class that
     *   extends WorkerBase. The core resolves the on-disk path from the class
     *   name via Util::getFilePathByClassName(), so the file name and namespace
     *   must match the PSR-style autoload layout (Lib/WorkerExampleCronMain.php
     *   ↔ Modules\ModuleExampleCron\Lib\WorkerExampleCronMain).
     *
     * @return array<int, array{type: string, worker: class-string}>
     */
    public function getModuleWorkers(): array
    {
        return [
            [
                'type'   => WorkerSafeScriptsCore::CHECK_BY_PID_NOT_ALERT,
                'worker' => WorkerExampleCronMain::class,
            ],
        ];
    }

    /**
     * Regenerate the system crontab the moment the module is enabled.
     *
     * WHY THIS IS MANDATORY FOR A CRON-CONTRIBUTING MODULE:
     *   createCronTasks() only affects the crontab when the core regenerates the
     *   file /var/spool/cron/crontabs/root. Without this hook, enabling the
     *   module would NOT add our line until some unrelated event happened to
     *   trigger a cron reload — the module would look installed yet do nothing.
     *
     *   CronConf::reStart() calls generateConfig() (which re-runs every enabled
     *   module's createCronTasks() and rewrites the crontab) and then restarts
     *   the crond daemon via monit so the new schedule takes effect at once.
     *   This is the exact same code path the core's own ReloadCrondAction runs:
     *       (new CronConf())->reStart();
     *   so we are reusing a verified core mechanism, not inventing one.
     *
     * @return void
     */
    public function onAfterModuleEnable(): void
    {
        (new CronConf())->reStart();
    }

    /**
     * Regenerate the crontab when the module is disabled so our line is removed.
     *
     * The freshly generated crontab simply omits a disabled module's
     * createCronTasks() output, so this reload cleanly drops our every-minute
     * line and stops the scheduled work. (The core supervisor likewise stops
     * re-spawning the worker because getModuleWorkers() is no longer consulted
     * for a disabled module.)
     *
     * @return void
     */
    public function onAfterModuleDisable(): void
    {
        (new CronConf())->reStart();
    }
}
