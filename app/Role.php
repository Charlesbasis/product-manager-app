<?php

namespace App;

enum Role: string
{
    case Admin = 'admin';
    case Editor = 'editor';
    case Viewer = 'viewer';

    public function canMutate(): bool
    {
        return in_array($this, [self::Admin, self::Editor], true);
    }

    public function canDelete(): bool
    {
        return $this === self::Admin;
    }
}
