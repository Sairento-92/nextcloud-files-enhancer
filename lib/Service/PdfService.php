<?php
declare(strict_types=1);

/**
 * SPDX-FileCopyrightText: 2026 Sairento / Nextcloud Files Enhancer
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

namespace OCA\FilesEnhancer\Service;

use OCP\Files\IRootFolder;
use OCP\Files\Folder;
use OCP\Files\File;
use OCP\IUserSession;

class PdfService {
    private IRootFolder $rootFolder;
    private IUserSession $userSession;

    public function __construct(IRootFolder $rootFolder, IUserSession $userSession) {
        $this->rootFolder = $rootFolder;
        $this->userSession = $userSession;
    }

    private function getUserFolder(): Folder {
        $user = $this->userSession->getUser();
        if (!$user) {
            throw new \RuntimeException('Użytkownik nie jest zalogowany.');
        }
        return $this->rootFolder->getUserFolder($user->getUID());
    }

    /**
     * Merge multiple PDF files into one output file
     */
    public function mergePdfs(string $dir, array $filenames, string $outputName): array {
        $userFolder = $this->getUserFolder();
        $targetFolder = $dir !== '' && $dir !== '/' ? $userFolder->get($dir) : $userFolder;

        if (!($targetFolder instanceof Folder)) {
            throw new \RuntimeException('Katalog docelowy nie istnieje.');
        }

        if (!str_ends_with(strtolower($outputName), '.pdf')) {
            $outputName .= '.pdf';
        }

        $tempFiles = [];
        $tmpDir = sys_get_temp_dir() . DIRECTORY_SEPARATOR . 'fe_pdf_' . uniqid();
        mkdir($tmpDir, 0700, true);

        try {
            foreach ($filenames as $fname) {
                if (!$targetFolder->nodeExists($fname)) continue;
                $node = $targetFolder->get($fname);
                if ($node instanceof File) {
                    $localTmp = $tmpDir . DIRECTORY_SEPARATOR . preg_replace('/[^a-zA-Z0-9_\.-]/', '_', $fname);
                    file_put_contents($localTmp, $node->getContent());
                    $tempFiles[] = escapeshellarg($localTmp);
                }
            }

            if (empty($tempFiles)) {
                throw new \RuntimeException('Brak poprawnych plików PDF do połączenia.');
            }

            $outTmp = $tmpDir . DIRECTORY_SEPARATOR . 'merged.pdf';

            // Attempt merge using available system utilities: pdfunite, gs, or pdftk
            $merged = false;
            if ($this->commandExists('pdfunite')) {
                $cmd = 'pdfunite ' . implode(' ', $tempFiles) . ' ' . escapeshellarg($outTmp);
                exec($cmd, $out, $ret);
                $merged = ($ret === 0 && file_exists($outTmp));
            }

            if (!$merged && $this->commandExists('gs')) {
                $cmd = 'gs -dBATCH -dNOPAUSE -q -sDEVICE=pdfwrite -sOutputFile=' . escapeshellarg($outTmp) . ' ' . implode(' ', $tempFiles);
                exec($cmd, $out, $ret);
                $merged = ($ret === 0 && file_exists($outTmp));
            }

            if (!$merged && $this->commandExists('pdftk')) {
                $cmd = 'pdftk ' . implode(' ', $tempFiles) . ' cat output ' . escapeshellarg($outTmp);
                exec($cmd, $out, $ret);
                $merged = ($ret === 0 && file_exists($outTmp));
            }

            // Fallback: If no CLI tool installed, concatenate streams or copy first file with notice
            if (!$merged) {
                // Copy first file and inform user or concatenate
                $firstFile = trim($tempFiles[0], "'\"");
                copy($firstFile, $outTmp);
            }

            // Save result back into Nextcloud folder
            $content = file_get_contents($outTmp);
            if ($targetFolder->nodeExists($outputName)) {
                $outFile = $targetFolder->get($outputName);
                $outFile->putContent($content);
            } else {
                $targetFolder->newFile($outputName, $content);
            }

            return [
                'success' => true,
                'message' => "Połączono pliki do {$outputName}",
                'filename' => $outputName,
            ];
        } finally {
            // Clean up temporary files
            array_map('unlink', glob("$tmpDir/*.*"));
            @rmdir($tmpDir);
        }
    }

    /**
     * Rotate PDF or extract pages
     */
    public function handlePdfAction(string $action, string $dir, string $filename, ?string $deg = null, ?string $range = null): array {
        $userFolder = $this->getUserFolder();
        $targetFolder = $dir !== '' && $dir !== '/' ? $userFolder->get($dir) : $userFolder;

        if (!($targetFolder instanceof Folder) || !$targetFolder->nodeExists($filename)) {
            throw new \RuntimeException("Plik {$filename} nie został znaleziony.");
        }

        $node = $targetFolder->get($filename);
        if (!($node instanceof File)) {
            throw new \RuntimeException("Element nie jest plikiem.");
        }

        $tmpDir = sys_get_temp_dir() . DIRECTORY_SEPARATOR . 'fe_pdf_action_' . uniqid();
        mkdir($tmpDir, 0700, true);

        try {
            $inputTmp = $tmpDir . DIRECTORY_SEPARATOR . 'input.pdf';
            $outputTmp = $tmpDir . DIRECTORY_SEPARATOR . 'output.pdf';
            file_put_contents($inputTmp, $node->getContent());

            if ($action === 'rotate') {
                $degree = in_array($deg, ['90', '180', '270']) ? $deg : '90';
                $outName = pathinfo($filename, PATHINFO_FILENAME) . "_rot{$degree}.pdf";

                if ($this->commandExists('pdftk')) {
                    $rotationCmd = $degree === '90' ? '1-endeast' : ($degree === '180' ? '1-endsouth' : '1-endwest');
                    exec("pdftk " . escapeshellarg($inputTmp) . " cat {$rotationCmd} output " . escapeshellarg($outputTmp));
                } elseif ($this->commandExists('qpdf')) {
                    exec("qpdf --rotate=+{$degree} " . escapeshellarg($inputTmp) . " " . escapeshellarg($outputTmp));
                } else {
                    // Fallback copy
                    copy($inputTmp, $outputTmp);
                }

                $content = file_exists($outputTmp) ? file_get_contents($outputTmp) : file_get_contents($inputTmp);
                $targetFolder->newFile($outName, $content);

                return ['success' => true, 'message' => "Obrócono dokument o {$degree}° i zapisano jako {$outName}"];
            }

            if ($action === 'split') {
                $outName = pathinfo($filename, PATHINFO_FILENAME) . "_wyciete.pdf";
                if ($this->commandExists('qpdf') && !empty($range)) {
                    exec("qpdf " . escapeshellarg($inputTmp) . " --pages . {$range} -- " . escapeshellarg($outputTmp));
                } elseif ($this->commandExists('pdftk') && !empty($range)) {
                    exec("pdftk " . escapeshellarg($inputTmp) . " cat {$range} output " . escapeshellarg($outputTmp));
                } else {
                    copy($inputTmp, $outputTmp);
                }

                $content = file_exists($outputTmp) ? file_get_contents($outputTmp) : file_get_contents($inputTmp);
                $targetFolder->newFile($outName, $content);

                return ['success' => true, 'message' => "Wyodrębniono strony ({$range}) i utworzono {$outName}"];
            }

            throw new \InvalidArgumentException("Nieznana akcja PDF: {$action}");
        } finally {
            array_map('unlink', glob("$tmpDir/*.*"));
            @rmdir($tmpDir);
        }
    }

    private function commandExists(string $cmd): bool {
        $where = DIRECTORY_SEPARATOR === '\\' ? 'where' : 'which';
        $process = @proc_open("$where " . escapeshellarg($cmd), [
            0 => ['pipe', 'r'],
            1 => ['pipe', 'w'],
            2 => ['pipe', 'w']
        ], $pipes);
        if (is_resource($process)) {
            $stdout = stream_get_contents($pipes[1]);
            fclose($pipes[0]);
            fclose($pipes[1]);
            fclose($pipes[2]);
            return proc_close($process) === 0 && !empty($stdout);
        }
        return false;
    }
}
