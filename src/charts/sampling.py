"""Échantillonnage pour figures Plotly légères (dashboard JSON)."""

from __future__ import annotations

import numpy as np
import pandas as pd

PLOTLY_SAMPLE_HIST = 8_000
PLOTLY_SAMPLE_SCATTER = 2_000
PLOTLY_SAMPLE_CLUSTER = 800
PLOTLY_SAMPLE_DENDRO = 300
PLOTLY_SAMPLE_ROC_POINTS = 200
PLOTLY_JSON_WARN_BYTES = 500_000

DEFAULT_RANDOM_STATE = 42


def sample_series(series: pd.Series, n: int, random_state: int = DEFAULT_RANDOM_STATE) -> pd.Series:
    if len(series) <= n:
        return series
    return series.sample(n=n, random_state=random_state)


def sample_df(df: pd.DataFrame, n: int, random_state: int = DEFAULT_RANDOM_STATE) -> pd.DataFrame:
    if len(df) <= n:
        return df
    return df.sample(n=n, random_state=random_state)


def subsample_curve(
    x, y, max_points: int = PLOTLY_SAMPLE_ROC_POINTS
) -> tuple[np.ndarray, np.ndarray]:
    x_arr = np.asarray(x)
    y_arr = np.asarray(y)
    if len(x_arr) <= max_points:
        return x_arr, y_arr
    idx = np.linspace(0, len(x_arr) - 1, max_points, dtype=int)
    return x_arr[idx], y_arr[idx]
