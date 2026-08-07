/*
 * Copyright © 2026. Cloud Software Group, Inc.
 * This file is subject to the license terms contained
 * in the license file that is distributed with this file.
 */

import LabelService from "@spotfire-mod-common/common/util/localization/LabelService.mjs";

export default class AreaChartValidator {
    static LOG_MODULE = 'AreaChartValidator';

    /* ---------------------------------------------------------------------------------------------------- */
    /* VALIDATION */

    // Validate
    async validate(trellisPathId, dataNode) {
        // Create a result object
        const result = {
            valid: true,
            warnings: [],
        };

        return result;
    }
}