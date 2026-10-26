<?php
declare(strict_types=1);

/**
 * SPDX-FileCopyrightText: 2026 Sairento / Nextcloud Files Enhancer
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

namespace OCA\FilesEnhancer\Command;

use OCA\FilesEnhancer\Service\StatsService;
use Symfony\Component\Console\Command\Command;
use Symfony\Component\Console\Helper\Table;
use Symfony\Component\Console\Input\InputInterface;
use Symfony\Component\Console\Output\OutputInterface;

class StatsCommand extends Command {
    private StatsService $statsService;

    public function __construct(StatsService $statsService) {
        parent::__construct();
        $this->statsService = $statsService;
    }

    protected function configure(): void {
        $this->setName('files:enhancer:stats')
            ->setDescription('Wyświetl szczegółowe statystyki magazynu plików w Nextcloud');
    }

    protected function execute(InputInterface $input, OutputInterface $output): int {
        $stats = $this->statsService->getStorageOverview();

        $bytes = (float)$stats['totalBytes'];
        $units = ['B', 'KB', 'MB', 'GB', 'TB'];
        for ($i = 0; $bytes >= 1024 && $i < 4; $i++) $bytes /= 1024;
        $totalFormatted = round($bytes, 2) . ' ' . $units[$i];

        $output->writeln('<info>=== Podsumowanie Magazynu Nextcloud Files ===</info>');
        $output->writeln('Łączna liczba plików:   <comment>' . number_format($stats['totalFiles']) . '</comment>');
        $output->writeln('Łączna liczba folderów: <comment>' . number_format($stats['totalFolders']) . '</comment>');
        $output->writeln('Całkowity rozmiar:      <comment>' . $totalFormatted . '</comment>');
        $output->writeln('');

        if (!empty($stats['topMimeTypes'])) {
            $output->writeln('<info>Najpopularniejsze typy plików:</info>');
            $table = new Table($output);
            $table->setHeaders(['Typ MIME', 'Liczba plików', 'Rozmiar']);

            foreach ($stats['topMimeTypes'] as $mime) {
                $mBytes = (float)$mime['bytes'];
                for ($j = 0; $mBytes >= 1024 && $j < 4; $j++) $mBytes /= 1024;
                $mFormatted = round($mBytes, 2) . ' ' . $units[$j];

                $table->addRow([$mime['mimetype'], number_format($mime['count']), $mFormatted]);
            }
            $table->render();
        }

        return Command::SUCCESS;
    }
}
