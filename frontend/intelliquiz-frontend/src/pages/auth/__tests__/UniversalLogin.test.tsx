import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import UniversalLogin from '../UniversalLogin';

// Mock useNavigate
const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

/**
 * Unit Tests for UniversalLogin Component
 * 
 * Tests component rendering, navigation, and content completeness
 * Validates: Requirements 3.6, 6.3
 */

const renderComponent = () => {
  return render(
    <BrowserRouter>
      <UniversalLogin />
    </BrowserRouter>
  );
};

describe('UniversalLogin Component', () => {
  beforeEach(() => {
    mockNavigate.mockClear();
  });

  describe('Component Rendering', () => {
    it('should render without errors', () => {
      expect(() => renderComponent()).not.toThrow();
    });

    it('should render the hero section with title', () => {
      renderComponent();
      
      const title = screen.getByText('IntelliQuiz');
      expect(title).toBeDefined();
      expect(title.tagName).toBe('H1');
    });

    it('should render the subtitle', () => {
      renderComponent();
      
      expect(screen.getByText('Interactive Quiz Platform')).toBeDefined();
    });

    it('should render the tagline', () => {
      renderComponent();
      
      expect(screen.getByText('Engage, Learn, and Compete in Real-Time')).toBeDefined();
    });
  });

  describe('Login Cards - Content Completeness', () => {
    /**
     * Property 1: Login Card Content Completeness
     * For any login card rendered on the landing page, the card SHALL contain 
     * both an icon element and descriptive text content.
     * 
     * Validates: Requirements 3.6
     */
    it('should display all three login options', () => {
      renderComponent();
      
      expect(screen.getByText('Join as Participant')).toBeDefined();
      expect(screen.getByText('Host as Proctor')).toBeDefined();
      expect(screen.getByText('Admin Portal')).toBeDefined();
    });

    it('should display participant card with icon and description', () => {
      renderComponent();
      
      const participantCard = screen.getByLabelText('Join as Participant');
      expect(participantCard).toBeDefined();
      
      // Check for description text
      expect(screen.getByText('Enter your team code to join a quiz session')).toBeDefined();
      
      // Check for SVG icon (the card should contain an SVG)
      const svgElements = participantCard.querySelectorAll('svg');
      expect(svgElements.length).toBeGreaterThan(0);
    });

    it('should display proctor card with icon and description', () => {
      renderComponent();
      
      const proctorCard = screen.getByLabelText('Host as Proctor');
      expect(proctorCard).toBeDefined();
      
      // Check for description text
      expect(screen.getByText('Enter your proctor PIN to host and manage a quiz')).toBeDefined();
      
      // Check for SVG icon
      const svgElements = proctorCard.querySelectorAll('svg');
      expect(svgElements.length).toBeGreaterThan(0);
    });

    it('should display admin card with icon and description', () => {
      renderComponent();
      
      const adminCard = screen.getByLabelText('Admin Portal');
      expect(adminCard).toBeDefined();
      
      // Check for description text
      expect(screen.getByText('Manage quizzes, teams, and system settings')).toBeDefined();
      
      // Check for SVG icon
      const svgElements = adminCard.querySelectorAll('svg');
      expect(svgElements.length).toBeGreaterThan(0);
    });

    it('each login card should have both title and description', () => {
      renderComponent();
      
      const cards = [
        { label: 'Join as Participant', title: 'Join as Participant', desc: 'Enter your team code to join a quiz session' },
        { label: 'Host as Proctor', title: 'Host as Proctor', desc: 'Enter your proctor PIN to host and manage a quiz' },
        { label: 'Admin Portal', title: 'Admin Portal', desc: 'Manage quizzes, teams, and system settings' },
      ];

      cards.forEach(({ label, title, desc }) => {
        const card = screen.getByLabelText(label);
        expect(card).toBeDefined();
        expect(screen.getByText(title)).toBeDefined();
        expect(screen.getByText(desc)).toBeDefined();
      });
    });
  });

  describe('Navigation', () => {
    /**
     * Property 2: Navigation Route Validity
     * For any login card click action, the navigation SHALL route to a valid 
     * application path that exists in the router configuration.
     * 
     * Validates: Requirements 3.1, 3.3, 3.4, 3.5
     */
    it('should navigate to participant login on participant card click', () => {
      renderComponent();
      
      const participantCard = screen.getByLabelText('Join as Participant');
      fireEvent.click(participantCard);
      
      expect(mockNavigate).toHaveBeenCalledWith('/participant/login');
    });

    it('should navigate to proctor login on proctor card click', () => {
      renderComponent();
      
      const proctorCard = screen.getByLabelText('Host as Proctor');
      fireEvent.click(proctorCard);
      
      expect(mockNavigate).toHaveBeenCalledWith('/proctor/login');
    });

    it('should navigate to admin login on admin card click', () => {
      renderComponent();
      
      const adminCard = screen.getByLabelText('Admin Portal');
      fireEvent.click(adminCard);
      
      expect(mockNavigate).toHaveBeenCalledWith('/login');
    });

    it('should navigate on Enter key press for participant card', () => {
      renderComponent();
      
      const participantCard = screen.getByLabelText('Join as Participant');
      fireEvent.keyDown(participantCard, { key: 'Enter' });
      
      expect(mockNavigate).toHaveBeenCalledWith('/participant/login');
    });

    it('should navigate on Enter key press for proctor card', () => {
      renderComponent();
      
      const proctorCard = screen.getByLabelText('Host as Proctor');
      fireEvent.keyDown(proctorCard, { key: 'Enter' });
      
      expect(mockNavigate).toHaveBeenCalledWith('/proctor/login');
    });

    it('should navigate on Enter key press for admin card', () => {
      renderComponent();
      
      const adminCard = screen.getByLabelText('Admin Portal');
      fireEvent.keyDown(adminCard, { key: 'Enter' });
      
      expect(mockNavigate).toHaveBeenCalledWith('/login');
    });
  });

  describe('Footer', () => {
    /**
     * Validates: Requirements 6.3
     */
    it('should display footer with correct copyright year 2026', () => {
      renderComponent();
      
      const footer = screen.getByText(/© 2026 IntelliQuiz/);
      expect(footer).toBeDefined();
    });

    it('should display "All rights reserved" in footer', () => {
      renderComponent();
      
      expect(screen.getByText(/All rights reserved/)).toBeDefined();
    });
  });

  describe('Accessibility', () => {
    it('should have proper role attributes on cards', () => {
      renderComponent();
      
      const participantCard = screen.getByLabelText('Join as Participant');
      const proctorCard = screen.getByLabelText('Host as Proctor');
      const adminCard = screen.getByLabelText('Admin Portal');
      
      expect(participantCard.getAttribute('role')).toBe('button');
      expect(proctorCard.getAttribute('role')).toBe('button');
      expect(adminCard.getAttribute('role')).toBe('button');
    });

    it('should have tabIndex for keyboard navigation', () => {
      renderComponent();
      
      const participantCard = screen.getByLabelText('Join as Participant');
      const proctorCard = screen.getByLabelText('Host as Proctor');
      const adminCard = screen.getByLabelText('Admin Portal');
      
      expect(participantCard.getAttribute('tabIndex')).toBe('0');
      expect(proctorCard.getAttribute('tabIndex')).toBe('0');
      expect(adminCard.getAttribute('tabIndex')).toBe('0');
    });
  });
});
