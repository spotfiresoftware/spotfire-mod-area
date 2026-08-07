/*
 * Copyright © 2026. Cloud Software Group, Inc.
 * This file is subject to the license terms contained
 * in the license file that is distributed with this file.
 */

import AbstractSubscribeStrategy from "@spotfire-mod-common/common/visualization/strategies/AbstractSubscribeStrategy.mjs";
import BaseDataView from "@spotfire-mod-common/common/visualization/dataview/BaseDataView.mjs";
import LayerDataView from "@spotfire-mod-common/common/visualization/dataview/LayerDataView.mjs";

import AxisNames from "../../AxisNames.mjs";

export default class SubscribeStrategy extends AbstractSubscribeStrategy {
    // Create data and axis readers
    // MANDATORY OVERRIDE
    async subscribe(mod, onExecute) {
        // Create a read function for axis, data, and windowSize changes
        // Subscribe to the reader function
        const reader = mod.createReader(
            mod.visualization.axis(AxisNames.AXIS_COLOR),
            mod.visualization.axis(AxisNames.AXIS_TRELLIS_BY),
            mod.visualization.axis(AxisNames.AXIS_X),
            mod.visualization.axis(AxisNames.AXIS_Y),
            mod.visualization.data(),
            mod.windowSize(),
        );
        reader.subscribe(render);

        // Render function for axis, data, and windowSize changes
        async function render(colorByView, trellisByView, xView, yView,
            dataView, windowSizeView) {
            
            // Create an array of data views    
            const dataViews = [];

            // Create a BaseDataView with the axis views and data view
            const axisViews = [colorByView, trellisByView, xView, yView];
            const baseDataView = await BaseDataView.create(axisViews, dataView);
            dataViews.push(baseDataView);

            // Call the onExecute callback with the data views and windowSizeView
            await onExecute(dataViews, windowSizeView);
        }
    }
}