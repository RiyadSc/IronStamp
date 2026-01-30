import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import CompanyProfileStep from '../CompanyProfileStep'
import type { OnboardingData } from '../index'

// Mock initial data
const mockInitialData: OnboardingData = {
  company_name: '',
  city: '',
  team_size: '',
  work_types: [],
  services: [],
  required_certifications: [],
  team_members: [],
  certification_assignments: [],
  onboarding_step: 0
}

const mockOnComplete = jest.fn()

describe('CompanyProfileStep', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('Rendering', () => {
    it('renders the step header', () => {
      render(
        <CompanyProfileStep
          initialData={mockInitialData}
          onComplete={mockOnComplete}
          saving={false}
        />
      )

      expect(screen.getByText(/company profile/i)).toBeInTheDocument()
    })

    it('renders IronStamp branding', () => {
      render(
        <CompanyProfileStep
          initialData={mockInitialData}
          onComplete={mockOnComplete}
          saving={false}
        />
      )

      expect(screen.getAllByAltText(/ironstamp/i).length).toBeGreaterThan(0)
    })

    it('renders team size options', () => {
      render(
        <CompanyProfileStep
          initialData={mockInitialData}
          onComplete={mockOnComplete}
          saving={false}
        />
      )

      expect(screen.getByText(/just me/i)).toBeInTheDocument()
    })

    it('renders work type options', () => {
      render(
        <CompanyProfileStep
          initialData={mockInitialData}
          onComplete={mockOnComplete}
          saving={false}
        />
      )

      expect(screen.getByText(/residential/i)).toBeInTheDocument()
      expect(screen.getByText(/commercial/i)).toBeInTheDocument()
    })

    it('renders service options', () => {
      render(
        <CompanyProfileStep
          initialData={mockInitialData}
          onComplete={mockOnComplete}
          saving={false}
        />
      )

      expect(screen.getAllByText(/refrigeration/i).length).toBeGreaterThan(0)
      expect(screen.getAllByText(/heating/i).length).toBeGreaterThan(0)
    })
  })

  describe('Form Interactions', () => {
    it('allows entering company name', async () => {
      const user = userEvent.setup()
      render(
        <CompanyProfileStep
          initialData={mockInitialData}
          onComplete={mockOnComplete}
          saving={false}
        />
      )

      const inputs = screen.getAllByRole('textbox')
      const companyInput = inputs[0]
      await user.type(companyInput, 'Test HVAC Company')
      
      expect(companyInput).toHaveValue('Test HVAC Company')
    })
  })

  describe('Saving State', () => {
    it('shows saving indicator when saving', () => {
      render(
        <CompanyProfileStep
          initialData={mockInitialData}
          onComplete={mockOnComplete}
          saving={true}
        />
      )

      expect(screen.getByText(/saving/i)).toBeInTheDocument()
    })
  })

  describe('Pre-filled Data', () => {
    it('loads initial data into form fields', () => {
      const prefilledData: OnboardingData = {
        ...mockInitialData,
        company_name: 'Pre-filled Company',
        city: 'Boston',
      }

      render(
        <CompanyProfileStep
          initialData={prefilledData}
          onComplete={mockOnComplete}
          saving={false}
        />
      )

      expect(screen.getByDisplayValue('Pre-filled Company')).toBeInTheDocument()
    })
  })
})
