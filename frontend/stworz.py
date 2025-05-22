import os
import pathlib
import sys

# --- Konfiguracja Wykluczeń ---
# Edytuj te listy, aby dostosować, co ma być ignorowane podczas generowania drzewa.

# Foldery, które mają być całkowicie zignorowane (nie będą listowane)
EXCLUDE_DIRS = [
    "node_modules",
    ".git",
    "__pycache__",
    "venv",
    "env",
    ".vscode",
    ".idea",
    "build",
    "dist",
    "coverage",
    # Możesz dodać inne foldery, np. "logs", "temp"
]

# Dokładne nazwy plików, które mają być zignorowane
EXCLUDE_FILES_EXACT = [
    # Nazwa pliku wyjściowego i samego skryptu zostaną dodane dynamicznie
]

# Wzorce nazw plików do zignorowania (np. pliki kończące się na .log)
# Używa metody .endswith()
EXCLUDE_FILE_PATTERNS_ENDS_WITH = [
    ".log",
    ".DS_Store",       # Plik systemowy macOS
    "Thumbs.db",       # Plik systemowy Windows
    ".swp",            # Pliki tymczasowe Vim
    ".tmp",
    ".pyc",            # Skompilowane pliki Python
    ".pyo",
]
# --- Koniec Konfiguracji Wykluczeń ---

def should_ignore(item_name, item_path, is_dir, script_filename_to_ignore, output_filename_to_ignore):
    """Sprawdza, czy dany element (plik lub folder) powinien zostać zignorowany."""
    if is_dir:
        if item_name in EXCLUDE_DIRS:
            return True
    else:  # Jest plikiem
        if item_name == script_filename_to_ignore or item_name == output_filename_to_ignore:
            return True
        if item_name in EXCLUDE_FILES_EXACT:
            return True
        for pattern in EXCLUDE_FILE_PATTERNS_ENDS_WITH:
            if item_name.endswith(pattern):
                return True
    return False

def generate_tree_lines_recursive(current_dir_path, prefix_parts, script_filename, output_filename):
    """
    Rekurencyjnie generuje linie reprezentujące strukturę folderu.
    Args:
        current_dir_path (pathlib.Path): Aktualnie skanowany folder.
        prefix_parts (list): Lista stringów ("│   " lub "    ") do tworzenia wcięcia.
        script_filename (str): Nazwa pliku skryptu (do ignorowania).
        output_filename (str): Nazwa pliku wyjściowego (do ignorowania).
    Returns:
        list: Lista stringów, gdzie każdy string to linia w drzewie struktury.
    """
    lines = []
    try:
        # Pobierz wszystkie elementy, posortuj
        all_item_names = sorted(os.listdir(current_dir_path))
    except PermissionError:
        lines.append("".join(prefix_parts) + "├── [Błąd: Odmowa dostępu]/")
        return lines
    except FileNotFoundError: # Powinno być rzadkie, bo current_dir_path jest sprawdzane
        lines.append("".join(prefix_parts) + "├── [Błąd: Nie znaleziono ścieżki]/")
        return lines

    # Przefiltruj ignorowane elementy i przygotuj listę do wyświetlenia
    display_items = []
    for name in all_item_names:
        item_path = current_dir_path / name
        is_dir = item_path.is_dir() # is_dir() działa poprawnie dla dowiązań symbolicznych do folderów
        if not should_ignore(name, item_path, is_dir, script_filename, output_filename):
            display_items.append({"name": name, "is_dir": is_dir, "path": item_path})

    num_display_items = len(display_items)
    for i, item_info in enumerate(display_items):
        name = item_info["name"]
        is_dir = item_info["is_dir"]
        item_path = item_info["path"]

        is_last_item_in_level = (i == num_display_items - 1)
        connector = "└── " if is_last_item_in_level else "├── "

        line_entry = "".join(prefix_parts) + connector + name
        if is_dir:
            line_entry += "/"
        lines.append(line_entry)

        if is_dir:
            new_prefix_parts = prefix_parts[:]  # Utwórz kopię listy prefixów
            new_prefix_parts.append("    " if is_last_item_in_level else "│   ")
            lines.extend(generate_tree_lines_recursive(item_path, new_prefix_parts, script_filename, output_filename))
    return lines

def main():
    try:
        # Ustal ścieżkę do uruchomionego skryptu
        script_full_path = pathlib.Path(__file__).resolve()
    except NameError:
        # Fallback, jeśli __file__ nie jest zdefiniowane (np. w niektórych IDE lub exec)
        script_full_path = pathlib.Path(sys.argv[0]).resolve()

    script_filename = script_full_path.name
    # Folder źródłowy to folder, w którym znajduje się skrypt
    source_directory_path = script_full_path.parent
    source_directory_name = source_directory_path.name

    output_filename = "struktura_projektu.txt"
    output_file_path = source_directory_path / output_filename

    # Dodaj dynamicznie sam skrypt i plik wyjściowy do listy ignorowanych,
    # aby nie pojawiły się w generowanym drzewie.
    if script_filename not in EXCLUDE_FILES_EXACT:
        EXCLUDE_FILES_EXACT.append(script_filename)
    if output_filename not in EXCLUDE_FILES_EXACT:
        EXCLUDE_FILES_EXACT.append(output_filename)

    all_output_lines = []
    # Pierwsza linia to nazwa głównego folderu (tego, w którym jest skrypt)
    all_output_lines.append(f"{source_directory_name}/")

    # Generuj linie dla zawartości folderu źródłowego
    tree_content_lines = generate_tree_lines_recursive(
        current_dir_path=source_directory_path,
        prefix_parts=[], # Początkowy prefix jest pusty
        script_filename=script_filename,
        output_filename=output_filename
    )
    all_output_lines.extend(tree_content_lines)

    try:
        with open(output_file_path, "w", encoding="utf-8") as f:
            for line in all_output_lines:
                f.write(line + "\n")
        print(f"Struktura folderu '{source_directory_name}' została zapisana do pliku: {output_file_path}")
    except IOError as e:
        print(f"Błąd podczas zapisywania pliku '{output_file_path}': {e}")

if __name__ == "__main__":
    main()