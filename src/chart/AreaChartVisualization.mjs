/*
 * Copyright © 2026. Cloud Software Group, Inc.
 * This file is subject to the license terms contained
 * in the license file that is distributed with this file.
 */

import Visualization from "@spotfire-mod-common/common/Visualization.mjs";
import { ZoomSliderPosition } from "@spotfire-mod-common/common/view/zoom/ZoomConstants.mjs";

import AxisNames from "./AxisNames.mjs";
import CreateDiagramStrategy from "./visualization/strategies/CreateDiagramStrategy.mjs";
import RowToObjectStrategy from "./visualization/strategies/RowToObjectStrategy.mjs";
import SubscribeStrategy from "./visualization/strategies/SubscribeStrategy.mjs";

// Icons
import ModIcon from "../../static/images/icon.svg";

// Configurations
import { vizConfigurationDefault } from "../config/ConfigurationDefault.mjs";
import { vizConfigurationTemplate } from "../config/ConfigurationTemplate.mjs";

export default class AreaChartVisualization {
    static LOG_MODULE = 'AreaChartVisualization';

    static createVisualization(mod) {
        const vizOptions = this.#createVizOptions();
        
        const strategies = {
            createDiagram: new CreateDiagramStrategy(),
            rowToObject: new RowToObjectStrategy(),
            subscribe: new SubscribeStrategy(),
        };

        return new Visualization(mod, vizOptions, strategies);

    }

    static #createVizOptions() {
        const vizOptions = {
            appearance: {
                showProgressInSubscribe: true, // Show progress in subscribe
            },
            compatibility: {
                minVersion: '2.0.0', // string - minimum compatible version of the mod framework    
            },
            data: {
                rootProperty: 'trellisPathId', // root property for data hierarchy
                tree: ['colorBy', 'marked'], // tree properties for data hierarchy
                extents: ['x', 'y'], // extents for data
            },
            modules: {
                base: {
                    axes: {
                        axisNames: AxisNames,   // axis names for the visualization
                        colorAxis: AxisNames.AXIS_COLOR, // color axis for the visualization
                        mandatory: [AxisNames.AXIS_X, AxisNames.AXIS_Y], // mandatory axes for the visualization
                    },
                    configuration: {
                        configurationTemplate: vizConfigurationTemplate, // configuration template for the base module
                        defaultConfiguration: vizConfigurationDefault, // default configuration for the base module
                    },
                },
            },
            // Rectangular marking configuration
            rectangularMarking: {
                enabled: true, // boolean - enable rectangular marking
            },
            trellis: {
                enabled: true, // enable trellis
                axis: AxisNames.AXIS_TRELLIS_BY, // axis for trellis
                showHierarchy: true, // Show trellis names as hierarchy
            },
            zoom: {
                enabled: true,
                disableWheelEvents: true,
                axes: {
                    x: ZoomSliderPosition.BOTTOM,
                    y: ZoomSliderPosition.LEFT,
                }
            },
        };

        return vizOptions;
    }
}