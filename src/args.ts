import { printHtml } from "kolmafia";

interface ArgSpec<T> {
  name?: Exclude<string, "help">;
  help?: string;
  options?: [T, string?][];
  default: T;
}
type ArgSpecNoDefault<T> = Omit<ArgSpec<T>, "default">;

type Parser<T> = (value: string) => T | undefined;
interface Arg<T> extends ArgSpec<T> {
  valueHelpName: string;
  options?: [T, string?][];
  parser: Parser<T>;
}
type ArgNoDefault<T> = Omit<Arg<T>, "default">;

export function arg<T>(spec: ArgSpec<T>, parser: Parser<T>, valueName: string): Arg<T>;
export function arg<T>(
  spec: ArgSpecNoDefault<T>,
  parser: Parser<T>,
  valueHelpName: string
): ArgNoDefault<T>;
export function arg<T>(
  spec: ArgSpec<T> | ArgSpecNoDefault<T>,
  parser: Parser<T>,
  valueHelpName: string
): Arg<T> | ArgNoDefault<T> {
  if ("default" in spec && spec.options) {
    if (!spec.options.map((option) => option[0]).includes(spec.default)) {
      throw `Invalid default value ${spec.default}`;
    }
  }

  return {
    ...spec,
    valueHelpName: valueHelpName,
    parser: parser,
  };
}

export function string(spec: ArgSpec<string>): Arg<string>;
export function string(spec: ArgSpecNoDefault<string>): ArgNoDefault<string>;
export function string(spec: ArgSpecNoDefault<string>): ArgNoDefault<string> {
  return arg<string>(spec, (value: string) => value, "TEXT");
}

export function number(spec: ArgSpec<number>): Arg<number>;
export function number(spec: ArgSpecNoDefault<number>): ArgNoDefault<number>;
export function number(spec: ArgSpecNoDefault<number>): ArgNoDefault<number> {
  return arg(spec, (value: string) => (isNaN(Number(value)) ? undefined : Number(value)), "NUMBER");
}

export function boolean(spec: ArgSpec<boolean>): Arg<boolean>;
export function boolean(spec: ArgSpecNoDefault<boolean>): ArgNoDefault<boolean>;
export function boolean(spec: ArgSpecNoDefault<boolean>): ArgNoDefault<boolean> {
  return arg(
    spec,
    (value: string) => {
      if (value.toLowerCase() === "true") return true;
      if (value.toLowerCase() === "false") return false;
      return undefined;
    },
    "BOOLEAN"
  );
}

export function flag(spec: ArgSpec<boolean>): Arg<boolean>;
export function flag(spec: ArgSpecNoDefault<boolean>): ArgNoDefault<boolean>;
export function flag(spec: ArgSpecNoDefault<boolean>): ArgNoDefault<boolean> {
  return arg(
    spec,
    (value: string) => {
      if (value.toLowerCase() === "true") return true;
      if (value.toLowerCase() === "false") return false;
      return undefined;
    },
    "FLAG"
  );
}

type ArgMap = {
  [key: string]: Arg<unknown> | ArgNoDefault<unknown>;
};

const specSymbol: unique symbol = Symbol("spec");
const scriptSymbol: unique symbol = Symbol("script");
const scriptHelpSymbol: unique symbol = Symbol("scriptHelp");
type ArgMetadata<T extends ArgMap> = {
  [specSymbol]: T;
  [scriptSymbol]: string;
  [scriptHelpSymbol]: string;
};
type ParsedArgs<T extends ArgMap> = {
  [k in keyof T]: T[k] extends Arg<unknown>
    ? Exclude<ReturnType<T[k]["parser"]>, undefined>
    : ReturnType<T[k]["parser"]>;
} & ArgMetadata<T>;

export function create<T extends ArgMap>(
  scriptName: string,
  scriptHelp: string,
  spec: T
): ParsedArgs<T> & { help: Arg<boolean> } {
  for (const k in spec) {
    if (k === "help" || spec[k].name === "help") throw `help is a reserved argument name`;
  }

  const specWithHelp = {
    ...spec,
    help: flag({ help: "Show this message and exit." }),
  };

  const res: { [key: string]: unknown } & ArgMetadata<T> = {
    [specSymbol]: specWithHelp,
    [scriptSymbol]: scriptName,
    [scriptHelpSymbol]: scriptHelp,
  };
  for (const k in specWithHelp) {
    const v = specWithHelp[k];
    if ("default" in v) res[k] = v["default"];
    else res[k] = undefined;
  }
  return res as ParsedArgs<T> & { help: Arg<boolean> };
}

export function fill<T extends ArgMap>(args: ParsedArgs<T>, command: string | undefined) {
  if (command === undefined || command === "") return;

  const spec = args[specSymbol];
  const keys = new Set<string>();
  const flags = new Set<string>();
  for (const k in spec) {
    if (spec[k].valueHelpName === "FLAG") flags.add(spec[k].name ?? k);
    else keys.add(spec[k].name ?? k);
  }

  // Parse new argments from the command line
  const parsed = new CommandParser(command, keys, flags).parse();
  for (const k in spec) {
    const key = spec[k].name ?? k;
    const value_str = parsed.get(key);
    if (value_str === undefined) continue;

    const value = spec[k].parser(value_str);
    if (value === undefined) throw `Argument ${key} could not parse value: ${value_str}`;
    const options = spec[k].options;
    if (options) {
      if (!options.map((option) => option[0]).includes(value)) {
        throw `Argument ${key} received invalid value: ${value_str}`;
      }
    }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    args[k] = value as any;
  }
}

export function parse<T extends ArgMap>(
  scriptName: string,
  scriptHelp: string,
  spec: T,
  command: string
): ParsedArgs<T> {
  const args = create(scriptName, scriptHelp, spec);
  fill(args, command);
  return args;
}

export function showHelp<T extends ArgMap>(args: ParsedArgs<T>, maxOptionsToDisplay?: number) {
  const spec = args[specSymbol];
  const scriptHelp = args[scriptHelpSymbol];

  printHtml(`${scriptHelp}`);
  printHtml(`<font color='blue'>Options:</font>`);
  for (const k in spec) {
    const arg = spec[k];

    const nameText = arg.name ?? k;
    const valueText = arg.valueHelpName === "FLAG" ? "" : `${arg.valueHelpName}`;
    const helpText = arg.help ?? "";
    const defaultText = "default" in arg ? `[default: ${arg.default}]` : "";

    printHtml(`&nbsp;&nbsp;${[nameText, valueText, "-", helpText, defaultText].join(" ")}`);
    const valueOptions = arg.options ?? [];
    if (valueOptions.length < (maxOptionsToDisplay ?? Number.MAX_VALUE)) {
      for (const option of valueOptions) {
        if (option.length === 1) {
          printHtml(`&nbsp;&nbsp;&nbsp;&nbsp;${nameText} ${option[0]}`);
        } else {
          printHtml(`&nbsp;&nbsp;&nbsp;&nbsp;${nameText} ${option[0]} - ${option[1]}`);
        }
      }
    }
  }
}

class CommandParser {
  private command: string;
  private keys: Set<string>;
  private flags: Set<string>;
  private index: number;
  constructor(command: string, keys: Set<string>, flags: Set<string>) {
    this.command = command;
    this.index = 0;
    this.keys = keys;
    this.flags = flags;
  }

  parse(): Map<string, string> {
    const result = new Map<string, string>();
    while (!this.finished()) {
      let parsing_negative_flag = false;
      if (this.peek() === "!") {
        parsing_negative_flag = true;
        this.consume(["!"]);
      }

      const key = this.parseKey();
      if (result.has(key)) {
        throw `Duplicate key: ${key}`;
      }
      if (this.flags.has(key)) {
        // The key corresponds to a flag.
        // Parse [key] as true and ![key] as false.
        result.set(key, parsing_negative_flag ? "false" : "true");
        if (this.peek() === "=") throw `Flag ${key} cannot be assigned a value`;
        if (!this.finished()) this.consume([" "]);
      } else {
        // Parse [key]=[value] or [key] [value]
        this.consume(["=", " "]);
        const value = this.parseValue();
        if (!this.finished()) this.consume([" "]);
        result.set(key, value);
      }
    }
    return result;
  }

  private finished(): boolean {
    return this.index >= this.command.length;
  }

  private peek(): string | undefined {
    if (this.index >= this.command.length) return undefined;
    return this.command.charAt(this.index);
  }

  private consume(allowed: string[]) {
    if (this.finished()) throw `Expected ${allowed}`;
    if (allowed.includes(this.peek() ?? "")) {
      this.index += 1;
    }
  }

  private findNext(searchValue: string[]) {
    let result = this.command.length;
    for (const value of searchValue) {
      const index = this.command.indexOf(value, this.index);
      if (index !== -1 && index < result) result = index;
    }
    return result;
  }

  private parseKey(): string {
    const keyEnd = this.findNext(["=", " "]);
    const key = this.command.substring(this.index, keyEnd);
    this.index = keyEnd;
    if (!this.keys.has(key) && !this.flags.has(key)) {
      throw `Unknown key: ${key}`;
    }
    return key;
  }

  private parseValue(): string {
    let valueEnder = " ";
    const quotes = ["'", '"'];
    if (quotes.includes(this.peek() ?? "")) {
      valueEnder = this.peek() ?? ""; // The value is everything until the next quote
      this.consume([valueEnder]); // Consume opening quote
    }

    const valueEnd = this.findNext([valueEnder]);
    const value = this.command.substring(this.index, valueEnd);
    if (valueEnder !== " " && valueEnd === this.command.length) {
      throw `No closing ${valueEnder} found for ${valueEnder}${value}`;
    }

    // Consume the value (and closing quote)
    this.index = valueEnd;
    if (valueEnder !== " ") this.consume([valueEnder]);
    return value;
  }
}
