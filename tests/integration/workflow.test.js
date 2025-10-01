/**
 * @jest-environment jsdom
 */

import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

// Mock Next.js router
const mockPush = jest.fn()
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
  }),
}))

// Mock fetch
global.fetch = jest.fn()

describe('Complete User Workflows', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    fetch.mockClear()
  })

  describe('Activity Management Workflow', () => {
    it('should complete full activity lifecycle: create -> edit -> log -> delete', async () => {
      // Mock initial data
      const mockCategories = [
        { id: 'cat-1', name: 'Professional', color: '#3b82f6' }
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
        }
      ]

      // Mock API responses
      fetch
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ categories: mockCategories })
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ activities: [] })
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ activity: { id: 'act-1', name: 'Code Review' } })
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ categories: [{ ...mockCategories[0], activities: mockActivities }] })
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ activities: mockActivities })
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ message: 'Activity logged successfully!' })
        })

      // Import components dynamically to avoid module loading issues
      const { SettingsManager } = await import('../../src/components/SettingsManager')
      const { LogActivityForm } = await import('../../src/components/LogActivityForm')

      // Step 1: Create Activity
      render(<SettingsManager />)

      await waitFor(() => {
        expect(screen.getByText('Manage Activities')).toBeInTheDocument()
      })

      // Fill out activity creation form
      const categorySelect = screen.getByRole('combobox', { name: /category/i })
      await userEvent.selectOptions(categorySelect, 'cat-1')

      const nameInput = screen.getByRole('textbox', { name: /activity name/i })
      await userEvent.type(nameInput, 'Code Review')

      const pointsInput = screen.getByRole('spinbutton', { name: /base points value/i })
      await userEvent.type(pointsInput, '10')

      // Fill focus levels
      const focusInputs = screen.getAllByDisplayValue('')
      await userEvent.type(focusInputs[0], '0.5')
      await userEvent.type(focusInputs[1], '1.0')
      await userEvent.type(focusInputs[2], '1.5')
      await userEvent.type(focusInputs[3], '2.0')

      const createButton = screen.getByRole('button', { name: /add activity/i })
      await userEvent.click(createButton)

      await waitFor(() => {
        expect(screen.getByText(/Activity added successfully/)).toBeInTheDocument()
      })

      // Step 2: Log Activity
      // Navigate to log activity page (simulated)
      render(<LogActivityForm />)

      await waitFor(() => {
        expect(screen.getByText('Select Category')).toBeInTheDocument()
      })

      const logCategorySelect = screen.getByRole('combobox', { name: /select category/i })
      await userEvent.selectOptions(logCategorySelect, 'cat-1')

      await waitFor(() => {
        expect(screen.getByText('Select Activity')).toBeInTheDocument()
      })

      const logActivitySelect = screen.getByRole('combobox', { name: /select activity/i })
      await userEvent.selectOptions(logActivitySelect, 'act-1')

      await waitFor(() => {
        expect(screen.getByText('Code Review')).toBeInTheDocument()
      })

      const focusSelect = screen.getByRole('combobox', { name: /focus level/i })
      await userEvent.selectOptions(focusSelect, 'good')

      const logButton = screen.getByRole('button', { name: /log activity/i })
      await userEvent.click(logButton)

      await waitFor(() => {
        expect(screen.getByText(/Activity logged successfully/)).toBeInTheDocument()
      })

      // Step 3: Edit Activity (back to settings)
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

      // Update activity name
      const editNameInput = screen.getByDisplayValue('Code Review')
      await userEvent.clear(editNameInput)
      await userEvent.type(editNameInput, 'Updated Code Review')

      const updateButton = screen.getByRole('button', { name: /update activity/i })
      await userEvent.click(updateButton)

      await waitFor(() => {
        expect(screen.getByText(/Activity updated successfully/)).toBeInTheDocument()
      })

      // Step 4: Delete Activity
      window.confirm = jest.fn(() => true)

      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ message: 'Activity deleted successfully' })
      })

      const deleteButton = screen.getByTitle('Delete activity')
      await userEvent.click(deleteButton)

      expect(window.confirm).toHaveBeenCalled()

      await waitFor(() => {
        expect(screen.getByText(/Activity "Updated Code Review" deleted successfully/)).toBeInTheDocument()
      })
    })
  })

  describe('Point Calculation Workflow', () => {
    it('should correctly calculate points for different activity types and focus levels', async () => {
      const mockCategories = [
        { id: 'cat-1', name: 'Professional', color: '#3b82f6' }
      ]

      const mockActivities = [
        {
          id: 'act-1',
          name: 'Fixed Activity',
          points: 10,
          type: 'fixed',
          focusScoringType: 'multiplier',
          focusLevels: { low: 0.5, medium: 1.0, good: 1.5, zen: 2.0 },
          pointCategory: mockCategories[0]
        },
        {
          id: 'act-2',
          name: 'Time-Based Activity',
          points: 0,
          type: 'time_based',
          focusScoringType: 'multiplier',
          focusLevels: { low: 0.5, medium: 1.0, good: 1.5, zen: 2.0 },
          pointCategory: mockCategories[0]
        }
      ]

      fetch
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ categories: mockCategories })
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ activities: mockActivities })
        })

      const { LogActivityForm } = await import('../../src/components/LogActivityForm')
      render(<LogActivityForm />)

      await waitFor(() => {
        expect(screen.getByText('Select Category')).toBeInTheDocument()
      })

      const categorySelect = screen.getByRole('combobox', { name: /select category/i })
      await userEvent.selectOptions(categorySelect, 'cat-1')

      await waitFor(() => {
        expect(screen.getByText('Select Activity')).toBeInTheDocument()
      })

      // Test Fixed Activity with Good Focus
      const activitySelect = screen.getByRole('combobox', { name: /select activity/i })
      await userEvent.selectOptions(activitySelect, 'act-1')

      await waitFor(() => {
        expect(screen.getByText('Fixed Activity')).toBeInTheDocument()
      })

      const focusSelect = screen.getByRole('combobox', { name: /focus level/i })
      await userEvent.selectOptions(focusSelect, 'good')

      await waitFor(() => {
        expect(screen.getByText(/Expected Points: 15/)).toBeInTheDocument() // 10 * 1.5
      })

      // Test Time-Based Activity
      await userEvent.selectOptions(activitySelect, 'act-2')

      await waitFor(() => {
        expect(screen.getByText('Time-Based Activity')).toBeInTheDocument()
      })

      // Set time range
      const startTimeInput = screen.getByDisplayValue('')
      const endTimeInput = screen.getAllByDisplayValue('')[1]
      
      fireEvent.change(startTimeInput, { target: { value: '09:00' } })
      fireEvent.change(endTimeInput, { target: { value: '10:30' } })

      await userEvent.selectOptions(focusSelect, 'zen')

      await waitFor(() => {
        expect(screen.getByText(/Expected Points: 180/)).toBeInTheDocument() // 90 minutes * 2.0
      })
    })
  })

  describe('Error Handling Workflow', () => {
    it('should handle various error scenarios gracefully', async () => {
      // Test network error
      fetch.mockRejectedValueOnce(new Error('Network error'))

      const { SettingsManager } = await import('../../src/components/SettingsManager')
      render(<SettingsManager />)

      await waitFor(() => {
        expect(screen.getByText('Manage Activities')).toBeInTheDocument()
      })

      // Should not crash and should show loading state or empty state
      expect(screen.getByText('Loading categories...')).toBeInTheDocument()

      // Test API error response
      fetch
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ categories: [] })
        })
        .mockResolvedValueOnce({
          ok: false,
          json: async () => ({ error: 'Failed to create activity' })
        })

      const categorySelect = screen.getByRole('combobox', { name: /category/i })
      await userEvent.selectOptions(categorySelect, 'cat-1')

      const nameInput = screen.getByRole('textbox', { name: /activity name/i })
      await userEvent.type(nameInput, 'Test Activity')

      const pointsInput = screen.getByRole('spinbutton', { name: /base points value/i })
      await userEvent.type(pointsInput, '10')

      const focusInputs = screen.getAllByDisplayValue('')
      await userEvent.type(focusInputs[0], '0.5')
      await userEvent.type(focusInputs[1], '1.0')
      await userEvent.type(focusInputs[2], '1.5')
      await userEvent.type(focusInputs[3], '2.0')

      const createButton = screen.getByRole('button', { name: /add activity/i })
      await userEvent.click(createButton)

      await waitFor(() => {
        expect(screen.getByText('Failed to create activity')).toBeInTheDocument()
      })
    })
  })

  describe('Data Validation Workflow', () => {
    it('should validate all form inputs correctly', async () => {
      const mockCategories = [
        { id: 'cat-1', name: 'Professional', color: '#3b82f6' }
      ]

      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ categories: mockCategories })
      })

      const { SettingsManager } = await import('../../src/components/SettingsManager')
      render(<SettingsManager />)

      await waitFor(() => {
        expect(screen.getByText('Manage Activities')).toBeInTheDocument()
      })

      // Test missing category
      const nameInput = screen.getByRole('textbox', { name: /activity name/i })
      await userEvent.type(nameInput, 'Test Activity')

      const createButton = screen.getByRole('button', { name: /add activity/i })
      await userEvent.click(createButton)

      // Should show validation error
      expect(screen.getByText('Please fill in all focus level multipliers')).toBeInTheDocument()

      // Test missing name
      const categorySelect = screen.getByRole('combobox', { name: /category/i })
      await userEvent.selectOptions(categorySelect, 'cat-1')

      await userEvent.clear(nameInput)
      await userEvent.click(createButton)

      expect(screen.getByText('Please fill in all focus level multipliers')).toBeInTheDocument()

      // Test invalid focus levels
      await userEvent.type(nameInput, 'Test Activity')
      const focusInputs = screen.getAllByDisplayValue('')
      await userEvent.type(focusInputs[0], '0') // Invalid: should be > 0

      await userEvent.click(createButton)

      expect(screen.getByText('Please fill in all focus level multipliers')).toBeInTheDocument()
    })
  })
})
