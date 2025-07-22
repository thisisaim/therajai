import { render, screen, fireEvent } from '@testing-library/react'
import { Button } from '../button'

describe('Button', () => {
  it('renders correctly', () => {
    render(<Button>Click me</Button>)
    expect(screen.getByRole('button')).toBeInTheDocument()
    expect(screen.getByText('Click me')).toBeInTheDocument()
  })

  it('applies default variant and size', () => {
    render(<Button>Default Button</Button>)
    const button = screen.getByRole('button')
    expect(button).toHaveClass('bg-gradient-to-r')
    expect(button).toHaveClass('from-primary-600')
    expect(button).toHaveClass('to-primary-700')
    expect(button).toHaveClass('h-10')
    expect(button).toHaveClass('px-4')
    expect(button).toHaveClass('py-2')
    expect(button).toHaveClass('text-sm')
  })

  it('applies outline variant correctly', () => {
    render(<Button variant="outline">Outline Button</Button>)
    const button = screen.getByRole('button')
    expect(button).toHaveClass('border-2')
    expect(button).toHaveClass('border-primary-500')
    expect(button).toHaveClass('text-primary-600')
  })

  it('applies ghost variant correctly', () => {
    render(<Button variant="ghost">Ghost Button</Button>)
    const button = screen.getByRole('button')
    expect(button).toHaveClass('text-neutral-600')
    expect(button).toHaveClass('hover:bg-neutral-100')
  })

  it('applies link variant correctly', () => {
    render(<Button variant="link">Link Button</Button>)
    const button = screen.getByRole('button')
    expect(button).toHaveClass('text-primary-600')
    expect(button).toHaveClass('underline-offset-4')
  })

  it('applies success variant correctly', () => {
    render(<Button variant="success">Success Button</Button>)
    const button = screen.getByRole('button')
    expect(button).toHaveClass('from-success-600')
    expect(button).toHaveClass('to-success-700')
  })

  it('applies warning variant correctly', () => {
    render(<Button variant="warning">Warning Button</Button>)
    const button = screen.getByRole('button')
    expect(button).toHaveClass('from-warning-600')
    expect(button).toHaveClass('to-warning-700')
  })

  it('applies error variant correctly', () => {
    render(<Button variant="error">Error Button</Button>)
    const button = screen.getByRole('button')
    expect(button).toHaveClass('from-error-600')
    expect(button).toHaveClass('to-error-700')
  })

  it('applies secondary variant correctly', () => {
    render(<Button variant="secondary">Secondary Button</Button>)
    const button = screen.getByRole('button')
    expect(button).toHaveClass('from-secondary-600')
    expect(button).toHaveClass('to-secondary-700')
  })

  it('applies sm size correctly', () => {
    render(<Button size="sm">Small Button</Button>)
    const button = screen.getByRole('button')
    expect(button).toHaveClass('h-8')
    expect(button).toHaveClass('px-3')
    expect(button).toHaveClass('py-1')
    expect(button).toHaveClass('text-xs')
  })

  it('applies lg size correctly', () => {
    render(<Button size="lg">Large Button</Button>)
    const button = screen.getByRole('button')
    expect(button).toHaveClass('h-12')
    expect(button).toHaveClass('px-8')
    expect(button).toHaveClass('py-3')
    expect(button).toHaveClass('text-base')
  })

  it('applies xl size correctly', () => {
    render(<Button size="xl">Extra Large Button</Button>)
    const button = screen.getByRole('button')
    expect(button).toHaveClass('h-14')
    expect(button).toHaveClass('px-10')
    expect(button).toHaveClass('py-4')
    expect(button).toHaveClass('text-lg')
  })

  it('applies icon size correctly', () => {
    render(<Button size="icon">Icon</Button>)
    const button = screen.getByRole('button')
    expect(button).toHaveClass('h-10')
    expect(button).toHaveClass('w-10')
  })

  it('applies custom className', () => {
    render(<Button className="custom-class">Custom Button</Button>)
    const button = screen.getByRole('button')
    expect(button).toHaveClass('custom-class')
  })

  it('handles click events', () => {
    const handleClick = jest.fn()
    render(<Button onClick={handleClick}>Click me</Button>)
    
    const button = screen.getByRole('button')
    fireEvent.click(button)
    
    expect(handleClick).toHaveBeenCalledTimes(1)
  })

  it('is disabled when disabled prop is true', () => {
    render(<Button disabled>Disabled Button</Button>)
    const button = screen.getByRole('button')
    expect(button).toBeDisabled()
    expect(button).toHaveClass('disabled:opacity-50')
    expect(button).toHaveClass('disabled:pointer-events-none')
  })

  it('shows loading state', () => {
    render(<Button loading>Loading Button</Button>)
    const button = screen.getByRole('button')
    expect(button).toBeDisabled()
    expect(button).toHaveClass('disabled:opacity-50')
    expect(screen.getByText('Loading Button')).toBeInTheDocument()
    
    const spinner = button.querySelector('.animate-spin')
    expect(spinner).toBeInTheDocument()
  })

  it('is disabled when loading is true', () => {
    const handleClick = jest.fn()
    render(<Button loading onClick={handleClick}>Loading Button</Button>)
    
    const button = screen.getByRole('button')
    fireEvent.click(button)
    
    expect(button).toBeDisabled()
    expect(handleClick).not.toHaveBeenCalled()
  })

  it('renders as span when asChild is true', () => {
    render(<Button asChild>As Child</Button>)
    const span = screen.getByText('As Child')
    expect(span.tagName).toBe('SPAN')
    expect(span).toHaveClass('inline-flex')
    expect(span).toHaveClass('items-center')
    expect(span).toHaveClass('justify-center')
  })

  it('applies disabled styles when asChild and disabled', () => {
    render(<Button asChild disabled>Disabled Child</Button>)
    const span = screen.getByText('Disabled Child')
    expect(span).toHaveClass('opacity-50')
    expect(span).toHaveClass('pointer-events-none')
    expect(span).toHaveClass('transform-none')
  })

  it('applies disabled styles when asChild and loading', () => {
    const { container } = render(<Button asChild loading>Loading Child</Button>)
    const span = container.querySelector('span')
    expect(span).toHaveClass('opacity-50')
    expect(span).toHaveClass('pointer-events-none')
    expect(span).toHaveClass('transform-none')
  })

  it('shows loading spinner when asChild and loading', () => {
    const { container } = render(<Button asChild loading>Loading Child</Button>)
    const spinner = container.querySelector('.animate-spin')
    expect(spinner).toBeInTheDocument()
    expect(screen.getByText('Loading Child')).toBeInTheDocument()
  })

  it('forwards ref correctly', () => {
    const ref = jest.fn()
    render(<Button ref={ref}>Button with ref</Button>)
    expect(ref).toHaveBeenCalledWith(expect.any(HTMLButtonElement))
  })

  it('has correct display name', () => {
    expect(Button.displayName).toBe('Button')
  })

  it('applies focus styles correctly', () => {
    render(<Button>Focus Button</Button>)
    const button = screen.getByRole('button')
    expect(button).toHaveClass('focus-visible:outline-none')
    expect(button).toHaveClass('focus-visible:ring-2')
    expect(button).toHaveClass('focus-visible:ring-primary-500')
    expect(button).toHaveClass('focus-visible:ring-offset-2')
  })

  it('applies hover and active states correctly', () => {
    render(<Button>Hover Button</Button>)
    const button = screen.getByRole('button')
    expect(button).toHaveClass('hover:from-primary-700')
    expect(button).toHaveClass('hover:to-primary-800')
    expect(button).toHaveClass('hover:shadow-xl')
    expect(button).toHaveClass('transform')
    expect(button).toHaveClass('hover:scale-[1.02]')
    expect(button).toHaveClass('active:scale-[0.98]')
  })
})