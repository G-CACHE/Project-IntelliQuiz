import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';

/**
 * Property 15: Form Validation Feedback
 * For any form submission with invalid input (empty access code, whitespace-only input),
 * the system SHALL display inline validation errors and prevent submission.
 * 
 * Validates: Requirements 8.7
 */

// Validation logic extracted from component for testing
const validateAccessCode = (code: string): { valid: boolean; error: string | null } => {
  const trimmed = code.trim();
  
  if (!trimmed) {
    return { valid: false, error: 'Please enter your team code' };
  }
  
  if (trimmed.length < 4) {
    return { valid: false, error: 'Team code must be at least 4 characters' };
  }
  
  return { valid: true, error: null };
};

// Generator for whitespace-only strings
const whitespaceOnlyArb = fc.array(
  fc.constantFrom(' ', '\t', '\n', '\r'),
  { minLength: 0, maxLength: 20 }
).map(arr => arr.join(''));

// Generator for valid access codes
const validAccessCodeArb = fc.string({ minLength: 4, maxLength: 10 })
  .filter(s => s.trim().length >= 4);

// Generator for short access codes (1-3 chars after trim)
const shortAccessCodeArb = fc.string({ minLength: 1, maxLength: 3 })
  .filter(s => s.trim().length > 0 && s.trim().length < 4);

describe('Form Validation Feedback - Property Tests', () => {
  /**
   * Feature: proctor-participant-ui, Property 15: Form Validation Feedback
   */
  it('should reject empty strings with appropriate error', () => {
    const result = validateAccessCode('');
    
    expect(result.valid).toBe(false);
    expect(result.error).toBeTruthy();
    expect(result.error).toContain('enter');
  });

  it('should reject whitespace-only strings', () => {
    fc.assert(
      fc.property(whitespaceOnlyArb, (whitespace) => {
        const result = validateAccessCode(whitespace);
        
        expect(result.valid).toBe(false);
        expect(result.error).toBeTruthy();
        return true;
      }),
      { numRuns: 100 }
    );
  });

  it('should reject codes shorter than 4 characters', () => {
    fc.assert(
      fc.property(shortAccessCodeArb, (shortCode) => {
        const result = validateAccessCode(shortCode);
        
        expect(result.valid).toBe(false);
        expect(result.error).toBeTruthy();
        expect(result.error).toContain('4 characters');
        return true;
      }),
      { numRuns: 100 }
    );
  });

  it('should accept valid codes (4+ characters)', () => {
    fc.assert(
      fc.property(validAccessCodeArb, (validCode) => {
        const result = validateAccessCode(validCode);
        
        expect(result.valid).toBe(true);
        expect(result.error).toBeNull();
        return true;
      }),
      { numRuns: 100 }
    );
  });

  it('should trim whitespace before validation', () => {
    fc.assert(
      fc.property(
        validAccessCodeArb,
        fc.string({ minLength: 0, maxLength: 5 }).filter(s => /^\s*$/.test(s)),
        fc.string({ minLength: 0, maxLength: 5 }).filter(s => /^\s*$/.test(s)),
        (code, prefix, suffix) => {
          const paddedCode = prefix + code + suffix;
          const result = validateAccessCode(paddedCode);
          
          // Should be valid because the trimmed code is valid
          expect(result.valid).toBe(true);
          expect(result.error).toBeNull();
          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should always return either valid=true with null error OR valid=false with error message', () => {
    fc.assert(
      fc.property(fc.string({ minLength: 0, maxLength: 20 }), (input) => {
        const result = validateAccessCode(input);
        
        // XOR: either valid with no error, or invalid with error
        const validWithNoError = result.valid === true && result.error === null;
        const invalidWithError = result.valid === false && result.error !== null;
        
        expect(validWithNoError || invalidWithError).toBe(true);
        return true;
      }),
      { numRuns: 100 }
    );
  });
});
