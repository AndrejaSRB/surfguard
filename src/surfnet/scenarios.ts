import type { Profile } from "../profiles/types.js";
import type { OverrideInstance, Scenario } from "./types.js";

export function profileToScenarios(profile: Profile): Scenario[] {
  if (!profile.overrides || profile.overrides.length === 0) {
    return [];
  }

  const overrides: OverrideInstance[] = profile.overrides.map((o, i) => ({
    id: `${profile.name}-override-${i}`,
    templateId: o.templateId,
    values: o.values,
    scenarioRelativeSlot: 0,
    label: o.label ?? null,
    enabled: true,
    account: { pubkey: o.account },
  }));

  return [
    {
      id: `${profile.name}-scenario`,
      name: profile.name,
      description: profile.description,
      overrides,
      tags: [profile.name],
    },
  ];
}
