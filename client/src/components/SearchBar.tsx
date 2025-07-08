import { memo, useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, X } from "lucide-react";
import { useDebounce } from "@/hooks/usePerformanceOptimization";

interface SearchBarProps {
  value?: string;
  onChange?: (value: string) => void;
  onSearch?: (query: string) => void;
  placeholder?: string;
  className?: string;
  debounceMs?: number;
}

export const SearchBar = memo(({
  value: controlledValue,
  onChange,
  onSearch,
  placeholder = "Rechercher...",
  className = "",
  debounceMs = 300
}: SearchBarProps) => {
  const [internalValue, setInternalValue] = useState(controlledValue || "");
  
  const isControlled = controlledValue !== undefined;
  const currentValue = isControlled ? controlledValue : internalValue;

  const debouncedOnSearch = useDebounce((query: string) => {
    onSearch?.(query);
  }, debounceMs);

  const handleChange = (newValue: string) => {
    if (isControlled) {
      onChange?.(newValue);
    } else {
      setInternalValue(newValue);
    }
    
    debouncedOnSearch(newValue);
  };

  const handleClear = () => {
    handleChange("");
  };

  return (
    <div className={`relative ${className}`}>
      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
      <Input
        type="text"
        placeholder={placeholder}
        value={currentValue}
        onChange={(e) => handleChange(e.target.value)}
        className="pl-10 pr-10"
      />
      {currentValue && (
        <Button
          variant="ghost"
          size="sm"
          onClick={handleClear}
          className="absolute right-1 top-1/2 transform -translate-y-1/2 h-6 w-6 p-0 hover:bg-gray-100 dark:hover:bg-gray-800"
        >
          <X className="h-3 w-3" />
        </Button>
      )}
    </div>
  );
});

SearchBar.displayName = "SearchBar";