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

namespace Modules\ModuleExampleAcl\Lib;

use MikoPBX\AdminCabinet\Plugins\SecurityPlugin;
use MikoPBX\Common\Providers\AclProvider;
use MikoPBX\Modules\Config\ConfigClass;
use Modules\ModuleExampleAcl\App\Controllers\ModuleExampleAclController;
use Modules\ModuleExampleAcl\App\Controllers\SecretPageController;
use Modules\ModuleExampleAcl\Models\ModuleExampleAcl;
use Modules\ModuleExampleAcl\Models\ModuleExampleAclNote;
use Phalcon\Acl\Adapter\Memory as AclList;
use Phalcon\Acl\Component;
use Phalcon\Acl\Role as AclRole;

/**
 * ExampleAclConf — everything this example has to say about access control.
 *
 * The module ships two admin-cabinet pages:
 *
 *   /module-example-acl/module-example-acl   "public" page — granted to one limited role
 *   /module-example-acl/secret-page          "secret" page — never granted to anybody
 *
 * An administrator reaches both (the 'admins' role is allowed everything). A
 * limited role reaches only the first one, and even there it sees only its own
 * rows (see ModuleExampleAclController::indexAction()).
 *
 * ---------------------------------------------------------------------------
 * FIVE FACTS ABOUT THE MikoPBX ACL THAT THIS EXAMPLE EXISTS TO MAKE VISIBLE
 * ---------------------------------------------------------------------------
 *
 * 1. The ACL starts from DENY.
 *    Core/src/Common/Providers/AclProvider.php:73 calls
 *    $acl->setDefaultAction(AclEnum::DENY). Two roles are registered before any
 *    module is consulted (AclProvider.php:76-81):
 *      - 'admins' (AclProvider::ROLE_ADMINS)  -> allow('admins', '*', '*')
 *      - 'guests' (AclProvider::ROLE_GUESTS)  -> deny('guests', '*', '*')
 *    So a module never has to deny anything: not granting is denying. This
 *    class contains no deny() call at all, and the secret page stays closed.
 *
 * 2. The assembled ACL is CACHED (AclProvider.php:68-69 and :118, TTL 86400).
 *    A change to roles or rules does NOTHING until the cache is dropped with
 *    MikoPBX\Common\Providers\AclProvider::clearCache() (AclProvider.php:130).
 *    This is the single most common reason an ACL change "does not work". This
 *    module drops the cache in onAfterModuleEnable(), onAfterModuleDisable()
 *    and modelsEventChangeData() below.
 *
 * 3. LOCALHOST IS AN ADMINISTRATOR — the ACL is not the only gate.
 *    SecurityPlugin::beforeDispatch() skips the ACL check entirely when
 *    isLocalHostRequest() is true (Core/src/AdminCabinet/Plugins/SecurityPlugin.php:128),
 *    and isAllowedAction() falls back to ROLE_ADMINS for localhost when no role
 *    can be extracted from the JWT (SecurityPlugin.php:402-406).
 *    isLocalHostRequest() is literally $_SERVER['REMOTE_ADDR'] === '127.0.0.1'
 *    (SecurityPlugin.php:228). Consequences:
 *      - testing this example from a browser running ON the PBX shows both
 *        pages open and looks like a bug — test from another host;
 *      - a reverse proxy that does not preserve the client address turns every
 *        visitor into an administrator.
 *
 * 4. A few grants are added to EVERY role AFTER this hook returns and cannot be
 *    revoked from a module (AclProvider.php:89-116): the Errors controller
 *    (show401/show404/show500), the Session controller
 *    (index/start/changeLanguage/end) and the stateless password helper
 *    endpoints /pbxcore/api/v3/passwords (generate/validate/checkDictionary).
 *
 * 5. A role is inert until something mints a JWT carrying it.
 *    onAfterACLPrepared() can register any role name, but SecurityPlugin reads
 *    the role from the JWT (Bearer header, or the refreshToken cookie mapped
 *    through Redis — SecurityPlugin::extractRoleFromJwt(), lines 422-446). In a
 *    stock system the component that mints those tokens with a non-admin role is
 *    ModuleUsersUI, whose role ids are Constants::MODULE_ROLE_PREFIX
 *    ('UsersUIRoleID') . <access group id>
 *    (Extensions/ModuleUsersUI/Lib/Constants.php:39 and
 *     Extensions/ModuleUsersUI/Lib/UsersUIACL.php:53).
 *    That is why this example grants rights to a ModuleUsersUI role id instead
 *    of inventing its own: an invented role would never appear in any token.
 *    A module that mints its own sessions implements the authenticateUser hook
 *    (WebUIConfigInterface::AUTHENTICATE_USER) — see the external-authentication
 *    recipe in the documentation.
 *
 * Side note on the passkey family: getPasskeySessionData() is NOT declared on
 * any interface and has NO base implementation. It works only because the
 * dispatcher guards the call with method_exists(). You ADD such a method, you do
 * not override it — and a typo in its name fails silently, with no error
 * anywhere. This module does not implement it; if yours does, keep that in mind.
 *
 * @package Modules\ModuleExampleAcl\Lib
 */
class ExampleAclConf extends ConfigClass
{
    /**
     * Role id prefix used by ModuleUsersUI.
     *
     * Copied deliberately instead of importing
     * Modules\ModuleUsersUI\Lib\Constants::MODULE_ROLE_PREFIX
     * (Extensions/ModuleUsersUI/Lib/Constants.php:39): this module must not
     * fatal when ModuleUsersUI is absent. Keep it in sync with that constant.
     */
    public const string USERS_UI_ROLE_PREFIX = 'UsersUIRoleID';

    /** Stable markers that make the three demo notes re-findable (see seedDemoNotes()). */
    public const string NOTE_PUBLIC = '[demo-public] ';
    public const string NOTE_OWNED = '[demo-owned] ';
    public const string NOTE_FOREIGN = '[demo-foreign] ';

    /** An access group id nobody in the demo belongs to. */
    public const string FOREIGN_GROUP_ID = '999999';

    /**
     * Adds this module's rules to the system ACL.
     *
     * Declared in Core/src/Modules/Config/WebUIConfigInterface.php:80
     * (constant ON_AFTER_ACL_LIST_PREPARED = 'onAfterACLPrepared', line 43),
     * called from Core/src/Common/Providers/AclProvider.php:84-87 while the ACL
     * is being assembled — i.e. exactly once per cache generation.
     *
     * Three things worth copying from here:
     *
     *  a) A COMPONENT IS THE CONTROLLER CLASS NAME, not the URL.
     *     SecurityPlugin asks the ACL with $dispatcher->getHandlerClass()
     *     (SecurityPlugin.php:66 and :129), so the component must be the FQCN.
     *     Registering 'module-example-acl' or 'ModuleExampleAclController'
     *     produces a rule that is never consulted, and the page stays denied
     *     with no diagnostic anywhere.
     *
     *  b) addComponent() BEFORE allow(). Phalcon needs the component (and its
     *     action list) to exist before a rule can reference it.
     *
     *  c) HOOK ORDER BETWEEN MODULES IS NOT SPECIFIED.
     *     PBXConfModulesProvider::hookModulesMethod() iterates the enabled
     *     modules in whatever order the DI service returns them
     *     (Core/src/Common/Providers/PBXConfModulesProvider.php:100). This hook
     *     may therefore run before ModuleUsersUI has registered the role we are
     *     granting to, and Phalcon's allow() throws on an unknown role. Hence
     *     the isRole() guard plus addRole() below.
     *
     * @param AclList $aclList The ACL being assembled (mutated in place).
     */
    public function onAfterACLPrepared(AclList $aclList): void
    {
        $groupId = $this->getLimitedGroupId();
        if ($groupId === '') {
            // Nothing configured yet -> grant nothing. Default DENY does the
            // rest: both pages stay administrator-only.
            return;
        }

        // The role id has to match exactly what the JWT will carry.
        $role = self::USERS_UI_ROLE_PREFIX . $groupId;

        // Register the role if nobody did it yet (see note (c) above). The guard
        // makes BOTH orderings safe: if ModuleUsersUI ran first it already called
        // addRole() for this exact id (UsersUIACL.php:67) and we must not repeat
        // it; if it has not run yet, allow() below would throw on an unknown role.
        if (!$aclList->isRole($role)) {
            $aclList->addRole(new AclRole($role, 'ModuleExampleAcl limited role'));
        }

        // The public page: one controller, one action.
        $publicActions = ['index'];
        $aclList->addComponent(new Component(ModuleExampleAclController::class), $publicActions);
        $aclList->allow($role, ModuleExampleAclController::class, $publicActions);

        // The secret page is deliberately NOT granted.
        //
        // We still register it as a component so that the ACL knows about it and
        // so that the intent is readable here — but no allow() rule mentions it
        // for $role, and the default action is DENY. There is no deny() call to
        // write: writing one would be redundant, and it would not help anyway,
        // because a later hook could still allow() the same pair.
        $aclList->addComponent(new Component(SecretPageController::class), ['index', 'save']);
    }

    /**
     * Contributes custom permission flags for the front-end.
     *
     * Declared in Core/src/Modules/Config/WebUIConfigInterface.php:166
     * (constant ON_GET_CONTROLLER_PERMISSIONS = 'onGetControllerPermissions',
     * line 59) and called by Core/src/AdminCabinet/Controllers/AclController.php.
     * Whatever lands in $permissions is returned to JavaScript under
     * data.custom.
     *
     * THIS IS A UI HINT, NOT A SECURITY BOUNDARY. It decides whether a button is
     * drawn; the ACL decides whether the request behind the button is served.
     * Never let a hidden button be the only thing protecting an action.
     *
     * @param string $controller Fully-qualified controller class name.
     * @param array $permissions Custom flags (by reference), arrives empty.
     */
    public function onGetControllerPermissions(string $controller, array &$permissions): void
    {
        if ($controller !== ModuleExampleAclController::class) {
            return;
        }

        // Ask the very same plugin the dispatcher uses, so the answer cannot
        // drift from the real check.
        $securityPlugin = new SecurityPlugin();
        $securityPlugin->setDI($this->di);

        // The public page uses this flag to show or hide the link to the secret
        // page. A limited role gets false and never sees the link; if it types
        // the URL by hand, the ACL answers with the 401 page.
        $permissions['canOpenSecretPage'] =
            $securityPlugin->isAllowedAction(SecretPageController::class, 'index');
    }

    /**
     * Narrows CDR list queries for this module's roles.
     *
     * Declared in Core/src/Modules/Config/CDRConfigInterface.php:53
     * (constant APPLY_ACL_FILTERS_TO_CDR_QUERY, line 32) and called from
     * Core/src/PBXCoreREST/Lib/Cdr/GetListAction.php. $sessionContext is filled
     * from the caller's JWT and carries 'role', 'user_name', 'session_id'.
     *
     * Included here only to show the shape — this module grants nobody access to
     * CallDetailRecordsController, so in this example the hook is never reached
     * with one of our roles. A role that cannot open the CDR page never runs
     * this filter: the ACL denies the page long before any query is built.
     *
     * The mutation below is the pattern to copy: bound array placeholder, never
     * string concatenation of values, and the pre-existing conditions preserved.
     *
     * @param array $parameters Phalcon query-builder parameters (by reference).
     * @param array $sessionContext JWT-derived context.
     */
    public function applyACLFiltersToCDRQuery(array &$parameters, array $sessionContext = []): void
    {
        $role = $sessionContext['role'] ?? '';

        // Not one of our roles (an administrator has no matching prefix either)
        // -> leave the query untouched.
        if (!is_string($role) || !str_starts_with($role, self::USERS_UI_ROLE_PREFIX)) {
            return;
        }

        // Recover the access group id: 'UsersUIRoleID7' -> '7'.
        $groupId = substr($role, strlen(self::USERS_UI_ROLE_PREFIX));

        // A real module would resolve the group's extension numbers here.
        $allowedNumbers = $this->resolveAllowedNumbers($groupId);
        if ($allowedNumbers === []) {
            // Nothing visible -> an empty result set, never "no filter".
            $parameters['conditions'] = '1=0';
            return;
        }

        $oldConditions = $parameters['conditions'] ?? '';

        $parameters['bind']['exampleAclNumbers'] = $allowedNumbers;
        $parameters['conditions'] =
            '(src_num IN ({exampleAclNumbers:array}) OR dst_num IN ({exampleAclNumbers:array}))';

        if (!empty($oldConditions)) {
            $parameters['conditions'] .= ' AND (' . $oldConditions . ')';
        }
    }

    /**
     * Drops the cached ACL as soon as the module is switched on.
     *
     * Without this the freshly enabled module's rules are invisible until the
     * cached ACL expires (24 hours).
     */
    public function onAfterModuleEnable(): void
    {
        AclProvider::clearCache();

        // Without demo rows the public page shows an empty table for every role
        // and the row-level half of the example cannot be observed at all.
        self::seedDemoNotes();
    }

    /**
     * Drops the cached ACL when the module is switched off, so that the grants
     * it added disappear immediately.
     */
    public function onAfterModuleDisable(): void
    {
        AclProvider::clearCache();
    }

    /**
     * Reacts to database changes.
     *
     * Saving the settings form changes which role gets the public page, so the
     * cached ACL has to go. This is what turns "save the form" into a working
     * demo — otherwise the tester has to clear the cache by hand and rightly
     * concludes that the hook does nothing.
     *
     * @param mixed $data Change event data: model, recordId, changedFields.
     */
    public function modelsEventChangeData(mixed $data): void
    {
        if (($data['model'] ?? '') === ModuleExampleAcl::class) {
            AclProvider::clearCache();

            // Re-point the demo note that belongs to "the configured group" at
            // whatever group the administrator has just chosen, so the tester
            // sees a group-owned row instead of an empty table.
            self::seedDemoNotes();
        }
    }

    /**
     * Creates (or re-points) the three demo notes.
     *
     * Idempotent: it is called from onAfterModuleEnable() and again whenever the
     * settings row is saved. The three rows exist to make the row-level half of
     * the example visible:
     *
     *   ''        — visible to everybody, including the limited role;
     *   <groupId> — visible to the configured limited role and to administrators;
     *   999999    — owned by a group nobody in this demo belongs to, so it is
     *               visible to administrators only.
     *
     * ModuleExampleAclController::indexAction() is what enforces that split, with
     * a bound query — the ACL says nothing about rows.
     */
    private static function seedDemoNotes(): void
    {
        // findFirst() returns null before the administrator has ever saved the
        // form — hence the null-safe operator, not `$settings->x ?? ''` (which
        // only silences a warning).
        $settings = ModuleExampleAcl::findFirst();
        $groupId = (string)($settings?->limited_group_id ?? '');

        // Placeholder used until the administrator picks a real group, so the
        // row still exists and the table is never empty.
        $ownedGroupId = $groupId === '' ? '1' : $groupId;

        $rows = [
            self::NOTE_PUBLIC => ['group' => '', 'text' => 'Public note: every role that can open this page sees it.'],
            self::NOTE_OWNED => ['group' => $ownedGroupId, 'text' => 'Group note: only the configured limited role and administrators see it.'],
            self::NOTE_FOREIGN => ['group' => self::FOREIGN_GROUP_ID, 'text' => 'Foreign note: owned by another access group, so the limited role never sees it.'],
        ];

        foreach ($rows as $marker => $row) {
            // Bound parameters, as everywhere else in this module. The column
            // is bracket-escaped because PHQL tokenizes the leading "not" of
            // note_text as the NOT keyword and then fails on "e_text".
            $note = ModuleExampleAclNote::findFirst([
                'conditions' => '[note_text] = :text:',
                'bind' => ['text' => $marker . $row['text']],
            ]);
            if ($note === null) {
                $note = new ModuleExampleAclNote();
                $note->note_text = $marker . $row['text'];
            }
            $note->access_group_id = $row['group'];
            $note->save();
        }
    }

    /**
     * Demo resolver for applyACLFiltersToCDRQuery().
     *
     * A production module queries its own tables here (with bound parameters).
     * ModuleUsersUI's real implementation lives in
     * Extensions/ModuleUsersUI/Lib/UsersUICDRFilter.php.
     *
     * @param string $groupId Access group id.
     * @return string[] Extension numbers the group may see.
     */
    private function resolveAllowedNumbers(string $groupId): array
    {
        // Intentionally empty in the example: no CDR page is granted, so this
        // never runs. $groupId is what a real implementation would bind.
        unset($groupId);

        return [];
    }

    /**
     * Reads the configured access group id from the module settings.
     *
     * @return string Access group id, or '' when the module is unconfigured.
     */
    private function getLimitedGroupId(): string
    {
        $settings = ModuleExampleAcl::findFirst();

        return (string)($settings?->limited_group_id ?? '');
    }
}
