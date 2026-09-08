'use client'

export function AutoSubmitSelect({
  name,
  defaultValue,
  options,
  className,
}: {
  name: string
  defaultValue: string
  options: readonly string[]
  className?: string
}) {
  return (
    <select
      name={name}
      defaultValue={defaultValue}
      onChange={(e) => e.currentTarget.form?.requestSubmit()}
      className={className}
    >
      {options.map((o) => (
        <option key={o} value={o}>
          {o}
        </option>
      ))}
    </select>
  )
}
