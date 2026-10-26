<?php
declare(strict_types=1);

/**
 * SPDX-FileCopyrightText: 2026 Sairento / Nextcloud Files Enhancer
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

namespace OCA\FilesEnhancer\Controller;

use OCA\FilesEnhancer\Service\ShareService;
use OCP\AppFramework\Controller;
use OCP\AppFramework\Http\DataResponse;
use OCP\IRequest;

class ShareController extends Controller {
    private ShareService $shareService;

    public function __construct(string $appName, IRequest $request, ShareService $shareService) {
        parent::__construct($appName, $request);
        $this->shareService = $shareService;
    }

    /**
     * @NoAdminRequired
     */
    public function batch(array $paths): DataResponse {
        try {
            $res = $this->shareService->batchShare($paths);
            return new DataResponse($res);
        } catch (\Throwable $e) {
            return new DataResponse(['error' => $e->getMessage()], 400);
        }
    }
}
