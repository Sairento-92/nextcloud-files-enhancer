<?php
declare(strict_types=1);

/**
 * SPDX-FileCopyrightText: 2026 Sairento / Nextcloud Files Enhancer
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

namespace OCA\FilesEnhancer\Controller;

use OCA\FilesEnhancer\Service\ArchiveService;
use OCP\AppFramework\Controller;
use OCP\AppFramework\Http\DataResponse;
use OCP\IRequest;

class ArchiveController extends Controller {
    private ArchiveService $archiveService;

    public function __construct(string $appName, IRequest $request, ArchiveService $archiveService) {
        parent::__construct($appName, $request);
        $this->archiveService = $archiveService;
    }

    /**
     * @NoAdminRequired
     */
    public function extract(string $path, ?string $destination = null): DataResponse {
        try {
            $dest = $destination ?? dirname($path);
            if ($dest === '.' || $dest === '') {
                $dest = '/';
            }
            $result = $this->archiveService->extractArchive($path, $dest);
            return new DataResponse($result);
        } catch (\Throwable $e) {
            return new DataResponse(['error' => $e->getMessage()], 400);
        }
    }

    /**
     * @NoAdminRequired
     */
    public function compress(array $paths, string $zipName = 'Archive.zip', ?string $targetFolder = null): DataResponse {
        try {
            $target = $targetFolder ?? (isset($paths[0]) ? dirname($paths[0]) : '/');
            if ($target === '.' || $target === '') {
                $target = '/';
            }
            $result = $this->archiveService->compressToZip($paths, $zipName, $target);
            return new DataResponse($result);
        } catch (\Throwable $e) {
            return new DataResponse(['error' => $e->getMessage()], 400);
        }
    }

    /**
     * @NoAdminRequired
     */
    public function folderSize(string $path): DataResponse {
        try {
            $result = $this->archiveService->getFolderSize($path);
            return new DataResponse($result);
        } catch (\Throwable $e) {
            return new DataResponse(['error' => $e->getMessage()], 400);
        }
    }
}
