<?php
declare(strict_types=1);

/**
 * SPDX-FileCopyrightText: 2026 Sairento / Nextcloud Files Enhancer
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

namespace OCA\FilesEnhancer\Controller;

use OCA\FilesEnhancer\Service\PdfService;
use OCP\AppFramework\Controller;
use OCP\AppFramework\Http\DataResponse;
use OCP\AppFramework\Http\JSONResponse;
use OCP\IRequest;

class PdfController extends Controller {
    private PdfService $pdfService;

    public function __construct(string $appName, IRequest $request, PdfService $pdfService) {
        parent::__construct($appName, $request);
        $this->pdfService = $pdfService;
    }

    /**
     * Merge multiple PDFs
     */
    public function merge(): JSONResponse {
        $data = json_decode($this->request->getRawContent(), true) ?? [];
        $dir = $data['dir'] ?? '';
        $files = $data['files'] ?? [];
        $outputName = $data['outputName'] ?? 'Polaczone.pdf';

        try {
            $res = $this->pdfService->mergePdfs($dir, $files, $outputName);
            return new JSONResponse($res);
        } catch (\Throwable $e) {
            return new JSONResponse(['error' => true, 'message' => $e->getMessage()], 400);
        }
    }

    /**
     * Rotate or split PDF
     */
    public function action(): JSONResponse {
        $data = json_decode($this->request->getRawContent(), true) ?? [];
        $action = $data['action'] ?? '';
        $dir = $data['dir'] ?? '';
        $filename = $data['filename'] ?? '';
        $deg = $data['deg'] ?? null;
        $range = $data['range'] ?? null;

        try {
            $res = $this->pdfService->handlePdfAction($action, $dir, $filename, $deg, $range);
            return new JSONResponse($res);
        } catch (\Throwable $e) {
            return new JSONResponse(['error' => true, 'message' => $e->getMessage()], 400);
        }
    }
}
