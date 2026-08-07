/*
 * Copyright © 2026. Cloud Software Group, Inc.
 * This file is subject to the license terms contained
 * in the license file that is distributed with this file.
 */

export default class DiagramModel {
    // Properties set by accessors
    #segmentGroups;

    // Returns the segment groups
    getSegmentGroups() {
        return this.#segmentGroups;
    }

    // Sets the segment groups
    setSegmentGroups(segmentGroups) {
        this.#segmentGroups = segmentGroups;
    }
}