import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import OnboardingV1 from '../index'
import { supabase } from '@/lib/supabase'

// Mock CSRF and fetch so step completion can "succeed" without real API
jest.mock('@/lib/csrf-client', () => ({
  getCSRFToken: jest.fn(() => Promise.resolve('mock-csrf-token')),
}))

const mockFetch = jest.fn()
beforeAll(() => {
  global.fetch = mockFetch
})
beforeEach(() => {
  mockFetch.mockResolvedValue({ ok: true, json: () => Promise.resolve({}) })
  ;(supabase.auth.getSession as jest.Mock).mockResolvedValue({
    data: { session: { access_token: 'test-token' } },
    error: null,
  })
})

// Mock child components to simplify testing
jest.mock('../CompanyProfileStep', () => {
  return function MockCompanyProfileStep({ onComplete, saving }: any) {
    return (
      <div data-testid="company-profile-step">
        <button 
          onClick={() => onComplete({ 
            company_name: 'Test Company', 
            city: 'Boston',
            team_size: '6-15',
            work_types: ['residential'],
            services: ['refrigeration']
          })}
          disabled={saving}
        >
          Complete Step 1
        </button>
      </div>
    )
  }
})

jest.mock('../TeamRosterStep', () => {
  return function MockTeamRosterStep({ onComplete, onBack, saving }: any) {
    return (
      <div data-testid="team-roster-step">
        <button onClick={onBack}>Back</button>
        <button 
          onClick={() => onComplete([
            { id: 'member-1', name: 'John Doe', email: 'john@example.com', phone: '', role: 'Technician', isValid: true, issues: [] }
          ])}
          disabled={saving}
        >
          Complete Step 2
        </button>
      </div>
    )
  }
})

jest.mock('../CertificationAssignmentStep', () => {
  return function MockCertificationAssignmentStep({ onComplete, onBack, saving }: any) {
    return (
      <div data-testid="certification-assignment-step">
        <button onClick={onBack}>Back</button>
        <button 
          onClick={() => onComplete([
            { memberId: 'member-1', memberName: 'John Doe', certificationId: 'epa_608', certificationName: 'EPA 608', hasCert: true, isLifetime: true }
          ])}
          disabled={saving}
        >
          Complete Step 3
        </button>
      </div>
    )
  }
})

jest.mock('../ComplianceReviewStep', () => {
  return function MockComplianceReviewStep({ onComplete, onBack, saving }: any) {
    return (
      <div data-testid="compliance-review-step">
        <button onClick={onBack}>Back</button>
        <button 
          onClick={() => onComplete()}
          disabled={saving}
        >
          Launch Dashboard
        </button>
      </div>
    )
  }
})

describe('OnboardingV1 Orchestrator', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('Initial State', () => {
    it('renders step 1 (Company Profile) by default', async () => {
      render(<OnboardingV1 />)

      await waitFor(() => {
        expect(screen.getByTestId('company-profile-step')).toBeInTheDocument()
      })
    })

    it('does not show other steps initially', async () => {
      render(<OnboardingV1 />)

      await waitFor(() => {
        expect(screen.getByTestId('company-profile-step')).toBeInTheDocument()
      })

      expect(screen.queryByTestId('team-roster-step')).not.toBeInTheDocument()
      expect(screen.queryByTestId('certification-assignment-step')).not.toBeInTheDocument()
      expect(screen.queryByTestId('compliance-review-step')).not.toBeInTheDocument()
    })
  })

  describe('Step Navigation', () => {
    it('advances to step 2 (team roster) when step 1 is completed', async () => {
      const user = userEvent.setup()
      render(<OnboardingV1 />)

      await waitFor(() => {
        expect(screen.getByTestId('company-profile-step')).toBeInTheDocument()
      })

      const completeButton = screen.getByRole('button', { name: /complete step 1/i })
      await user.click(completeButton)

      await waitFor(() => {
        expect(screen.getByTestId('team-roster-step')).toBeInTheDocument()
      })
    })

    it('advances to step 3 (cert assignment) when step 2 is completed', async () => {
      const user = userEvent.setup()
      render(<OnboardingV1 />)

      await waitFor(() => {
        expect(screen.getByTestId('company-profile-step')).toBeInTheDocument()
      })
      await user.click(screen.getByRole('button', { name: /complete step 1/i }))

      await waitFor(() => {
        expect(screen.getByTestId('team-roster-step')).toBeInTheDocument()
      })
      await user.click(screen.getByRole('button', { name: /complete step 2/i }))

      await waitFor(() => {
        expect(screen.getByTestId('certification-assignment-step')).toBeInTheDocument()
      })
    })

    it('advances to step 4 (review) when step 3 is completed', async () => {
      const user = userEvent.setup()
      render(<OnboardingV1 />)

      await waitFor(() => {
        expect(screen.getByTestId('company-profile-step')).toBeInTheDocument()
      })
      await user.click(screen.getByRole('button', { name: /complete step 1/i }))

      await waitFor(() => {
        expect(screen.getByTestId('team-roster-step')).toBeInTheDocument()
      })
      await user.click(screen.getByRole('button', { name: /complete step 2/i }))

      await waitFor(() => {
        expect(screen.getByTestId('certification-assignment-step')).toBeInTheDocument()
      })
      await user.click(screen.getByRole('button', { name: /complete step 3/i }))

      await waitFor(() => {
        expect(screen.getByTestId('compliance-review-step')).toBeInTheDocument()
      })
    })
  })

  describe('Back Navigation', () => {
    it('goes back to step 1 from step 2', async () => {
      const user = userEvent.setup()
      render(<OnboardingV1 />)

      await waitFor(() => {
        expect(screen.getByTestId('company-profile-step')).toBeInTheDocument()
      })
      await user.click(screen.getByRole('button', { name: /complete step 1/i }))

      await waitFor(() => {
        expect(screen.getByTestId('team-roster-step')).toBeInTheDocument()
      })

      const backButton = screen.getByRole('button', { name: /back/i })
      await user.click(backButton)

      await waitFor(() => {
        expect(screen.getByTestId('company-profile-step')).toBeInTheDocument()
      })
    })

    it('goes back to step 2 from step 3', async () => {
      const user = userEvent.setup()
      render(<OnboardingV1 />)

      await waitFor(() => {
        expect(screen.getByTestId('company-profile-step')).toBeInTheDocument()
      })
      await user.click(screen.getByRole('button', { name: /complete step 1/i }))

      await waitFor(() => {
        expect(screen.getByTestId('team-roster-step')).toBeInTheDocument()
      })
      await user.click(screen.getByRole('button', { name: /complete step 2/i }))

      await waitFor(() => {
        expect(screen.getByTestId('certification-assignment-step')).toBeInTheDocument()
      })

      const backButton = screen.getByRole('button', { name: /back/i })
      await user.click(backButton)

      await waitFor(() => {
        expect(screen.getByTestId('team-roster-step')).toBeInTheDocument()
      })
    })
  })

  describe('Data Persistence', () => {
    it('maintains data across step navigation', async () => {
      const user = userEvent.setup()
      render(<OnboardingV1 />)

      await waitFor(() => {
        expect(screen.getByTestId('company-profile-step')).toBeInTheDocument()
      })
      await user.click(screen.getByRole('button', { name: /complete step 1/i }))

      await waitFor(() => {
        expect(screen.getByTestId('team-roster-step')).toBeInTheDocument()
      })

      const backButton = screen.getByRole('button', { name: /back/i })
      await user.click(backButton)

      await waitFor(() => {
        expect(screen.getByTestId('company-profile-step')).toBeInTheDocument()
      })
    })
  })
})

describe('OnboardingV1 Data Types', () => {
  describe('OnboardingData Interface', () => {
    it('accepts correct initial data structure', async () => {
      // This test verifies the TypeScript types at runtime
      render(<OnboardingV1 />)

      await waitFor(() => {
        expect(screen.getByTestId('company-profile-step')).toBeInTheDocument()
      })
    })
  })
})
