<?php
declare(strict_types=1);

namespace Modules\ModuleExampleRestAPIv3\App\Controllers;

use MikoPBX\AdminCabinet\Controllers\BaseController;
use MikoPBX\Modules\PbxExtensionUtils;

class ModuleExampleRestAPIv3BaseController extends BaseController
{
    protected string $moduleUniqueID = 'ModuleExampleRestAPIv3';
    protected string $moduleDir;

    public function initialize(): void
    {
        if ($this->request->isAjax() === false) {
            $this->moduleDir = PbxExtensionUtils::getModuleDir($this->moduleUniqueID);
            $this->view->logoImagePath = "{$this->url->get()}assets/img/cache/{$this->moduleUniqueID}/logo.svg";
        }
        parent::initialize();
    }
}
