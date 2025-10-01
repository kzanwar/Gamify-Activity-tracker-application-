/**
 * @jest-environment jsdom
 */

import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { SettingsManager } from '../../src/components/SettingsManager'

// Mock fetch
global.fetch = jest.fn()

describe('SettingsManager', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    fetch.mockClear()
  })

  const mockCategories = [
    {
      id: 'cat-1',
      name: 'Professional',
      color: '#3b82f6',
      activities: [
        {
          id: 'act-1',
          name: 'Code Review',
          points: 10,
          type: 'fixed',
          focusScoringType: 'multiplier',
          focusLevels: { low: 0.5, medium: 1.0, good: 1.5, zen: 2.0 },
          loggedActivitiesCount: 5
        }
      ]
    },
    {
      id: 'cat-2',
      name: 'Health',
      color: '#10b981',
      activities: []
    }
  ]

  it('should render with activities tab active by default', async () => {
    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ categories: mockCategories })
    })

    render(<SettingsManager />)

    await waitFor(() => {
      expect(screen.getByText('Manage Activities')).toBeInTheDocument()
    })

    expect(screen.getByText('Add New Activity')).toBeInTheDocument()
    expect(screen.getByText('Your Activities')).toBeInTheDocument()
  })

  it('should switch between tabs', async () => {
    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ categories: mockCategories })
    })

    render(<SettingsManager />)

    await waitFor(() => {
      expect(screen.getByText('Manage Activities')).toBeInTheDocument()
    })

    // Click on Profile tab
    const profileTab = screen.getByText('Profile')
    await userEvent.click(profileTab)

    expect(screen.getByText('Profile Settings')).toBeInTheDocument()
    expect(screen.getByText('Full Name')).toBeInTheDocument()
    expect(screen.getByText('Email')).toBeInTheDocument()
  })

  it('should add new activity', async () => {
    fetch
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ categories: mockCategories })
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ activity: { id: 'new-act', name: 'New Activity' } })
      })

    render(<SettingsManager />)

    await waitFor(() => {
      expect(screen.getByText('Manage Activities')).toBeInTheDocument()
    })

    // Fill out the form
    const categorySelect = screen.getByRole('combobox', { name: /category/i })
    await userEvent.selectOptions(categorySelect, 'cat-1')

    const nameInput = screen.getByRole('textbox', { name: /activity name/i })
    await userEvent.type(nameInput, 'New Activity')

    const pointsInput = screen.getByRole('spinbutton', { name: /base points value/i })
    await userEvent.type(pointsInput, '15')

    // Fill focus levels
    const lowInput = screen.getByDisplayValue('')
    const mediumInput = screen.getAllByDisplayValue('')[1]
    const goodInput = screen.getAllByDisplayValue('')[2]
    const zenInput = screen.getAllByDisplayValue('')[3]

    await userEvent.type(lowInput, '0.5')
    await userEvent.type(mediumInput, '1.0')
    await userEvent.type(goodInput, '1.5')
    await userEvent.type(zenInput, '2.0')

    const submitButton = screen.getByRole('button', { name: /add activity/i })
    await userEvent.click(submitButton)

    await waitFor(() => {
      expect(screen.getByText(/Activity added successfully/)).toBeInTheDocument()
    })
  })

  it('should edit existing activity', async () => {
    fetch
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ categories: mockCategories })
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ activity: { id: 'act-1', name: 'Updated Code Review' } })
      })

    render(<SettingsManager />)

    await waitFor(() => {
      expect(screen.getByText('Manage Activities')).toBeInTheDocument()
    })

    // Click edit button
    const editButton = screen.getByTitle('Edit activity')
    await userEvent.click(editButton)

    await waitFor(() => {
      expect(screen.getByText('Edit Activity')).toBeInTheDocument()
    })

    // Update the name
    const nameInput = screen.getByDisplayValue('Code Review')
    await userEvent.clear(nameInput)
    await userEvent.type(nameInput, 'Updated Code Review')

    const updateButton = screen.getByRole('button', { name: /update activity/i })
    await userEvent.click(updateButton)

    await waitFor(() => {
      expect(screen.getByText(/Activity updated successfully/)).toBeInTheDocument()
    })
  })

  it('should delete activity without logged activities', async () => {
    // Mock window.confirm
    window.confirm = jest.fn(() => true)

    fetch
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ categories: mockCategories })
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ message: 'Activity deleted successfully' })
      })

    render(<SettingsManager />)

    await waitFor(() => {
      expect(screen.getByText('Manage Activities')).toBeInTheDocument()
    })

    // Click delete button
    const deleteButton = screen.getByTitle('Delete activity')
    await userEvent.click(deleteButton)

    expect(window.confirm).toHaveBeenCalled()

    await waitFor(() => {
      expect(screen.getByText(/Activity "Code Review" deleted successfully/)).toBeInTheDocument()
    })
  })

  it('should delete activity with logged activities when confirmed', async () => {
    // Mock window.confirm to return true for both confirmations
    window.confirm = jest.fn(() => true)

    const categoriesWithLoggedActivities = [
      {
        ...mockCategories[0],
        activities: [
          {
            ...mockCategories[0].activities[0],
            loggedActivitiesCount: 3
          }
        ]
      }
    ]

    fetch
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ categories: categoriesWithLoggedActivities })
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ message: 'Activity and all its logged activities deleted successfully' })
      })

    render(<SettingsManager />)

    await waitFor(() => {
      expect(screen.getByText('Manage Activities')).toBeInTheDocument()
    })

    // Click delete button
    const deleteButton = screen.getByTitle('Delete activity')
    await userEvent.click(deleteButton)

    expect(window.confirm).toHaveBeenCalledWith(
      expect.stringContaining('This activity has logged activities associated with it')
    )

    await waitFor(() => {
      expect(screen.getByText(/Activity "Code Review" and all its logged activities deleted successfully/)).toBeInTheDocument()
    })
  })

  it('should toggle activity type between fixed and time-based', async () => {
    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ categories: mockCategories })
    })

    render(<SettingsManager />)

    await waitFor(() => {
      expect(screen.getByText('Manage Activities')).toBeInTheDocument()
    })

    // Check initial state (should be fixed)
    expect(screen.getByText('Fixed Points')).toBeInTheDocument()

    // Click the toggle
    const toggle = screen.getByRole('button', { name: /activity type/i })
    await userEvent.click(toggle)

    // Should now show time-based
    expect(screen.getByText('Time-Based')).toBeInTheDocument()
  })

  it('should toggle focus scoring method between multiplier and fixed points', async () => {
    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ categories: mockCategories })
    })

    render(<SettingsManager />)

    await waitFor(() => {
      expect(screen.getByText('Manage Activities')).toBeInTheDocument()
    })

    // Check initial state (should be multiplier)
    expect(screen.getByText('× Multipliers')).toBeInTheDocument()

    // Click the toggle
    const toggle = screen.getByRole('button', { name: /focus scoring method/i })
    await userEvent.click(toggle)

    // Should now show fixed points
    expect(screen.getByText('Fixed Points')).toBeInTheDocument()
  })

  it('should show example calculation', async () => {
    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ categories: mockCategories })
    })

    render(<SettingsManager />)

    await waitFor(() => {
      expect(screen.getByText('Manage Activities')).toBeInTheDocument()
    })

    // Fill out form
    const categorySelect = screen.getByRole('combobox', { name: /category/i })
    await userEvent.selectOptions(categorySelect, 'cat-1')

    const nameInput = screen.getByRole('textbox', { name: /activity name/i })
    await userEvent.type(nameInput, 'Test Activity')

    const pointsInput = screen.getByRole('spinbutton', { name: /base points value/i })
    await userEvent.type(pointsInput, '10')

    // Fill focus levels
    const goodInput = screen.getAllByDisplayValue('')[2]
    await userEvent.type(goodInput, '1.5')

    // Should show example calculation
    expect(screen.getByText(/10 base points × 1.5 \(Good Focus\) = 15.0 points/)).toBeInTheDocument()
  })

  it('should validate required fields', async () => {
    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ categories: mockCategories })
    })

    render(<SettingsManager />)

    await waitFor(() => {
      expect(screen.getByText('Manage Activities')).toBeInTheDocument()
    })

    // Try to submit without filling required fields
    const submitButton = screen.getByRole('button', { name: /add activity/i })
    await userEvent.click(submitButton)

    await waitFor(() => {
      expect(screen.getByText('Please fill in all focus level multipliers')).toBeInTheDocument()
    })
  })

  it('should show existing activities with correct information', async () => {
    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ categories: mockCategories })
    })

    render(<SettingsManager />)

    await waitFor(() => {
      expect(screen.getByText('Manage Activities')).toBeInTheDocument()
    })

    // Check that existing activity is displayed correctly
    expect(screen.getByText('Code Review')).toBeInTheDocument()
    expect(screen.getByText('Fixed')).toBeInTheDocument()
    expect(screen.getByText('× Multiplier')).toBeInTheDocument()
    expect(screen.getByText('Base: +10 points')).toBeInTheDocument()
  })
})
