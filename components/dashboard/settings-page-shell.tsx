import { SettingsNav } from './settings-nav';

type SettingsPageShellProps = {
  children: React.ReactNode;
};

export function SettingsPageShell({ children }: SettingsPageShellProps) {
  return (
    <div className="max-w-2xl">
      <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
      <p className="mt-1 mb-6 text-sm text-gray-500">
        Manage your account and preferences.
      </p>
      <SettingsNav />
      {children}
    </div>
  );
}
