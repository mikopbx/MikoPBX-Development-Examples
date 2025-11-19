<?php
declare(strict_types=1);

namespace Modules\ModuleExampleRestAPIv3\Models;

use MikoPBX\Common\Models\ModelsBase;

class Tasks extends ModelsBase
{
    /**
     * @Primary
     * @Identity
     * @Column(type="integer", nullable=false)
     */
    public int $id;

    /**
     * @Column(type="string", nullable=false)
     */
    public string $uniqid;

    /**
     * @Column(type="string", nullable=false)
     */
    public string $title;

    /**
     * @Column(type="string", nullable=true)
     */
    public ?string $status = 'pending';

    /**
     * @Column(type="integer", nullable=true)
     */
    public ?int $priority = 5;

    public function initialize(): void
    {
        $this->setSource('m_ModuleExampleRestAPIv3_Tasks');
        parent::initialize();
    }
}
