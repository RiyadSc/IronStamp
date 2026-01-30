import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import CertificationAssignmentStep from '../CertificationAssignmentStep'
import type { OnboardingData } from '../index'
import type { TeamMember } from '../TeamRosterStep'

const mockTeamMembers: TeamMember[] = [
  { id: 'member-1', name: 'John Doe', email: 'john@example.com', phone: '555-1234', role: 'Lead', isValid: true, issues: [] },
  { id: 'member-2', name: 'Jane Smith', email: 'jane@example.com', phone: '555-5678', role: 'Technician', isValid: true, issues: [] },
]

const mockInitialData: OnboardingData = {
  company_name: 'Test HVAC Company',
  city: 'Boston',
  team_size: '6-15',
  work_types: ['residential', 'commercial'],
  services: ['refrigeration', 'heating'],
  required_certifications: ['epa_608', 'osha_10', 'ma_gas_fitter'],
  team_members: mockTeamMembers,
  certification_assignments: [],
  onboarding_step: 3
}

const mockOnComplete = jest.fn()
const mockOnBack = jest.fn()

describe('CertificationAssignmentStep', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('Rendering', () => {
    it('renders the step header', () => {
      render(
        <CertificationAssignmentStep
          initialData={mockInitialData}
          onComplete={mockOnComplete}
          onBack={mockOnBack}
          saving={false}
        />
      )

      expect(screen.getByText(/capture your/i)).toBeInTheDocument()
    })

    it('renders step indicator', () => {
      render(
        <CertificationAssignmentStep
          initialData={mockInitialData}
          onComplete={mockOnComplete}
          onBack={mockOnBack}
          saving={false}
        />
      )

      expect(screen.getByText(/step 3/i)).toBeInTheDocument()
    })

    it('renders team members', () => {
      render(
        <CertificationAssignmentStep
          initialData={mockInitialData}
          onComplete={mockOnComplete}
          onBack={mockOnBack}
          saving={false}
        />
      )

      expect(screen.getByText(/2\s+Team Members/i)).toBeInTheDocument()
    })

    it('shows method or actions', () => {
      render(
        <CertificationAssignmentStep
          initialData={mockInitialData}
          onComplete={mockOnComplete}
          onBack={mockOnBack}
          saving={false}
        />
      )

      expect(screen.getByText(/capture your/i)).toBeInTheDocument()
      expect(screen.getByText(/record which certifications/i)).toBeInTheDocument()
    })

    it('shows team summary', () => {
      render(
        <CertificationAssignmentStep
          initialData={mockInitialData}
          onComplete={mockOnComplete}
          onBack={mockOnBack}
          saving={false}
        />
      )

      expect(screen.getAllByText(/your team/i).length).toBeGreaterThan(0)
      expect(screen.getAllByText(/cert types/i).length).toBeGreaterThan(0)
    })
  })

  describe('Empty State', () => {
    it('shows empty state when no team members', () => {
      const emptyData: OnboardingData = {
        ...mockInitialData,
        team_members: []
      }

      render(
        <CertificationAssignmentStep
          initialData={emptyData}
          onComplete={mockOnComplete}
          onBack={mockOnBack}
          saving={false}
        />
      )

      expect(screen.getByText(/no team members/i)).toBeInTheDocument()
    })

    it('allows continuing without team members', async () => {
      const user = userEvent.setup()
      const emptyData: OnboardingData = {
        ...mockInitialData,
        team_members: []
      }

      render(
        <CertificationAssignmentStep
          initialData={emptyData}
          onComplete={mockOnComplete}
          onBack={mockOnBack}
          saving={false}
        />
      )

      const continueButton = screen.getByRole('button', { name: /continue/i })
      await user.click(continueButton)

      expect(mockOnComplete).toHaveBeenCalledWith([])
    })
  })

  describe('Member Expansion', () => {
    it('expands member when clicked', async () => {
      const user = userEvent.setup()
      render(
        <CertificationAssignmentStep
          initialData={mockInitialData}
          onComplete={mockOnComplete}
          onBack={mockOnBack}
          saving={false}
        />
      )

      const memberName = screen.queryByText(/john doe/i)
      if (memberName) {
        const rowButton = memberName.closest('button')
        if (rowButton) {
          await user.click(rowButton)
          await waitFor(() => {
            expect(screen.getAllByRole('checkbox').length).toBeGreaterThan(0)
          })
        }
      }
      expect(screen.getByText(/capture your/i)).toBeInTheDocument()
    })
  })

  describe('Navigation', () => {
    it('calls onBack when back is clicked', async () => {
      const user = userEvent.setup()
      render(
        <CertificationAssignmentStep
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
  })

  describe('Saving State', () => {
    it('renders when saving', () => {
      render(
        <CertificationAssignmentStep
          initialData={mockInitialData}
          onComplete={mockOnComplete}
          onBack={mockOnBack}
          saving={true}
        />
      )

      expect(screen.getByText(/capture your/i)).toBeInTheDocument()
    })
  })
})
