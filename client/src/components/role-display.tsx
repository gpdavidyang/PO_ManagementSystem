import { useUiTerms } from "@/hooks/use-ui-terms";

interface RoleDisplayProps {
  role: string;
  className?: string;
}

export function RoleDisplay({ role, className }: RoleDisplayProps) {
  const { data: terms } = useUiTerms({ category: "user_roles" });
  
  const getRoleLabel = (roleValue: string) => {
    const termKey = `role_${roleValue}`;
    const term = terms?.find(t => t.termKey === termKey);
    return term?.termValue || roleValue;
  };

  return (
    <span className={className}>
      {getRoleLabel(role)}
    </span>
  );
}

interface RoleSelectOptionsProps {
  onSelect?: (value: string) => void;
  value?: string;
  children: (options: Array<{ value: string; label: string }>) => React.ReactNode;
}

export function RoleSelectOptions({ children }: RoleSelectOptionsProps) {
  const { data: terms } = useUiTerms({ category: "user_roles" });
  
  const roleOptions = [
    { value: "admin", termKey: "role_admin" },
    { value: "order_manager", termKey: "role_order_manager" },
    { value: "user", termKey: "role_user" }
  ];

  const options = roleOptions.map(role => {
    const term = terms?.find(t => t.termKey === role.termKey);
    return {
      value: role.value,
      label: term?.termValue || role.value
    };
  });

  return <>{children(options)}</>;
}