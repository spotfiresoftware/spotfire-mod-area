/*
 * Copyright © 2026. Cloud Software Group, Inc.
 * This file is subject to the license terms contained
 * in the license file that is distributed with this file.
 */

/* This object is used to populate the default configuration on mod creation into the mod properties. */
export const vizConfigurationDefault = {
    "appearance": {
        "strokeDashArray": " ",
        "strokeWidth": 2,
        "fillTransparency": 50,
        "lineWithEmptyValues": 'continue',
        "smoothCurves": false,
    },
    "data": {
        "rowLimit": 1000000,
        "showWarningIcon": true,
        "showWarningIconMode": "editing",
    },
    "xAxis": {
        "showScaleX": true,
        "scaleInvert": false,
        "scaleMin": null,
        "scaleMax": null,
    },
    "yAxis": {
        "showScaleY": true,
        "scaleInvert": false,
        "scaleMin": null,
        "scaleMax": null,
    },
    "trellis": {
        "trellisDirection": "rows",
        "maxTrellisCount": 20,
    },
    "gridlines": {
        "showGridX": true,
        "showGridY": true,
    },
    "zoom": {
        "showZoomX": false,
        "showZoomY": false,
    },
}
