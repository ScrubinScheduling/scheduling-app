'use client';

import * as React from 'react';
import { CheckIcon, ChevronsUpDownIcon, XIcon } from 'lucide-react';

import type { User } from '@scrubin/schemas';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';

export type UserComboboxProps = {
  users: User[];
  value: string | undefined;
  onChange: (value: string | undefined) => void;
  disabled?: boolean;
  placeholder?: string;
  className?: string;
  clearable?: boolean;
};

export default function UserCombobox({
  users,
  value,
  onChange,
  disabled,
  placeholder = 'Select employee...',
  className,
  clearable = true
}: UserComboboxProps) {
  const [open, setOpen] = React.useState(false);

  const selectedUser = React.useMemo(() => {
    if (!value) return undefined;
    return users.find((u) => String(u.id) === value);
  }, [users, value]);

  const selectedLabel = selectedUser
    ? `${selectedUser.firstName}${selectedUser.lastName ? ` ${selectedUser.lastName}` : ''}`
    : '';

  return (
    <div className={cn('flex items-center', className)}>
      <Popover
        open={open}
        onOpenChange={(next) => {
          if (disabled) {
            setOpen(false);
            return;
          }
          setOpen(next);
        }}
      >
        <PopoverTrigger asChild>
          <Button
            type="button"
            variant="outline"
            size="sm"
            role="combobox"
            aria-expanded={open}
            className="w-full justify-between"
            disabled={disabled}
          >
            <span className={cn('truncate text-left', !selectedLabel && 'text-muted-foreground')}>
              {selectedLabel || placeholder}
            </span>
            <ChevronsUpDownIcon className="ml-2 size-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
          <Command>
            <CommandInput placeholder="Search employees..." disabled={disabled} />
            <CommandList>
              <CommandEmpty>No employees found.</CommandEmpty>
              <CommandGroup>
                {users.map((u) => {
                  const id = String(u.id);
                  const label = `${u.firstName}${u.lastName ? ` ${u.lastName}` : ''}`;
                  const selected = id === value;

                  return (
                    <CommandItem
                      key={id}
                      value={`${label} ${id}`}
                      onSelect={() => {
                        if (disabled) return;
                        onChange(id);
                        setOpen(false);
                      }}
                    >
                      <CheckIcon className={cn('mr-2 size-4', selected ? 'opacity-100' : 'opacity-0')} />
                      {label}
                    </CommandItem>
                  );
                })}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>

      {clearable && value ? (
        <Button
          type="button"
          variant="ghost"
          size="icon-xs"
          aria-label="Clear selected employee"
          onClick={() => onChange(undefined)}
          disabled={disabled}
        >
          <XIcon className="size-4" />
        </Button>
      ) : null}
    </div>
  );
}
