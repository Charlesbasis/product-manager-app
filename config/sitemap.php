<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Sitemap Output Path
    |--------------------------------------------------------------------------
    |
    | Releases are immutable and served through a stable document root, so the
    | sitemap must be written to the directory that is actually served rather
    | than into the active release. Set SITEMAP_PATH in the production
    | environment file; when it is absent the command falls back to
    | public_path('sitemap.xml').
    |
    */

    'path' => env('SITEMAP_PATH'),

];
