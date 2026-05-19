#!/usr/bin/env python3
import ast
import json
import subprocess
from pathlib import Path


def run(cmd: list[str]) -> str:
    return subprocess.check_output(cmd, text=True).strip()


def changed_files() -> list[str]:
    try:
        base = run(["git", "merge-base", "HEAD", "origin/main"])
    except Exception:
        base = "HEAD~1"
    diff = run(["git", "diff", "--name-only", f"{base}..HEAD"])
    return [f for f in diff.splitlines() if f]


def py_complexity(file_path: Path) -> int:
    tree = ast.parse(file_path.read_text())
    return sum(isinstance(node, (ast.If, ast.For, ast.While, ast.Try, ast.With, ast.Match, ast.BoolOp)) for node in ast.walk(tree))


def build_report() -> str:
    files = changed_files()
    py_files = [Path(f) for f in files if f.endswith('.py') and Path(f).exists()]

    lines = ["# Automated Review Report", "", "## Changed Files"]
    if files:
        lines.extend([f"- `{f}`" for f in files])
    else:
        lines.append("- No changed files detected.")

    lines.extend(["", "## Potential Logic Risks"])
    if not py_files:
        lines.append("- No Python files changed; no AST checks run.")
    else:
        for f in py_files:
            try:
                score = py_complexity(f)
                if score > 50:
                    lines.append(f"- `{f}`: High branch/flow complexity ({score}) may increase logic error risk.")
                elif score > 25:
                    lines.append(f"- `{f}`: Moderate complexity ({score}); consider targeted unit tests.")
                else:
                    lines.append(f"- `{f}`: Complexity appears manageable ({score}).")
            except Exception as ex:
                lines.append(f"- `{f}`: Unable to analyze ({ex}).")

    lines.extend(["", "## Potential Performance Bottlenecks"])
    if py_files:
        lines.append("- Review loops and nested iterations in changed Python modules; optimize if dataset size is large.")
    else:
        lines.append("- No executable Python diff to analyze for performance concerns.")

    lines.extend(["", "## Security Scan + Tests Summary"])
    for artifact in ["bandit-report.json", "pytest-output.txt"]:
        p = Path(artifact)
        if p.exists():
            lines.append(f"- Attached artifact: `{artifact}`")

    return "\n".join(lines) + "\n"


if __name__ == "__main__":
    Path("review-report.md").write_text(build_report())
    print("Wrote review-report.md")
