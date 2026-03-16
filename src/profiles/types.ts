export interface ProfileOverride {
  templateId: string;
  account: string;
  values: Record<string, unknown>;
  label?: string;
}

export interface Profile {
  name: string;
  description: string;
  overrides?: ProfileOverride[];
  flowConfig?: Record<string, unknown>;
}
