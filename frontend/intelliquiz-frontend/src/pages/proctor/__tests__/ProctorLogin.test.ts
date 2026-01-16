import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import { AccessResolutionResponse, RouteType } from '../../../services/api';

/**
 * Property 1: Access Code Routing Consistency
 * For any valid access code submitted to the system:
 * - If the code resolves to type HOST, the user SHALL be routed to the proctor lobby
 * - If the code resolves to type PARTICIPANT, the user SHALL be routed to the player lobby
 * - If the code is INVALID, an error message SHALL be displayed
 * 
 * Validates: Requirements 1.4, 1.5, 1.6
 */

// Arbitrary generators
const routeTypeArb = fc.constantFrom<RouteType>('HOST', 'PARTICIPANT', 'INVALID');

const teamResponseArb = fc.record({
  id: fc.integer({ min: 1, max: 10000 }),
  name: fc.string({ minLength: 1, maxLength: 50 }),
  accessCode: fc.string({ minLength: 4, maxLength: 10 }),
  quizId: fc.integer({ min: 1, max: 10000 }),
});

const quizAccessResponseArb = fc.record({
  id: fc.integer({ min: 1, max: 10000 }),
  title: fc.string({ minLength: 1, maxLength: 100 }),
  proctorPin: fc.string({ minLength: 4, maxLength: 10 }),
  status: fc.constantFrom('DRAFT', 'READY', 'ACTIVE', 'ARCHIVED'),
});

const accessResolutionResponseArb: fc.Arbitrary<AccessResolutionResponse> = fc.oneof(
  // HOST response
  fc.record({
    routeType: fc.constant<RouteType>('HOST'),
    quiz: quizAccessResponseArb,
    team: fc.constant(undefined),
    errorMessage: fc.constant(undefined),
  }),
  // PARTICIPANT response
  fc.record({
    routeType: fc.constant<RouteType>('PARTICIPANT'),
    team: teamResponseArb,
    quiz: fc.constant(undefined),
    errorMessage: fc.constant(undefined),
  }),
  // INVALID response
  fc.record({
    routeType: fc.constant<RouteType>('INVALID'),
    team: fc.constant(undefined),
    quiz: fc.constant(undefined),
    errorMessage: fc.string({ minLength: 1, maxLength: 200 }),
  })
);

// Routing logic function (extracted from component for testing)
const determineRoute = (response: AccessResolutionResponse): {
  route: string | null;
  error: string | null;
} => {
  switch (response.routeType) {
    case 'HOST':
      if (response.quiz) {
        return { route: '/host/lobby', error: null };
      }
      return { route: null, error: 'Invalid response: missing quiz data' };
    
    case 'PARTICIPANT':
      if (response.team) {
        return { route: '/player/lobby', error: null };
      }
      return { route: null, error: 'Invalid response: missing team data' };
    
    case 'INVALID':
      return { 
        route: null, 
        error: response.errorMessage || 'Invalid code. Please try again.' 
      };
    
    default:
      return { route: null, error: 'Unknown route type' };
  }
};

describe('Access Code Routing - Property Tests', () => {
  /**
   * Feature: proctor-participant-ui, Property 1: Access Code Routing Consistency
   */
  it('should route HOST responses to proctor lobby', () => {
    fc.assert(
      fc.property(quizAccessResponseArb, (quiz) => {
        const response: AccessResolutionResponse = {
          routeType: 'HOST',
          quiz,
        };
        
        const result = determineRoute(response);
        
        expect(result.route).toBe('/host/lobby');
        expect(result.error).toBeNull();
        return true;
      }),
      { numRuns: 100 }
    );
  });

  it('should route PARTICIPANT responses to player lobby', () => {
    fc.assert(
      fc.property(teamResponseArb, (team) => {
        const response: AccessResolutionResponse = {
          routeType: 'PARTICIPANT',
          team,
        };
        
        const result = determineRoute(response);
        
        expect(result.route).toBe('/player/lobby');
        expect(result.error).toBeNull();
        return true;
      }),
      { numRuns: 100 }
    );
  });

  it('should display error for INVALID responses', () => {
    fc.assert(
      fc.property(
        fc.option(fc.string({ minLength: 1, maxLength: 200 }), { nil: undefined }),
        (errorMessage) => {
          const response: AccessResolutionResponse = {
            routeType: 'INVALID',
            errorMessage,
          };
          
          const result = determineRoute(response);
          
          expect(result.route).toBeNull();
          expect(result.error).toBeTruthy();
          expect(typeof result.error).toBe('string');
          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should handle any valid access resolution response correctly', () => {
    fc.assert(
      fc.property(accessResolutionResponseArb, (response) => {
        const result = determineRoute(response);
        
        // Either we have a route or an error, never both, never neither
        const hasRoute = result.route !== null;
        const hasError = result.error !== null;
        
        expect(hasRoute !== hasError).toBe(true);
        
        // Verify correct routing based on response type
        if (response.routeType === 'HOST' && response.quiz) {
          expect(result.route).toBe('/host/lobby');
        } else if (response.routeType === 'PARTICIPANT' && response.team) {
          expect(result.route).toBe('/player/lobby');
        } else if (response.routeType === 'INVALID') {
          expect(result.error).toBeTruthy();
        }
        
        return true;
      }),
      { numRuns: 100 }
    );
  });
});
