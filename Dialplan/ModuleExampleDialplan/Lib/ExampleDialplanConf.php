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

namespace Modules\ModuleExampleDialplan\Lib;

use MikoPBX\Core\Asterisk\Configs\ExtensionsConf;
use MikoPBX\Modules\Config\ConfigClass;

/**
 * Dialplan generation example for MikoPBX.
 *
 * ======================================================================================
 *  WHAT THIS CLASS TEACHES
 * ======================================================================================
 * MikoPBX never lets a module edit /etc/asterisk/extensions.conf directly. The file is
 * regenerated from scratch on every dialplan reload. Instead, a module contributes
 * *string fragments* by overriding hook methods on its ConfigClass; the Core splices
 * those fragments into the right sections of the generated file.
 *
 * The full inheritance chain is:
 *
 *      ExampleDialplanConf
 *        └─ MikoPBX\Modules\Config\ConfigClass            (module base)
 *             └─ MikoPBX\Core\Asterisk\Configs\AsteriskConfigClass
 *                  implements AsteriskConfigInterface
 *
 * AsteriskConfigClass supplies an empty default (`return '';`) for every dialplan hook,
 * so a module overrides ONLY the hooks it cares about. When the Core builds
 * extensions.conf it calls one hook across *all* installed modules and concatenates the
 * non-empty results — this fan-out lives in AsteriskConfigClass::hookModulesMethod().
 *
 * Two mechanics of that fan-out drive how the fragments below are written:
 *
 *   1. ORDERING IS BY PRIORITY (ascending). Modules are sorted on
 *      getMethodPriority($methodName); a lower number is emitted earlier. The inherited
 *      default for an external module (set in ConfigClass) is 10000, while Core config
 *      classes use 1000 — so core dialplan is laid down before module dialplan. We keep
 *      the inherited 10000 here (we do NOT override getMethodPriority): this example has
 *      no ordering requirement against other modules, and the inherited default is the
 *      correct, idiomatic choice. Override getMethodPriority($methodName) only when your
 *      fragment MUST run before or after another module's — and when you do, branch on the
 *      AsteriskConfigInterface constants (EXTENSION_GEN_CONTEXTS, GET_INCLUDE_INTERNAL,
 *      GENERATE_INCOMING_ROUT_BEFORE_DIAL, …) rather than raw method-name strings, since
 *      those constants are exactly the values hookModulesMethod() passes in.
 *
 *   2. EACH FRAGMENT IS WRAPPED IN COMMENT MARKERS. A non-empty return value is bracketed
 *      with `; ***** BEGIN BY ModuleExampleDialplan` / `; ***** END BY ...` by
 *      confBlockWithComments(), making your block easy to locate in the generated file.
 *      Because that BEGIN marker is prepended first, a `same =>` line you emit is NOT
 *      auto-indented under the preceding `exten` — so we emit our own leading tab ("\t")
 *      on every `same =>` continuation line (the documented contract).
 *
 * Hooks return RAW dialplan text. Terminate lines with PHP_EOL. Never write the file or
 * call `dialplan reload` yourself — returning a fragment is the entire contract.
 *
 * @see https://docs.mikopbx.com/mikopbx-development/cookbook/asterisk/modify-extensions.conf
 * @see https://docs.mikopbx.com/mikopbx-development/module-developement/hooks-reference
 *
 * @package Modules\ModuleExampleDialplan\Lib
 */
class ExampleDialplanConf extends ConfigClass
{
    /**
     * Name of the standalone context this module generates.
     *
     * Hardcoded as a class constant on purpose: this example carries no database model,
     * so there are no user-configurable settings to read. A real module would typically
     * derive such names from its own Models instead of a constant.
     */
    public const string IVR_CONTEXT = 'example-dialplan-ivr';

    /**
     * Tiny "entry" context that exposes the feature code inside [internal].
     *
     * WHY a separate context (and not just including IVR_CONTEXT into [internal]):
     * the IVR menu uses single-digit options (1, plus the special i/t). If the IVR
     * context itself were included into [internal], WaitExten() would run in the
     * [internal] numbering plan, so pressing "1" would match a real extension/queue
     * "1" instead of our menu option (directly-defined extensions beat included
     * ones). By including only this entry context — which holds nothing but the
     * feature code and an explicit Goto INTO the IVR context — the menu digits are
     * resolved in [example-dialplan-ivr], isolated from the internal dial plan.
     */
    public const string ENTRY_CONTEXT = 'example-dialplan-entry';

    /**
     * Service number, dialed from any internal phone, that enters the demo IVR.
     * It is reachable because getIncludeInternal() pulls ENTRY_CONTEXT into [internal];
     * the entry then switches the channel into IVR_CONTEXT.
     */
    public const string IVR_EXTENSION = '*761';

    /**
     * Generate one or more complete standalone [context] blocks for extensions.conf.
     *
     * WHEN MIKOPBX CALLS IT
     *   During extensions.conf generation, via the InternalContexts generator
     *   (MikoPBX\Core\Asterisk\Configs\Generators\Extensions\InternalContexts), which
     *   appends every module's extensionGenContexts() output after the core contexts.
     *
     * WHAT IT MUST RETURN
     *   Raw dialplan text containing whole `[context]` blocks (header line + priorities).
     *   Start the fragment with a leading PHP_EOL so the new context does not glue onto
     *   the previous module's last line. Return '' to contribute nothing.
     *
     * HOW IT COMPOSES WITH THE CORE DIALPLAN
     *   The returned context is INERT on its own — nothing routes into it until some
     *   other context include's or Goto's it. Here we publish a small announcement / IVR
     *   menu and make it reachable from the internal numbering plan via getIncludeInternal()
     *   below. This is the canonical "define a context, then wire it into [internal]" pair.
     *
     * @return string Complete [example-dialplan-ivr] context, or '' to skip.
     */
    public function extensionGenContexts(): string
    {
        $ext = self::IVR_EXTENSION;

        // Leading PHP_EOL separates our block from the previous module's fragment.
        $conf  = PHP_EOL . '[' . self::IVR_CONTEXT . ']' . PHP_EOL;

        // 's' is the standard "start" extension Asterisk falls into when a context is
        // entered without an explicit number (e.g. via Goto(context,s,1)). It is also
        // matched when our service number is dialed below and re-enters at 's'.
        $conf .= 'exten => s,1,NoOp(ModuleExampleDialplan: entering demo IVR)' . PHP_EOL;
        $conf .= "\t" . 'same => n,Answer()' . PHP_EOL;
        // Give the caller time to press a digit while / after the prompt plays.
        $conf .= "\t" . 'same => n,Set(TIMEOUT(digit)=5)' . PHP_EOL;
        $conf .= "\t" . 'same => n,Set(TIMEOUT(response)=10)' . PHP_EOL;
        // vm-intro / vm-goodbye / invalid are core MikoPBX prompts shipped in EVERY
        // installed locale, so this example plays out of the box without bundling
        // custom audio. (Asterisk's classic demo sounds such as 'hello-world' /
        // 'demo-congrats' are NOT present in MikoPBX's default locales — using them
        // logs "File ... does not exist in any format" and plays silence.) A module
        // that needs bespoke audio ships its own files and installs them into the
        // sounds directory. Background() keeps listening for DTMF while the file
        // plays; WaitExten() then waits for the digit.
        $conf .= "\t" . 'same => n(menu),Background(vm-intro)' . PHP_EOL;
        $conf .= "\t" . 'same => n,WaitExten()' . PHP_EOL;

        // Digit 1: a simple announcement, then hang up.
        $conf .= 'exten => 1,1,NoOp(ModuleExampleDialplan: caller chose announcement)' . PHP_EOL;
        $conf .= "\t" . 'same => n,Playback(vm-goodbye)' . PHP_EOL;
        $conf .= "\t" . 'same => n,Hangup()' . PHP_EOL;

        // 'i' (invalid) and 't' (timeout) are special extensions Asterisk jumps to when
        // the caller presses an unmapped key or does not respond in time. Play a short
        // "invalid" prompt then loop back to the (menu) label so the example stays
        // self-contained and never dead-ends.
        $conf .= 'exten => i,1,NoOp(ModuleExampleDialplan: invalid entry)' . PHP_EOL;
        $conf .= "\t" . 'same => n,Playback(invalid)' . PHP_EOL;
        $conf .= "\t" . 'same => n,Goto(s,menu)' . PHP_EOL;

        $conf .= 'exten => t,1,NoOp(ModuleExampleDialplan: input timeout)' . PHP_EOL;
        $conf .= "\t" . 'same => n,Goto(s,menu)' . PHP_EOL;

        // Second, tiny context: the dialable entry point that lives in [internal]
        // (via getIncludeInternal()). It does ONE thing — jump into IVR_CONTEXT with
        // an EXPLICIT context name so the channel's context becomes example-dialplan-ivr.
        // From that point WaitExten() resolves digits against the IVR context, so the
        // menu option "1" hits our `exten => 1` and never the internal extension/queue 1.
        $conf .= PHP_EOL . '[' . self::ENTRY_CONTEXT . ']' . PHP_EOL;
        $conf .= 'exten => ' . $ext . ',1,Goto(' . self::IVR_CONTEXT . ',s,1)' . PHP_EOL;

        return $conf;
    }

    /**
     * Add `include =>` lines to the core [internal] context.
     *
     * WHEN MIKOPBX CALLS IT
     *   During extensions.conf generation, by InternalContexts when it assembles the
     *   [internal] context. Crucially it is called BEFORE extensionGenInternal(), so all
     *   module include lines are written ahead of module-supplied explicit rules. Asterisk
     *   evaluates includes only after the explicit patterns in a context, which is the
     *   precedence you usually want.
     *
     * WHAT IT MUST RETURN
     *   One or more `include => <context>` lines, each terminated with PHP_EOL. Return ''
     *   to add no include.
     *
     * HOW IT COMPOSES WITH THE CORE DIALPLAN
     *   [internal] is the context internal phones dial within. We include only the small
     *   ENTRY_CONTEXT (not the IVR itself): when a call in [internal] finds no explicit
     *   match, it falls through the include into [example-dialplan-entry], where our
     *   `exten => *761` matches and immediately Goto's into the isolated IVR context.
     *   Including the IVR directly would expose its single-digit menu options to the
     *   internal numbering plan (see the ENTRY_CONTEXT docblock for why that breaks).
     *
     * @return string `include => example-dialplan-entry` line, or '' to skip.
     */
    public function getIncludeInternal(): string
    {
        return 'include => ' . self::ENTRY_CONTEXT . PHP_EOL;
    }

    /**
     * Inject priority lines into EVERY incoming route's context, just before the Dial.
     *
     * WHEN MIKOPBX CALLS IT
     *   While the Core generates the per-route incoming contexts in extensions.conf. For
     *   each configured incoming route the Core calls this hook on every module and splices
     *   the result into that route's context at the point right before the call is dialed
     *   to its destination. $rout_number is the DID / route number being generated.
     *
     * WHAT IT MUST RETURN
     *   Continuation priority lines in `same => n,<Application>(...)` form — NOT a context
     *   header. The lines are appended inside an already-open `exten` chain, so each must
     *   begin with a leading tab ("\t") to attach to the preceding priority. Return '' to
     *   add nothing for this route.
     *
     * HOW IT COMPOSES WITH THE CORE DIALPLAN
     *   This is the standard place to run pre-answer logic that must execute for inbound
     *   calls before they reach a user: caller-ID lookups, blacklist screening, tagging
     *   channel variables, early media, etc. Here we only log via NoOp() and stamp a
     *   channel variable, so the example is safe to install on a live PBX — it changes no
     *   routing decision. A real module would, for example, run an AGI() here:
     *     $conf .= "\t" . 'same => n,AGI(' . $this->moduleDir . '/agi-bin/MyLookup.php)' . PHP_EOL;
     *   $this->moduleDir is set by ConfigClass to the module's absolute install directory.
     *
     * @param string $rout_number The incoming route number whose context is being built.
     *
     * @return string `same =>` continuation lines, or '' to skip this route.
     */
    public function generateIncomingRoutBeforeDial(string $rout_number): string
    {
        $conf  = "\t" . 'same => n,NoOp(ModuleExampleDialplan: inbound call on route ' . $rout_number . ' from ${CALLERID(num)})' . PHP_EOL;
        // Stamp a channel variable other dialplan / AGI / CDR logic can read later.
        $conf .= "\t" . 'same => n,Set(__MODULE_EXAMPLE_DIALPLAN_SEEN=1)' . PHP_EOL;

        return $conf;
    }

    /**
     * Regenerate the dialplan after the module is enabled.
     *
     * WHEN MIKOPBX CALLS IT
     *   PbxExtensionState::enableModule() invokes this lifecycle hook (declared in
     *   SystemConfigInterface) once the module has been switched on.
     *
     * WHY
     *   Our fragments only appear in extensions.conf the next time it is generated. Calling
     *   ExtensionsConf::reload() rebuilds extensions.conf and issues `dialplan reload`, so
     *   the new [example-dialplan-ivr] context and the inbound hooks take effect immediately
     *   instead of on the next unrelated config change.
     */
    public function onAfterModuleEnable(): void
    {
        ExtensionsConf::reload();
    }

    /**
     * Regenerate the dialplan after the module is disabled.
     *
     * WHEN MIKOPBX CALLS IT
     *   PbxExtensionState::disableModule() invokes this lifecycle hook after the module is
     *   switched off.
     *
     * WHY
     *   Once disabled, this module's hooks are no longer consulted during generation.
     *   Reloading here removes our context and inbound priority lines from the live
     *   dialplan right away rather than leaving stale fragments until the next reload.
     */
    public function onAfterModuleDisable(): void
    {
        ExtensionsConf::reload();
    }
}
