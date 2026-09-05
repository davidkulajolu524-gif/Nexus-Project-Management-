import re


PASSWORD_MIN_LENGTH = 12


def password_strength_errors(password: str) -> list[str]:
    errors = []

    if len(password) < PASSWORD_MIN_LENGTH:
        errors.append(f"Use at least {PASSWORD_MIN_LENGTH} characters.")
    if not re.search(r"[a-z]", password):
        errors.append("Add a lowercase letter.")
    if not re.search(r"[A-Z]", password):
        errors.append("Add an uppercase letter.")
    if not re.search(r"\d", password):
        errors.append("Add a number.")
    if not re.search(r"[^A-Za-z0-9]", password):
        errors.append("Add a symbol.")

    return errors


def validate_password_strength(password: str) -> str:
    errors = password_strength_errors(password)
    if errors:
        raise ValueError("Password is too weak. " + " ".join(errors))
    return password
