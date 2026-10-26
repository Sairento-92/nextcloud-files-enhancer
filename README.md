# Nextcloud Files Enhancer (by Sairento)

Zaawansowane, wielofunkcyjne rozszerzenie (plugin) dla chmury **Nextcloud Files** (`/apps/files`), wzbogacające menedżer plików o najbardziej wyczekiwane funkcje społeczności, narzędzia masowe, podglądy i potężny zestaw poleceń konsolowych OCC.

![Files Enhancer Badge](https://img.shields.io/badge/Nextcloud-Files_Enhancer-0082c9?style=for-the-badge&logo=nextcloud&logoColor=white)
![Version](https://img.shields.io/badge/Version-1.2.0-success?style=for-the-badge)
![License](https://img.shields.io/badge/License-AGPL--3.0-blue?style=for-the-badge)

---

## 🌟 Najważniejsze Możliwości i Funkcje

### 1. ⚡ QuickLook (Błyskawiczny Podgląd Spacją)
- **Naciśnięcie Spacji (Spacebar)** na zaznaczonym pliku natychmiast otwiera pełny, płynny podgląd pliku bez otwierania ciężkich edytorów zewnętrznych (działa dokładnie tak jak w systemie macOS lub QuickLook na Windows).
- **Obsługa multimediów i dokumentów**:
  - **Zdjęcia i grafika**: JPG, PNG, GIF, WebP, SVG, AVIF, BMP.
  - **Wideo i audio**: MP4, WebM, MP3, WAV, FLAC, OGG, M4A z natywnym odtwarzaczem.
  - **Dokumenty PDF**: bezpośredni podgląd wbudowaną przeglądarką.
  - **Kod i tekst ze składnią**: `.json`, `.yaml`, `.xml`, `.sql`, `.py`, `.js`, `.ts`, `.php`, `.sh`, `.css`, `.html`, `.md`, `.env`, `.log` itp.
- **Płynna nawigacja klawiaturą**: naciśnięcie strzałek `←` / `→` lub `↑` / `↓` podczas aktywnego podglądu natychmiast przełącza na poprzedni lub kolejny plik w katalogu!

### 2. 🛡️ Delete Key Guard (Ochrona przed przypadkowym usunięciem katalogu - Issue #62278)
- Blokuje wywołanie skasowania całego katalogu nadrzędnego po omyłkowym naciśnięciu klawisza `Delete` lub `Backspace` w oknie plików, jeśli użytkownik nie zaznaczył konkretnych elementów.

### 3. ⚡ Szybkie Przyciski Akcji w Wierszu (Issue #59665)
- Po najechaniu kursorem na dowolny plik w wierszu pojawiają się bezpośrednie ikony:
  - ⬇️ **Szybkie pobranie**: natychmiastowe pobranie pliku jednym kliknięciem.
  - 🗑️ **Szybkie usunięcie**: bezpieczne przeniesienie do kosza z potwierdzeniem, bez konieczności rozwijania menu trzech kropek `...`.

### 4. 👁️ Przełącznik Plików Ukrytych (.dotfiles - Issue #39027)
- Dedykowany przycisk na pasku narzędzi: **„👁️ Pliki ukryte (Ukryte / Widoczne)”**.
- Pozwala błyskawicznie ukryć systemowe i techniczne pliki: `.DS_Store`, `Thumbs.db`, `.git`, `.env`, `.htaccess` itp., oczyszczając widok katalogu. Wybór jest trwale zapamiętywany.

### 5. 🔄 Zapamiętywane Sortowanie per Katalog (Issue #65101)
- Trwałe, niezależne zapamiętywanie wybranego sortowania dla każdego folderu (np. folder ze zdjęciami posortowany wg daty malejąco, a dokumenty alfabetycznie).

### 6. 🕒 Dokładne Znaczniki Czasu (Issue #22278 & #54784)
- Podgląd pełnej, precyzyjnej daty i godziny (np. `26.10.2026, 22:52:10`) w czytelnym dymku oraz możliwość kliknięcia na kolumnę daty w celu przełączenia z czasu względnego („2 dni temu”) na dokładny.

### 7. 📌 Przypinanie Folderów na Samej Górze (Sticky Folders - PR #61825)
- Nowa akcja w menu folderu: **„📌 Przypnij / Odepnij z góry”**.
- Przypięte foldery są zawsze prezentowane na samej górze listy z odznaką 📌, niezależnie od bieżącego sortowania.

### 8. 🔗 Masowe Udostępnianie Wielu Plików (Issue #3902 & #26248)
- Przycisk na pasku zaznaczenia: **„Udostępnij zaznaczone”**.
- Tworzy linki publiczne dla wszystkich zaznaczonych plików i prezentuje je w czytelnym oknie z możliwością skopiowania wszystkich linków jednym kliknięciem.

### 9. 🖼️ Konwerter Obrazów na Serwerze (WebP / PNG / JPG)
- Opcja w menu pliku: **„🖼️ Konwertuj format”**.
- Błyskawiczna konwersja do WebP (oszczędność 30-50% miejsca bez straty jakości), PNG lub JPG bezpośrednio na serwerze.

### 10. ⚠️ Ochrona przed Kolizją Nazw (Conflict Guard - Issue #33719)
- Wczesne wykrywanie i ostrzeganie przed wgrywaniem plików o nazwach, które już istnieją w bieżącym katalogu.

### 11. 📦 Server-side Archive Manager (Rozpakowywanie i Pakowanie ZIP na serwerze)
- **Rozpakuj na serwerze**: Dodaje do menu kontekstowego plików archiwów (`.zip`, `.tar.gz`, `.tgz`) opcję bezpośredniego rozpakowania w chmurze bez marnowania transferu na pobieranie na komputer i ponowne wysyłanie.
- **Spakuj do ZIP**:
  - Działa dla pojedynczego pliku lub całego katalogu.
  - W menu masowego zaznaczenia (multi-select) dodaje przycisk **„Spakuj do ZIP”** tworzący natychmiast nowe archiwum ze wszystkich zaznaczonych elementów.

### 3. 🏷️ Kolorowe Etykiety i Tagi Wizualne (Color Tags)
- Oznaczaj pliki i foldery kolorowymi punktami (Czerwony, Pomarańczowy, Żółty, Zielony, Niebieski, Fioletowy) – analogicznie jak w Apple macOS Finder.
- Kolorowe etykiety wyświetlają się bezpośrednio obok nazw plików na liście.
- Ustawienia tagów zapisywane są trwale na poziomie konta użytkownika w chmurze.

### 4. 🔤 Hurtowa Zmiana Nazw (Batch Renamer)
- Zaznacz wiele plików i kliknij **„Zmień nazwy zbiorczo”** na pasku akcji masowych.
- Opcje:
  - **Prefiks**: dodanie tekstu na początku nazwy (np. `Raport_2026_`).
  - **Sufiks**: dodanie tekstu przed rozszerzeniem (np. `_zatwierdzony`).
  - **Znajdź i zamień**: automatyczna wymiana frazy we wszystkich nazwach.
  - **Numeracja sekwencyjna**: automatyczne numerowanie `1, 2, 3...`, `01, 02...` lub `001, 002...` (np. `Wakacje_001.jpg`, `Wakacje_002.jpg`).
  - **Podgląd na żywo**: prezentuje przed zatwierdzeniem jak będą wyglądać nowe nazwy.

### 5. 🔍 Kalkulator Sum Kontrolnych (MD5, SHA-1, SHA-256)
- Opcja w menu pliku: **„Pokaż sumy kontrolne (Hashe)”**.
- Szybkie obliczanie kryptograficznych sum kontrolnych po stronie serwera.
- Przyciski szybkiego kopiowania sumy do schowka jednym kliknięciem.
- **Wbudowana porównywarka sum**: wklej hash pobrany ze strony producenta oprogramowania, a aplikacja w ułamku sekundy sprawdzi zgodność i wyświetli zielony znacznik weryfikacji.

### 6. 📐 Rozmiar Folderów w Czasie Rzeczywistym
- Opcja w menu folderu: **„Oblicz rozmiar folderu”**.
- Rekurencyjnie sumuje rozmiar wszystkich zagnieżdżonych plików oraz podaje łączną liczbę plików i podkatalogów, bez czekania na harmonogram crona.

### 7. 📋 Szybkie Ścieżki i Linki WebDAV
- **Kopiuj ścieżkę wewnętrzną**: np. `/Dokumenty/Projekty/specyfikacja.pdf`.
- **Kopiuj bezpośredni URL WebDAV**: gotowy link do zmapowania folderu lub pliku w Eksploratorze Windows, WinSCP, rclone lub skryptach backupu.

---

## 🛠️ Narzędzia Konsolowe OCC (`php occ files:enhancer:...`)

Aplikacja dostarcza administratorom kompletne narzędzia do analizy i utrzymania porządku w pamięci masowej chmury:

### 1. Wyszukiwanie duplikatów plików
```bash
php occ files:enhancer:duplicates --min-size-mb=10 --limit=30
```
Analizuje pliki w magazynach Nextcloud, grupuje identyczne pliki i raportuje ile megabajtów/gigabajtów przestrzeni dyskowej można odzyskać.

### 2. Głęboka analiza spójności pamięci podręcznej (Deep Scan)
```bash
php occ files:enhancer:scan-deep
```
Wykrywa i raportuje osierocone rekordy w tabeli `oc_filecache` oraz brakujące typy MIME.

### 3. Analityka i statystyki magazynu
```bash
php occ files:enhancer:stats
```
Generuje czytelną tabelę podsumowującą zajętość chmury z podziałem na najważniejsze typy MIME (filmy, zdjęcia, dokumenty, archiwa).

### 4. Inteligentne czyszczenie kosza i starych wersji
```bash
# Podgląd (dry-run):
php occ files:enhancer:cleanup-trash --days=30 --dry-run

# Wykonanie usunięcia:
php occ files:enhancer:cleanup-trash --days=30
```

---

## ⚙️ Panel Administracyjny w Chmurze Nextcloud

W interfejsie graficznym administratora (`Ustawienia administracyjne ➔ Pliki / Files Enhancer`):
- Włączanie/wyłączanie poszczególnych modułów (QuickLook, Archive Manager, Color Tags, Batch Rename, Checksums, Folder Sizes).
- Karty podsumowania zajętości magazynu w czasie rzeczywistym.
- Podręczna ściągawka z poleceń OCC.

---

## 📥 Instalacja w Chmurze Nextcloud

### Metoda 1: Wgranie paczki do katalogu `apps/` (Zalecana)
1. Pobierz spakowane archiwum `files_enhancer.tar.gz` lub `files_enhancer.zip` z najnowszego wydania [Releases na GitHubie](https://github.com/Sairento-92/nextcloud-files-enhancer/releases).
2. Rozpakuj zawartość do katalogu aplikacji Nextcloud na serwerze:
   ```bash
   cd /var/www/nextcloud/apps
   tar -xzf /sciezka/do/files_enhancer.tar.gz
   chown -R www-data:www-data files_enhancer
   ```
3. Aktywuj aplikację:
   ```bash
   sudo -u www-data php /var/www/nextcloud/occ app:enable files_enhancer
   ```
4. Gotowe! Moduły natychmiast pojawią się w interfejsie plików.

### Metoda 2: Aktywacja przez Panel Administratora Web
1. Po wgraniu katalogu `files_enhancer` do `apps/`, przejdź w przeglądarce do: `Ustawienia ➔ Aplikacje ➔ Twoje aplikacje`.
2. Odszukaj **Files Enhancer (by Sairento)** i kliknij **Włącz**.

---

## 💻 Budowanie ze Źródeł

Wymagany Node.js (wersja 18+).

```bash
# Zbudowanie bundla JS oraz paczek archiwów .tar.gz i .zip:
node build.js
```

Wynikowe paczki instalacyjne zostaną utworzone w katalogu głównym projektu (`files_enhancer.tar.gz` i `files_enhancer.zip`).

---

## 📄 Licencja

Projekt objęty licencją **GNU AGPLv3**.  
Autor: **Sairento / Huriko Cloud Team** (2026).
