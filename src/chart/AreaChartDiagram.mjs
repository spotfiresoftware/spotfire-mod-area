/*
 * Copyright © 2026. Cloud Software Group, Inc.
 * This file is subject to the license terms contained
 * in the license file that is distributed with this file.
 */

import Diagram from "@spotfire-mod-common/common/Diagram.mjs";

import DiagramLifecycleStrategy from "./diagram/strategies/DiagramLifecycleStrategy.mjs";
import DiagramRenderStrategy from "./diagram/strategies/DiagramRenderStrategy.mjs";
import RectangleSelectionStrategy from "./diagram/strategies/RectangleSelectionStrategy.mjs";

export default class AreaChartDiagram {
    static createDiagram(vizOptions, canvasElem, context) {
        const strategies = {
            lifecycle: new DiagramLifecycleStrategy(),
            rectSelection: new RectangleSelectionStrategy(),
            render: new DiagramRenderStrategy(),
        };

        return new Diagram(vizOptions, canvasElem, context, strategies);
    }
}
