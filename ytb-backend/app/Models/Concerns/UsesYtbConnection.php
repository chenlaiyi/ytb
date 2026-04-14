<?php

namespace App\Models\Concerns;

trait UsesYtbConnection
{
    public function getConnectionName()
    {
        return config('ytb.database.connection', parent::getConnectionName() ?? config('database.default'));
    }
}
