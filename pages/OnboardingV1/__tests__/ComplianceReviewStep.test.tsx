import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import ComplianceReviewStep from '../ComplianceReviewStep'
import type { OnboardingData } from '../index'
import type { TeamMember } from '../TeamRosterStep'
import type { CertificationAssignment } from '../CertificationAssignmentStep'

const mockTeamMembers: TeamMember[] = [
  { id: 'member-1', name: 'John Doe', email: 'john@example.com', phone: '555-1234', role: 'Lead', isValid: true, issues: [] },
  { id: 'member-2', name: 'Jane Smith', email: 'jane@example.com', phone: '555-5678', role: 'Technician', isValid: true, issues: [] },
]

const mockAssignments: CertificationAssignment[] = [
  { memberId: 'member-1', memberName: 'John Doe', certificationId: 'epa_608', certificationName: 'EPA 608', hasCert: true, isLifetime: true },
  { memberId: 'member-1', memberName: 'John Doe', certificationId: 'osha_10', certificationName: 'OSHA 10', hasCert: true, isLifetime: true },
  { memberId: 'member-2', memberName: 'Jane Smith', certificationId: 'epa_608', certificationName: 'EPA 608', hasCert: true, isLifetime: true },
  { memberId: 'member-2', memberName: 'Jane Smith', certificationId: 'osha_10', certificationName: 'OSHA 10', hasCert: true, isLifetime: true },
]

const mockInitialData: OnboardingData = {
  company_name: 'Test HVAC Company',
  city: 'Boston',
  team_size: '6-15',
  work_types: ['residential', 'commercial'],
  services: ['refrigeration', 'gas_fitting'],
  required_certifications: ['epa_608', 'osha_10'],
  team_members: mockTeamMembers,
  certification_assignments: mockAssignments,
  onboarding_step: 4
}

const mockOnComplete = jest.fn()
const mockOnBack = jest.fn()

describe('ComplianceReviewStep', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('Rendering', () => {
    it('renders the step header', () => {
      render(
        <ComplianceReviewStep
          initialData={mockInitialData}
          onComplete={mockOnComplete}
          onBack={mockOnBack}
          saving={false}
        />
      )

      expect(screen.getByText(/compliance summary/i)).toBeInTheDocument()
    })

    it('renders step indicator', () => {
      render(
        <ComplianceReviewStep
          initialData={mockInitialData}
          onComplete={mockOnComplete}
          onBack={mockOnBack}
          saving={false}
        />
      )

      expect(screen.getByText(/step 4/i)).toBeInTheDocument()
    })

    it('shows company name', () => {
      render(
        <ComplianceReviewStep
          initialData={mockInitialData}
          onComplete={mockOnComplete}
          onBack={mockOnBack}
          saving={false}
        />
      )

      expect(screen.getByText(/test hvac company/i)).toBeInTheDocument()
    })

    it('shows team size stat', () => {
      render(
        <ComplianceReviewStep
          initialData={mockInitialData}
          onComplete={mockOnComplete}
          onBack={mockOnBack}
          saving={false}
        />
      )

      expect(screen.getByText(/team size/i)).toBeInTheDocument()
    })

    it('shows launch dashboard button', () => {
      render(
        <ComplianceReviewStep
          initialData={mockInitialData}
          onComplete={mockOnComplete}
          onBack={mockOnBack}
          saving={false}
        />
      )

      expect(screen.getByRole('button', { name: /launch dashboard/i })).toBeInTheDocument()
    })
  })

  describe('Compliance Status', () => {
    it('shows success state when fully compliant', () => {
      render(
        <ComplianceReviewStep
          initialData={mockInitialData}
          onComplete={mockOnComplete}
          onBack={mockOnBack}
          saving={false}
        />
      )

      expect(screen.getByText(/ready to go/i)).toBeInTheDocument()
    })

    it('shows compliance percentage', () => {
      render(
        <ComplianceReviewStep
          initialData={mockInitialData}
          onComplete={mockOnComplete}
          onBack={mockOnBack}
          saving={false}
        />
      )

      expect(screen.getAllByText(/100%/i).length).toBeGreaterThan(0)
    })
  })

  describe('What\'s Next Section', () => {
    it('shows what\'s next section', () => {
      render(
        <ComplianceReviewStep
          initialData={mockInitialData}
          onComplete={mockOnComplete}
          onBack={mockOnBack}
          saving={false}
        />
      )

      expect(screen.getByText(/what's next/i)).toBeInTheDocument()
    })

    it('mentions dashboard', () => {
      render(
        <ComplianceReviewStep
          initialData={mockInitialData}
          onComplete={mockOnComplete}
          onBack={mockOnBack}
          saving={false}
        />
      )

      expect(screen.getAllByText(/dashboard/i).length).toBeGreaterThan(0)
    })
  })

  describe('Navigation', () => {
    it('calls onBack when back is clicked', async () => {
      const user = userEvent.setup()
      render(
        <ComplianceReviewStep
          initialData={mockInitialData}
          onComplete={mockOnComplete}
          onBack={mockOnBack}
          saving={false}
        />
      )

      const backButtons = screen.getAllByText(/back/i)
      const backButton = backButtons[0].closest('button')
      if (backButton) {
        await user.click(backButton)
        expect(mockOnBack).toHaveBeenCalled()
      }
    })

    it('calls onComplete when launch dashboard is clicked', async () => {
      const user = userEvent.setup()
      render(
        <ComplianceReviewStep
          initialData={mockInitialData}
          onComplete={mockOnComplete}
          onBack={mockOnBack}
          saving={false}
        />
      )

      const launchButton = screen.getByRole('button', { name: /launch dashboard/i })
      await user.click(launchButton)

      expect(mockOnComplete).toHaveBeenCalled()
    })
  })

  describe('Saving State', () => {
    it('shows saving indicator when saving', () => {
      render(
        <ComplianceReviewStep
          initialData={mockInitialData}
          onComplete={mockOnComplete}
          onBack={mockOnBack}
          saving={true}
        />
      )

      expect(screen.getByText(/finishing/i)).toBeInTheDocument()
    })

    it('disables launch button when saving', () => {
      render(
        <ComplianceReviewStep
          initialData={mockInitialData}
          onComplete={mockOnComplete}
          onBack={mockOnBack}
          saving={true}
        />
      )

      const savingButton = screen.getByRole('button', { name: /finishing/i })
      expect(savingButton).toBeDisabled()
    })
  })

  describe('Empty States', () => {
    it('handles empty team members', () => {
      const emptyData: OnboardingData = {
        ...mockInitialData,
        team_members: [],
        certification_assignments: []
      }

      render(
        <ComplianceReviewStep
          initialData={emptyData}
          onComplete={mockOnComplete}
          onBack={mockOnBack}
          saving={false}
        />
      )

      // Should render without crashing
      expect(screen.getByText(/compliance summary/i)).toBeInTheDocument()
    })
  })
})
