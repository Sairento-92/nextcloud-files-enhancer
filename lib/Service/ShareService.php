<?php
declare(strict_types=1);

/**
 * SPDX-FileCopyrightText: 2026 Sairento / Nextcloud Files Enhancer
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

namespace OCA\FilesEnhancer\Service;

use OCP\Files\Folder;
use OCP\Files\File;
use OCP\Files\IRootFolder;
use OCP\Files\NotPermittedException;
use OCP\IUserSession;
use OCP\Share\IManager as IShareManager;
use OCP\Constants;

class ShareService {
    private IRootFolder $rootFolder;
    private IUserSession $userSession;
    private IShareManager $shareManager;

    public function __construct(IRootFolder $rootFolder, IUserSession $userSession, IShareManager $shareManager) {
        $this->rootFolder = $rootFolder;
        $this->userSession = $userSession;
        $this->shareManager = $shareManager;
    }

    /**
     * Create public links for a batch of files
     */
    public function batchShare(array $paths, ?string $bundleFolderName = null): array {
        $user = $this->userSession->getUser();
        if ($user === null) {
            throw new NotPermittedException('User is not logged in');
        }

        $userFolder = $this->rootFolder->getUserFolder($user->getUID());
        $results = [];

        foreach ($paths as $path) {
            try {
                $node = $userFolder->get($path);
                
                // Create a public link share
                $share = $this->shareManager->newShare();
                $share->setNode($node)
                    ->setShareType(Constants::SHARE_TYPE_LINK)
                    ->setPermissions(Constants::PERMISSION_READ)
                    ->setSharedBy($user->getUID());

                $createdShare = $this->shareManager->createShare($share);
                $token = $createdShare->getToken();
                
                $results[] = [
                    'name' => $node->getName(),
                    'path' => $path,
                    'token' => $token,
                    'url' => \OC::$server->getURLGenerator()->linkToRouteAbsolute('files_sharing.sharecontroller.showShare', ['token' => $token]),
                ];
            } catch (\Throwable $e) {
                $results[] = [
                    'path' => $path,
                    'error' => $e->getMessage(),
                ];
            }
        }

        return [
            'success' => true,
            'count' => count($results),
            'shares' => $results,
        ];
    }
}
