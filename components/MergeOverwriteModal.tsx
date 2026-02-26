'use client'

interface MergeOverwriteModalProps {
  isOpen: boolean
  onClose: () => void
  onMerge: () => void
  onOverwrite: () => void
  existingFields: string[]
  newFields: string[]
  conflictingFields: string[]
  extractedImageCount: number
  existingImageCount: number
}

export default function MergeOverwriteModal({
  isOpen,
  onClose,
  onMerge,
  onOverwrite,
  existingFields,
  newFields,
  conflictingFields,
  extractedImageCount,
  existingImageCount,
}: MergeOverwriteModalProps) {
  if (!isOpen) return null

  const newOnlyFields = newFields.filter((f) => !conflictingFields.includes(f))

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />

      {/* Modal */}
      <div className="relative bg-white rounded-3xl shadow-xl max-w-lg w-full p-8 z-10">
        <h2 className="font-nunito text-xl font-black text-dark mb-2">
          This property already has data
        </h2>
        <p className="text-sm text-muted mb-5">
          The uploaded document contains information that overlaps with existing data.
          How would you like to handle it?
        </p>

        {/* Field breakdown */}
        <div className="bg-[rgba(108,92,231,0.04)] rounded-2xl p-4 mb-5 space-y-3">
          {conflictingFields.length > 0 && (
            <div className="flex items-start gap-3">
              <div className="w-5 h-5 mt-0.5 shrink-0">
                <svg className="w-5 h-5 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4.5c-.77-.833-2.694-.833-3.464 0L3.34 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>
              <div>
                <p className="text-sm font-bold text-dark">Overlapping fields</p>
                <p className="text-xs text-muted">{conflictingFields.join(', ')}</p>
              </div>
            </div>
          )}

          {newOnlyFields.length > 0 && (
            <div className="flex items-start gap-3">
              <div className="w-5 h-5 mt-0.5 shrink-0">
                <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
              </div>
              <div>
                <p className="text-sm font-bold text-dark">New information</p>
                <p className="text-xs text-muted">{newOnlyFields.join(', ')}</p>
              </div>
            </div>
          )}

          {extractedImageCount > 0 && (
            <div className="flex items-start gap-3">
              <div className="w-5 h-5 mt-0.5 shrink-0">
                <svg className="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <div>
                <p className="text-sm font-bold text-dark">
                  {extractedImageCount} image{extractedImageCount !== 1 ? 's' : ''} extracted
                </p>
                {existingImageCount > 0 && (
                  <p className="text-xs text-muted">
                    Property currently has {existingImageCount} image{existingImageCount !== 1 ? 's' : ''}
                  </p>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          <button
            onClick={onMerge}
            className="flex-1 bg-primary text-white px-6 py-3 rounded-full font-nunito font-extrabold text-sm hover:bg-primary/90 hover:-translate-y-0.5 transition-all"
          >
            Update & Add
          </button>
          <button
            onClick={onOverwrite}
            className="flex-1 bg-white border-2 border-red-200 text-red-600 px-6 py-3 rounded-full font-nunito font-extrabold text-sm hover:border-red-400 hover:-translate-y-0.5 transition-all"
          >
            Overwrite All
          </button>
        </div>
        <button
          onClick={onClose}
          className="w-full text-center text-xs text-muted mt-3 hover:text-dark transition-colors"
        >
          Cancel
        </button>
      </div>
    </div>
  )
}
