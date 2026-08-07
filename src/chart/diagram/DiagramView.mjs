/*
 * Copyright © 2026. Cloud Software Group, Inc.
 * This file is subject to the license terms contained
 * in the license file that is distributed with this file.
 */

import * as d3 from 'd3';

import DataUtility from '@spotfire-mod-common/common/util/data/DataUtility.mjs';
import D3Utility from '@spotfire-mod-common/common/util/graphics/D3Utility.mjs';
import EventHandler from '@spotfire-mod-common/common/util/events/EventHandler.mjs';
import Log from "@spotfire-mod-common/common/util/logging/Log.mjs";
import MarkingEvents, { MarkRowsEvent } from "@spotfire-mod-common/common/view/marking/MarkingEvents.mjs";
import MarkingModuleRows from "@spotfire-mod-common/common/view/marking/MarkingModuleRows.mjs";
import MarkingService from "@spotfire-mod-common/common/view/marking/MarkingService.mjs";
import SVGUtility from '@spotfire-mod-common/common/util/graphics/SVGUtility.mjs';
import TextMeasurerService from "@spotfire-mod-common/common/util/graphics/TextMeasurerService.mjs";
import TooltipService from "@spotfire-mod-common/common/view/services/TooltipService.mjs";

export default class DiagramView extends EventHandler {
    static LOG_MODULE = 'DiagramView';

    static EVENTS = [
        MarkingEvents.MARK_ROWS_EVENT
    ];

    // Properties set in constructor
    #canvasElem;                       // Canvas element for the diagram
   
    // Properties set by accessors
    #context;                          // Mod context
    #dataNode;                         // Data node for the diagram
    #domains;                          // Domains
    #isMarkable;                       // Is marking enabled
    #segmentGroups;                    // Array of segment groups
    #trellisPathId;                    // Trellis path id for the diagram
    #vizModules;                       // Visualization modules for the diagram
    #zoomRange;                        // Zoom range for the diagram
    
    // Properties set in initialize
    #plotAreaSelect;                   // Plot area selection for the diagram
    #svgGridlinesGSelect;              // SVG gridlines group selection for the diagram
    #svgSelect;                        // SVG selection for the diagram
    #svgTransformGSelect;              // SVG transform group selection for the diagram
    #svgScaleXGSelect;                 // SVG scales group selection for the diagram
    #svgScaleYGSelect;                 // SVG scales group selection for the diagram

    #svgBaseDataAreaGSelect;           // SVG base data area group selection for the diagram
    #svgBaseDataLineGSelect;           // SVG base data line group selection for the diagram
    #svgMarkedDataAreaGSelect;         // SVG marked data area group selection for the diagram
    #svgMarkedDataLineGSelect;         // SVG marked data line group selection for the diagram
    #svgHoveredDataGSelect;            // SVG hovered data group selection for the diagram
    #svgHoveredLineGSelect;            // SVG hovered line group selection for the diagram
    #svgLabelsGSelect;                 // SVG labels group selection for the diagram

    // Properties set in redraw
    #width;                            // Width of the diagram
    #height;                           // Height of the diagram
    #margin;                           // Margin for the diagram
    #scales;                           // Scales for the diagram

    constructor(canvasElem) {
        super(DiagramView.EVENTS);

        this.#canvasElem = canvasElem;
    }
    
    /* ---------------------------------------------------------------------------------------------------- */
    /* INITIALIZE  */

    // Initialize the diagram static content
    async initialize(trellisPathId) {
        Log.debug(DiagramView.LOG_MODULE, `[${trellisPathId}]`, 'DiagramLifecycle', 'Initialize static content');

        // Reset the canvas element contents
        const canvasElem = this.#canvasElem;
        canvasElem.innerHTML = '';

        // Convert the canvas element to a d3 selection
        const canvasSelect = d3.select(canvasElem);

        // Create diagram and append
        const digramSelect = canvasSelect.append('div')
            .attr('class', 'area-chart-diagram diagram');

        // Create plot area and append
        const plotAreaSelect = digramSelect.append('div')
            .attr('class', 'plot-area');
        this.#plotAreaSelect = plotAreaSelect;

        // Create SVG element and append
        const svgSelect = plotAreaSelect.append('svg')
            .attr('height', '100%')
            .attr('width', '100%');
        this.#svgSelect = svgSelect;

        // Create SVG group for offset
        const svgTransformGSelect = svgSelect.append('g');
        this.#svgTransformGSelect = svgTransformGSelect;

        // Debug rect
        // svgTransformGSelect.append('rect').attr('x', 0).attr('y', 0).attr('height', '100%').attr('width', '100%').attr('fill', 'pink');

        // Append defs
        const defsSelect = svgSelect.append('defs');

        // Create a Mask defs for clip path. This is used with zoom sliders to prevent
        //   components displaying outside the axes
        const id = `mask-${DataUtility.generateUUID()}`;
        defsSelect.append('clipPath')
            .attr('id', id)
            .style('pointer-events', 'none')
            .append('rect')
                .attr('x', 0)
                .attr('y', 0)
                .attr('class', 'plot-area-mask')
                .attr('width', '100%')
                .attr('height', '100%');

        // Create group for to hold plot elements that will be clipped with mask
        const svgMaskedGSelect = svgTransformGSelect.append('g')
            .attr('clip-path', `url(#${id})`);

        // Create SVG group for gridlines
        const svgGridlinesGSelect = svgMaskedGSelect.append('g').attr('class', 'grid');
        this.#svgGridlinesGSelect = svgGridlinesGSelect;

        // Create SVG group for scales
        const svgScalesGSelect = svgTransformGSelect.append('g').attr('class', 'scales');
        const svgScaleXGSelect = svgScalesGSelect.append('g').attr('class', 'scale scale-x');
        this.#svgScaleXGSelect = svgScaleXGSelect;
        const svgScaleYGSelect = svgScalesGSelect.append('g').attr('class', 'scale scale-y');
        this.#svgScaleYGSelect = svgScaleYGSelect;
        
        // Create SVG groups for base, marked, and hovered graphic elements
        const svgBaseDataAreaGSelect = svgMaskedGSelect.append('g').attr('class', 'base area');
        this.#svgBaseDataAreaGSelect = svgBaseDataAreaGSelect;
        const svgBaseDataLineGSelect = svgMaskedGSelect.append('g').attr('class', 'base line');
        this.#svgBaseDataLineGSelect = svgBaseDataLineGSelect;
        const svgMarkedDataAreaGSelect = svgMaskedGSelect.append('g').attr('class', 'marked area');
        this.#svgMarkedDataAreaGSelect = svgMarkedDataAreaGSelect;
        const svgMarkedDataLineGSelect = svgMaskedGSelect.append('g').attr('class', 'marked line');
        this.#svgMarkedDataLineGSelect = svgMarkedDataLineGSelect;
        const svgHoveredDataGSelect = svgMaskedGSelect.append('g').attr('class', 'hovered');
        this.#svgHoveredDataGSelect = svgHoveredDataGSelect;

        this.#drawLineHoveredComponents(svgHoveredDataGSelect);
                
        // Create SVG group for labels
        const svgLabelsGSelect = svgMaskedGSelect.append('g').attr('class', 'labels');
        this.#svgLabelsGSelect = svgLabelsGSelect;

        Log.debug(DiagramView.LOG_MODULE, `[${trellisPathId}]`, 'DiagramLifecycle', 'Completed initialize static content');
    }

    // Draw components for line hovered state
    #drawLineHoveredComponents(svgHoveredDataGSelect) {
        const svgHoveredLineGSelect = svgHoveredDataGSelect.append('g').attr('class', 'segment-lines hovered-group');
        this.#svgHoveredLineGSelect = svgHoveredLineGSelect;

        // Create two paths for the hovered line: background and padding
        // Create two groups for the base and marked subsets
        svgHoveredLineGSelect.append('path').attr('class', 'background');
        svgHoveredLineGSelect.append('path').attr('class', 'padding');
        svgHoveredLineGSelect.append('g').attr('class', 'foreground base');
        svgHoveredLineGSelect.append('g').attr('class', 'foreground marked');
    }
    
    /* ------------------------------=---------------------------------------------------------------------- */
    /* UPDATE  */

    async update() {
    }

    /* ---------------------------------------------------------------------------------------------------- */
    /* REDRAW  */

    // Redraw the diagram dynamic content
    async redraw() {
        const plotAreaSelect = this.#plotAreaSelect;
        const domains = this.#domains;
        const isMarkable = this.#isMarkable;
        const svgSelect = this.#svgSelect;

        // Create result object
        const result = {
            valid: true,
        }

        // Set markable class if marking enabled
        plotAreaSelect.classed('markable', isMarkable === true);

        // Get the margin
        const margin = this.#calculateMargins(domains);
        this.#margin = margin;

        // Update plot area mask
        svgSelect.select(`rect.plot-area-mask`)
            .attr('width', `calc(100% - ${margin.left + margin.right}px)`)
            .attr('height', `calc(100% - ${margin.top + margin.bottom}px)`);

        // Calculate width and height
        let width = plotAreaSelect.node().clientWidth - margin.left - margin.right;
        let height = plotAreaSelect.node().clientHeight - margin.top - margin.bottom;  

        // Create scales
        const scales = {};
        this.#scales = scales;

        // Get the plot padding
        const padding = this.#calculatePlotPadding(domains, width, height);

        // Apply zoom ranges to domains after plot padding is calculated
        this.#applyZoomRange(domains);

        // Create x and y scales
        scales.xScale = this.#createXScale(domains, padding, width);
        scales.yScale = this.#createYScale(domains, padding, height);

        // Set the width and height
        this.#width = width;
        this.#height = height;

        // Validate width and height -- this can occur sometimes during config changes, this
        //   just prevents spurious errors in the console log
        if(width < 0 || isNaN(width) || height < 0 || isNaN(height)) return result;

        // Draw the data
        this.#redraw();

        return result;
    }

    // Redraw the diagram data
    #redraw() {
        const svgTransformGSelect = this.#svgTransformGSelect;
        const margin = this.#margin;

        // Update the SVG transform group
        svgTransformGSelect.attr('transform', 'translate(' + margin.left + ',' + margin.top + ')');

        // Redraw components
        this.#redrawXAxisScale();
        this.#redrawYAxisScale();
        this.#redrawXAxisGridlines();
        this.#redrawYAxisGridlines();
        this.#redrawData();
    }

    /* ---------------------------------------------------------------------------------------------------- */
    /* REDRAW - GRIDLINES */

    // Redraw the x-axis gridlines
    #redrawXAxisGridlines() {
        const svgGridlinesGSelect = this.#svgGridlinesGSelect;

        const height = this.#height;
        const scales = this.#scales;
        const vizModules = this.#vizModules;
        const vizConfiguration = vizModules.getVizConfiguration();
        const vizConfig = vizConfiguration.getConfiguration();

        // Get the x scale and ticks
        const xScale = scales.xScale;
        //const ticks = vizConfig.gridlines.showGridX == true ? xScale.ticks() : []; // continuous scale
        //const ticks = vizConfig.gridlines.showGridX == true ? xScale.domain() : [];
        
        // Obtain the ticks that have labels
        const ticks = vizConfig.gridlines.showGridX == true
            ? this.#svgScaleXGSelect.selectAll('.tick').data()
            : [];

        // Bind data to object elements
        const selectedData = svgGridlinesGSelect.selectAll(`line.grid.grid-x`)
            .data(ticks, (d, i) => i);

        // Debugging log
        Log.trace(DiagramView.LOG_MODULE, 'Update', `X Gridlines added: ${selectedData.enter().size()}, removed: ${selectedData.exit().size()}, updated: ${selectedData.size()}`);

        // Remove old objects
        selectedData.exit().remove();

        // Create new objects, result will be new and updated objects
        const gridlinesSelect = selectedData
            .join(enter => enter.append('line').attr('class', `grid grid-x`));

        // Update new and existing objects
        gridlinesSelect.each(function (d, i) {
            const lineSelect = d3.select(this);
            lineSelect
                .attr('x1', (d) => xScale(d))
                .attr('x2', (d) => xScale(d))
                .attr('y1', 0)
                .attr('y2', height);
        });        
    }

    // Redraw the y-axis gridlines
    #redrawYAxisGridlines() {
        const svgGridlinesGSelect = this.#svgGridlinesGSelect;

        const height = this.#height;
        const width = this.#width;
        const scales = this.#scales;
        const vizModules = this.#vizModules;
        const vizConfiguration = vizModules.getVizConfiguration();
        const vizConfig = vizConfiguration.getConfiguration();

        // Get the y scale and ticks
        const yScale = scales.yScale;
        const maxTicks = vizConfig.yAxis.maxTickCount ?? height / 70;
        const ticks = vizConfig.gridlines.showGridY == true ? yScale.ticks(maxTicks) : [];

        // Bind data to object elements
        const selectedData = svgGridlinesGSelect.selectAll(`line.grid.grid-y`)
            .data(ticks, (d, i) => i);

        // Debugging log
        Log.trace(DiagramView.LOG_MODULE, 'Update', `Y Gridlines added: ${selectedData.enter().size()}, removed: ${selectedData.exit().size()}, updated: ${selectedData.size()}`);

        // Remove old objects
        selectedData.exit().remove();

        // Create new objects, result will be new and updated objects
        const gridlinesSelect = selectedData
            .join(enter => enter.append('line').attr('class', `grid grid-y`));

        // Update new and existing objects
        gridlinesSelect.each(function (d, i) {
            const lineSelect = d3.select(this);
            lineSelect
                .attr('x1', 0)
                .attr('x2', width)
                .attr('y1', (d) => yScale(d))
                .attr('y2', (d) => yScale(d));
        });
    }

    /* ---------------------------------------------------------------------------------------------------- */
    /* REDRAW - SCALES */

    // Redraw the x-axis scale
    #redrawXAxisScale() {
        const svgSelect = this.#svgSelect;
        const svgScaleXGSelect = this.#svgScaleXGSelect;

        const context = this.#context;
        const height = this.#height;
        const width = this.#width;
        const scales = this.#scales;
        const vizModules = this.#vizModules;
        const vizConfiguration = vizModules.getVizConfiguration();
        const vizConfig = vizConfiguration.getConfiguration();

        // Get the x-scale
        const xScale = scales.xScale;

        // Limit ticks to a maximum count, evenly spaced across the domain
        const maxTicks = vizConfig.xAxis.maxTickCount ?? width / 50;
        const domain = xScale.domain();
        const step = Math.ceil(domain.length / maxTicks);
        const tickValues = domain.filter((_, i) => i % step === 0);

        // Always show scales initially otherwise labels don't appear
        svgScaleXGSelect.classed('visible', true);

        // Append x-axis scale
        svgScaleXGSelect
            .attr('transform', 'translate(0,' + height + ')')
            .call(d3.axisBottom(xScale).tickSizeOuter(0).tickValues(tickValues))
            .call(g => g.selectAll('.tick line')
                .attr('stroke', context.styling.scales.tick.stroke)
            )
            .call(g => g.selectAll('.tick text')
                .attr('color', context.styling.scales.font.color)
                .attr('font-family', context.styling.scales.font.fontFamily)
                .attr('font-size', context.styling.scales.font.fontSize)
                .attr('font-style', context.styling.scales.font.fontStyle)
                .attr('font-weight', context.styling.scales.font.fontWeight)
            )
            .call(g => g.selectAll('path')
                .attr('stroke', context.styling.scales.line.stroke)
            );

        // Remove overlapping x-axis tick labels
        D3Utility.removeOverlappingTicksLabelsX(svgSelect, svgScaleXGSelect, true);

        // Hide x ticks and text labels if show scale is false
        svgScaleXGSelect.classed('visible', vizConfig.xAxis.showScaleX);
    }

    // Redraw the y-axis scale
    #redrawYAxisScale() {
        const svgSelect = this.#svgSelect;
        const svgScaleYGSelect = this.#svgScaleYGSelect;

        const context = this.#context;
        const height = this.#height;
        const scales = this.#scales;
        const vizModules = this.#vizModules;
        const vizConfiguration = vizModules.getVizConfiguration();
        const vizConfig = vizConfiguration.getConfiguration();

        // Get the y-scale
        const yScale = scales.yScale;

        // Limit ticks to a maximum count
        const maxTicks = vizConfig.yAxis.maxTickCount ?? height / 70;

        // Always show scales initially otherwise labels don't appear
        svgScaleYGSelect.classed('visible', true);

        // Append y-axis scale
        svgScaleYGSelect
            .call(d3.axisLeft(yScale).tickSizeOuter(0).ticks(maxTicks))
            .call(g => g.selectAll('.tick line')
                .attr('stroke', context.styling.scales.tick.stroke)
            )
            .call(g => g.selectAll('.tick text')
                .attr('color', context.styling.scales.font.color)
                .attr('font-family', context.styling.scales.font.fontFamily)
                .attr('font-size', context.styling.scales.font.fontSize)
                .attr('font-style', context.styling.scales.font.fontStyle)
                .attr('font-weight', context.styling.scales.font.fontWeight)
            )
            .call(g => g.selectAll('path')
                .attr('stroke', context.styling.scales.line.stroke)
            );

        // Remove overlapping y-axis tick labels
        D3Utility.removeOverlappingTicksLabelsY(svgSelect, svgScaleYGSelect, true);

        // Hide y ticks and text labels if show scale is false
        svgScaleYGSelect.classed('visible', vizConfig.yAxis.showScaleY);
    }

    /* ---------------------------------------------------------------------------------------------------- */
    /* REDRAW - DATA */

    // Redraw the data elements
    #redrawData() {
        const svgBaseDataAreaGSelect = this.#svgBaseDataAreaGSelect;
        const svgBaseDataLineGSelect = this.#svgBaseDataLineGSelect;
        const svgMarkedDataAreaGSelect = this.#svgMarkedDataAreaGSelect;
        const svgMarkedDataLineGSelect = this.#svgMarkedDataLineGSelect;
        const segmentGroups = this.#segmentGroups;

        const segmentGroupsBase = segmentGroups;
        const segmentGroupsMarked = segmentGroups.filter(segmentGroup => segmentGroup.markedCount > 0);

        // Redraw data areas for base and marked
        this.#redrawSegmentGroups(svgBaseDataAreaGSelect, segmentGroupsBase,
            (s, seg, g) => this.#updateSegmentArea(s, seg, g, false));
        this.#redrawSegmentGroups(svgMarkedDataAreaGSelect, segmentGroupsMarked,
            (s, seg, g) => this.#updateSegmentArea(s, seg, g, true));

        // Redraw data lines for base and marked
        this.#redrawSegmentGroups(svgBaseDataLineGSelect, segmentGroupsBase,
            (s, seg, g) => this.#updateSegment(s, seg, g, true, false));
        this.#redrawSegmentGroups(svgMarkedDataLineGSelect, segmentGroupsMarked,
            (s, seg, g) => this.#updateSegment(s, seg, g, true, true));
    }

    // Redraw segment groups
    #redrawSegmentGroups(parentElem, segmentGroups, updateSegmentFn) {
        const self = this;

        // Bind the segment groups to the base data group
        const selectedData = parentElem.selectAll(`g.segment-group`)
            .data(segmentGroups, d => d.id);

        // Debugging log
        Log.trace(DiagramView.LOG_MODULE, 'Update', `Segment groups added: ${selectedData.enter().size()}, removed: ${selectedData.exit().size()}, updated: ${selectedData.size()}`);

        // Add new segment groups to the data group
        const segmentGroupsSelect = selectedData.join(enter => enter.append('g').attr('class', `segment-group`));

        // Update new and existing segment groups in the base data group
        segmentGroupsSelect.each(function (segmentGroup, i) {
            self.#updateSegmentGroup(d3.select(this), segmentGroup, updateSegmentFn);
        });
    }

    // Update segment group elements
    #updateSegmentGroup(segmentGroupSelect, segmentGroup, updateSegmentFn) {
        const self = this;

        // Bind the segments in the segment group to the segment group selection
        const segmentSelect = segmentGroupSelect.selectAll('g.segment')
            .data(segmentGroup.segments, (d, i) => i);

        // Debugging log
        Log.trace(DiagramView.LOG_MODULE, 'Update', `Segments added: ${segmentSelect.enter().size()}, removed: ${segmentSelect.exit().size()}, updated: ${segmentSelect.size()}`);

        // Create new objects, result will be new and updated objects
        const segmentGSelect = segmentSelect.enter().append('g').attr('class', 'segment').merge(segmentSelect);

        // Update new and existing objects
        segmentGSelect.each(function (segment, i) {
            updateSegmentFn(d3.select(this), segment, segmentGroup);
        });
    }

    // Update a single segment
    #updateSegment(segmentSelect, segment, segmentGroup, hasEvents, isMarked) {
        if(segmentSelect.node().children.length === 0) {
            if(hasEvents === true) {
                segmentSelect.append('g').attr('class', 'event-lines');
                segmentSelect.append('g').attr('class', 'event-points');
            }
            segmentSelect.append('g').attr('class', 'data-lines');
            if(isMarked === true) {
                segmentSelect.append('g').attr('class', 'data-points');
            }
        }

        // If events are enabled, update the event lines and points
        if(hasEvents === true) {
            const eventLinesSelect = segmentSelect.select('g.event-lines');
            this.#updateSegmentEventLine(eventLinesSelect, segment);

            const eventPointsSelect = segmentSelect.select('g.event-points');
            this.#updateSegmentEventPoints(eventPointsSelect, segment);
        }

        // Update the segment data lines
        const subsegments = segment.subsegments.filter(subsegment => subsegment.marked === isMarked);
        const dataLinesSelect = segmentSelect.select('g.data-lines');
        this.#updateSegmentDataLines(dataLinesSelect, subsegments);

        // If marking is enabled, update the data points
        if(isMarked === true) {
            const dataPointsSelect = segmentSelect.select('g.data-points');
            this.#updateSegmentDataPoints(dataPointsSelect, subsegments);
        }
    }

    // Update a single area segment
    #updateSegmentArea(segmentSelect, segment, segmentGroup, isMarked) {
        if(segmentSelect.node().children.length === 0) {
            segmentSelect.append('g').attr('class', 'data-areas');
        }

        const subsegments = segment.subsegments.filter(subsegment => subsegment.marked === isMarked);
        const dataAreasSelect = segmentSelect.select('g.data-areas');
        this.#updateSegmentDataLines(dataAreasSelect, subsegments, (points) => this.#createClosedPathString(points));
    }

    // Update segment event line
    #updateSegmentEventLine(parentElem, segment) {
        const self = this;

        const vizModules = this.#vizModules;
        const vizConfiguration = vizModules.getVizConfiguration();
        const vizConfig = vizConfiguration.getConfiguration();

        // Padding for events line width
        const dataLineEventPadding = 4;
        const dataLineEventStrokeWidth = vizConfig.appearance.strokeWidth + dataLineEventPadding;

        // Create a single segment for the event line, using the points from the segment group
        const eventLines = [{id: 0, points: segment.points}];

        // Bind the events segments to the segment group
        const eventsSelect = parentElem.selectAll('path.events.interactive')
             .data(eventLines, (d, i) => d.id);
        
        // Debugging log
        Log.trace(DiagramView.LOG_MODULE, 'Update', `Events added: ${eventsSelect.enter().size()}, removed: ${eventsSelect.exit().size()}, updated: ${eventsSelect.size()}`);

        // Create new objects, result will be new and updated objects
        const pathEventsSelect = eventsSelect
            .join(enter => enter.append('path').attr('class', `events interactive`));

        // Function for mouseover events
        function mouseover(e, eventLine) {
            self.#showHoveredSegment(segment);
            const tooltip = self.#createSegmentTooltip(segment);
            TooltipService.showUITooltip(tooltip);
        }
        
        // Function for mouseout events
        function mouseout(e, eventLine) {
            self.#hideHoveredSegment();
            TooltipService.hideTooltip();
        }
        
        // Function for click events
        function click(e, eventLine) {
            e.stopPropagation(); // important            
            const markingModuleRows = self.#convertPointsToMarkingModuleRows(segment.points);
            const markRowsEvent = new MarkRowsEvent(e.ctrlKey, markingModuleRows);
            self.dispatchEvent(markRowsEvent);
        }
        
        // Update new and existing objects
        pathEventsSelect.each(function (eventLine, i) {
            const pathSelect = d3.select(this);
            pathSelect
                .attr('d', self.#createPathString(eventLine.points))
                .attr('stroke-width', dataLineEventStrokeWidth)
                .on('mouseover', mouseover)
                .on('mouseout', mouseout)
                .on('click', click);

            // Restore hover state if mouse is still over this element after a redraw triggered by a click
            if(this.matches(':hover')) {
                mouseover(null, eventLine);
            }
        });
    }

    // Update segment event points
    #updateSegmentEventPoints(parentElem, segment) {
        const self = this;

        const scales = this.#scales;
        const xScale = scales.xScale;
        const yScale = scales.yScale;

        const vizModules = this.#vizModules;
        const vizConfiguration = vizModules.getVizConfiguration();
        const vizConfig = vizConfiguration.getConfiguration();

        // Radius for data points, point event padding, and radius for events points
        const dataPointsRadius = DiagramLayout.DATA_POINT_RADIUS;
        const dataPointEventPadding = 2;
        const dataPointsEventRadius = dataPointsRadius + dataPointEventPadding;

        // Function to handle mouseover, mouseout, and click
        function mouseover(e, point, segment) {
            e.stopPropagation(); // important
            self.#showHoveredSegment(segment);                
            TooltipService.showDataTooltip(point.row);
        }

        function mouseout(e, point) {
            e.stopPropagation(); // important
            TooltipService.hideTooltip();
            self.#hideHoveredSegment();
        }

        // Click not enabled on points
        function click(e, point) {
            e.stopPropagation(); // important            
            const markingModuleRows = self.#convertPointsToMarkingModuleRows(segment.points);
            const markRowsEvent = new MarkRowsEvent(e.ctrlKey, markingModuleRows);
            self.dispatchEvent(markRowsEvent);
        }

        // Bind the event points to the segment group
        const selectedData = parentElem.selectAll('circle.event-point')
            .data(segment.points, (point, i) => i);

        // Debugging log
        Log.trace(DiagramView.LOG_MODULE, 'Update', `Event points added: ${selectedData.enter().size()}, removed: ${selectedData.exit().size()}, updated: ${selectedData.size()}`);

        // Add new event points to the segment group
        const pointsSelect = selectedData
            .join(enter => enter.append('circle').attr('class', 'event-point interactive'));

        // Update new and existing event points
        pointsSelect
            .attr('cx', (point) => xScale(point.x))
            .attr('cy', (point) => yScale(point.y))
            .attr('r', dataPointsEventRadius)
            .on('mouseover', (e, d) => mouseover(e, d, segment))
            .on('mouseout', mouseout)
            .on('click', click);
    }

    // Update segment data
    #updateSegmentDataLines(parentElem, subsegments, pathGeneratorFn = null) {
        const self = this;

        const vizModules = this.#vizModules;
        const vizConfiguration = vizModules.getVizConfiguration();
        const vizConfig = vizConfiguration.getConfiguration();

        const strokeWidth = vizConfig.appearance.strokeWidth;
        const strokeDashArray = vizConfig.appearance.strokeDashArray;
        const fillOpacity = 1 - vizConfig.appearance.fillTransparency / 100;

        // Bind the segments to the segment group
        const dataSelect = parentElem.selectAll('path.data')
            .data(subsegments, (d, i) => i);

        // Debugging log
        Log.trace(DiagramView.LOG_MODULE, 'Update', `Data added: ${dataSelect.enter().size()}, removed: ${dataSelect.exit().size()}, updated: ${dataSelect.size()}`);

        // Create new objects, result will be new and updated objects
        const pathDataSelect = dataSelect
            .join(enter => enter.append('path').attr('class', `data`));

        // Update new and existing objects
        pathDataSelect.each(function (d, i) {
            const pathSelect = d3.select(this);
            pathSelect
                .attr('d', pathGeneratorFn ? pathGeneratorFn(d.points) : self.#createPathString(d.points))
                .attr('stroke', d.color)
                .attr('fill', d.color)
                .attr('fill-opacity', fillOpacity)
                .attr('stroke-width', strokeWidth)
                .attr('stroke-dasharray', strokeDashArray);
        });
    }

    // Update segment data points
    #updateSegmentDataPoints(parentElem, subsegments) {
        const self = this;

        const scales = this.#scales;
        const xScale = scales.xScale;
        const yScale = scales.yScale;

        const vizModules = this.#vizModules;
        const vizConfiguration = vizModules.getVizConfiguration();
        const vizConfig = vizConfiguration.getConfiguration();

        // Radius for data points, point event padding, and radius for events points
        const dataPointsRadius = DiagramLayout.DATA_POINT_RADIUS;

        // Bind data to object elements
        const selectedData = parentElem.selectAll('g.segment-data-points')
            .data(subsegments, (segment, i) => i);

        // Create new objects, result will be new and updated objects
        const segmentEventPointsSelect = selectedData
            .join(enter => enter.append('g').attr('class', `segment-data-points`));

        // Update new and existing objects
        segmentEventPointsSelect.each(function (segment, i) {
            const segmentEventPointsSelect = d3.select(this);

            // If there are two or less points in the segment.points, use those
            // If there are more than two, use the first and last points in the segment.points
            const points = [];
            if(segment.points.length <= 2) {
                points.push(...segment.points);
            } 
            else {
                points.push(segment.points[0]);
                points.push(segment.points[segment.points.length - 1]);
            }

            const selectedData = segmentEventPointsSelect.selectAll('circle.data-point')
                .data(points, (point, i) => i);
            const pointsSelect = selectedData
                .join(enter => enter.append('circle').attr('class', 'data-point interactive'));
            pointsSelect
                .attr('cx', (point) => xScale(point.x))
                .attr('cy', (point) => yScale(point.y))
                .attr('r', dataPointsRadius)
                .attr('fill', segment.color);
        });
    }

    /* ---------------------------------------------------------------------------------------------------- */
    /* REDRAW - HELPERS */

    // Creates a d defintion for a path from an array of points
    #createPathString(points) {
        const scales = this.#scales;
        const xScale = scales.xScale;
        const yScale = scales.yScale;

        const pathString = points.map((point, index) => {
            const x = xScale(point.x);
            const y = yScale(point.y);
            return `${index === 0 ? 'M' : 'L'} ${x} ${y}`;
        }).join(' ');

        return pathString;
    }

    // Closed path: data points → drop to y baseline → return along baseline → close
    #createClosedPathString(points) {
        const scales = this.#scales;
        const xScale = scales.xScale;
        const yScale = scales.yScale;
        const yBaseline = yScale.range()[0]; // pixel coordinate of y-axis minimum

        const openPath = points.map((point, index) => {
            const x = xScale(point.x);
            const y = yScale(point.y);
            return `${index === 0 ? 'M' : 'L'} ${x} ${y}`;
        }).join(' ');

        const xLast  = xScale(points[points.length - 1].x);
        const xFirst = xScale(points[0].x);

        return `${openPath} L ${xLast} ${yBaseline} L ${xFirst} ${yBaseline} Z`;
    }

    // Create a tooltip for a line segment
    #createSegmentTooltip(segment) {
        const colorParts = segment.colorParts;
        if(colorParts == null) return null;

        const parts = colorParts.getParts();
        if(parts == null || parts.length === 0) return null;
    
        const stringArr = [];
        for(const part of parts) {
            const partName = part.axisPart?.displayName;
            const partValue = part.formattedValue;
            stringArr.push(`${partName}: ${partValue}`);
        }

        return stringArr.join('\n');
    }

    /* ---------------------------------------------------------------------------------------------------- */
    /* REDRAW - LABELS */

    /* ---------------------------------------------------------------------------------------------------- */
    /* ACTIONS -- HOVER LINE */

    // Show hovered elements for a segment group
    #showHoveredSegment(segment) {
        const svgHoveredLineGSelect = this.#svgHoveredLineGSelect;

        const context = this.#context;
        const vizModules = this.#vizModules;
        const vizConfiguration = vizModules.getVizConfiguration();
        const vizConfig = vizConfiguration.getConfiguration();

        // Stroke width for the hovered line
        const strokeWidth = vizConfig.appearance.strokeWidth;
        const strokeDashArray = vizConfig.appearance.strokeDashArray;

        // Offsets for the paths
        const pathOutlineOffset = DiagramLayout.LINE_OUTLINE_OFFSET; // Offset for the hovered path
        const pathPaddingOffset = DiagramLayout.LINE_PADDING_OFFSET; // Offset for the padding path

        // Convert the points into coordinate strings
        const pathStr = this.#createPathString(segment.points);

        // Update the hovered background path
        svgHoveredLineGSelect.select('path.background')
            .attr('d', pathStr)
            .attr('stroke-width', strokeWidth + pathOutlineOffset);

        // Update the hovered padding path
        svgHoveredLineGSelect.select('path.padding')
            .attr('d', pathStr)
            .attr('stroke', context.styling.general.backgroundColor)
            .attr('stroke-width', strokeWidth + pathPaddingOffset);

        // Update the hovered foreground path
        const unmarkedSubsegments = segment.subsegments.filter(subsegment => subsegment.marked === false);
        const foregroundBaseSelect = svgHoveredLineGSelect.select('g.foreground.base');
        this.#updateSegmentDataLines(foregroundBaseSelect, unmarkedSubsegments);

        const markedSubsegments = segment.subsegments.filter(subsegment => subsegment.marked === true);
        const foregroundMarkedSelect = svgHoveredLineGSelect.select('g.foreground.marked');
        this.#updateSegmentDataLines(foregroundMarkedSelect, markedSubsegments);
        this.#updateSegmentDataPoints(foregroundMarkedSelect, markedSubsegments);

        // Make hovered elements visible
        svgHoveredLineGSelect.classed('visible', true);
    }

    // Hide hovered elements for a line
    #hideHoveredSegment() {
        const svgHoveredLineGSelect = this.#svgHoveredLineGSelect;
        svgHoveredLineGSelect.classed('visible', false);
    }

    /* ---------------------------------------------------------------------------------------------------- */
    /* MARKING */

    // Rectangular selection
    rectangleSelection(selection) {
        const margin = this.#margin;
        const scales = this.#scales;
        const segmentGroups = this.#segmentGroups;
        const svgSelect = this.#svgSelect;

        // If height and width are undefined or zero, return empty set
        // This is important for page trellis to prevent errors by selecting points on hidden charts
        const height = svgSelect.node().clientHeight;
        const width = svgSelect.node().clientWidth;
        if(height == null || width == null || height <= 0 || width <= 0) 
            return new MarkingModuleRows();

        // Check for scales, may not be available if all data filtered, in which case return empty set
        if(scales == null) return new MarkingModuleRows();

        // Get the scales
        const xScale = scales.xScale;
        const yScale = scales.yScale;

        // Convert the selection rectangle coordinates
        const selectionBox = {
            x1: selection.x,
            x2: selection.x + selection.width,
            y1: selection.y,
            y2: selection.y + selection.height,
            offsetLeft: selection.offsetLeft,
            offsetTop: selection.offsetTop
        };

        // Determine if point is inside selection box
        function pointInSelectionBox(point) {
            const x1 = selectionBox.x1 + selectionBox.offsetLeft;
            const x2 = selectionBox.x2 + selectionBox.offsetLeft;
            const y1 = selectionBox.y1 + selectionBox.offsetTop;
            const y2 = selectionBox.y2 + selectionBox.offsetTop;
            return point.x >= x1 && point.x <= x2 && 
                point.y >= y1 && point.y <= y2;
        }

        // Initialize an array of selected objects
        const selectedArr = [];

        // Create a function to test raw svg coordinates are inside the selection box
        function testPoint(svgX, svgY) {
            const testSvgX = svgX + margin.left;
            const testSvgY = svgY + margin.top;
            const point = SVGUtility.svgToScreen(svgSelect.node(), testSvgX, testSvgY);
            return pointInSelectionBox(point);
        }

        for(const segmentGroup of segmentGroups) {
            for(const segment of segmentGroup.segments) {
                segment.points.forEach(point => {
                    const svgX = xScale(point.x);
                    const svgY = yScale(point.y);
                    if(testPoint(svgX, svgY))
                        selectedArr.push(point);
                });
            }
        }

        // Create a marking module rows object from the selected array
        const markingModuleRows = this.#convertPointsToMarkingModuleRows(selectedArr);
        return markingModuleRows;
    }

    // Convert a single point or a point array into a marking module rows object
    #convertPointsToMarkingModuleRows(points) {
        const markingModuleRows = new MarkingModuleRows();
        
        const testPoints = Array.isArray(points) ? points : [points];
        
        // Extract and group by moduleId
        const moduleRowMap = {};
        for(const point of testPoints) {
            const row = point.row;
            moduleRowMap[point.moduleId] = moduleRowMap[point.moduleId] || [];
            moduleRowMap[point.moduleId].push(row);
        }
        
        for(const moduleId in moduleRowMap) {
            const rows = moduleRowMap[moduleId];
            markingModuleRows.addRows(moduleId, rows);
        }

        return markingModuleRows;
    }

    /* ---------------------------------------------------------------------------------------------------- */
    /* CALCULATIONS -- DIMENSIONS */

    // Calculate the margin for the diagram
    #calculateMargins(domains) {
        const canvasElem = this.#canvasElem;
        const context = this.#context;
        const vizModules = this.#vizModules;
        const vizConfiguration = vizModules.getVizConfiguration();
        const vizConfig = vizConfiguration.getConfiguration();
        
        const height = canvasElem.clientHeight;

        // Get the y_domain
        const y_domain = domains.y_domain;
        const yAxisIsDate = y_domain.every(yd => yd instanceof Date);

        // Determine left margin from y-axis scale
        let leftMargin = DiagramMargins.LEFT_MARGIN_NO_LABELS;
        if(vizConfig.yAxis.showScaleY == true) {
            // Add a temp svg and all axis labels to calculate the width
            const svgDataSelect = d3.select('body').append('svg')
                .attr('class', 'axis-labels')
                .attr('width', '100%')
                .attr('height', `${height}px`);
            
            // Calculate a temp yScale
            let yScale;
            if(yAxisIsDate == true) {
                yScale = d3.scaleTime()
                    .domain([y_domain[0], y_domain[1]])
                    .range([0, height]);
            }
            else {
                yScale = d3.scaleLinear()
                    .domain([y_domain[0], y_domain[1]])
                    .range([0, height]);
            }
    
            // Create a y axis generator with custom date formatting if needed
            const yAxis = d3.axisLeft(yScale);
            const tickValues = yScale.ticks();

            // Draw a temp y axis scale to generate the labels
            const gScale = svgDataSelect.append('g').attr('class', 'axis-y');
            yAxis(gScale);
            
            svgDataSelect.selectAll('.tick text')
                .attr('font-family', context.styling.scales.font.fontFamily)
                .attr('font-size', context.styling.scales.font.fontSize)
                .attr('font-style', context.styling.scales.font.fontStyle)
                .attr('font-weight', context.styling.scales.font.fontWeight);
            
            // Select all text areas and calculate the maximum width
            let width = 0;
            svgDataSelect.selectAll('text').each(function() {
                const textSelect = d3.select(this);
                const thisWidth = TextMeasurerService.getWidth(textSelect.text());
                width = Math.max(width, thisWidth);
            });

            // Remove the temp svg
            svgDataSelect.remove();

            // Set the left margin to the width of the labels plus offset for tick and some padding
            leftMargin = Math.max(leftMargin, width + 14);
        }

        // Determine right margin from x-axis scale
        let rightMargin = DiagramMargins.RIGHT_MARGIN;
        if(vizConfig.xAxis.showScaleX == true) {
            // Get the last tick label and calculate the width
            const x_domain = domains.x_domain;
            const lastTick = x_domain[x_domain.length - 1];
            const lastTickWidth = TextMeasurerService.getWidth(lastTick, true);
            rightMargin = Math.max(rightMargin, lastTickWidth / 2 + 10);
        }

        // Determine bottom margin
        let bottomMargin = DiagramMargins.BOTTOM_MARGIN_NO_LABELS;
        if(vizConfig.xAxis.showScaleX == true) {
            bottomMargin = TextMeasurerService.getHeight(true) + DiagramMargins.BOTTOM_MARGIN_LABELS;
        }

        const margin = {
            top:    DiagramMargins.TOP_MARGIN, 
            right:  rightMargin, 
            bottom: bottomMargin,
            left:   leftMargin
        };

        return margin;
    }

    // Calculate plot padding for the diagram
    #calculatePlotPadding(domains, width, height) {
        const padding = {
            top:    DiagramPadding.PLOT_PADDING_TOP,
            right:  DiagramPadding.PLOT_PADDING_RIGHT,
            bottom: DiagramPadding.PLOT_PADDING_BOTTOM,
            left:   DiagramPadding.PLOT_PADDING_LEFT,
        }

        return padding;
    }

    // Apply zoom range to domains
    #applyZoomRange(domains) {
        const zoomRange = this.#zoomRange;

        const x_domain = domains.x_domain;
        const y_domain = domains.y_domain;

        // Update domains with zoom range
        // This is for continuous x-axis
        /*if(zoomRange.x != null && (zoomRange.x.rangeFrom > 0 || zoomRange.x.rangeTo < 1)) {
            const x_span = x_domain[1] - x_domain[0];
            const x_fromDelta = x_span * zoomRange.x.rangeFrom;
            const x_toDelta = x_span * (1 - zoomRange.x.rangeTo);
            x_domain[1] = x_domain[1] - x_toDelta;
            x_domain[0] = x_domain[0] + x_fromDelta;
        }*/
       if(zoomRange.x != null && (zoomRange.x.rangeFrom > 0 || zoomRange.x.rangeTo < 1)) {
            const x_domain_length = x_domain.length;
            const x_fromIndex = Math.floor(x_domain_length * zoomRange.x.rangeFrom);
            const x_toIndex = Math.ceil(x_domain_length * zoomRange.x.rangeTo);
            domains.x_zoom = { fromIndex: x_fromIndex, toIndex: x_toIndex };
       }

        if(zoomRange.y != null && (zoomRange.y.rangeFrom > 0 || zoomRange.y.rangeTo < 1)) {
            const y_span = y_domain[1] - y_domain[0];
            const y_fromDelta = y_span * zoomRange.y.rangeFrom;
            const y_toDelta = y_span * (1 - zoomRange.y.rangeTo);
            y_domain[1] = y_domain[1] - y_fromDelta;
            y_domain[0] = y_domain[0] + y_toDelta;
        }
    }

    /* ---------------------------------------------------------------------------------------------------- */
    /* CALCULATIONS -- SCALES */

    // Create the x scale
    #createXScale(domains, padding, width) {
        const zoomRange = this.#zoomRange;
        const x_domain = domains.x_domain;

        // x-axis is categorical so no scale range, left here in case continuous in future
        /*let xScale = d3.scaleLinear()
            .domain(x_domain)
            .range([0, width]);

        const pxLeft = xScale(x_domain[0]);
        const padPxleft = pxLeft - padding.left
        const invertedLeft = xScale.invert(padPxleft);

        const pxRight = xScale(x_domain[1]);
        const padPxRight = pxRight + padding.right;
        const invertedRight = xScale.invert(padPxRight);

        xScale.domain([invertedLeft, invertedRight]);*/

        // Need to apply zoom range here for categorical x-axis, otherwise the 
        // scale will not be correct when zooming in
        let rangeStart = padding.left;
        let rangeEnd = width - padding.right;

        if(domains.x_zoom != null) {
            const { fromIndex, toIndex } = domains.x_zoom;
            const visibleCount = toIndex - fromIndex;
            const visibleWidth = width - padding.left - padding.right;
            if(visibleCount > 1) {
                const step = visibleWidth / (visibleCount - 1);
                rangeStart = padding.left - fromIndex * step;
                rangeEnd = rangeStart + (x_domain.length - 1) * step;
            } else {
                // Single visible item: center it, use visibleWidth as step to push others off-screen
                const step = visibleWidth;
                rangeStart = padding.left + visibleWidth / 2 - fromIndex * step;
                rangeEnd = rangeStart + (x_domain.length - 1) * step;
            }
        }

        let xScale = d3.scalePoint()
            .domain(x_domain)
            .range([rangeStart, rangeEnd]);

        return xScale;

    }

    // Create the y scale
    #createYScale(domains, padding, height) {
        const y_domain = domains.y_domain;
        const yScale = d3.scaleLinear()
            .domain(y_domain)
            .range([height, 0]);

        const pxTop = yScale(y_domain[1]);
        const padPxTop = pxTop - padding.top
        const invertedTop = yScale.invert(padPxTop);

        const pxBottom = yScale(y_domain[0]);
        const padPxBottom = pxBottom + padding.bottom;
        const invertedBottom = yScale.invert(padPxBottom);

        yScale.domain([invertedBottom, invertedTop]);

        return yScale;
    }

    /* ---------------------------------------------------------------------------------------------------- */
    /* ACCESSORS */

    // Sets the context
    setContext(context) {
        this.#context = context;
    }

    // Sets the data node
    setDataNode(dataNode) {
        this.#dataNode = dataNode;
    }

    // Sets the domains
    setDomains(domains) {
        this.#domains = domains;
    }

    // Sets the markable
    setMarkable(isMarkable) {
        this.#isMarkable = isMarkable;
    }

    // Sets the segment groups
    setSegmentGroups(segmentGroups) {
        this.#segmentGroups = segmentGroups;
    }

    // Sets the trellis path
    setTrellisPathId(trellisPathId) {
        this.#trellisPathId = trellisPathId;
    }

    // Sets the visualization modules
    setVisualizationModules(vizModules) {
        this.#vizModules = vizModules;
    }
    
    // Sets the zoom range
    setZoomRange(zoomRange) {
        this.#zoomRange = zoomRange;
    }
}

export class DiagramMargins {
    static TOP_MARGIN               = 10;
    static RIGHT_MARGIN             = 10;
    static BOTTOM_MARGIN_LABELS     = 10;
    static BOTTOM_MARGIN_NO_LABELS  = 10;
    static LEFT_MARGIN_NO_LABELS    = 10;
}

export class DiagramPadding {
    static PLOT_PADDING_TOP       = 0;
    static PLOT_PADDING_RIGHT     = 0;
    static PLOT_PADDING_BOTTOM    = 0;
    static PLOT_PADDING_LEFT      = 0;
}

export class DiagramLayout {
    static DATA_POINT_RADIUS = 3; // Radius for the data points
    static DATA_POINT_PADDING_RADIUS = 5; // Radius for the hovered point padding
    static DATA_POINT_OUTLINE_RADIUS = 6; // Radius for the hovered point outline
    static DATA_POINT_EVENT_RADIUS = 8; // Radius for the data point events
    
    static CIRCLE_PADDING_RADIUS = 3; // Additional padding radius for markers during marking

    static LINE_EVENT_OFFSET = 8; // Offset for the events path
    static LINE_OUTLINE_OFFSET = 4; // Offset for the hovered path
    static LINE_PADDING_OFFSET = 2; // Offset for the padding path
}