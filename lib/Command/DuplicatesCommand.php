<?php
declare(strict_types=1);

/**
 * SPDX-FileCopyrightText: 2026 Sairento / Nextcloud Files Enhancer
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

namespace OCA\FilesEnhancer\Command;

use OCA\FilesEnhancer\Service\DuplicateService;
use Symfony\Component\Console\Command\Command;
use Symfony\Component\Console\Helper\Table;
use Symfony\Component\Console\Input\InputInterface;
use Symfony\Component\Console\Input\InputOption;
use Symfony\Component\Console\Output\OutputInterface;

class DuplicatesCommand extends Command {
    private DuplicateService $duplicateService;

    public function __construct(DuplicateService $duplicateService) {
        parent::__construct();
        $this->duplicateService = $duplicateService;
    }

    protected function configure(): void {
        $this->setName('files:enhancer:duplicates')
            ->setDescription('Wyszukaj zduplikowane pliki w chmurze Nextcloud')
            ->addOption('min-size-mb', 'm', InputOption::VALUE_OPTIONAL, 'Minimalny rozmiar pliku w MB do analizy', '5')
            ->addOption('limit', 'l', InputOption::VALUE_OPTIONAL, 'Maksymalna liczba grup duplikatów', '25');
    }

    protected function execute(InputInterface $input, OutputInterface $output): int {
        $minSizeMb = (int)$input->getOption('min-size-mb');
        $limit = (int)$input->getOption('limit');

        $output->writeln('<info>Analiza potencjalnych duplikatów plików (min. ' . $minSizeMb . ' MB)...</info>');
        $result = $this->duplicateService->findDuplicates($minSizeMb * 1024 * 1024, $limit);

        if (empty($result['groups'])) {
            $output->writeln('<info>Nie znaleziono zduplikowanych plików o rozmiarze powyżej ' . $minSizeMb . ' MB.</info>');
            return Command::SUCCESS;
        }

        $wastedMb = round($result['totalWastedBytes'] / (1024 * 1024), 2);
        $output->writeln('<comment>Znaleziono grup: ' . $result['totalGroups'] . ' | Potencjalnie zmarnowane miejsce: ' . $wastedMb . ' MB</comment>');

        $table = new Table($output);
        $table->setHeaders(['Rozmiar (MB)', 'Kopii', 'Zmarnowane', 'Przykładowe pliki']);

        foreach ($result['groups'] as $group) {
            $sizeMb = round($group['size'] / (1024 * 1024), 2);
            $wastedGroupMb = round($group['wastedBytes'] / (1024 * 1024), 2);
            $paths = array_map(fn($f) => $f['path'], $group['sampleFiles']);
            $pathsSample = implode("\n", array_slice($paths, 0, 3));
            if (count($paths) > 3) {
                $pathsSample .= "\n(+ " . (count($paths) - 3) . " więcej)";
            }

            $table->addRow([$sizeMb, $group['count'], $wastedGroupMb . ' MB', $pathsSample]);
        }

        $table->render();
        return Command::SUCCESS;
    }
}
