import React, { useId, useRef } from 'react'
import { Input } from './ui/input'
import { Label } from './ui/label'
import { CheckboxProps } from '@radix-ui/react-checkbox'
import { useInputControl } from '@conform-to/react'
import { Checkbox } from './ui/checkbox'
import { Textarea } from './ui/textarea'

export type ListOfErrors = Array<string | null | undefined> | null | undefined

export function ErrorList({
  id,
  errors,
  size,
}: {
  errors?: ListOfErrors
  id?: string
  size?: 'sm' | 'lg'
}) {
  const errorsToRender = errors?.filter(Boolean)
  if (!errorsToRender?.length) return null
  const sizeClass = size === 'lg' ? 'text-sm' : 'text-[10px]'
  return (
    <ul id={id} className="flex flex-col gap-1">
      {errorsToRender.map(e => (
        <li key={e} className={`text-destructive ${sizeClass} `}>
          {e}
        </li>
      ))}
    </ul>
  )
}

export function Field({
  labelProps,
  inputProps,
  errors,
  className,
}: {
  labelProps: React.LabelHTMLAttributes<HTMLLabelElement>
  inputProps: React.InputHTMLAttributes<HTMLInputElement>
  errors?: ListOfErrors
  className?: string
}) {
  const fallbackId = useId()
  const id = inputProps.id ?? fallbackId
  const errorId = errors?.length ? `${id}-error` : undefined
  return (
    <div className={className}>
      <div className="space-y-2">
        <Label htmlFor={id} {...labelProps} />
        <Input
          id={id}
          aria-invalid={errorId ? true : undefined}
          aria-describedby={errorId}
          {...inputProps}
        />
      </div>
      <div className="min-h-[32px] pt-1">
        {errorId ? <ErrorList id={errorId} errors={errors} /> : null}
      </div>
    </div>
  )
}

export function TextareaField({
  labelProps,
  textareaProps,
  errors,
  className,
}: {
  labelProps: React.LabelHTMLAttributes<HTMLLabelElement>
  textareaProps: React.TextareaHTMLAttributes<HTMLTextAreaElement>
  errors?: ListOfErrors
  className?: string
}) {
  const fallbackId = useId()
  const id = textareaProps.id ?? textareaProps.name ?? fallbackId
  const errorId = errors?.length ? `${id}-error` : undefined
  return (
    <div className={className}>
      <Label htmlFor={id} {...labelProps} />
      <Textarea
        id={id}
        aria-invalid={errorId ? true : undefined}
        aria-describedby={errorId}
        {...textareaProps}
      />
      <div className="min-h-[32px] px-4 pb-3 pt-1">
        {errorId ? <ErrorList id={errorId} errors={errors} /> : null}
      </div>
    </div>
  )
}

export function CheckboxField({
  labelProps,
  buttonProps,
  errors,
  className,
}: {
  labelProps: JSX.IntrinsicElements['label']
  buttonProps: CheckboxProps
  errors?: ListOfErrors
  className?: string
}) {
  const fallbackId = useId()
  const buttonRef = useRef<HTMLButtonElement>(null)
  const control = useInputControl({
    name: buttonProps.name ?? '',
    formId: buttonProps.form ?? '',
  })
  const id = buttonProps.id ?? buttonProps.name ?? fallbackId
  const errorId = errors?.length ? `${id}-error` : undefined
  return (
    <div className={className}>
      <div className="flex items-center gap-2">
        <Checkbox
          id={id}
          ref={buttonRef}
          aria-invalid={errorId ? true : undefined}
          aria-describedby={errorId}
          {...buttonProps}
          onCheckedChange={state => {
            control.change(String(state.valueOf()))
            buttonProps.onCheckedChange?.(state)
          }}
          onFocus={event => {
            control.focus()
            buttonProps.onFocus?.(event)
          }}
          onBlur={event => {
            control.blur()
            buttonProps.onBlur?.(event)
          }}
          type="button"
        />
        <label
          htmlFor={id}
          {...labelProps}
          className="text-body-xs self-center text-muted-foreground"
        />
      </div>
      <div className="min-h-[32px] px-4 pb-3 pt-1">
        {errorId ? <ErrorList id={errorId} errors={errors} /> : null}
      </div>
    </div>
  )
}
