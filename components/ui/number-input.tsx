"use client";

import { type ComponentProps } from "react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

type Base = Omit<ComponentProps<typeof Input>, "type" | "value" | "onChange" | "inputMode" | "pattern">;

type NullableProps = Base & {
  nullable: true;
  value: number | undefined;
  onChange: (value: number | undefined) => void;
  min?: number;
};

type NonNullableProps = Base & {
  nullable?: false;
  value: number;
  onChange: (value: number) => void;
  min?: number;
};

type NumberInputProps = NullableProps | NonNullableProps;

export function NumberInput({ value, onChange, min = 0, nullable, className, ...props }: NumberInputProps) {
  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const raw = e.target.value.replace(/[^0-9]/g, "");
    if (raw === "") {
      if (nullable) (onChange as (v: number | undefined) => void)(undefined);
      else (onChange as (v: number) => void)(min);
    } else {
      (onChange as (v: number) => void)(Math.max(min, parseInt(raw, 10)));
    }
  }

  return (
    <Input
      type="text"
      inputMode="numeric"
      pattern="[0-9]*"
      className={cn("w-16 text-right", className)}
      value={value ?? ""}
      onChange={handleChange}
      {...props}
    />
  );
}
