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
use Symfony\Component\Console\Input\InputOption;
use Symfony\Component\Console\Output\OutputInterface;

class CleanupOrphansCommand extends Command {
    private IDBConnection $db;

    public function __construct(IDBConnection $db) {
        parent::__construct();
        $this->db = $db;
    }

    protected function configure(): void {
        $this->setName('files:enhancer:cleanup-orphans')
            ->setDescription('Wyczyść osierocone wpisy pamięci podręcznej i nieprawidłowe relacje magazynu')
            ->addOption('dry-run', null, InputOption::VALUE_NONE, 'Symulacja bez fizycznego usuwania');
    }

    protected function execute(InputInterface $input, OutputInterface $output): int {
        $dryRun = (bool)$input->getOption('dry-run');

        $output->writeln('<info>Wyszukiwanie osieroconych rekordów w bazie filecache...</info>');

        // Find filecache entries where storage doesn't exist in oc_storages
        $qb = $this->db->getQueryBuilder();
        $qb->select('f.fileid', 'f.path')
            ->from('filecache', 'f')
            ->leftJoin('f', 'storages', 's', $qb->expr()->eq('f.storage', 's.numeric_id'))
            ->where($qb->expr()->isNull('s.numeric_id'))
            ->setMaxResults(500);

        $results = $qb->executeQuery()->fetchAll();
        $orphanCount = count($results);

        $output->writeln('Znaleziono osieroconych wpisów: <comment>' . $orphanCount . '</comment>');

        if ($dryRun) {
            $output->writeln('<comment>[Dry-run] Żadne rekordy nie zostały usunięte.</comment>');
            return Command::SUCCESS;
        }

        if ($orphanCount > 0) {
            $fileIds = array_column($results, 'fileid');
            $delQb = $this->db->getQueryBuilder();
            $delQb->delete('filecache')
                ->where($delQb->expr()->in('fileid', $delQb->createNamedParameter($fileIds, IDBConnection::PARAM_INT_ARRAY)))
                ->executeStatement();

            $output->writeln('<info>✓ Pomyślnie usunięto ' . $orphanCount . ' osieroconych rekordów z tabeli filecache.</info>');
        }

        return Command::SUCCESS;
    }
}
