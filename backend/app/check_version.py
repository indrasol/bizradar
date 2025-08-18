import pkg_resources

req_file = '../requirements.txt'

with open(req_file) as f:
    for line in f:
        line = line.strip()
        if not line or line.startswith('#'):
            continue
        # Remove inline comments
        if '#' in line:
            line = line.split('#')[0].strip()
        if not line:
            continue
        # Extract package name (handles extras and version specifiers)
        pkg_name = line.split('[')[0].split('==')[0].split('>=')[0].split('<=')[0].strip()
        if not pkg_name:
            continue
        try:
            version = pkg_resources.get_distribution(pkg_name).version
            print(f"{pkg_name}: {version}")
        except Exception as e:
            print(f"{pkg_name}: Not installed or error ({e})")