import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { useSession, signOut } from 'next-auth/react'
import { useTranslation } from 'react-i18next'
import { Navbar } from '../Navbar'

jest.mock('next-auth/react', () => ({
  useSession: jest.fn(),
  signOut: jest.fn(),
}))

jest.mock('react-i18next', () => ({
  useTranslation: jest.fn(),
}))

jest.mock('next/link', () => {
  return ({ children, href, onClick }: any) => (
    <a href={href} onClick={onClick}>
      {children}
    </a>
  )
})

jest.mock('next/image', () => {
  return ({ src, alt, width, height, className }: any) => (
    <img src={src} alt={alt} width={width} height={height} className={className} />
  )
})

jest.mock('@/components/LanguageToggle', () => ({
  LanguageToggle: ({ variant }: { variant: string }) => (
    <div data-testid="language-toggle" data-variant={variant}>
      Language Toggle
    </div>
  ),
}))

const mockUseSession = useSession as jest.MockedFunction<typeof useSession>
const mockSignOut = signOut as jest.MockedFunction<typeof signOut>
const mockUseTranslation = useTranslation as jest.MockedFunction<typeof useTranslation>

describe('Navbar', () => {
  const mockT = jest.fn((key: string) => key)

  beforeEach(() => {
    jest.clearAllMocks()
    mockUseTranslation.mockReturnValue({
      t: mockT,
      i18n: { language: 'en' },
    } as any)
    mockSignOut.mockResolvedValue(undefined)
  })

  it('renders logo and brand name', () => {
    mockUseSession.mockReturnValue({ data: null, status: 'unauthenticated' })

    render(<Navbar />)

    expect(screen.getByAltText('TheraJAI Logo')).toBeInTheDocument()
    expect(screen.getByText('therajai')).toBeInTheDocument()
  })

  it('renders login and register buttons when not authenticated', () => {
    mockUseSession.mockReturnValue({ data: null, status: 'unauthenticated' })

    render(<Navbar />)

    expect(screen.getAllByText('auth.login')[0]).toBeInTheDocument()
    expect(screen.getAllByText('auth.register')[0]).toBeInTheDocument()
  })

  it('renders dashboard and logout buttons when authenticated as client', () => {
    mockUseSession.mockReturnValue({
      data: {
        user: {
          id: '1',
          email: 'client@example.com',
          name: 'Client User',
          role: 'CLIENT',
          verified: true,
        },
      },
      status: 'authenticated',
    })

    render(<Navbar />)

    expect(screen.getAllByText('dashboard.client')[0]).toBeInTheDocument()
    expect(screen.getAllByText('auth.logout')[0]).toBeInTheDocument()
  })

  it('renders dashboard and logout buttons when authenticated as therapist', () => {
    mockUseSession.mockReturnValue({
      data: {
        user: {
          id: '1',
          email: 'therapist@example.com',
          name: 'Therapist User',
          role: 'THERAPIST',
          verified: true,
        },
      },
      status: 'authenticated',
    })

    render(<Navbar />)

    expect(screen.getAllByText('dashboard.therapist')[0]).toBeInTheDocument()
    expect(screen.getAllByText('auth.logout')[0]).toBeInTheDocument()
  })

  it('handles logout correctly', async () => {
    mockUseSession.mockReturnValue({
      data: {
        user: {
          id: '1',
          email: 'user@example.com',
          name: 'User',
          role: 'CLIENT',
          verified: true,
        },
      },
      status: 'authenticated',
    })

    render(<Navbar />)

    const logoutButton = screen.getAllByText('auth.logout')[0]
    fireEvent.click(logoutButton)

    await waitFor(() => {
      expect(mockSignOut).toHaveBeenCalledWith({ callbackUrl: '/' })
    })
  })

  it('renders language toggle', () => {
    mockUseSession.mockReturnValue({ data: null, status: 'unauthenticated' })

    render(<Navbar />)

    expect(screen.getAllByTestId('language-toggle')[0]).toBeInTheDocument()
  })

  it('toggles mobile menu', () => {
    mockUseSession.mockReturnValue({ data: null, status: 'unauthenticated' })

    render(<Navbar />)

    const mobileMenuButton = screen.getByLabelText('Toggle mobile menu')
    
    // Mobile menu should be initially closed
    const mobileMenu = screen.getByRole('navigation').querySelector('.md\\:hidden.transition-all')
    expect(mobileMenu).toHaveClass('max-h-0 opacity-0')

    // Click to open mobile menu
    fireEvent.click(mobileMenuButton)
    expect(mobileMenu).toHaveClass('max-h-96 opacity-100')

    // Click to close mobile menu
    fireEvent.click(mobileMenuButton)
    expect(mobileMenu).toHaveClass('max-h-0 opacity-0')
  })

  it('closes mobile menu when clicking on mobile navigation links', () => {
    mockUseSession.mockReturnValue({ data: null, status: 'unauthenticated' })

    render(<Navbar />)

    const mobileMenuButton = screen.getByLabelText('Toggle mobile menu')
    
    // Open mobile menu
    fireEvent.click(mobileMenuButton)
    
    const mobileMenu = screen.getByRole('navigation').querySelector('.md\\:hidden.transition-all')
    expect(mobileMenu).toHaveClass('max-h-96 opacity-100')

    // Click on mobile login link
    const mobileLoginLinks = screen.getAllByText('auth.login')
    const mobileLoginLink = mobileLoginLinks.find(link => 
      link.closest('.md\\:hidden')
    )
    
    if (mobileLoginLink) {
      fireEvent.click(mobileLoginLink)
      expect(mobileMenu).toHaveClass('max-h-0 opacity-0')
    }
  })

  it('closes mobile menu when clicking logout in mobile menu', async () => {
    mockUseSession.mockReturnValue({
      data: {
        user: {
          id: '1',
          email: 'user@example.com',
          name: 'User',
          role: 'CLIENT',
          verified: true,
        },
      },
      status: 'authenticated',
    })

    render(<Navbar />)

    const mobileMenuButton = screen.getByLabelText('Toggle mobile menu')
    
    // Open mobile menu
    fireEvent.click(mobileMenuButton)
    
    const mobileMenu = screen.getByRole('navigation').querySelector('.md\\:hidden.transition-all')
    expect(mobileMenu).toHaveClass('max-h-96 opacity-100')

    // Click on mobile logout button
    const mobileLogoutButtons = screen.getAllByText('auth.logout')
    const mobileLogoutButton = mobileLogoutButtons.find(button => 
      button.closest('.md\\:hidden')
    )
    
    if (mobileLogoutButton) {
      fireEvent.click(mobileLogoutButton)
      
      await waitFor(() => {
        expect(mockSignOut).toHaveBeenCalledWith({ callbackUrl: '/' })
      })
      
      expect(mobileMenu).toHaveClass('max-h-0 opacity-0')
    }
  })

  it('displays correct navigation for different screen sizes', () => {
    mockUseSession.mockReturnValue({ data: null, status: 'unauthenticated' })

    render(<Navbar />)

    // Desktop navigation should have hidden class for mobile
    const desktopNav = screen.getByRole('navigation').querySelector('.hidden.md\\:flex')
    expect(desktopNav).toBeInTheDocument()

    // Mobile hamburger menu should have hidden class for desktop
    const mobileHamburger = screen.getByRole('navigation').querySelector('.md\\:hidden')
    expect(mobileHamburger).toBeInTheDocument()
  })

  it('applies correct styling classes', () => {
    mockUseSession.mockReturnValue({ data: null, status: 'unauthenticated' })

    render(<Navbar />)

    const nav = screen.getByRole('navigation')
    expect(nav).toHaveClass('bg-[#F6EDE5]')
    expect(nav).toHaveClass('shadow-lg')
    expect(nav).toHaveClass('border-b')
    expect(nav).toHaveClass('border-gray-200')
  })

  it('renders icons correctly', () => {
    mockUseSession.mockReturnValue({
      data: {
        user: {
          id: '1',
          email: 'user@example.com',
          name: 'User',
          role: 'CLIENT',
          verified: true,
        },
      },
      status: 'authenticated',
    })

    render(<Navbar />)

    // Check that icons are rendered (they should be in the DOM as SVG elements)
    expect(screen.getByRole('navigation')).toContainElement(
      screen.getByRole('navigation').querySelector('svg')
    )
  })

  it('uses translation function correctly', () => {
    mockUseSession.mockReturnValue({ data: null, status: 'unauthenticated' })

    render(<Navbar />)

    expect(mockT).toHaveBeenCalledWith('auth.login')
    expect(mockT).toHaveBeenCalledWith('auth.register')
  })
})