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

namespace Modules\ModuleExampleAgi\Lib;

use MikoPBX\Core\Asterisk\Configs\ExtensionsConf;
use MikoPBX\Modules\Config\ConfigClass;

/**
 * Class ExampleAgiConf
 *
 * A ConfigClass is the single hook point a module uses to influence the
 * generated Asterisk configuration. MikoPBX rebuilds `extensions.conf`
 * (and friends) from scratch on every "apply config". During that process it
 * collects the output of well-known methods from every enabled module's
 * ConfigClass and stitches the fragments into the final files.
 *
 * ConfigClass extends AsteriskConfigClass, so every method we override here has
 * a real, documented counterpart in the core. NEVER invent a method name — the
 * core only calls the exact set defined on AsteriskConfigClass. Here we use
 * `extensionGenContexts()`, which is the canonical place to publish a brand-new,
 * self-contained dialplan context (as opposed to patching an existing route).
 *
 * @see \MikoPBX\Core\Asterisk\Configs\AsteriskConfigClass::extensionGenContexts()
 * @see https://docs.mikopbx.com/mikopbx-development/module-developement/module-class#extensiongencontexts
 *
 * @package Modules\ModuleExampleAgi\Lib
 */
class ExampleAgiConf extends ConfigClass
{
    /**
     * The name of the custom dialplan context this module publishes.
     *
     * Context names live in a single global namespace inside Asterisk, so a
     * module must pick a name unlikely to clash with the core or other modules.
     * Prefixing with the module feature name is the convention we follow.
     */
    public const CONTEXT_NAME = 'example-agi-context';

    /**
     * Prepares additional context sections for the generated `extensions.conf`.
     *
     * WHY this hook:
     *   `extensionGenContexts()` is invoked once while the core assembles the
     *   global part of `extensions.conf`. Whatever string we return is appended
     *   verbatim as a new `[context]` block. This is the cleanest extension
     *   point for "create an entirely new context" — see the Dialplan README's
     *   "Custom Contexts" section.
     *
     * What the context does:
     *   It defines a single dialable feature code, `*762`, that hands the call to
     *   our PHP-AGI script via the AGI() application. The AGI script runs in the
     *   same process space as Asterisk's AGI subsystem, can read and write channel
     *   variables, and returns control to the dialplan when it finishes. After the
     *   script returns we NoOp the result so the outcome is visible in the
     *   Asterisk console / CLI log.
     *
     * How a learner reaches this context:
     *   getIncludeInternal() (below) adds `include => example-agi-context` to the
     *   core `[internal]` context, so any registered extension can simply DIAL
     *   `*762` to run the AGI demo. We expose exactly one feature code — never a
     *   catch-all pattern like `_X.` — precisely because the context is included
     *   into `[internal]`: a catch-all there would swallow every internal call.
     *   Other ways to enter a published context (no include needed) are a
     *   `Goto()`/`Gosub()` from your own dialplan, or an incoming-route hook
     *   (override generateIncomingRoutBeforeDial()).
     *
     * Note on the AGI path:
     *   `$this->moduleDir` is provided by ConfigClass and resolves to this
     *   module's absolute installation directory. Building the path from it
     *   keeps the dialplan correct regardless of where modules are installed.
     *
     * @return string The `[example-agi-context]` block for extensions.conf.
     */
    public function extensionGenContexts(): string
    {
        // Absolute path to the AGI script shipped with this module.
        $agiScript = $this->moduleDir . '/agi-bin/example-agi.php';

        // Build the context. The leading tab on continuation lines ("\t") is the
        // style MikoPBX uses for `same =>` priorities in generated dialplan.
        // The single extension is the feature code *762 (safe to include into
        // [internal]); $CALLERID(num) is the real number of the phone that dialed.
        return '[' . self::CONTEXT_NAME . ']' . PHP_EOL
            . 'exten => *762,1,NoOp(ModuleExampleAgi: entering AGI demo for ${CALLERID(num)})' . PHP_EOL
            . "\t" . 'same => n,AGI(' . $agiScript . ')' . PHP_EOL
            . "\t" . 'same => n,NoOp(ModuleExampleAgi: AGI returned department=${EXAMPLE_AGI_DEPARTMENT})' . PHP_EOL
            // We terminate with Hangup() so the context is safe to enter as a
            // top-level destination (Goto / include / channel originate). Do NOT
            // end with Return() here: Return only balances a prior Gosub frame,
            // and a top-level entry has none — Asterisk would raise
            // "Return without Gosub" and drop the call. Use Return() only if you
            // redesign this context to be invoked exclusively via Gosub().
            . "\t" . 'same => n,Hangup()' . PHP_EOL;
    }

    /**
     * Wire the feature code into the core [internal] context.
     *
     * WHY: extensionGenContexts() publishes [example-agi-context] as a standalone
     * block, but nothing routes to it until it is included somewhere reachable.
     * getIncludeInternal() is invoked while the core builds the [internal] context
     * (the one every registered extension dials from); whatever string we return
     * is appended as raw `include =>` lines. One include makes *762 dialable.
     *
     * Returning a catch-all context here would be dangerous (it would swallow
     * every internal call), which is why example-agi-context exposes only *762.
     *
     * @return string An `include => example-agi-context` line for [internal].
     */
    public function getIncludeInternal(): string
    {
        return 'include => ' . self::CONTEXT_NAME . PHP_EOL;
    }

    /**
     * Republish the dialplan immediately after the module is enabled.
     *
     * WHY this matters: extensionGenContexts() only contributes to
     * extensions.conf when the core regenerates it. Without this hook, enabling
     * the module would NOT make [example-agi-context] appear until some unrelated
     * event happened to trigger a reload — the module would look installed yet do
     * nothing. ExtensionsConf::reload() rebuilds extensions.conf from every
     * enabled module and issues `dialplan reload`, so the context goes live at
     * once. (The Dialplan example module does exactly the same.)
     */
    public function onAfterModuleEnable(): void
    {
        ExtensionsConf::reload();
    }

    /**
     * Drop our context from the live dialplan when the module is disabled.
     *
     * The regenerated extensions.conf no longer includes a disabled module's
     * fragments, so a reload here cleanly removes [example-agi-context].
     */
    public function onAfterModuleDisable(): void
    {
        ExtensionsConf::reload();
    }
}
