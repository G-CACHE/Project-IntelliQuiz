package com.intelliquiz.api.domain.services;

import net.jqwik.api.*;

import java.util.HashSet;
import java.util.Set;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * Property-based tests for CodeGenerationService.
 * 
 * Feature: application-layer, Property 4: Code Generation Uniqueness and Format
 * Validates: Requirements 4.1, 6.1, 11.1, 11.2, 11.3, 11.4
 */
public class CodeGenerationPropertyTest {

    private static final String AMBIGUOUS_CHARS = "0O1IL";
    private static final String TEAM_CHARSET = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";
    private static final String PROCTOR_CHARSET = "0123456789";

    private final CodeGenerationService codeGenerationService = new CodeGenerationService();

    /**
     * Property 4: Team codes follow XXX-XXX format
     */
    @Property(tries = 100)
    void teamCodesFollowCorrectFormat() {
        String code = codeGenerationService.generateTeamAccessCode();
        
        assertThat(code).hasSize(7);
        assertThat(code.charAt(3)).isEqualTo('-');
        assertThat(code.substring(0, 3)).matches("[A-Z0-9]{3}");
        assertThat(code.substring(4)).matches("[A-Z0-9]{3}");
    }

    /**
     * Property 4: Team codes exclude ambiguous characters (0, O, 1, I, L)
     */
    @Property(tries = 100)
    void teamCodesExcludeAmbiguousCharacters() {
        String code = codeGenerationService.generateTeamAccessCode();
        String codeWithoutDash = code.replace("-", "");
        
        for (char c : AMBIGUOUS_CHARS.toCharArray()) {
            assertThat(codeWithoutDash).doesNotContain(String.valueOf(c));
        }
    }

    /**
     * Property 4: Team codes only use valid charset
     */
    @Property(tries = 100)
    void teamCodesUseValidCharset() {
        String code = codeGenerationService.generateTeamAccessCode();
        String codeWithoutDash = code.replace("-", "");
        
        for (char c : codeWithoutDash.toCharArray()) {
            assertThat(TEAM_CHARSET).contains(String.valueOf(c));
        }
    }

    /**
     * Property 4: Proctor PINs follow XXX-XXX format
     */
    @Property(tries = 100)
    void proctorPinsFollowCorrectFormat() {
        String pin = codeGenerationService.generateProctorPin();
        
        assertThat(pin).hasSize(7);
        assertThat(pin.charAt(3)).isEqualTo('-');
        assertThat(pin.substring(0, 3)).matches("[0-9]{3}");
        assertThat(pin.substring(4)).matches("[0-9]{3}");
    }

    /**
     * Property 4: Proctor PINs use numeric charset only
     */
    @Property(tries = 100)
    void proctorPinsUseNumericCharset() {
        String pin = codeGenerationService.generateProctorPin();
        String pinWithoutDash = pin.replace("-", "");
        
        for (char c : pinWithoutDash.toCharArray()) {
            assertThat(PROCTOR_CHARSET).contains(String.valueOf(c));
        }
    }

    /**
     * Property 4: Team codes and proctor PINs use distinct charsets
     * Team codes exclude 0 and 1, while proctor PINs include them
     */
    @Property(tries = 100)
    void teamCodesAndProctorPinsUseDistinctCharsets() {
        String teamCode = codeGenerationService.generateTeamAccessCode();
        String proctorPin = codeGenerationService.generateProctorPin();
        
        // Team codes should be identified as team format
        assertThat(codeGenerationService.isTeamCodeFormat(teamCode)).isTrue();
        
        // Proctor PINs should be identified as proctor format
        assertThat(codeGenerationService.isProctorPinFormat(proctorPin)).isTrue();
        
        // Proctor PINs with 0 or 1 should NOT be identified as team format
        // (team charset excludes 0 and 1)
        String pinWithZeroOrOne = "012-345";
        assertThat(codeGenerationService.isTeamCodeFormat(pinWithZeroOrOne)).isFalse();
        
        // Note: Team codes MAY be identified as proctor format if they only contain 2-9
        // This is acceptable as the charsets overlap for digits 2-9
        // The key distinction is that proctor PINs can contain 0 and 1, which team codes cannot
    }

    /**
     * Property 4: Generated codes are likely unique (statistical test)
     * Note: This is a probabilistic test - we generate many codes and check for duplicates
     */
    @Property(tries = 10)
    void generatedCodesAreLikelyUnique() {
        Set<String> teamCodes = new HashSet<>();
        Set<String> proctorPins = new HashSet<>();
        
        int sampleSize = 100;
        
        for (int i = 0; i < sampleSize; i++) {
            teamCodes.add(codeGenerationService.generateTeamAccessCode());
            proctorPins.add(codeGenerationService.generateProctorPin());
        }
        
        // With a large charset, we expect very few (if any) collisions
        // Team codes: 30^6 = 729,000,000 possible combinations
        // Proctor PINs: 10^6 = 1,000,000 possible combinations
        assertThat(teamCodes.size()).isGreaterThan(sampleSize - 5); // Allow up to 5 collisions
        assertThat(proctorPins.size()).isGreaterThan(sampleSize - 10); // Allow up to 10 collisions
    }

    /**
     * Property 4: isTeamCodeFormat correctly identifies team codes
     */
    @Property(tries = 50)
    void isTeamCodeFormatCorrectlyIdentifiesTeamCodes() {
        String teamCode = codeGenerationService.generateTeamAccessCode();
        
        assertThat(codeGenerationService.isTeamCodeFormat(teamCode)).isTrue();
        assertThat(codeGenerationService.isTeamCodeFormat(null)).isFalse();
        assertThat(codeGenerationService.isTeamCodeFormat("")).isFalse();
        assertThat(codeGenerationService.isTeamCodeFormat("ABC")).isFalse();
        assertThat(codeGenerationService.isTeamCodeFormat("ABCDEFG")).isFalse();
    }

    /**
     * Property 4: isProctorPinFormat correctly identifies proctor PINs
     */
    @Property(tries = 50)
    void isProctorPinFormatCorrectlyIdentifiesProctorPins() {
        String proctorPin = codeGenerationService.generateProctorPin();
        
        assertThat(codeGenerationService.isProctorPinFormat(proctorPin)).isTrue();
        assertThat(codeGenerationService.isProctorPinFormat(null)).isFalse();
        assertThat(codeGenerationService.isProctorPinFormat("")).isFalse();
        assertThat(codeGenerationService.isProctorPinFormat("123")).isFalse();
        assertThat(codeGenerationService.isProctorPinFormat("1234567")).isFalse();
    }
}
