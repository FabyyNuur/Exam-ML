"""Package src — imports paresseux pour éviter IPython hors notebooks."""

_LAZY_IMPORTS = {
    "init_notebook_theme": (".display", "init_notebook_theme"),
    "show_architecture_card": (".display", "show_architecture_card"),
    "show_badge": (".display", "show_badge"),
    "show_findings_list": (".display", "show_findings_list"),
    "show_hero": (".display", "show_hero"),
    "show_info": (".display", "show_info"),
    "show_insight": (".display", "show_insight"),
    "show_metrics_row": (".display", "show_metrics_row"),
    "show_section": (".display", "show_section"),
    "show_success": (".display", "show_success"),
    "show_table_html": (".display", "show_table_html"),
    "show_warning": (".display", "show_warning"),
    "COLORS": (".utils", "COLORS"),
    "apply_plotly_theme": (".utils", "apply_plotly_theme"),
    "evaluate_classifier": (".utils", "evaluate_classifier"),
    "plot_class_distribution": (".utils", "plot_class_distribution"),
    "plot_confusion_matrix": (".utils", "plot_confusion_matrix"),
    "plot_roc_curve": (".utils", "plot_roc_curve"),
    "plot_silhouette": (".utils", "plot_silhouette"),
    "save_figure": (".utils", "save_figure"),
    "show_figure": (".utils", "show_figure"),
}

__all__ = list(_LAZY_IMPORTS.keys())


def __getattr__(name: str):
    if name not in _LAZY_IMPORTS:
        raise AttributeError(f"module {__name__!r} has no attribute {name!r}")
    module_name, attr = _LAZY_IMPORTS[name]
    import importlib

    module = importlib.import_module(module_name, __package__)
    return getattr(module, attr)
