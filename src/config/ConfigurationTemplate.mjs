/*
 * Copyright © 2026. Cloud Software Group, Inc.
 * This file is subject to the license terms contained
 * in the license file that is distributed with this file.
 */

export const vizConfigurationTemplate = {
    "appearance": {
        "_label_data": "cfgGroupAppearance",
        "strokeDashArray": {
            "label": "cfgAppearanceLineDashArray",
            "datatype": "string",
            "classes": "configuration-stroke-line-pattern",
            "enumeration": [
                {"classes": "line-pattern", "graphic": '<svg xmlns="http://www.w3.org/2000/svg" stroke-width="1" stroke-dasharray=" " stroke="currentColor"><line x1="0" x2="100%" y1="50%" y2="50%"></line></svg>', "value": " "},
                {"classes": "line-pattern", "graphic": '<svg xmlns="http://www.w3.org/2000/svg" stroke-width="1" stroke-dasharray="2,2,2,2,2,2" stroke="currentColor"><line x1="0" x2="100%" y1="50%" y2="50%"></line></svg>', "value": "2,2,2,2,2,2"},
                {"classes": "line-pattern", "graphic": '<svg xmlns="http://www.w3.org/2000/svg" stroke-width="1" stroke-dasharray="5,5" stroke="currentColor"><line x1="0" x2="100%" y1="50%" y2="50%"></line></svg>', "value": "5,5"},
                {"classes": "line-pattern", "graphic": '<svg xmlns="http://www.w3.org/2000/svg" stroke-width="1" stroke-dasharray="8,2" stroke="currentColor"><line x1="0" x2="100%" y1="50%" y2="50%"></line></svg>', "value": "8,2"},
                {"classes": "line-pattern", "graphic": '<svg xmlns="http://www.w3.org/2000/svg" stroke-width="1" stroke-dasharray="1,5" stroke="currentColor"><line x1="0" x2="100%" y1="50%" y2="50%"></line></svg>', "value": "1,5"},
                {"classes": "line-pattern", "graphic": '<svg xmlns="http://www.w3.org/2000/svg" stroke-width="1" stroke-dasharray="2,8" stroke="currentColor"><line x1="0" x2="100%" y1="50%" y2="50%"></line></svg>', "value": "2,8"},
                {"classes": "line-pattern", "graphic": '<svg xmlns="http://www.w3.org/2000/svg" stroke-width="1" stroke-dasharray="5,2,1,2" stroke="currentColor"><line x1="0" x2="100%" y1="50%" y2="50%"></line></svg>', "value": "5,2,1,2"},
                {"classes": "line-pattern", "graphic": '<svg xmlns="http://www.w3.org/2000/svg" stroke-width="1" stroke-dasharray="10,2,2,2" stroke="currentColor"><line x1="0" x2="100%" y1="50%" y2="50%"></line></svg>', "value": "10,2,2,2"},
                {"classes": "line-pattern", "graphic": '<svg xmlns="http://www.w3.org/2000/svg" stroke-width="1" stroke-dasharray="5,3,2,3" stroke="currentColor"><line x1="0" x2="100%" y1="50%" y2="50%"></line></svg>', "value": "5,3,2,3"},
                {"classes": "line-pattern", "graphic": '<svg xmlns="http://www.w3.org/2000/svg" stroke-width="1" stroke-dasharray="7,1,1,1" stroke="currentColor"><line x1="0" x2="100%" y1="50%" y2="50%"></line></svg>', "value": "7,1,1,1"},
            ],
        },
        "strokeWidth": {
            "label": "cfgAppearanceLineWidth",
            "datatype": "double",
            "rangeSlider": true,
            "minVal": 0,
            "maxVal": 10,
            "step": 0.5,
            "valueLabelSuffix": 'px',
        },
        "fillTransparency": {
            "label": "cfgAppearanceFillTransparency",
            "datatype": "int",
            "rangeSlider": true,
            "minVal": 0,
            "maxVal": 100,
            "valueLabelSuffix": '%',
        },
    },
    "data": {
        "_label": "cfgGroupData",
        "rowLimit": {
            "label": "cfgDataRowLimit",
            "datatype": "int",
            "hidden": true,
            "minVal": 0
        },
        "showWarningIcon": {
            "label": "cfgDataWarningEnabled",
            "datatype": "boolean"
        },
        "showWarningIconMode": {
            "datatype": "string",
            "radio": true,
            "enabled": "vizConfig.data.showWarningIcon == true",
            "indent": true,
            "enumeration": [
                {"label": "cfgDataWarningAlways", "value": "always"}, 
                {"label": "cfgDataWarningEditing", "value": "editing"},
            ]
        },
    },
    "xAxis": {
        "_label": "cfgGroupXAxis",
        "showScaleX": {
            "label": "cfgAxisShowScale",
            "datatype": "boolean"
        },
        "scaleInvert": {
            "label": "cfgAxisScaleInvert",
            "datatype": "boolean"
        },
        // This is commented out in case x scale becomes continuous in the future
        /*"scaleMin": {
            "label": "cfgAxisScaleMin",
            "datatype": "double",
            "placeholder": "cfgAxisScaleMinPlaceholder",
            "classes": "configuration-scale-min-max",
            "validation": {
                "cfgAxisScaleMinValidation": "vizConfig.xAxis.scaleMax == null || targetVal == null || targetVal <= vizConfig.xAxis.scaleMax",
            },
        },
        "scaleMax": {
            "label": "cfgAxisScaleMax",
            "datatype": "double",
            "placeholder": "cfgAxisScaleMaxPlaceholder",
            "classes": "configuration-scale-min-max",
            "validation": {
                "cfgAxisScaleMaxValidation": "vizConfig.xAxis.scaleMin == null || targetVal == null || targetVal >= vizConfig.xAxis.scaleMin",
            },
        },*/ 
    },
    "yAxis": {
        "_label": "cfgGroupYAxis",
        "showScaleY": {
            "label": "cfgAxisShowScale",
            "datatype": "boolean"
        },
        "scaleInvert": {
            "label": "cfgAxisScaleInvert",
            "datatype": "boolean"
        },
        "scaleMin": {
            "label": "cfgAxisScaleMin",
            "datatype": "double",
            "placeholder": "cfgAxisScaleMinPlaceholder",
            "classes": "configuration-scale-min-max",
            "validation": {
                "cfgAxisScaleMinValidation": "vizConfig.yAxis.scaleMax == null || targetVal == null || targetVal <= vizConfig.yAxis.scaleMax",
            },
        },
        "scaleMax": {
            "label": "cfgAxisScaleMax",
            "datatype": "double",
            "placeholder": "cfgAxisScaleMaxPlaceholder",
            "classes": "configuration-scale-min-max",
            "validation": {
                "cfgAxisScaleMaxValidation": "vizConfig.yAxis.scaleMin == null || targetVal == null || targetVal >= vizConfig.yAxis.scaleMin",
            },
        },
    },
    "trellis": {
        "_label": {
            "text": "cfgGroupTrellis",
            "enabled": "axisHasExpression(AxisNames.AXIS_TRELLIS_BY) == true",
            "tooltip": {
                "cfgGroupTrellisTooltipDisabled": "!(axisHasExpression(AxisNames.AXIS_TRELLIS_BY) == true)",
            }
        },
        "trellisDirection": {
            "datatype": "string",
            "enabled": "axisHasExpression(AxisNames.AXIS_TRELLIS_BY) == true",
            "enumeration": [
                {"label": "cfgTrellisRow", "value": "rows"}, 
                {"label": "cfgTrellisColumn", "value": "columns"},
                {"label": "cfgTrellisPage", "value": "pages"},
                {"label": "cfgTrellisPanel", "value": "panels"},
            ],
            "tooltip": {
                "cfgGroupTrellisTooltipDisabled": "!(axisHasExpression(AxisNames.AXIS_TRELLIS_BY) == true)",
            }
        },
        "maxTrellisCount": {
            "label": "cfgTrellisMaxCount",
            "datatype": "int",
            "hidden": true,
            "rangeSlider": true,
            "minVal": 1,
            "maxVal": 20,
            "step": 1,
            "valueLabelSuffix": ' panels'
        }
    },
    "gridlines": {
        "_label_gridlines": "cfgGroupGridlines",
        "showGridX": {
            "label": "cfgGridlinesX",
            "datatype": "boolean",
        },
        "showGridY": {
            "label": "cfgGridlinesY",
            "datatype": "boolean",
        }
    },
    "zoom": {
        "_label": "cfgGroupZoom",
        "showZoomX": {
            "label": "cfgZoomX",
            "datatype": "boolean"
        },
        "showZoomY": {
            "label": "cfgZoomY",
            "datatype": "boolean",
        },
    },
}
