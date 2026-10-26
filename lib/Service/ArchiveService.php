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
use ZipArchive;
use PharData;

class ArchiveService {
    private IRootFolder $rootFolder;
    private IUserSession $userSession;

    public function __construct(IRootFolder $rootFolder, IUserSession $userSession) {
        $this->rootFolder = $rootFolder;
        $this->userSession = $userSession;
    }

    /**
     * Extract archive directly on server
     */
    public function extractArchive(string $archivePath, string $destinationDir): array {
        $user = $this->userSession->getUser();
        if ($user === null) {
            throw new NotPermittedException('User is not logged in');
        }

        $userFolder = $this->rootFolder->getUserFolder($user->getUID());
        $archiveNode = $userFolder->get($archivePath);

        if (!($archiveNode instanceof File)) {
            throw new NotPermittedException('Specified archive is not a valid file');
        }

        $destFolderNode = $userFolder->get($destinationDir);
        if (!($destFolderNode instanceof Folder)) {
            throw new NotPermittedException('Destination directory not found');
        }

        // Copy archive stream to temporary local file
        $tempArchive = tempnam(sys_get_temp_dir(), 'nc_extract_');
        $inStream = $archiveNode->fopen('rb');
        $outStream = fopen($tempArchive, 'wb');
        stream_copy_to_stream($inStream, $outStream);
        fclose($inStream);
        fclose($outStream);

        $extractedFiles = 0;
        $tempExtractDir = sys_get_temp_dir() . DIRECTORY_SEPARATOR . 'nc_extracted_' . uniqid();
        mkdir($tempExtractDir, 0777, true);

        $name = strtolower($archiveNode->getName());
        try {
            if (str_ends_with($name, '.zip')) {
                $zip = new ZipArchive();
                if ($zip->open($tempArchive) === true) {
                    $zip->extractTo($tempExtractDir);
                    $extractedFiles = $zip->numFiles;
                    $zip->close();
                } else {
                    throw new \RuntimeException('Failed to open ZIP archive');
                }
            } elseif (str_ends_with($name, '.tar.gz') || str_ends_with($name, '.tgz')) {
                $phar = new PharData($tempArchive);
                $phar->extractTo($tempExtractDir);
                $extractedFiles = count(scandir($tempExtractDir));
            } else {
                throw new \InvalidArgumentException('Unsupported archive format: only .zip, .tar.gz, .tgz are supported');
            }

            // Sync extracted contents into destination folder in Nextcloud
            $this->importDirectory($tempExtractDir, $destFolderNode);
        } finally {
            // Clean up temporary files
            if (file_exists($tempArchive)) {
                @unlink($tempArchive);
            }
            $this->deleteRecursive($tempExtractDir);
        }

        return [
            'success' => true,
            'archive' => $archiveNode->getName(),
            'destination' => $destinationDir,
            'extractedCount' => $extractedFiles,
        ];
    }

    /**
     * Compress selected files/folders into a ZIP
     */
    public function compressToZip(array $paths, string $zipName, string $targetFolder): array {
        $user = $this->userSession->getUser();
        if ($user === null) {
            throw new NotPermittedException('User is not logged in');
        }

        $userFolder = $this->rootFolder->getUserFolder($user->getUID());
        $targetNode = $userFolder->get($targetFolder);
        if (!($targetNode instanceof Folder)) {
            throw new NotPermittedException('Target directory not found');
        }

        if (!str_ends_with(strtolower($zipName), '.zip')) {
            $zipName .= '.zip';
        }

        $tempZip = tempnam(sys_get_temp_dir(), 'nc_zip_');
        $zip = new ZipArchive();
        if ($zip->open($tempZip, ZipArchive::CREATE | ZipArchive::OVERWRITE) !== true) {
            throw new \RuntimeException('Could not create temporary zip archive');
        }

        $totalAdded = 0;
        foreach ($paths as $path) {
            $node = $userFolder->get($path);
            if ($node instanceof File) {
                $stream = $node->fopen('rb');
                $content = stream_get_contents($stream);
                fclose($stream);
                $zip->addFromString($node->getName(), $content);
                $totalAdded++;
            } elseif ($node instanceof Folder) {
                $this->addFolderToZip($node, $node->getName(), $zip);
                $totalAdded++;
            }
        }
        $zip->close();

        // Write the zip file back into Nextcloud
        $finalFile = $targetNode->newFile($zipName);
        $finalStream = fopen($tempZip, 'rb');
        $destStream = $finalFile->fopen('wb');
        stream_copy_to_stream($finalStream, $destStream);
        fclose($finalStream);
        fclose($destStream);

        @unlink($tempZip);

        return [
            'success' => true,
            'zipName' => $zipName,
            'itemsCompressed' => $totalAdded,
            'size' => $finalFile->getSize(),
        ];
    }

    /**
     * Compute folder size and item count
     */
    public function getFolderSize(string $folderPath): array {
        $user = $this->userSession->getUser();
        if ($user === null) {
            throw new NotPermittedException('User is not logged in');
        }

        $userFolder = $this->rootFolder->getUserFolder($user->getUID());
        $node = $userFolder->get($folderPath);

        if (!($node instanceof Folder)) {
            throw new NotPermittedException('Specified path is not a directory');
        }

        $stats = ['size' => 0, 'files' => 0, 'folders' => 0];
        $this->calculateFolderRecursive($node, $stats);

        return [
            'name' => $node->getName(),
            'path' => $folderPath,
            'size' => $stats['size'],
            'files' => $stats['files'],
            'folders' => $stats['folders'],
        ];
    }

    private function calculateFolderRecursive(Folder $folder, array &$stats): void {
        foreach ($folder->getDirectoryListing() as $child) {
            if ($child instanceof File) {
                $stats['files']++;
                $stats['size'] += $child->getSize();
            } elseif ($child instanceof Folder) {
                $stats['folders']++;
                $this->calculateFolderRecursive($child, $stats);
            }
        }
    }

    private function addFolderToZip(Folder $folder, string $localPath, ZipArchive $zip): void {
        $zip->addEmptyDir($localPath);
        foreach ($folder->getDirectoryListing() as $child) {
            $childPath = $localPath . '/' . $child->getName();
            if ($child instanceof File) {
                $stream = $child->fopen('rb');
                $zip->addFromString($childPath, stream_get_contents($stream));
                fclose($stream);
            } elseif ($child instanceof Folder) {
                $this->addFolderToZip($child, $childPath, $zip);
            }
        }
    }

    private function importDirectory(string $localDir, Folder $parentFolder): void {
        $items = scandir($localDir);
        foreach ($items as $item) {
            if ($item === '.' || $item === '..') {
                continue;
            }
            $fullPath = $localDir . DIRECTORY_SEPARATOR . $item;
            if (is_dir($fullPath)) {
                $subFolder = $parentFolder->nodeExists($item) ? $parentFolder->get($item) : $parentFolder->newFolder($item);
                if ($subFolder instanceof Folder) {
                    $this->importDirectory($fullPath, $subFolder);
                }
            } else {
                $file = $parentFolder->nodeExists($item) ? $parentFolder->get($item) : $parentFolder->newFile($item);
                if ($file instanceof File) {
                    $srcStream = fopen($fullPath, 'rb');
                    $destStream = $file->fopen('wb');
                    stream_copy_to_stream($srcStream, $destStream);
                    fclose($srcStream);
                    fclose($destStream);
                }
            }
        }
    }

    private function deleteRecursive(string $dir): void {
        if (!file_exists($dir)) {
            return;
        }
        if (!is_dir($dir)) {
            @unlink($dir);
            return;
        }
        foreach (scandir($dir) as $item) {
            if ($item === '.' || $item === '..') {
                continue;
            }
            $this->deleteRecursive($dir . DIRECTORY_SEPARATOR . $item);
        }
        @rmdir($dir);
    }
}
