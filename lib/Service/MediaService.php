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

class MediaService {
    private IRootFolder $rootFolder;
    private IUserSession $userSession;

    public function __construct(IRootFolder $rootFolder, IUserSession $userSession) {
        $this->rootFolder = $rootFolder;
        $this->userSession = $userSession;
    }

    /**
     * Convert an image to WebP, PNG, or JPEG
     */
    public function convertImage(string $path, string $targetFormat): array {
        $user = $this->userSession->getUser();
        if ($user === null) {
            throw new NotPermittedException('User is not logged in');
        }

        $userFolder = $this->rootFolder->getUserFolder($user->getUID());
        $node = $userFolder->get($path);

        if (!($node instanceof File)) {
            throw new NotPermittedException('Target node is not a file');
        }

        $targetFormat = strtolower($targetFormat);
        if (!in_array($targetFormat, ['webp', 'png', 'jpg', 'jpeg'], true)) {
            throw new \InvalidArgumentException('Unsupported target format: ' . $targetFormat);
        }

        $stream = $node->fopen('rb');
        $imgData = stream_get_contents($stream);
        fclose($stream);

        $img = @imagecreatefromstring($imgData);
        if (!$img) {
            throw new \RuntimeException('Failed to decode image data');
        }

        // Handle transparency
        imagealphablending($img, false);
        imagesavealpha($img, true);

        $tempOut = tempnam(sys_get_temp_dir(), 'nc_conv_');
        $saved = false;

        if ($targetFormat === 'webp') {
            $saved = imagewebp($img, $tempOut, 85);
        } elseif ($targetFormat === 'png') {
            $saved = imagepng($img, $tempOut, 8);
        } elseif ($targetFormat === 'jpg' || $targetFormat === 'jpeg') {
            // Fill background with white for JPEG
            $bg = imagecreatetruecolor(imagesx($img), imagesy($img));
            $white = imagecolorallocate($bg, 255, 255, 255);
            imagefilledrectangle($bg, 0, 0, imagesx($img), imagesy($img), $white);
            imagecopy($bg, $img, 0, 0, 0, 0, imagesx($img), imagesy($img));
            $saved = imagejpeg($bg, $tempOut, 90);
            imagedestroy($bg);
        }

        imagedestroy($img);

        if (!$saved) {
            @unlink($tempOut);
            throw new \RuntimeException('Failed to encode converted image');
        }

        // Determine destination filename
        $parentFolder = $node->getParent();
        $baseName = pathinfo($node->getName(), PATHINFO_FILENAME);
        $ext = ($targetFormat === 'jpeg') ? 'jpg' : $targetFormat;
        $newFileName = $baseName . '.' . $ext;

        // Avoid accidental overwrite
        $counter = 1;
        while ($parentFolder->nodeExists($newFileName)) {
            $newFileName = $baseName . '_' . $counter . '.' . $ext;
            $counter++;
        }

        $newFile = $parentFolder->newFile($newFileName);
        $newStream = fopen($tempOut, 'rb');
        $targetStream = $newFile->fopen('wb');
        stream_copy_to_stream($newStream, $targetStream);
        fclose($newStream);
        fclose($targetStream);
        @unlink($tempOut);

        return [
            'success' => true,
            'original' => $node->getName(),
            'converted' => $newFile->getName(),
            'format' => $targetFormat,
            'size' => $newFile->getSize(),
        ];
    }
}
