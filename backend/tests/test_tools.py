from app.tools import calculator


def test_calculator_basic():
    assert calculator("2 + 2") == "4"


def test_calculator_rejects_unsafe_input():
    result = calculator("__import__('os').system('echo hi')")
    assert result.startswith("Invalid expression")
