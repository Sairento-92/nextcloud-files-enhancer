<?php
declare(strict_types=1);

/**
 * SPDX-FileCopyrightText: 2026 Sairento / Nextcloud Files Enhancer
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

namespace OCA\FilesEnhancer\AppInfo;

use OCA\FilesEnhancer\Command\CleanupOrphansCommand;
use OCA\FilesEnhancer\Command\CleanupTrashCommand;
use OCA\FilesEnhancer\Command\DeepScanCommand;
use OCA\FilesEnhancer\Command\DuplicatesCommand;
use OCA\FilesEnhancer\Command\StatsCommand;
use OCA\FilesEnhancer\Settings\Admin;
use OCP\AppFramework\App;
use OCP\AppFramework\Bootstrap\IBootContext;
use OCP\AppFramework\Bootstrap\IBootstrap;
use OCP\AppFramework\Bootstrap\IRegistrationContext;
use OCP\Util;

class Application extends App implements IBootstrap {
    public const APP_ID = 'files_enhancer';

    public function __construct() {
        parent::__construct(self::APP_ID);
    }

    public function register(IRegistrationContext $context): void {
        // Register Admin Settings in Web Panel
        $context->registerAdminSettings(Admin::class);

        // Register OCC Console Commands
        $context->registerCommand(StatsCommand::class);
        $context->registerCommand(DuplicatesCommand::class);
        $context->registerCommand(DeepScanCommand::class);
        $context->registerCommand(CleanupTrashCommand::class);
        $context->registerCommand(CleanupOrphansCommand::class);
    }

    public function boot(IBootContext $context): void {
        Util::addScript(self::APP_ID, 'files_enhancer');
        Util::addStyle(self::APP_ID, 'files_enhancer');
    }
}
