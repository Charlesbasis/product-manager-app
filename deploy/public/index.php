<?php

/**
 * Stable CWP document root bootstrap.
 *
 * CWP owns this directory (auto-SSL, open_basedir, Apache vhost), so it must
 * remain a real directory and cannot become a symlink to the active release.
 * This file is the one stable entry point: it hands the request to the release
 * that `current` points at, and the release's public/index.php resolves its own
 * vendor/, storage/ and bootstrap/ paths from its real location.
 */
$releaseIndex = dirname(__DIR__).'/current/public/index.php';

if (! is_file($releaseIndex)) {
    http_response_code(503);
    header('Retry-After: 30');
    header('Content-Type: text/plain; charset=UTF-8');
    echo "Application release is not available.\n";

    return;
}

require $releaseIndex;
