/**
 * 选择框组件
 * 从 AddScholarPage:193-224 提取
 */
import { Children, isValidElement, type ReactNode } from "react";
import { ComboboxInput } from "@/components/ui/ComboboxInput";

interface SelectInputProps {
  value: string;
  onChange: (v: string) => void;
  children: React.ReactNode;
  placeholder?: string;
  error?: boolean;
  disabled?: boolean;
  className?: string;
}

export function SelectInput({
  value,
  onChange,
  children,
  placeholder,
  error,
  disabled,
  className,
}: SelectInputProps) {
  const options: Array<{ value: string; label: string }> = [];
  Children.forEach(children, (child) => {
    if (
      !isValidElement<{ value?: string; children?: ReactNode }>(child) ||
      child.type !== "option"
    )
      return;
    const optionValue = String(child.props.value ?? "");
    const label = String(child.props.children ?? "");
    options.push({ value: optionValue, label });
  });

  const valueToLabel = new Map(options.map((item) => [item.value, item.label]));
  const labelToValue = new Map(options.map((item) => [item.label, item.value]));
  const selectedLabel = value ? (valueToLabel.get(value) ?? value) : "";

  return (
    <ComboboxInput
      value={selectedLabel}
      onChange={(nextLabel) => onChange(labelToValue.get(nextLabel) ?? "")}
      options={options.map((item) => item.label)}
      placeholder={placeholder || "请选择"}
      error={error}
      disabled={disabled}
      className={className}
      clearable={Boolean(placeholder)}
    />
  );
}
