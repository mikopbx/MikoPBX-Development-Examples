<?php

declare(strict_types=1);

namespace Modules\ModuleExampleRestAPIv2\App\Controllers;

use MikoPBX\AdminCabinet\Providers\AssetProvider;

class ModuleExampleRestAPIv2Controller extends ModuleExampleRestAPIv2BaseController
{
    public function indexAction(): void
    {
        $headerCSS = $this->assets->collection(AssetProvider::HEADER_CSS);
        $headerCSS->addCss('css/cache/' . $this->moduleUniqueID . '/module-rest-api-v2.css', true);

        $footerJS = $this->assets->collection(AssetProvider::FOOTER_JS);
        $footerJS->addJs('js/cache/' . $this->moduleUniqueID . '/module-rest-api-v2.js', true);

        $this->view->moduleUniqueID = $this->moduleUniqueID;
    }
}
