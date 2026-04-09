---
name: components-and-styling
description: Use when building any UI component. Defines component organization, composition patterns, Tailwind CSS styling, ShadCN UI patterns, form abstractions, and Storybook conventions.
---

# Components & Styling

## When to use this skill

Use this skill when you need to:
- Create a new React component (shared or feature-specific)
- Style a component with Tailwind CSS
- Build form components with validation
- Wrap 3rd-party UI libraries
- Write Storybook stories

## Component Organization Rules

### Shared vs Feature Components

- **Shared components** (`src/components/`) — Used across multiple features. These are UI primitives and layout components.
- **Feature components** (`src/features/<feature>/components/`) — Scoped to a single feature. Only used within that feature.

### UI Primitives Structure

```
src/components/ui/
├── button/
│   ├── button.tsx
│   └── button.stories.tsx
├── dialog/
│   ├── confirmation-dialog/
│   │   ├── confirmation-dialog.tsx
│   │   └── __tests__/
│   │       └── confirmation-dialog.test.tsx
│   └── dialog.tsx
├── form/
│   ├── form.tsx
│   ├── input.tsx
│   ├── label.tsx
│   ├── select.tsx
│   └── textarea.tsx
├── link/
│   └── link.tsx
├── notifications/
│   ├── notification.tsx
│   └── notifications-store.ts
└── spinner/
    └── spinner.tsx
```

## Component Best Practices

### 1. Colocate Things Close to Where They're Used

Keep components, functions, styles, and state as close as possible to where they're used. This improves readability and reduces unnecessary re-renders.

### 2. No Nested Rendering Functions

```tsx
// ❌ BAD — nested render functions become unmanageable
function Component() {
  function renderItems() {
    return <ul>...</ul>;
  }
  return <div>{renderItems()}</div>;
}

// ✅ GOOD — extract into separate component
function Items() {
  return <ul>...</ul>;
}

function Component() {
  return (
    <div>
      <Items />
    </div>
  );
}
```

### 3. Limit Props Count

If a component accepts too many props, split it into multiple components or use the **composition pattern** via `children` or slots.

```tsx
// ✅ Composition pattern
function ConfirmationDialog({
  triggerButton,
  confirmButton,
  title,
  body,
  cancelButtonText = 'Cancel',
  icon,
  isDone,
}: ConfirmationDialogProps) {
  // Use composition — each piece is a separate component passed as a prop
}
```

### 4. Abstract Shared Components

Build abstractions around shared components for consistency. Wrap 3rd-party components to adapt them to application needs — this makes future migrations easier.

```tsx
// ✅ Wrap 3rd-party link component
import { Link as RouterLink } from 'react-router';

export const Link = ({ className, children, ...props }: LinkProps) => {
  return (
    <RouterLink className={cn('text-slate-600 hover:text-slate-900', className)} {...props}>
      {children}
    </RouterLink>
  );
};
```

### 5. Consistent Code Style

- Component names: **PascalCase** (e.g., `ConfirmationDialog`)
- File names: **kebab-case** (e.g., `confirmation-dialog.tsx`)
- Props types: `<ComponentName>Props` (e.g., `ConfirmationDialogProps`)
- Use `React.forwardRef` for components that need ref forwarding
- Always set `displayName` on forwardRef components

## Styling

### Primary: Tailwind CSS

Use Tailwind CSS as the primary styling solution. It is a zero-runtime styling solution (styles generated at build time), which is important for performance and React Server Component compatibility.

```tsx
// ✅ Tailwind CSS usage
const Button = ({ className, variant, size, ...props }: ButtonProps) => {
  return (
    <button
      className={cn(
        'inline-flex items-center justify-center rounded-md text-sm font-medium',
        'ring-offset-background transition-colors',
        'focus-visible:outline-none focus-visible:ring-2',
        'disabled:pointer-events-none disabled:opacity-50',
        variants[variant],
        sizes[size],
        className,
      )}
      {...props}
    />
  );
};
```

### Utility: `cn()` Helper

Always use the `cn()` utility (clsx + tailwind-merge) for conditional class composition:

```tsx
// src/utils/cn.ts
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
```

### Component Library: ShadCN UI Pattern

Use the ShadCN UI pattern — components are provided as code (not npm packages) that you own and customize:

- Based on Radix UI primitives (accessible, unstyled headless components)
- Styled with Tailwind CSS
- Fully customizable since you own the code
- Located in `src/components/ui/`

## Form Components

Forms use an abstracted `Form` component built on React Hook Form + Zod:

```tsx
// ✅ Form component pattern
import { zodResolver } from '@hookform/resolvers/zod';
import { FormProvider, useForm } from 'react-hook-form';
import { ZodType, z } from 'zod';

const Form = <Schema extends ZodType<any, any, any>, TFormValues extends FieldValues = z.infer<Schema>>({
  onSubmit, children, schema, options, className, id,
}: FormProps<TFormValues, Schema>) => {
  const form = useForm({ ...options, resolver: zodResolver(schema) });
  return (
    <FormProvider {...form}>
      <form className={cn('space-y-6', className)} onSubmit={form.handleSubmit(onSubmit)} id={id}>
        {children(form)}
      </form>
    </FormProvider>
  );
};
```

Usage pattern:
```tsx
<Form schema={createItemSchema} onSubmit={handleSubmit}>
  {({ register, formState }) => (
    <>
      <Input label="Title" error={formState.errors.title} registration={register('title')} />
      <Button type="submit">Create</Button>
    </>
  )}
</Form>
```

## Storybook

Write Storybook stories for all shared components:

```tsx
// button.stories.tsx
import type { Meta, StoryObj } from '@storybook/react';
import { Button } from './button';

const meta: Meta<typeof Button> = {
  component: Button,
};
export default meta;

type Story = StoryObj<typeof Button>;

export const Default: Story = {
  args: { children: 'Button', variant: 'default' },
};

export const Destructive: Story = {
  args: { children: 'Delete', variant: 'destructive' },
};
```

## Checklist for Creating a Component

- [ ] Determine if shared (`src/components/`) or feature-specific (`src/features/<f>/components/`)
- [ ] Use `kebab-case` for file name, `PascalCase` for component export
- [ ] Define a `Props` type for the component
- [ ] Use Tailwind CSS + `cn()` for styling
- [ ] Use composition pattern instead of excessive props
- [ ] Wrap 3rd-party components for adaptability
- [ ] Add `forwardRef` + `displayName` where appropriate
- [ ] Write Storybook story for shared components
- [ ] Write tests in a colocated `__tests__/` directory
