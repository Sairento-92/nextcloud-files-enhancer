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
use OCP\IUserSession;

class TagController extends Controller {
    private IConfig $config;
    private IUserSession $userSession;

    public function __construct(string $appName, IRequest $request, IConfig $config, IUserSession $userSession) {
        parent::__construct($appName, $request);
        $this->config = $config;
        $this->userSession = $userSession;
    }

    /**
     * @NoAdminRequired
     */
    public function getTags(): DataResponse {
        $user = $this->userSession->getUser();
        if ($user === null) {
            return new DataResponse(['error' => 'Unauthorized'], 401);
        }

        $raw = $this->config->getUserValue($user->getUID(), 'files_enhancer', 'color_tags', '{}');
        $tags = json_decode($raw, true) ?? [];

        return new DataResponse(['tags' => $tags]);
    }

    /**
     * @NoAdminRequired
     */
    public function setTag(string $fileId, ?string $color = null): DataResponse {
        $user = $this->userSession->getUser();
        if ($user === null) {
            return new DataResponse(['error' => 'Unauthorized'], 401);
        }

        $raw = $this->config->getUserValue($user->getUID(), 'files_enhancer', 'color_tags', '{}');
        $tags = json_decode($raw, true) ?? [];

        if ($color === null || $color === '' || $color === 'none') {
            unset($tags[$fileId]);
        } else {
            $tags[$fileId] = $color;
        }

        $this->config->setUserValue($user->getUID(), 'files_enhancer', 'color_tags', json_encode($tags));

        return new DataResponse(['success' => true, 'fileId' => $fileId, 'color' => $color]);
    }
}
