/*
 * Copyright © 2026. Cloud Software Group, Inc.
 * This file is subject to the license terms contained
 * in the license file that is distributed with this file.
 */

import AbstractDiagramLifecycleStrategy from "@spotfire-mod-common/common/diagram/strategies/AbstractDiagramLifecycleStrategy.mjs";
import Log from "@spotfire-mod-common/common/util/logging/Log.mjs";
import MarkingEvents from "@spotfire-mod-common/common/view/marking/MarkingEvents.mjs";

import DiagramView from "../../diagram/DiagramView.mjs";

export default class DiagramLifecycleStrategy extends AbstractDiagramLifecycleStrategy {
    static LOG_MODULE = 'AreaChart:DiagramLifecycleStrategy';

    /* ---------------------------------------------------------------------------------------------------- */
    /* INITIALIZE */

    // Initialize the diagram static content
    async initialize(diagram) {
        const trellisPathId = diagram.getTrellisPathId();
        const canvasElem = diagram.getCanvasElem();

        Log.debug(DiagramLifecycleStrategy.LOG_MODULE, `[${trellisPathId}]`, 'DiagramLifecycle', `Initialize diagram`);

        // Create the stiff diagram view and initialize
        const view = new DiagramView(canvasElem);
        await view.initialize(trellisPathId);
        diagram.setView(view);

        // Add diagram view event listeners
        view.addEventListener(MarkingEvents.MARK_ROWS_EVENT, (e) => diagram.dispatchEvent(e));

        Log.debug(DiagramLifecycleStrategy.LOG_MODULE, `[${trellisPathId}]`, 'DiagramLifecycle', `Completed initialize diagram`);
    }
}
