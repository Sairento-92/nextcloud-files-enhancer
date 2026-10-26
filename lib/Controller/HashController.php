<?php
declare(strict_types=1);

/**
 * SPDX-FileCopyrightText: 2026 Sairento / Nextcloud Files Enhancer
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

namespace OCA\FilesEnhancer\Controller;

use OCA\FilesEnhancer\Service\HashService;
use OCP\AppFramework\Controller;
use OCP\AppFramework\Http\DataResponse;
use OCP\IRequest;

class HashController extends Controller {
    private HashService $hashService;

    public function __construct(string $appName, IRequest $request, HashService $hashService) {
        parent::__construct($appName, $request);
        $this->hashService = $hashService;
    }

    /**
     * @NoAdminRequired
     */
    public function calculate(string $path): DataResponse {
        try {
            $data = $this->hashService->getFileHashes($path);
            return new DataResponse($data);
        } catch (\Throwable $e) {
            return new DataResponse(['error' => $e->getMessage()], 400);
        }
    }
}
