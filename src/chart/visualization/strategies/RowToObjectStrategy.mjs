/*
 * Copyright © 2026. Cloud Software Group, Inc.
 * This file is subject to the license terms contained
 * in the license file that is distributed with this file.
 */

import AbstractRowToObjectStrategy from "@spotfire-mod-common/common/visualization/strategies/AbstractRowToObjectStrategy.mjs";
import AxisUtility from "@spotfire-mod-common/common/util/data/AxisUtility.mjs";
import DataParts from "@spotfire-mod-common/common/data/DataParts.mjs";
import LayerModule from "@spotfire-mod-common/common/visualization/modules/LayerModule.mjs";
import RowUtility from "@spotfire-mod-common/common/util/data/RowUtility.mjs";

import AxisNames from "../../AxisNames.mjs";

export default class RowToObjectStrategy extends AbstractRowToObjectStrategy {
    // Convert a row to an object
    // MANDATORY OVERRIDE
    rowToObject(visualization, module, row) {
        const axes = module.getAxes();
        const colorAxisType = module.getColorAxisType();
        const object = {};

        // Get the color and color value properties
        object.color = row.color().hexCode;
        object.colorBy = AxisUtility.axisHasExpression(axes, AxisNames.AXIS_COLOR) ? 
            RowUtility.getColorValue(colorAxisType, row, AxisNames.AXIS_COLOR) : null;
        object.colorParts = new DataParts(axes, AxisNames.AXIS_COLOR, row);

        // Get the trellis parts and trellis path id properties
        object.trellisParts = new DataParts(axes, AxisNames.AXIS_TRELLIS_BY, row);
        object.trellisPathId = object.trellisParts.getPathId();

        // Get the x and y properties
        object.x = row.categorical(AxisNames.AXIS_X).formattedValue();
        object.y = row.continuous(AxisNames.AXIS_Y).value();
        object.y_formatted = row.continuous(AxisNames.AXIS_Y).formattedValue();

        // Set the marked flag
        object.marked = row.isMarked();

        // Store the original row for reference
        object.row = row;

        return object;
    }
}