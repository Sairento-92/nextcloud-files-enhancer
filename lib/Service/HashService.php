<?php
declare(strict_types=1);

/**
 * SPDX-FileCopyrightText: 2026 Sairento / Nextcloud Files Enhancer
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

namespace OCA\FilesEnhancer\Service;

use OCP\Files\Folder;
use OCP\Files\File;
use OCP\Files\Node;
use OCP\Files\NotFoundException;
use OCP\Files\NotPermittedException;
use OCP\Files\IRootFolder;
use OCP\IUserSession;

class HashService {
    private IRootFolder $rootFolder;
    private IUserSession $userSession;

    public function __construct(IRootFolder $rootFolder, IUserSession $userSession) {
        $this->rootFolder = $rootFolder;
        $this->userSession = $userSession;
    }

    /**
     * Compute hashes for a user file
     *
     * @param string $path
     * @return array
     * @throws NotFoundException
     * @throws NotPermittedException
     */
    public function getFileHashes(string $path): array {
        $user = $this->userSession->getUser();
        if ($user === null) {
            throw new NotPermittedException('User is not logged in');
        }

        $userFolder = $this->rootFolder->getUserFolder($user->getUID());
        $node = $userFolder->get($path);

        if (!($node instanceof File)) {
            throw new NotPermittedException('Target node is not a file');
        }

        $resource = $node->fopen('rb');
        if (!is_resource($resource)) {
            throw new NotPermittedException('Unable to open file resource');
        }

        $md5Context = hash_init('md5');
        $sha1Context = hash_init('sha1');
        $sha256Context = hash_init('sha256');

        while (!feof($resource)) {
            $chunk = fread($resource, 65536);
            if ($chunk === false || strlen($chunk) === 0) {
                break;
            }
            hash_update($md5Context, $chunk);
            hash_update($sha1Context, $chunk);
            hash_update($sha256Context, $chunk);
        }

        fclose($resource);

        return [
            'name' => $node->getName(),
            'size' => $node->getSize(),
            'mimetype' => $node->getMimeType(),
            'md5' => hash_final($md5Context),
            'sha1' => hash_final($sha1Context),
            'sha256' => hash_final($sha256Context),
        ];
    }
}
