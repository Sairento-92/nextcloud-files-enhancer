<?php
declare(strict_types=1);

/**
 * SPDX-FileCopyrightText: 2026 Sairento / Nextcloud Files Enhancer
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

namespace OCA\FilesEnhancer\Service;

use OCP\IDBConnection;

class StatsService {
    private IDBConnection $db;

    public function __construct(IDBConnection $db) {
        $this->db = $db;
    }

    /**
     * Get aggregate file storage stats
     */
    public function getStorageOverview(): array {
        $qb = $this->db->getQueryBuilder();
        $qb->selectAlias($qb->createFunction('COUNT(*)'), 'total_nodes')
            ->selectAlias($qb->createFunction('SUM(size)'), 'total_bytes')
            ->from('filecache')
            ->where($qb->expr()->neq('mimetype', $qb->createNamedParameter(2)));

        $res = $qb->executeQuery()->fetch();
        $totalFiles = (int)($res['total_nodes'] ?? 0);
        $totalBytes = (int)($res['total_bytes'] ?? 0);

        // Folders count
        $fqb = $this->db->getQueryBuilder();
        $fqb->selectAlias($fqb->createFunction('COUNT(*)'), 'total_folders')
            ->from('filecache')
            ->where($fqb->expr()->eq('mimetype', $fqb->createNamedParameter(2)));
        $totalFolders = (int)($fqb->executeQuery()->fetch()['total_folders'] ?? 0);

        // Group by mime category
        $mqb = $this->db->getQueryBuilder();
        $mqb->select('m.mimetype', 'm.mimetype AS mime_name')
            ->selectAlias($mqb->createFunction('COUNT(*)'), 'count')
            ->selectAlias($mqb->createFunction('SUM(f.size)'), 'bytes')
            ->from('filecache', 'f')
            ->leftJoin('f', 'mimetypes', 'm', $mqb->expr()->eq('f.mimetype', 'm.id'))
            ->where($mqb->expr()->neq('f.mimetype', $mqb->createNamedParameter(2)))
            ->groupBy('m.mimetype')
            ->orderBy('bytes', 'DESC')
            ->setMaxResults(15);

        $mimetypes = [];
        $mRes = $mqb->executeQuery();
        while ($mRow = $mRes->fetch()) {
            $mimetypes[] = [
                'mimetype' => $mRow['mime_name'] ?? 'unknown',
                'count' => (int)$mRow['count'],
                'bytes' => (int)($mRow['bytes'] ?? 0),
            ];
        }

        return [
            'totalFiles' => $totalFiles,
            'totalFolders' => $totalFolders,
            'totalBytes' => $totalBytes,
            'topMimeTypes' => $mimetypes,
        ];
    }
}
