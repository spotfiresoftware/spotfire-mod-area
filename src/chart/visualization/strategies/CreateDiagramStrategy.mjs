/*
 * Copyright © 2026. Cloud Software Group, Inc.
 * This file is subject to the license terms contained
 * in the license file that is distributed with this file.
 */

import AbstractCreateDiagramStrategy from "@spotfire-mod-common/common/visualization/strategies/AbstractCreateDiagramStrategy.mjs";

import AreaChartDiagram from "../../AreaChartDiagram.mjs";

export default class CreateDiagramStrategy extends AbstractCreateDiagramStrategy {
    // Create a new diagram object
    // MANDATORY OVERRIDE
    createDiagram(vizOptions, canvasElem, context) {
        return AreaChartDiagram.createDiagram(vizOptions, canvasElem, context);
    }
}