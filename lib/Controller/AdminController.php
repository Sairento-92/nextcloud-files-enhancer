<?php
declare(strict_types=1);

/**
 * SPDX-FileCopyrightText: 2026 Sairento / Nextcloud Files Enhancer
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

namespace OCA\FilesEnhancer\Controller;

use OCP\AppFramework\Controller;
use OCP\AppFramework\Http\DataResponse;
use OCP\IConfig;
use OCP\IRequest;

class AdminController extends Controller {
    private IConfig $config;

    public function __construct(string $appName, IRequest $request, IConfig $config) {
        parent::__construct($appName, $request);
        $this->config = $config;
    }

    public function getSettings(): DataResponse {
        return new DataResponse([
            'enable_quicklook' => $this->config->getAppValue('files_enhancer', 'enable_quicklook', 'yes') === 'yes',
            'enable_archive_ops' => $this->config->getAppValue('files_enhancer', 'enable_archive_ops', 'yes') === 'yes',
            'enable_color_tags' => $this->config->getAppValue('files_enhancer', 'enable_color_tags', 'yes') === 'yes',
            'enable_batch_rename' => $this->config->getAppValue('files_enhancer', 'enable_batch_rename', 'yes') === 'yes',
            'enable_checksums' => $this->config->getAppValue('files_enhancer', 'enable_checksums', 'yes') === 'yes',
            'enable_folder_sizes' => $this->config->getAppValue('files_enhancer', 'enable_folder_sizes', 'yes') === 'yes',
        ]);
    }

    public function saveSettings(array $settings): DataResponse {
        foreach ($settings as $key => $val) {
            $strVal = ($val === true || $val === 'yes' || $val === '1') ? 'yes' : 'no';
            $this->config->setAppValue('files_enhancer', $key, $strVal);
        }

        return new DataResponse(['success' => true]);
    }
}
