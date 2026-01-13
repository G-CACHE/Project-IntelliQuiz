package com.intelliquiz.api.domain.services;

import org.springframework.stereotype.Service;

import java.security.SecureRandom;

/**
 * Domain service for generating unique access codes.
 * 
 * Generates codes in XXX-XXX format:
 * - Team access codes use alphanumeric charset excluding ambiguous characters (0, O, 1, I, L)
 * - Proctor PINs use numeric charset for easy verbal communication
 */
@Service
public class CodeGenerationService {

    // Charset for team codes: excludes ambiguous characters (0, O, 1, I, L)
    private static final String TEAM_CHARSET = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";
    
    // Charset for proctor PINs: numeric only for easy verbal communication
    private static final String PROCTOR_CHARSET = "0123456789";
    
    private static final int CODE_SEGMENT_LENGTH = 3;
    
    private final SecureRandom random = new SecureRandom();

    /**
     * Generates a unique team access code in XXX-XXX format.
     * Uses alphanumeric charset excluding ambiguous characters.
     * 
     * @return a new team access code
     */
    public String generateTeamAccessCode() {
        return generateCode(TEAM_CHARSET);
    }

    /**
     * Generates a unique proctor PIN in XXX-XXX format.
     * Uses numeric charset for easy verbal communication.
     * 
     * @return a new proctor PIN
     */
    public String generateProctorPin() {
        return generateCode(PROCTOR_CHARSET);
    }

    /**
     * Generates a code in XXX-XXX format using the specified charset.
     */
    private String generateCode(String charset) {
        StringBuilder code = new StringBuilder();
        
        // First segment
        for (int i = 0; i < CODE_SEGMENT_LENGTH; i++) {
            code.append(charset.charAt(random.nextInt(charset.length())));
        }
        
        code.append('-');
        
        // Second segment
        for (int i = 0; i < CODE_SEGMENT_LENGTH; i++) {
            code.append(charset.charAt(random.nextInt(charset.length())));
        }
        
        return code.toString();
    }

    /**
     * Checks if a code matches the team access code format.
     * Team codes use alphanumeric charset excluding ambiguous characters.
     * 
     * @param code the code to check
     * @return true if the code matches team code format
     */
    public boolean isTeamCodeFormat(String code) {
        if (code == null || code.length() != 7 || code.charAt(3) != '-') {
            return false;
        }
        String withoutDash = code.substring(0, 3) + code.substring(4);
        return withoutDash.chars().allMatch(c -> TEAM_CHARSET.indexOf(c) >= 0);
    }

    /**
     * Checks if a code matches the proctor PIN format.
     * Proctor PINs use numeric charset only.
     * 
     * @param code the code to check
     * @return true if the code matches proctor PIN format
     */
    public boolean isProctorPinFormat(String code) {
        if (code == null || code.length() != 7 || code.charAt(3) != '-') {
            return false;
        }
        String withoutDash = code.substring(0, 3) + code.substring(4);
        return withoutDash.chars().allMatch(c -> PROCTOR_CHARSET.indexOf(c) >= 0);
    }
}
