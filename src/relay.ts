import { Args } from "grimoire-kolmafia";
import { write } from "kolmafia";
import { ComponentSetting, generateHTML, handleApiRequest, RelayPage } from "mafia-shared-relay";
import { args } from "./args";

function convertArgsToHtml(): RelayPage[] {
  const metadata = Args.getMetadata(args);
  const pages: RelayPage[] = [
    {
      page: metadata.options.defaultGroupName ?? "Options",
      file: metadata.options.defaultGroupName ?? "Options",
      components: [],
    },
  ];

  metadata.traverse(
    (key, name: string) => {
      if (key.setting === "" || key.hidden) return;

      const component: ComponentSetting = {
        type: "string",
        name: key.key ?? name,
        description: key.help || "No Description Provided",
        preference: key.setting ?? `${metadata.scriptName}_${key.key ?? name}`,
        default: "default" in key ? `${key["default"]}` : undefined,
      };

      if (key.valueHelpName === "FLAG" || key.valueHelpName === "BOOLEAN") {
        component.type = "boolean";
      } else if (key.options !== undefined) {
        component.type = "dropdown";
        component.dropdown = key.options.map(([k, desc]) => {
          return { display: desc ?? k, value: k };
        });
      }
      pages[pages.length - 1].components.push(component);
    },
    (group, name: string) => {
      pages.push({ page: group.name, file: name, components: [] });
    }
  );

  return pages.filter((page) => page.components.length > 0);
}

export function main() {
  if (handleApiRequest()) return;
  write(generateHTML(convertArgsToHtml()));
}
