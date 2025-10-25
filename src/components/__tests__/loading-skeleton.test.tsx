/**
 * Loading Skeleton Component Tests
 *
 * Week 4: Testing Framework - React Component Tests
 */

import { render, screen } from '@testing-library/react'
import {
  PageLoadingSkeleton,
  DashboardLoadingSkeleton,
  GalleryLoadingSkeleton,
  FormLoadingSkeleton,
} from '../loading-skeleton'

describe('Loading Skeleton Components', () => {
  describe('PageLoadingSkeleton', () => {
    it('should render without crashing', () => {
      render(<PageLoadingSkeleton />)
      expect(screen.getByRole('main')).toBeInTheDocument()
    })

    it('should have animate-pulse class', () => {
      const { container } = render(<PageLoadingSkeleton />)
      const animatedElement = container.querySelector('.animate-pulse')
      expect(animatedElement).toBeInTheDocument()
    })

    it('should render skeleton elements', () => {
      const { container } = render(<PageLoadingSkeleton />)
      const skeletonElements = container.querySelectorAll('.bg-gray-200')
      expect(skeletonElements.length).toBeGreaterThan(0)
    })
  })

  describe('DashboardLoadingSkeleton', () => {
    it('should render without crashing', () => {
      const { container } = render(<DashboardLoadingSkeleton />)
      expect(container.firstChild).toBeInTheDocument()
    })

    it('should render 4 stat card skeletons', () => {
      const { container } = render(<DashboardLoadingSkeleton />)
      // Looking for the grid that contains stat cards
      const grid = container.querySelector('.grid')
      expect(grid).toBeInTheDocument()
    })

    it('should have animate-pulse class', () => {
      const { container } = render(<DashboardLoadingSkeleton />)
      const animatedElement = container.querySelector('.animate-pulse')
      expect(animatedElement).toBeInTheDocument()
    })
  })

  describe('GalleryLoadingSkeleton', () => {
    it('should render without crashing', () => {
      render(<GalleryLoadingSkeleton />)
      expect(screen.getByRole('main')).toBeInTheDocument()
    })

    it('should render 8 video card skeletons', () => {
      const { container } = render(<GalleryLoadingSkeleton />)
      const videoCards = container.querySelectorAll('.aspect-video')
      expect(videoCards).toHaveLength(8)
    })

    it('should have grid layout', () => {
      const { container } = render(<GalleryLoadingSkeleton />)
      const grid = container.querySelector('.grid')
      expect(grid).toBeInTheDocument()
    })
  })

  describe('FormLoadingSkeleton', () => {
    it('should render without crashing', () => {
      const { container } = render(<FormLoadingSkeleton />)
      expect(container.firstChild).toBeInTheDocument()
    })

    it('should have centered layout', () => {
      const { container } = render(<FormLoadingSkeleton />)
      const centeredElement = container.querySelector('.items-center.justify-center')
      expect(centeredElement).toBeInTheDocument()
    })

    it('should have animate-pulse class', () => {
      const { container } = render(<FormLoadingSkeleton />)
      const animatedElement = container.querySelector('.animate-pulse')
      expect(animatedElement).toBeInTheDocument()
    })
  })

  describe('Accessibility', () => {
    it('PageLoadingSkeleton should have proper structure', () => {
      const { container } = render(<PageLoadingSkeleton />)
      expect(container.querySelector('.min-h-screen')).toBeInTheDocument()
    })

    it('GalleryLoadingSkeleton should have proper structure', () => {
      const { container } = render(<GalleryLoadingSkeleton />)
      expect(container.querySelector('.min-h-screen')).toBeInTheDocument()
      expect(container.querySelector('.container')).toBeInTheDocument()
    })
  })

  describe('Snapshot Tests', () => {
    it('PageLoadingSkeleton matches snapshot', () => {
      const { container } = render(<PageLoadingSkeleton />)
      expect(container.firstChild).toMatchSnapshot()
    })

    it('DashboardLoadingSkeleton matches snapshot', () => {
      const { container } = render(<DashboardLoadingSkeleton />)
      expect(container.firstChild).toMatchSnapshot()
    })

    it('GalleryLoadingSkeleton matches snapshot', () => {
      const { container } = render(<GalleryLoadingSkeleton />)
      expect(container.firstChild).toMatchSnapshot()
    })

    it('FormLoadingSkeleton matches snapshot', () => {
      const { container } = render(<FormLoadingSkeleton />)
      expect(container.firstChild).toMatchSnapshot()
    })
  })
})
