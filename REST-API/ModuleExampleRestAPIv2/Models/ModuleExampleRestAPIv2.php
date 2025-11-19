<?php

declare(strict_types=1);

namespace Modules\ModuleExampleRestAPIv2\Models;

use MikoPBX\Common\Models\ModelsBase;

class ModuleExampleRestAPIv2 extends ModelsBase
{
    /**
     * @Primary
     * @Identity
     * @Column(type="integer", nullable=false)
     */
    public int $id;

    /**
     * @Column(type="string", nullable=true)
     */
    public ?string $textParameter = null;

    public function initialize(): void
    {
        $this->setSource('m_ModuleExampleRestAPIv2');
        parent::initialize();
    }
}
