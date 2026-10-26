<?php
declare(strict_types=1);

/**
 * SPDX-FileCopyrightText: 2026 Sairento / Nextcloud Files Enhancer
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

namespace OCA\FilesEnhancer\Settings;

use OCA\FilesEnhancer\Service\StatsService;
use OCP\AppFramework\Http\TemplateResponse;
use OCP\IConfig;
use OCP\Settings\ISettings;

class Admin implements ISettings {
    private IConfig $config;
    private StatsService $statsService;

    public function __construct(IConfig $config, StatsService $statsService) {
        $this->config = $config;
        $this->statsService = $statsService;
    }

    public function getForm(): TemplateResponse {
        $stats = $this->statsService->getStorageOverview();

        return new TemplateResponse('files_enhancer', 'admin', [
            'enableQuicklook' => $this->config->getAppValue('files_enhancer', 'enable_quicklook', 'yes') === 'yes',
            'enableArchiveOps' => $this->config->getAppValue('files_enhancer', 'enable_archive_ops', 'yes') === 'yes',
            'enableColorTags' => $this->config->getAppValue('files_enhancer', 'enable_color_tags', 'yes') === 'yes',
            'enableBatchRename' => $this->config->getAppValue('files_enhancer', 'enable_batch_rename', 'yes') === 'yes',
            'enableChecksums' => $this->config->getAppValue('files_enhancer', 'enable_checksums', 'yes') === 'yes',
            'enableFolderSizes' => $this->config->getAppValue('files_enhancer', 'enable_folder_sizes', 'yes') === 'yes',
            'stats' => $stats,
        ]);
    }

    public function getSection(): string {
        return 'files';
    }

    public function getPriority(): int {
        return 70;
    }
}
