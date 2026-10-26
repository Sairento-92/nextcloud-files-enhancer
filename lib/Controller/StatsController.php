<?php
declare(strict_types=1);

/**
 * SPDX-FileCopyrightText: 2026 Sairento / Nextcloud Files Enhancer
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

namespace OCA\FilesEnhancer\Controller;

use OCA\FilesEnhancer\Service\DuplicateService;
use OCA\FilesEnhancer\Service\StatsService;
use OCP\AppFramework\Controller;
use OCP\AppFramework\Http\DataResponse;
use OCP\IRequest;

class StatsController extends Controller {
    private StatsService $statsService;
    private DuplicateService $duplicateService;

    public function __construct(string $appName, IRequest $request, StatsService $statsService, DuplicateService $duplicateService) {
        parent::__construct($appName, $request);
        $this->statsService = $statsService;
        $this->duplicateService = $duplicateService;
    }

    public function getOverview(): DataResponse {
        return new DataResponse($this->statsService->getStorageOverview());
    }

    public function getDuplicates(int $minSizeMb = 5, int $limit = 20): DataResponse {
        $minBytes = max(1, $minSizeMb) * 1024 * 1024;
        return new DataResponse($this->duplicateService->findDuplicates($minBytes, $limit));
    }
}
