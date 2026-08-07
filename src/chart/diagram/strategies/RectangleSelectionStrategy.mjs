/*
 * Copyright © 2026. Cloud Software Group, Inc.
 * This file is subject to the license terms contained
 * in the license file that is distributed with this file.
 */

import AbstractRectangleSelectionStrategy from "@spotfire-mod-common/common/diagram/strategies/AbstractRectangleSelectionStrategy.mjs";

export default class RectangleSelectionStrategy extends AbstractRectangleSelectionStrategy {
    // Perform rectangle selection on the diagram
    // MANDATORY OVERRIDE
    rectangleSelection(diagram, selection) {
        const view = diagram.getView();
        const dataNode = diagram.getDataNode();
        return view.rectangleSelection(selection, dataNode);
    }
}