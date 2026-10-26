<?php
declare(strict_types=1);

/**
 * SPDX-FileCopyrightText: 2026 Sairento / Nextcloud Files Enhancer
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

namespace OCA\FilesEnhancer\Service;

use OCP\IDBConnection;
use OCP\Files\IRootFolder;

class DuplicateService {
    private IDBConnection $db;
    private IRootFolder $rootFolder;

    public function __construct(IDBConnection $db, IRootFolder $rootFolder) {
        $this->db = $db;
        $this->rootFolder = $rootFolder;
    }

    /**
     * Find potential file duplicates in Nextcloud
     *
     * @param int $minSizeBytes Minimum size in bytes to inspect (default 1MB)
     * @param int $limit Maximum duplicate groups to return
     * @return array
     */
    public function findDuplicates(int $minSizeBytes = 1048576, int $limit = 50): array {
        $qb = $this->db->getQueryBuilder();

        // Find sizes that appear more than once for files (mimetype != 2 which is httpd/unix-directory)
        $qb->select('size')
            ->selectAlias($qb->createFunction('COUNT(*)'), 'file_count')
            ->from('filecache')
            ->where($qb->expr()->gt('size', $qb->createNamedParameter($minSizeBytes)))
            ->andWhere($qb->expr()->neq('mimetype', $qb->createNamedParameter(2)))
            ->groupBy('size')
            ->having($qb->expr()->gt('file_count', $qb->createNamedParameter(1)))
            ->orderBy('size', 'DESC')
            ->setMaxResults($limit);

        $result = $qb->executeQuery();
        $duplicateGroups = [];
        $totalWastedBytes = 0;

        while ($row = $result->fetch()) {
            $size = (int)$row['size'];
            $count = (int)$row['file_count'];

            // Fetch details for files with this exact size
            $detailQb = $this->db->getQueryBuilder();
            $detailQb->select('fileid', 'path', 'name', 'mimetype', 'mtime', 'storage')
                ->from('filecache')
                ->where($detailQb->expr()->eq('size', $detailQb->createNamedParameter($size)))
                ->andWhere($detailQb->expr()->neq('mimetype', $detailQb->createNamedParameter(2)))
                ->orderBy('mtime', 'DESC')
                ->setMaxResults(10);

            $detailRes = $detailQb->executeQuery();
            $files = [];
            while ($fRow = $detailRes->fetch()) {
                $files[] = [
                    'fileid' => (int)$fRow['fileid'],
                    'name' => $fRow['name'],
                    'path' => $fRow['path'],
                    'modified' => (int)$fRow['mtime'],
                ];
            }

            if (count($files) > 1) {
                $wastedForGroup = ($count - 1) * $size;
                $totalWastedBytes += $wastedForGroup;
                $duplicateGroups[] = [
                    'size' => $size,
                    'count' => $count,
                    'wastedBytes' => $wastedForGroup,
                    'sampleFiles' => $files,
                ];
            }
        }

        return [
            'totalGroups' => count($duplicateGroups),
            'totalWastedBytes' => $totalWastedBytes,
            'groups' => $duplicateGroups,
        ];
    }
}
