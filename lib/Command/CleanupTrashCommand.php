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

class CleanupTrashCommand extends Command {
    private IDBConnection $db;

    public function __construct(IDBConnection $db) {
        parent::__construct();
        $this->db = $db;
    }

    protected function configure(): void {
        $this->setName('files:enhancer:cleanup-trash')
            ->setDescription('Inteligentne czyszczenie przestarzałych wpisów w koszu i starych wersji')
            ->addOption('days', 'd', InputOption::VALUE_OPTIONAL, 'Wiek elementów w dniach do usunięcia', '30')
            ->addOption('dry-run', null, InputOption::VALUE_NONE, 'Tylko raport bez usuwania danych');
    }

    protected function execute(InputInterface $input, OutputInterface $output): int {
        $days = (int)$input->getOption('days');
        $dryRun = (bool)$input->getOption('dry-run');
        $thresholdTimestamp = time() - ($days * 86400);

        $output->writeln('<info>Analiza plików w koszu starszych niż ' . $days . ' dni...</info>');

        $qb = $this->db->getQueryBuilder();
        $qb->selectAlias($qb->createFunction('COUNT(*)'), 'count')
            ->selectAlias($qb->createFunction('SUM(file_size)'), 'size')
            ->from('files_trash')
            ->where($qb->expr()->lt('timestamp', $qb->createNamedParameter($thresholdTimestamp)));

        $res = $qb->executeQuery()->fetch();
        $count = (int)($res['count'] ?? 0);
        $size = (float)($res['size'] ?? 0);

        $units = ['B', 'KB', 'MB', 'GB'];
        for ($i = 0; $size >= 1024 && $i < 3; $i++) $size /= 1024;
        $formatted = round($size, 2) . ' ' . $units[$i];

        $output->writeln('Znaleziono starych elementów w koszu: <comment>' . number_format($count) . '</comment> (rozmiar: <comment>' . $formatted . '</comment>)');

        if ($dryRun) {
            $output->writeln('<comment>[Dry-run] Żadne pliki nie zostały zmodyfikowane.</comment>');
            return Command::SUCCESS;
        }

        if ($count > 0) {
            $delQb = $this->db->getQueryBuilder();
            $delQb->delete('files_trash')
                ->where($delQb->expr()->lt('timestamp', $delQb->createNamedParameter($thresholdTimestamp)))
                ->executeStatement();

            $output->writeln('<info>✓ Pomyślnie usunięto ' . number_format($count) . ' przeterminowanych wpisów z kosza.</info>');
        }

        return Command::SUCCESS;
    }
}
