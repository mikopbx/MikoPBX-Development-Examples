<?php
declare(strict_types=1);

namespace Modules\ModuleExampleRestAPIv3\App\Controllers;

use MikoPBX\AdminCabinet\Providers\AssetProvider;

class ModuleExampleRestAPIv3Controller extends ModuleExampleRestAPIv3BaseController
{
    public function indexAction(): void
    {
        $headerCSS = $this->assets->collection(AssetProvider::HEADER_CSS);
        $headerCSS->addCss('css/cache/' . $this->moduleUniqueID . '/module-rest-api-v3.css', true);

        $footerJS = $this->assets->collection(AssetProvider::FOOTER_JS);
        $footerJS->addJs('js/cache/' . $this->moduleUniqueID . '/module-rest-api-v3.js', true);

        $this->view->moduleUniqueID = $this->moduleUniqueID;
        $this->view->apiV3BasePath = '/pbxcore/api/v3/modules/example-rest-api-v3/tasks';
    }
}
