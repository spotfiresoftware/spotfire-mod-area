/*
 * Copyright © 2026. Cloud Software Group, Inc.
 * This file is subject to the license terms contained
 * in the license file that is distributed with this file.
 */

import "./main.scss";

// Import common modules
import LabelService from "@spotfire-mod-common/common/util/localization/LabelService.mjs";
import Log from "@spotfire-mod-common/common/util/logging/Log.mjs";
import Metrics from "@spotfire-mod-common/common/util/logging/Metrics.mjs";
import { LogCategories } from "@spotfire-mod-common/common/util/logging/LogConstants.mjs";

// Import common labels
import * as common_base_en_US from '@spotfire-mod-common/config/languages/base_en-US.json';
import * as common_cfg_en_US from '@spotfire-mod-common/config/languages/cfg_en-US.json';

// Import chart modules
import AreaChartVisualization from "./chart/AreaChartVisualization.mjs";

// Import chart labels
import * as chart_en_US from './config/languages/en-US.json';

Spotfire.initialize(async (mod) => {
    const LOG_MODULE = 'Main';

    // Setup logging
    Log.setLogLevel(LogCategories.INFO);
    //Log.setShowTimestamps(true);

    // Log start initialization
    Log.trace('----------------------------------------------------------------------------------------------------');
    Log.debug(LOG_MODULE, 'Initializing visualization');

    // Setup metrics
    //Metrics.setEnabled(true);
    Metrics.setFilter((p) => p.pct != null && p.pct > 0.0);
    Metrics.resetPoints();
    Metrics.setTrackingPoint(LOG_MODULE, 'Start initialization');

    // Register label sets and set active culture (which should come from mod.getRenderContext)
    LabelService.registerLabelSet('en-US', [common_base_en_US.default, common_cfg_en_US.default, chart_en_US.default]);
    LabelService.setCulture('en-US');

    // Create and initialize the visualization object
    const visualization = AreaChartVisualization.createVisualization(mod);
    await visualization.initialize();
    await visualization.subscribe();

    // Log complete initialization
    Log.debug(LOG_MODULE, 'Completed initialization');
    Metrics.setTrackingPoint(LOG_MODULE, 'Completed initialization');
    Metrics.printMetrics();
    
    Log.trace('----------------------------------------------------------------------------------------------------');
});
