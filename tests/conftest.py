"""Shared fixtures: import path for the build script and the committed CSVs."""

import sys
from pathlib import Path

import pandas as pd
import pytest

REPO_ROOT = Path(__file__).resolve().parents[1]

# The dataset builder lives in scripts/ as a plain script, not a package.
sys.path.insert(0, str(REPO_ROOT / "scripts"))

import build_dataset


@pytest.fixture(scope="session")
def bd():
    return build_dataset


@pytest.fixture(scope="session")
def full_df() -> pd.DataFrame:
    return pd.read_csv(REPO_ROOT / "data" / "full.csv")


@pytest.fixture(scope="session")
def notes_df() -> pd.DataFrame:
    return pd.read_csv(REPO_ROOT / "data" / "notes_input.csv")


@pytest.fixture(scope="session")
def answers_df() -> pd.DataFrame:
    return pd.read_csv(REPO_ROOT / "data" / "answers.csv")
