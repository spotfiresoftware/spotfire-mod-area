/*
 * Copyright © 2026. Cloud Software Group, Inc.
 * This file is subject to the license terms contained
 * in the license file that is distributed with this file.
 */

import AbstractDiagramRenderStrategy from "@spotfire-mod-common/common/diagram/strategies/AbstractDiagramRenderStrategy.mjs";
import LabelService from "@spotfire-mod-common/common/util/localization/LabelService.mjs";
import Log from "@spotfire-mod-common/common/util/logging/Log.mjs";
import StrategyResult from '@spotfire-mod-common/common/diagram/result/StrategyResult.mjs';
import TextMeasurerService from "@spotfire-mod-common/common/util/graphics/TextMeasurerService.mjs";

import AreaChartValidator from "../AreaChartValidator.mjs";
import DiagramModel from "../DiagramModel.mjs";
import { DiagramMargins } from "../DiagramView.mjs";
import { AreaLayout, AreaWithEmptyValues } from "../../AreaChartConstants.mjs";

export default class DiagramRenderStrategy extends AbstractDiagramRenderStrategy {
    static LOG_MODULE = 'AreaChart:DiagramRenderStrategy';

    /* ---------------------------------------------------------------------------------------------------- */
    /* UPDATE */

    // Update the diagram with new data
    async update(diagram) {
        const trellisPathId = diagram.getTrellisPathId();
        const dataNode = diagram.getDataNode();
        const rootDataNode = diagram.getRootDataNode();

        Log.trace(DiagramRenderStrategy.LOG_MODULE, `[${trellisPathId}]`, 'Update', `Validating and recalculating diagram data`);

        const warnings = [];

        // Validate
        const validateResult = await this.#validate(trellisPathId, dataNode);
        if(validateResult.valid == false) {
            const errors = [validateResult.reason];
            return StrategyResult.createErrorResult(errors);
        }

        // Set any warnings from the validation step
        warnings.push(...validateResult.warnings);

        // Recalculate the diagram data
        const recalculateResult = await this.#recalculate(diagram);
        if(recalculateResult.valid == false) {
            const errors = [recalculateResult.reason];
            return StrategyResult.createErrorResult(errors);
        }

        // Set any warnings from the recalculation step
        warnings.push(...recalculateResult.warnings);

        // Create the model object and set on the diagram
        const model = new DiagramModel();
        diagram.setModel(model);

        // Set the segments on the model
        const segmentGroups = recalculateResult.segmentGroups;
        model.setSegmentGroups(segmentGroups);

        return StrategyResult.createSuccessResult(warnings);
    }

    /* ---------------------------------------------------------------------------------------------------- */
    /* UPDATE - VALIDATION AND RECALCULATION */

    // Validate rows and configuration
    async #validate(trellisPathId, dataNode) {
        Log.trace(DiagramRenderStrategy.LOG_MODULE, `[${trellisPathId}]`, 'Update', 'Validate', 'Starting validation');

        // Create a validator and validate the data node
        const validator = new AreaChartValidator();
        const result = await validator.validate(trellisPathId, dataNode);

        Log.debug(DiagramRenderStrategy.LOG_MODULE, `[${trellisPathId}]`, 'Update', 'Validate', 'Completed validation', result);
        return result;
    }

    // Recalculate the diagram data
    async #recalculate(diagram) {
        const trellisPathId = diagram.getTrellisPathId();

        const result = {
            valid: true,
        };

        const warnings = [];

        // Calculate the domains
        const segmentGroups = this.#calculateSegmentGroups(diagram);

        result.warnings = warnings;
        result.segmentGroups = segmentGroups;

        return result;
    }
    
    // Recalculate the segments for the diagram
    #calculateSegmentGroups(diagram) {
        const dataNode = diagram.getDataNode();
        const vizModules = diagram.getVisualizationModules();
        const vizConfiguration = vizModules.getVizConfiguration();
        const vizConfig = vizConfiguration.getConfiguration();

        // Determine how to handle line with empty values based on configuration
        const areaWithEmptyValues = vizConfig.appearance.areaWithEmptyValues;
        const fillGaps = areaWithEmptyValues === AreaWithEmptyValues.CONTINUE;
        const areaLayout = vizConfig.appearance.areaLayout;

        // Calculate the domains
        const domains = this.#calculateDomains(diagram);
        const x_domain = domains.x_domain;

        // Create an array of segment groups
        const segmentGroups = [];

        // Data node hierarchy: moduleId > colorBy
        for(const colorByKey of dataNode.getKeys()) {
            const colorByDataNode = dataNode.getDataNodeByKey(colorByKey);
            const objects = colorByDataNode.getObjects();

            const objectsByX = new Map(objects.map(obj => [obj.x, obj]));

            const segments = [];
            let currentSegment = null;
            let currentSubsegment = null;
            let markedCount = 0;
            let prevObj = null;

            for(const xValue of x_domain) {
                const obj = objectsByX.get(xValue);

                if(obj == null) {
                    if(fillGaps && currentSegment != null) {
                        // In stacked modes, a gap must contribute y=0 so the line tracks the stacked base
                        if(areaLayout !== AreaLayout.OVERLAPPING && prevObj != null) {
                            const gapObj = { ...prevObj, x: xValue, y: 0, y0: 0, y1: 0, row: null };
                            currentSegment.points.push(gapObj);
                            currentSubsegment.points.push(gapObj);
                            prevObj = gapObj;
                        }
                        continue;
                    }
                    // Leading zeros: series starts after the domain begins, extend backwards with y=0
                    if(fillGaps && areaLayout !== AreaLayout.OVERLAPPING && objects.length > 0) {
                        const templateObj = objects[0];
                        const gapObj = { ...templateObj, x: xValue, y: 0, y0: 0, y1: 0, row: null };
                        currentSegment = { colorParts: templateObj.colorParts, points: [], subsegments: [] };
                        segments.push(currentSegment);
                        currentSubsegment = { marked: false, color: templateObj.color, points: [] };
                        currentSegment.subsegments.push(currentSubsegment);
                        currentSegment.points.push(gapObj);
                        currentSubsegment.points.push(gapObj);
                        prevObj = gapObj;
                        continue;
                    }
                    currentSegment = null;
                    currentSubsegment = null;
                    prevObj = null;
                    continue;
                }

                if(currentSegment == null) {
                    currentSegment = { colorParts: obj.colorParts, points: [], subsegments: [] };
                    segments.push(currentSegment);
                }

                currentSegment.points.push(obj);

                if(obj.marked) markedCount++;

                // Start a new subsegment when marked changes or at segment start
                if(currentSubsegment == null || currentSubsegment.marked !== obj.marked) {
                    const wasMarked = currentSubsegment?.marked ?? false;
                    // unmarked → marked: append first marked to closing unmarked subsegment
                    if(currentSubsegment != null && !wasMarked) {
                        currentSubsegment.points.push(obj);
                    }
                    currentSubsegment = { marked: obj.marked, color: obj.color, points: [] };
                    currentSegment.subsegments.push(currentSubsegment);
                    // marked → unmarked: prepend last marked to opening unmarked subsegment
                    if(wasMarked) {
                        currentSubsegment.points.push(prevObj);
                    }
                }

                currentSubsegment.points.push(obj);
                prevObj = obj;
            }

            segmentGroups.push({
                id: colorByKey,
                markedCount,
                segments,
            });
        }

        // Highest alpha key at index 0 → drawn first (bottom) and stacked first
        segmentGroups.sort((a, b) => b.id.localeCompare(a.id));

        // Stacking pass: accumulate y0/y1 per x value across color series
        if(areaLayout !== AreaLayout.OVERLAPPING) {
            const groupPointMaps = segmentGroups.map(sg => {
                const map = new Map();
                for(const seg of sg.segments) {
                    for(const pt of seg.points) {
                        map.set(pt.x, pt);
                    }
                }
                return map;
            });

            for(const xValue of x_domain) {
                let total = 1;
                if(areaLayout === AreaLayout.STACKED_100) {
                    total = groupPointMaps.reduce((sum, map) => {
                        const pt = map.get(xValue);
                        return sum + (pt != null && pt.y != null ? Math.abs(pt.y) : 0);
                    }, 0);
                    if(total === 0) continue;
                }

                let base = 0;
                for(const map of groupPointMaps) {
                    const pt = map.get(xValue);
                    if(pt == null || pt.y == null) continue;
                    pt.y0 = base;
                    pt.y1 = base + pt.y;
                    base = pt.y1;
                    if(areaLayout === AreaLayout.STACKED_100) {
                        pt.y0 /= total;
                        pt.y1 /= total;
                    }
                }
            }
        }

        return segmentGroups;
    }

    /* ---------------------------------------------------------------------------------------------------- */
    /* REDRAW */

    // Redraw the diagram with new data
    async redraw(diagram) {
        const context = diagram.getContext();
        const trellisPathId = diagram.getTrellisPathId();
        const model = diagram.getModel();
        const view = diagram.getView();
        const vizModules = diagram.getVisualizationModules();
    
        Log.trace(DiagramRenderStrategy.LOG_MODULE, `[${trellisPathId}]`, 'DiagramRedraw', 'Calculating redrawing');

        // Calculate the domains
        const domains = this.#calculateDomains(diagram);

        // Validate the canvas size, if too small, skip redraw
        const canvasElem = diagram.getCanvasElem();
        const width = canvasElem.clientWidth - DiagramMargins.LEFT_MARGIN_LABELS - DiagramMargins.RIGHT_MARGIN;
        const height = canvasElem.clientHeight - DiagramMargins.TOP_MARGIN - DiagramMargins.BOTTOM_MARGIN_LABELS;
        if(height <= 0 || width <= 0) return StrategyResult.createSuccessResult();

        // Update TextMeasurer font settings based on current user settings
        TextMeasurerService.updateFont(
            context.styling.scales.font.fontFamily,
            context.styling.scales.font.fontSize,
            context.styling.scales.font.fontWeight,
            context.styling.scales.font.fontStyle
        );

        // Update the view properties
        view.setContext(context);
        view.setDataNode(diagram.getDataNode());
        view.setDomains(domains);
        view.setMarkable(vizModules.isMarkable());
        view.setSegmentGroups(model.getSegmentGroups());
        view.setTrellisPathId(trellisPathId);
        view.setVisualizationModules(vizModules);
        view.setZoomRange(diagram.getZoomRange());

        // Update the view with trellis path, and additional data for rendering
        view.update();

        // Redraw the view
        const result = await view.redraw();

        // Display any errors or warnings
        if(result.valid == false) {
            const errors = [result.message];
            return StrategyResult.createErrorResult(errors);
        }

        return StrategyResult.createSuccessResult(result.warnings);
    }

    /* ---------------------------------------------------------------------------------------------------- */
    /* UPDATE - DOMAIN CALCULATIONS */

    // Calculate domains
    #calculateDomains(diagram) {
        const dataNode = diagram.getDataNode();
        const rootDataNode = diagram.getRootDataNode();
        const vizModules = diagram.getVisualizationModules();
        const vizConfiguration = vizModules.getVizConfiguration();
        const vizConfig = vizConfiguration.getConfiguration();

        // Get the x and y extents
        const x_extents = dataNode?.getExtents('x') ?? [];
        const y_extents = dataNode?.getExtents('y') ?? [];

        // Apply scale ranges
        // x-axis is categorical so no scale range, left here in case continuous in future
        //const minX = vizConfig.xAxis.scaleMin ?? x_extents[0];
        //const maxX = vizConfig.xAxis.scaleMax ?? x_extents[1];

        // Initialize the domains to be the extents
        const x_domain = x_extents;
        let y_domain;

        const areaLayout = vizConfig.appearance.areaLayout;
        if(areaLayout === AreaLayout.STACKED_100) {
            y_domain = [vizConfig.yAxis.scaleMin ?? 0, vizConfig.yAxis.scaleMax ?? 1];
        } else if(areaLayout === AreaLayout.STACKED) {
            const model = diagram.getModel();
            if(model != null) {
                let minStackedY = 0, maxStackedY = 0;
                for(const sg of model.getSegmentGroups() ?? []) {
                    for(const seg of sg.segments) {
                        for(const pt of seg.points) {
                            if(pt.y1 != null && pt.y1 > maxStackedY) maxStackedY = pt.y1;
                            if(pt.y0 != null && pt.y0 < minStackedY) minStackedY = pt.y0;
                        }
                    }
                }
                y_domain = [vizConfig.yAxis.scaleMin ?? minStackedY, vizConfig.yAxis.scaleMax ?? maxStackedY];
            } else {
                y_domain = [y_extents[0], y_extents[1]];
            }
        } else {
            y_domain = [vizConfig.yAxis.scaleMin ?? y_extents[0], vizConfig.yAxis.scaleMax ?? y_extents[1]];
        }

        // Invert the scale if the configuration is set to do so
        if(vizConfig.xAxis.scaleInvert == true)
            x_domain.reverse();
        if(vizConfig.yAxis.scaleInvert == true)
            y_domain.reverse();

        // Do not apply zoom range here, only after padding is calculated

        // Return domains and dimensions
        return {
            x_domain: x_domain,
            y_domain: y_domain,
        }
    }
}
