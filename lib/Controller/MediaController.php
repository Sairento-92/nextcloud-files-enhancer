<?php
declare(strict_types=1);

/**
 * SPDX-FileCopyrightText: 2026 Sairento / Nextcloud Files Enhancer
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

namespace OCA\FilesEnhancer\Controller;

use OCA\FilesEnhancer\Service\MediaService;
use OCP\AppFramework\Controller;
use OCP\AppFramework\Http\DataResponse;
use OCP\IRequest;

class MediaController extends Controller {
    private MediaService $mediaService;

    public function __construct(string $appName, IRequest $request, MediaService $mediaService) {
        parent::__construct($appName, $request);
        $this->mediaService = $mediaService;
    }

    /**
     * @NoAdminRequired
     */
    public function convert(string $path, string $format): DataResponse {
        try {
            $res = $this->mediaService->convertImage($path, $format);
            return new DataResponse($res);
        } catch (\Throwable $e) {
            return new DataResponse(['error' => $e->getMessage()], 400);
        }
    }
}
