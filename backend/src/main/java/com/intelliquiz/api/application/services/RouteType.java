package com.intelliquiz.api.application.services;

import io.swagger.v3.oas.annotations.media.Schema;

/**
 * Enum representing the type of route for access code resolution.
 */
@Schema(description = "Route types for access code resolution: PARTICIPANT (team code), HOST (proctor PIN), INVALID (no match)")
public enum RouteType {
    /**
     * Route to participant/player interface (team access code matched)
     */
    PARTICIPANT,
    
    /**
     * Route to host/proctor interface (proctor PIN matched for active quiz)
     */
    HOST,
    
    /**
     * Invalid access code - no match found
     */
    INVALID
}
