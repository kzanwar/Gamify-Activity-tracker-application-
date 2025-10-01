/**
 * @jest-environment jsdom
 */

import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { LogActivityForm } from '../../src/components/LogActivityForm'

// Mock Next.js router
const mockPush = jest.fn()
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
  }),
}))

// Mock fetch
global.fetch = jest.fn()

describe('LogActivityForm', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    fetch.mockClear()
  })

  const mockCategories = [
    { id: 'cat-1', name: 'Professional', color: '#3b82f6' },
    { id: 'cat-2', name: 'Health', color: '#10b981' }
  ]

  const mockActivities = [
    {
      id: 'act-1',
      name: 'Code Review',
      points: 10,
      type: 'fixed',
      focusScoringType: 'multiplier',
      focusLevels: { low: 0.5, medium: 1.0, good: 1.5, zen: 2.0 },
      pointCategory: mockCategories[0]
    },
    {
      id: 'act-2',
      name: 'Morning Run',
      points: 0,
      type: 'time_based',
      focusScoringType: 'multiplier',
      focusLevels: { low: 0.5, medium: 1.0, good: 1.5, zen: 2.0 },
      pointCategory: mockCategories[1]
    }
  ]

  it('should render form with category selection', async () => {
    fetch
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ categories: mockCategories })
      })

    render(<LogActivityForm />)

    await waitFor(() => {
      expect(screen.getByText('Select Category')).toBeInTheDocument()
    })

    expect(screen.getByRole('combobox', { name: /select category/i })).toBeInTheDocument()
  })

  it('should load activities when category is selected', async () => {
    fetch
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ categories: mockCategories })
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ activities: mockActivities })
      })

    render(<LogActivityForm />)

    await waitFor(() => {
      expect(screen.getByText('Select Category')).toBeInTheDocument()
    })

    const categorySelect = screen.getByRole('combobox', { name: /select category/i })
    await userEvent.selectOptions(categorySelect, 'cat-1')

    await waitFor(() => {
      expect(screen.getByText('Select Activity')).toBeInTheDocument()
    })

    expect(screen.getByRole('combobox', { name: /select activity/i })).toBeInTheDocument()
  })

  it('should show activity info panel when activity is selected', async () => {
    fetch
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ categories: mockCategories })
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ activities: mockActivities })
      })

    render(<LogActivityForm />)

    await waitFor(() => {
      expect(screen.getByText('Select Category')).toBeInTheDocument()
    })

    const categorySelect = screen.getByRole('combobox', { name: /select category/i })
    await userEvent.selectOptions(categorySelect, 'cat-1')

    await waitFor(() => {
      expect(screen.getByText('Select Activity')).toBeInTheDocument()
    })

    const activitySelect = screen.getByRole('combobox', { name: /select activity/i })
    await userEvent.selectOptions(activitySelect, 'act-1')

    await waitFor(() => {
      expect(screen.getByText('Code Review')).toBeInTheDocument()
    })

    expect(screen.getByText('Fixed Points')).toBeInTheDocument()
    expect(screen.getByText('× Multipliers')).toBeInTheDocument()
  })

  it('should show points preview for fixed activity', async () => {
    fetch
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ categories: mockCategories })
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ activities: mockActivities })
      })

    render(<LogActivityForm />)

    await waitFor(() => {
      expect(screen.getByText('Select Category')).toBeInTheDocument()
    })

    const categorySelect = screen.getByRole('combobox', { name: /select category/i })
    await userEvent.selectOptions(categorySelect, 'cat-1')

    await waitFor(() => {
      expect(screen.getByText('Select Activity')).toBeInTheDocument()
    })

    const activitySelect = screen.getByRole('combobox', { name: /select activity/i })
    await userEvent.selectOptions(activitySelect, 'act-1')

    await waitFor(() => {
      expect(screen.getByText('Code Review')).toBeInTheDocument()
    })

    const focusSelect = screen.getByRole('combobox', { name: /focus level/i })
    await userEvent.selectOptions(focusSelect, 'good')

    await waitFor(() => {
      expect(screen.getByText(/Expected Points: 15/)).toBeInTheDocument()
    })
  })

  it('should show time-based activity requirements', async () => {
    fetch
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ categories: mockCategories })
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ activities: mockActivities })
      })

    render(<LogActivityForm />)

    await waitFor(() => {
      expect(screen.getByText('Select Category')).toBeInTheDocument()
    })

    const categorySelect = screen.getByRole('combobox', { name: /select category/i })
    await userEvent.selectOptions(categorySelect, 'cat-2')

    await waitFor(() => {
      expect(screen.getByText('Select Activity')).toBeInTheDocument()
    })

    const activitySelect = screen.getByRole('combobox', { name: /select activity/i })
    await userEvent.selectOptions(activitySelect, 'act-2')

    await waitFor(() => {
      expect(screen.getByText('Morning Run')).toBeInTheDocument()
    })

    expect(screen.getByText('Time-Based')).toBeInTheDocument()
    expect(screen.getByText('Requires: Start & End Time')).toBeInTheDocument()
  })

  it('should calculate points for time-based activity', async () => {
    fetch
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ categories: mockCategories })
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ activities: mockActivities })
      })

    render(<LogActivityForm />)

    await waitFor(() => {
      expect(screen.getByText('Select Category')).toBeInTheDocument()
    })

    const categorySelect = screen.getByRole('combobox', { name: /select category/i })
    await userEvent.selectOptions(categorySelect, 'cat-2')

    await waitFor(() => {
      expect(screen.getByText('Select Activity')).toBeInTheDocument()
    })

    const activitySelect = screen.getByRole('combobox', { name: /select activity/i })
    await userEvent.selectOptions(activitySelect, 'act-2')

    await waitFor(() => {
      expect(screen.getByText('Morning Run')).toBeInTheDocument()
    })

    // Set start and end times
    const startTimeInput = screen.getByDisplayValue('')
    const endTimeInput = screen.getAllByDisplayValue('')[1]
    
    fireEvent.change(startTimeInput, { target: { value: '09:00' } })
    fireEvent.change(endTimeInput, { target: { value: '10:00' } })

    const focusSelect = screen.getByRole('combobox', { name: /focus level/i })
    await userEvent.selectOptions(focusSelect, 'good')

    await waitFor(() => {
      expect(screen.getByText(/Expected Points: 90/)).toBeInTheDocument()
    })
  })

  it('should submit form successfully', async () => {
    fetch
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ categories: mockCategories })
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ activities: mockActivities })
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ message: 'Activity logged successfully!' })
      })

    render(<LogActivityForm />)

    await waitFor(() => {
      expect(screen.getByText('Select Category')).toBeInTheDocument()
    })

    const categorySelect = screen.getByRole('combobox', { name: /select category/i })
    await userEvent.selectOptions(categorySelect, 'cat-1')

    await waitFor(() => {
      expect(screen.getByText('Select Activity')).toBeInTheDocument()
    })

    const activitySelect = screen.getByRole('combobox', { name: /select activity/i })
    await userEvent.selectOptions(activitySelect, 'act-1')

    await waitFor(() => {
      expect(screen.getByText('Code Review')).toBeInTheDocument()
    })

    const focusSelect = screen.getByRole('combobox', { name: /focus level/i })
    await userEvent.selectOptions(focusSelect, 'good')

    const submitButton = screen.getByRole('button', { name: /log activity/i })
    await userEvent.click(submitButton)

    await waitFor(() => {
      expect(screen.getByText(/Activity logged successfully/)).toBeInTheDocument()
    })

    expect(mockPush).toHaveBeenCalledWith('/dashboard')
  })

  it('should show error message on failed submission', async () => {
    fetch
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ categories: mockCategories })
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ activities: mockActivities })
      })
      .mockResolvedValueOnce({
        ok: false,
        json: async () => ({ error: 'Failed to log activity' })
      })

    render(<LogActivityForm />)

    await waitFor(() => {
      expect(screen.getByText('Select Category')).toBeInTheDocument()
    })

    const categorySelect = screen.getByRole('combobox', { name: /select category/i })
    await userEvent.selectOptions(categorySelect, 'cat-1')

    await waitFor(() => {
      expect(screen.getByText('Select Activity')).toBeInTheDocument()
    })

    const activitySelect = screen.getByRole('combobox', { name: /select activity/i })
    await userEvent.selectOptions(activitySelect, 'act-1')

    await waitFor(() => {
      expect(screen.getByText('Code Review')).toBeInTheDocument()
    })

    const focusSelect = screen.getByRole('combobox', { name: /focus level/i })
    await userEvent.selectOptions(focusSelect, 'good')

    const submitButton = screen.getByRole('button', { name: /log activity/i })
    await userEvent.click(submitButton)

    await waitFor(() => {
      expect(screen.getByText('Failed to log activity')).toBeInTheDocument()
    })
  })

  it('should validate required fields', async () => {
    fetch
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ categories: mockCategories })
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ activities: mockActivities })
      })

    render(<LogActivityForm />)

    await waitFor(() => {
      expect(screen.getByText('Select Category')).toBeInTheDocument()
    })

    const categorySelect = screen.getByRole('combobox', { name: /select category/i })
    await userEvent.selectOptions(categorySelect, 'cat-1')

    await waitFor(() => {
      expect(screen.getByText('Select Activity')).toBeInTheDocument()
    })

    const activitySelect = screen.getByRole('combobox', { name: /select activity/i })
    await userEvent.selectOptions(activitySelect, 'act-1')

    await waitFor(() => {
      expect(screen.getByText('Code Review')).toBeInTheDocument()
    })

    // Try to submit without selecting focus level
    const submitButton = screen.getByRole('button', { name: /log activity/i })
    await userEvent.click(submitButton)

    await waitFor(() => {
      expect(screen.getByText('Focus level is required for all activities')).toBeInTheDocument()
    })
  })
})
