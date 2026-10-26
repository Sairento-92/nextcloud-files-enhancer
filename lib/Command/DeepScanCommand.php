<?php
declare(strict_types=1);

/**
 * SPDX-FileCopyrightText: 2026 Sairento / Nextcloud Files Enhancer
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

namespace OCA\FilesEnhancer\Command;

use OCP\IDBConnection;
use Symfony\Component\Console\Command\Command;
use Symfony\Component\Console\Input\InputInterface;
use Symfony\Component\Console\Output\OutputInterface;

class DeepScanCommand extends Command {
    private IDBConnection $db;

    public function __construct(IDBConnection $db) {
        parent::__construct();
        $this->db = $db;
    }

    protected function configure(): void {
        $this->setName('files:enhancer:scan-deep')
            ->setDescription('Głęboka analiza integralności cache plików i relacji magazynów');
    }

    protected function execute(InputInterface $input, OutputInterface $output): int {
        $output->writeln('<info>Rozpoczynanie sprawdzania integralności pamięci podręcznej plików...</info>');

        // Check for orphan records in filecache where storage doesn't exist
        $qb = $this->db->getQueryBuilder();
        $qb->selectAlias($qb->createFunction('COUNT(*)'), 'orphans')
            ->from('filecache', 'f')
            ->leftJoin('f', 'storages', 's', $qb->expr()->eq('f.storage', 's.numeric_id'))
            ->where($qb->expr()->isNull('s.numeric_id'));

        $orphans = (int)($qb->executeQuery()->fetch()['orphans'] ?? 0);

        if ($orphans > 0) {
            $output->writeln('<comment>Wykryto ' . $orphans . ' osieroconych rekordów w filecache bez przypisanego magazynu.</comment>');
        } else {
            $output->writeln('<info>✓ Brak osieroconych rekordów filecache.</info>');
        }

        // Check files with missing or unknown mime types (mimetype = 0 or NULL)
        $mqb = $this->db->getQueryBuilder();
        $mqb->selectAlias($mqb->createFunction('COUNT(*)'), 'missing_mime')
            ->from('filecache')
            ->where($mqb->expr()->orX(
                $mqb->expr()->eq('mimetype', $mqb->createNamedParameter(0)),
                $mqb->expr()->isNull('mimetype')
            ));
        $missingMime = (int)($mqb->executeQuery()->fetch()['missing_mime'] ?? 0);

        if ($missingMime > 0) {
            $output->writeln('<comment>Wykryto ' . $missingMime . ' plików bez poprawnego typu MIME.</comment>');
        } else {
            $output->writeln('<info>✓ Wszystkie pliki posiadają przypisane typy MIME.</info>');
        }

        $output->writeln('<info>Analiza zakończona pomyślnie.</info>');
        return Command::SUCCESS;
    }
}
