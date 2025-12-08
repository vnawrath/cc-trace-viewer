# Input

```json
{
  "file_path": "/Users/viktornawrath/repos/cc-trace-viewer/src/components/LoadingSkeleton.tsx",
  "old_string": "interface SkeletonProps {\n  className?: string;\n}\n\nfunction Skeleton({ className = '' }: SkeletonProps) {\n  return (\n    <div\n      className={`animate-pulse bg-gray-200 rounded ${className}`}\n      aria-hidden=\"true\"\n    />\n  );\n}",
  "new_string": "interface SkeletonProps {\n  className?: string;\n}\n\nfunction Skeleton({ className = '' }: SkeletonProps) {\n  return (\n    <div\n      className={`animate-pulse bg-gray-200 rounded ${className}`}\n      aria-hidden=\"true\"\n    />\n  );\n}\n\nexport function LoadingSpinner({ size = 'md', className = '' }: { size?: 'sm' | 'md' | 'lg'; className?: string }) {\n  const sizeClasses = {\n    sm: 'h-4 w-4',\n    md: 'h-6 w-6',\n    lg: 'h-8 w-8'\n  };\n\n  return (\n    <div className={`animate-spin rounded-full border-2 border-blue-200 border-t-blue-600 ${sizeClasses[size]} ${className}`} />\n  );\n}\n\nexport function LoadingOverlay({ message = 'Loading...' }: { message?: string }) {\n  return (\n    <div className=\"absolute inset-0 bg-white/80 backdrop-blur-sm flex items-center justify-center z-50\">\n      <div className=\"text-center\">\n        <LoadingSpinner size=\"lg\" className=\"mx-auto mb-4\" />\n        <p className=\"text-gray-600 text-sm\">{message}</p>\n      </div>\n    </div>\n  );\n}\n\nexport function InlineLoading({ message = 'Loading...' }: { message?: string }) {\n  return (\n    <div className=\"flex items-center space-x-2 text-gray-600 text-sm\">\n      <LoadingSpinner size=\"sm\" />\n      <span>{message}</span>\n    </div>\n  );\n}\n\nexport function FullPageLoading({ message = 'Loading...' }: { message?: string }) {\n  return (\n    <div className=\"min-h-screen bg-gray-50 flex items-center justify-center\">\n      <div className=\"text-center\">\n        <LoadingSpinner size=\"lg\" className=\"mx-auto mb-4\" />\n        <h2 className=\"text-lg font-medium text-gray-900 mb-2\">{message}</h2>\n        <p className=\"text-gray-500 text-sm\">This may take a moment...</p>\n      </div>\n    </div>\n  );\n}"
}
```

# Output

```
The file /Users/viktornawrath/repos/cc-trace-viewer/src/components/LoadingSkeleton.tsx has been updated. Here's the result of running `cat -n` on a snippet of the edited file:
     1→interface SkeletonProps {
     2→  className?: string;
     3→}
     4→
     5→function Skeleton({ className = '' }: SkeletonProps) {
     6→  return (
     7→    <div
     8→      className={`animate-pulse bg-gray-200 rounded ${className}`}
     9→      aria-hidden="true"
    10→    />
    11→  );
    12→}
    13→
    14→export function LoadingSpinner({ size = 'md', className = '' }: { size?: 'sm' | 'md' | 'lg'; className?: string }) {
    15→  const sizeClasses = {
    16→    sm: 'h-4 w-4',
    17→    md: 'h-6 w-6',
    18→    lg: 'h-8 w-8'
    19→  };
    20→
    21→  return (
    22→    <div className={`animate-spin rounded-full border-2 border-blue-200 border-t-blue-600 ${sizeClasses[size]} ${className}`} />
    23→  );
    24→}
    25→
    26→export function LoadingOverlay({ message = 'Loading...' }: { message?: string }) {
    27→  return (
    28→    <div className="absolute inset-0 bg-white/80 backdrop-blur-sm flex items-center justify-center z-50">
    29→      <div className="text-center">
    30→        <LoadingSpinner size="lg" className="mx-auto mb-4" />
    31→        <p className="text-gray-600 text-sm">{message}</p>
    32→      </div>
    33→    </div>
    34→  );
    35→}
    36→
    37→export function InlineLoading({ message = 'Loading...' }: { message?: string }) {
    38→  return (
    39→    <div className="flex items-center space-x-2 text-gray-600 text-sm">
    40→      <LoadingSpinner size="sm" />
    41→      <span>{message}</span>
    42→    </div>
    43→  );
    44→}
    45→
    46→export function FullPageLoading({ message = 'Loading...' }: { message?: string }) {
    47→  return (
    48→    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
    49→      <div className="text-center">
    50→        <LoadingSpinner size="lg" className="mx-auto mb-4" />
    51→        <h2 className="text-lg font-medium text-gray-900 mb-2">{message}</h2>
    52→        <p className="text-gray-500 text-sm">This may take a moment...</p>
    53→      </div>
    54→    </div>
    55→  );
    56→}
    57→
    58→export function TableSkeleton() {
    59→  return (
    60→    <div className="space-y-4">
```
