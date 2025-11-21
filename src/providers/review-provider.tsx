import React, { createContext, useContext, useState } from "react"

type ReviewContextType = {
  openReviewDialog: () => void
}

const ReviewContext = createContext<ReviewContextType | undefined>(undefined)

export const ReviewProvider = ({ children }: { children: React.ReactNode }) => {
  const [_isOpen, setIsOpen] = useState(false)

  const openReviewDialog = () => {
    setIsOpen(true)
  }

  return (
    <ReviewContext.Provider value={{ openReviewDialog }}>
      {children}
    </ReviewContext.Provider>
  )
}

export const useReview = () => {
  const context = useContext(ReviewContext)

  if (!context) {
    throw new Error("useReview must be used within a ReviewProvider")
  }

  return context
}
