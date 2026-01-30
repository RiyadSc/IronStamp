import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import TeamRosterStep from '../TeamRosterStep'
import type { OnboardingData } from '../index'

const mockInitialData: OnboardingData = {
  company_name: 'Test HVAC Company',
  city: 'Boston',
  team_size: '6-15',
  work_types: ['residential', 'commercial'],
  services: ['refrigeration', 'heating'],
  required_certifications: ['epa_608', 'osha_10'],
  team_members: [],
  certification_assignments: [],
  onboarding_step: 2
}

const mockOnComplete = jest.fn()
const mockOnBack = jest.fn()

describe('TeamRosterStep', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('Initial Rendering', () => {
    it('renders the step header', () => {
      render(
        <TeamRosterStep
          initialData={mockInitialData}
          onComplete={mockOnComplete}
          onBack={mockOnBack}
          saving={false}
        />
      )

      expect(screen.getByText(/add your team/i)).toBeInTheDocument()
    })

    it('renders step indicator', () => {
      render(
        <TeamRosterStep
          initialData={mockInitialData}
          onComplete={mockOnComplete}
          onBack={mockOnBack}
          saving={false}
        />
      )

      expect(screen.getByText(/step 2/i)).toBeInTheDocument()
    })

    it('shows import method selection', () => {
      render(
        <TeamRosterStep
          initialData={mockInitialData}
          onComplete={mockOnComplete}
          onBack={mockOnBack}
          saving={false}
        />
      )

      expect(screen.getByText(/upload spreadsheet/i)).toBeInTheDocument()
      expect(screen.getByText(/paste from anywhere/i)).toBeInTheDocument()
      expect(screen.getByText(/enter manually/i)).toBeInTheDocument()
    })

    it('shows recommended badge', () => {
      render(
        <TeamRosterStep
          initialData={mockInitialData}
          onComplete={mockOnComplete}
          onBack={mockOnBack}
          saving={false}
        />
      )

      expect(screen.getByText(/recommended/i)).toBeInTheDocument()
    })

    it('shows skip option', () => {
      render(
        <TeamRosterStep
          initialData={mockInitialData}
          onComplete={mockOnComplete}
          onBack={mockOnBack}
          saving={false}
        />
      )

      expect(screen.getByText(/skip for now/i)).toBeInTheDocument()
    })

    it('shows company name', () => {
      render(
        <TeamRosterStep
          initialData={mockInitialData}
          onComplete={mockOnComplete}
          onBack={mockOnBack}
          saving={false}
        />
      )

      expect(screen.getByText(/test hvac company/i)).toBeInTheDocument()
    })
  })

  describe('Import Method Selection', () => {
    it('switches to paste view when clicked', async () => {
      const user = userEvent.setup()
      render(
        <TeamRosterStep
          initialData={mockInitialData}
          onComplete={mockOnComplete}
          onBack={mockOnBack}
          saving={false}
        />
      )

      const pasteButton = screen.getByText(/paste from anywhere/i).closest('button')
      if (pasteButton) {
        await user.click(pasteButton)
        expect(screen.getByPlaceholderText(/paste your team list/i)).toBeInTheDocument()
      }
    })
  })

  describe('Navigation', () => {
    it('calls onBack when back is clicked', async () => {
      const user = userEvent.setup()
      render(
        <TeamRosterStep
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

    it('allows skipping', async () => {
      const user = userEvent.setup()
      render(
        <TeamRosterStep
          initialData={mockInitialData}
          onComplete={mockOnComplete}
          onBack={mockOnBack}
          saving={false}
        />
      )

      const skipButton = screen.getByText(/skip for now/i)
      await user.click(skipButton)

      expect(mockOnComplete).toHaveBeenCalledWith([])
    })
  })
})
