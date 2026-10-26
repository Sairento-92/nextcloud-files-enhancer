<?php
declare(strict_types=1);

/**
 * SPDX-FileCopyrightText: 2026 Sairento / Nextcloud Files Enhancer
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

return [
    'routes' => [
        // Hashes & Checksums
        ['name' => 'hash#calculate', 'url' => '/api/v1/hash', 'verb' => 'POST'],
        
        // Archives (Extract & Compress)
        ['name' => 'archive#extract', 'url' => '/api/v1/archive/extract', 'verb' => 'POST'],
        ['name' => 'archive#compress', 'url' => '/api/v1/archive/compress', 'verb' => 'POST'],
        ['name' => 'archive#folderSize', 'url' => '/api/v1/folder/size', 'verb' => 'POST'],

        // Color Tags
        ['name' => 'tag#getTags', 'url' => '/api/v1/tags', 'verb' => 'GET'],
        ['name' => 'tag#setTag', 'url' => '/api/v1/tags', 'verb' => 'POST'],

        // Admin & Settings
        ['name' => 'admin#getSettings', 'url' => '/api/v1/admin/settings', 'verb' => 'GET'],
        ['name' => 'admin#saveSettings', 'url' => '/api/v1/admin/settings', 'verb' => 'POST'],

        // Stats & Duplicates
        ['name' => 'stats#getOverview', 'url' => '/api/v1/stats', 'verb' => 'GET'],
        ['name' => 'stats#getDuplicates', 'url' => '/api/v1/duplicates', 'verb' => 'GET'],

        // Media Converter & Batch Share
        ['name' => 'media#convert', 'url' => '/api/v1/media/convert', 'verb' => 'POST'],
        ['name' => 'share#batch', 'url' => '/api/v1/share/batch', 'verb' => 'POST'],

        // PDF Tools (Merge & Action)
        ['name' => 'pdf#merge', 'url' => '/api/v1/pdf/merge', 'verb' => 'POST'],
        ['name' => 'pdf#action', 'url' => '/api/v1/pdf/action', 'verb' => 'POST'],
    ]
];
