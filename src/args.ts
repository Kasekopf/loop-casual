import { printHtml } from "kolmafia";
import { get } from "libram";

/**
 * Specification for an argument that takes values in T.
 * @member key The key to use when parsing this argument.
 * @member help Description for the help text.
 * @member options An array of allowable values for this argument.
 *    Each entry has an optional description for the help text as well.
 * @member setting A setting to use for this argument. If not given,
 *    ${script name}_${argument name} is used; set to "" for no setting.
 *    A value in this setting is used as the new default for this argument,
 *    and can be overridden by a command line argument.
 * @member hidden If true, do not display this option in the help text.
 * @member default A default value to use if no value is provided.
 *    Note that 'default' is effectively optional, as all methods that take
 *    an ArgSpec allow for 'default' to be omitted. But it is typed as
 *    non-optional here to enable cool type inference voodoo.
 */
interface ArgSpec<T> {
  key?: Exclude<string, "help">;
  help?: string;
  options?: [T, string?][];
  setting?: string;
  hidden?: boolean;
  default: T;
}
/**
 * Allow the default argument to be optional, in a way that allows for cool type inference.
 */
type ArgSpecNoDefault<T> = Omit<ArgSpec<T>, "default">;

export class Args {
  /**
   * Create an argument for a custom type.
   * @param spec Specification for this argument.
   * @param parser A function to parse a string value into the proper type.
   * @param valueName The name of this type, for the help text.
   * @returns An argument.
   */
  static custom<T>(spec: ArgSpec<T>, parser: Parser<T>, valueName: string): Arg<T>;
  static custom<T>(
    spec: ArgSpecNoDefault<T>,
    parser: Parser<T>,
    valueHelpName: string
  ): ArgNoDefault<T>;
  static custom<T>(
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

  /**
   * Create a string argument.
   * @param spec Specification for this argument. See {@link ArgSpec} for details.
   */
  static string(spec: ArgSpec<string>): Arg<string>;
  static string(spec: ArgSpecNoDefault<string>): ArgNoDefault<string>;
  static string(spec: ArgSpecNoDefault<string>): ArgNoDefault<string> {
    return this.custom<string>(spec, (value: string) => value, "TEXT");
  }

  /**
   * Create a number argument.
   * @param spec Specification for this argument. See {@link ArgSpec} for details.
   */
  static number(spec: ArgSpec<number>): Arg<number>;
  static number(spec: ArgSpecNoDefault<number>): ArgNoDefault<number>;
  static number(spec: ArgSpecNoDefault<number>): ArgNoDefault<number> {
    return this.custom(
      spec,
      (value: string) => (isNaN(Number(value)) ? undefined : Number(value)),
      "NUMBER"
    );
  }

  /**
   * Create a boolean argument.
   * @param spec Specification for this argument. See {@link ArgSpec} for details.
   */
  static boolean(spec: ArgSpec<boolean>): Arg<boolean>;
  static boolean(spec: ArgSpecNoDefault<boolean>): ArgNoDefault<boolean>;
  static boolean(spec: ArgSpecNoDefault<boolean>): ArgNoDefault<boolean> {
    return this.custom(
      spec,
      (value: string) => {
        if (value.toLowerCase() === "true") return true;
        if (value.toLowerCase() === "false") return false;
        return undefined;
      },
      "BOOLEAN"
    );
  }

  /**
   * Create a flag.
   * @param spec Specification for this argument. See {@link ArgSpec} for details.
   */
  static flag(spec: ArgSpec<boolean>): Arg<boolean>;
  static flag(spec: ArgSpecNoDefault<boolean>): ArgNoDefault<boolean>;
  static flag(spec: ArgSpecNoDefault<boolean>): ArgNoDefault<boolean> {
    return this.custom(
      spec,
      (value: string) => {
        if (value.toLowerCase() === "true") return true;
        if (value.toLowerCase() === "false") return false;
        return undefined;
      },
      "FLAG"
    );
  }

  /**
   * Create a set of input arguments for a script.
   * @param scriptName Prefix for property names; often the name of the script.
   * @param scriptHelp Brief description of this script, for the help message.
   * @param args A JS object specifying the script arguments. Its values should
   *    be {@link Arg} objects (created by Args.string, Args.number, or others).
   * @returns An object which can hold parsed argument values. The keys of this
   *    object are identical to the keys in 'args'.
   */
  static create<T extends ArgMap>(
    scriptName: string,
    scriptHelp: string,
    args: T
  ): ParsedArgs<T> & { help: boolean } {
    for (const k in args) {
      if (k === "help" || args[k].key === "help") throw `help is a reserved argument name`;
    }

    const argsWithHelp = {
      ...args,
      help: this.flag({ help: "Show this message and exit.", setting: "" }),
    };

    const res: { [key: string]: unknown } & ArgMetadata<T> = {
      [specSymbol]: argsWithHelp,
      [scriptSymbol]: scriptName,
      [scriptHelpSymbol]: scriptHelp,
    };

    // Fill the default values for each argument.
    for (const k in argsWithHelp) {
      const v = argsWithHelp[k];
      if ("default" in v) res[k] = v["default"];
      else res[k] = undefined;
    }

    // Parse values from settings.
    for (const k in argsWithHelp) {
      const setting = argsWithHelp[k].setting ?? `${scriptName}_${argsWithHelp[k].key ?? k}`;
      if (setting === "") continue; // no setting
      const value_str = get(setting, "");
      if (value_str === "") continue;
      res[k] = parseAndValidate(argsWithHelp[k], `Setting ${setting}`, value_str);
    }

    return res as ParsedArgs<T> & { help: boolean };
  }

  /**
   * Parse the command line input into the provided script arguments.
   * @param args An object to hold the parsed argument values, from Args.create(*).
   * @param command The command line input.
   */
  static fill<T extends ArgMap>(args: ParsedArgs<T>, command: string | undefined): void {
    if (command === undefined || command === "") return;

    const spec = args[specSymbol];
    const keys = new Set<string>();
    const flags = new Set<string>();
    for (const k in spec) {
      if (spec[k].valueHelpName === "FLAG") flags.add(spec[k].key ?? k);
      else keys.add(spec[k].key ?? k);
    }

    // Parse new argments from the command line
    const parsed = new CommandParser(command, keys, flags).parse();
    for (const k in spec) {
      const key = spec[k].key ?? k;
      const value_str = parsed.get(key);
      if (value_str === undefined) continue;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      args[k] = parseAndValidate(spec[k], `Argument ${key}`, value_str) as any;
    }
  }

  /**
   * Parse command line input into a new set of script arguments.
   * @param scriptName Prefix to use in property names; typically the name of the script.
   * @param scriptHelp Brief description of this script, for the help message.
   * @param spec An object specifying the script arguments.
   * @param command The command line input.
   */
  static parse<T extends ArgMap>(
    scriptName: string,
    scriptHelp: string,
    spec: T,
    command: string
  ): ParsedArgs<T> {
    const args = this.create(scriptName, scriptHelp, spec);
    this.fill(args, command);
    return args;
  }

  /**
   * Print a description of the script arguments to the CLI.
   * @param args An object of parsed arguments, from Args.create(*).
   * @param maxOptionsToDisplay If given, do not list more than this many options for each arg.
   */
  static showHelp<T extends ArgMap>(args: ParsedArgs<T>, maxOptionsToDisplay?: number): void {
    const spec = args[specSymbol];
    const scriptName = args[scriptSymbol];
    const scriptHelp = args[scriptHelpSymbol];

    printHtml(`${scriptHelp}`);
    printHtml(`<font color='blue'><b>Options:</b></font>`);
    for (const k in spec) {
      const arg = spec[k];
      if (arg.hidden) continue;

      const nameText = `<font color='blue'>${arg.key ?? k}</font>`;
      const valueText =
        arg.valueHelpName === "FLAG" ? "" : `<font color='purple'>${arg.valueHelpName}</font>`;
      const helpText = arg.help ?? "";
      const defaultText =
        "default" in arg ? `<font color='#888888'>[default: ${arg.default}]</font>` : "";
      const settingText =
        arg.setting === ""
          ? ""
          : `<font color='#888888'>[setting: ${arg.setting ?? `${scriptName}_${arg.key ?? k}`
          }]</font>`;

      printHtml(
        `&nbsp;&nbsp;${[nameText, valueText, "-", helpText, defaultText, settingText].join(" ")}`
      );
      const valueOptions = arg.options ?? [];
      if (valueOptions.length < (maxOptionsToDisplay ?? Number.MAX_VALUE)) {
        for (const option of valueOptions) {
          if (option.length === 1) {
            printHtml(`&nbsp;&nbsp;&nbsp;&nbsp;<font color='blue'>${nameText}</font> ${option[0]}`);
          } else {
            printHtml(
              `&nbsp;&nbsp;&nbsp;&nbsp;<font color='blue'>${nameText}</font> ${option[0]} - ${option[1]}`
            );
          }
        }
      }
    }
  }
}

/**
 * A parser that can transform a string value into the desired type.
 * It may return undefined if given an invalid value.
 */
type Parser<T> = (value: string) => T | undefined;

/**
 * An argument that takes values in T.
 * @member parser The parser to use to built T values.
 * @member valueHelpName The string name of T, e.g. NUMBER.
 */
interface Arg<T> extends ArgSpec<T> {
  parser: Parser<T>;
  valueHelpName: string;
}
/**
 * Allow the default argument to be optional, in a way that allows for cool type inference.
 */
type ArgNoDefault<T> = Omit<Arg<T>, "default">;

/**
 * Metadata for the parsed arguments.
 *
 * This information is hidden within the parsed argument object so that it
 * is invisible to the user but available to fill(*) and showHelp(*).
 */
const specSymbol: unique symbol = Symbol("spec");
const scriptSymbol: unique symbol = Symbol("script");
const scriptHelpSymbol: unique symbol = Symbol("scriptHelp");
type ArgMetadata<T extends ArgMap> = {
  [specSymbol]: T;
  [scriptSymbol]: string;
  [scriptHelpSymbol]: string;
};

/**
 * Construct the object type for the parsed arguments with typescript voodoo.
 *
 * The keys for the parsed argument object match the keys from the argument
 * specifications. That is, for each (key: spec) pair in the argument spec
 * object, there is a (key: value) in the parsed argument object.
 *
 * If spec has type Arg<T> (i.e., has a default), then value has type T.
 * If spec has type ArgNoDefault<T>, the value has type T | undefined.
 *
 * Finally, there are hidden keys in ArgMetadata for fill(*) and showHelp(*).
 */
type ArgMap = {
  [key: string]: Arg<unknown> | ArgNoDefault<unknown>;
};
type ParsedArgs<T extends ArgMap> = {
  [k in keyof T]: T[k] extends Arg<unknown>
  ? Exclude<ReturnType<T[k]["parser"]>, undefined>
  : ReturnType<T[k]["parser"]>;
} & ArgMetadata<T>;

/**
 * Parse a string into a value for a given argument, throwing if the parsing fails.
 * @param arg An argument that takes values in T.
 * @param source A description of where this value came from, for the error message.
 * @param value The value to parse.
 * @returns the parsed value.
 */
function parseAndValidate<T>(arg: Arg<T> | ArgNoDefault<T>, source: string, value: string): T {
  const parsed_value = arg.parser(value);
  if (parsed_value === undefined) throw `${source} could not parse value: ${value}`;
  const options = arg.options;
  if (options) {
    if (!options.map((option) => option[0]).includes(parsed_value)) {
      throw `${source} received invalid value: ${value}`;
    }
  }
  return parsed_value;
}

/**
 * A parser to extract key/value pairs from a command line input.
 * @member command The command line input.
 * @member keys The set of valid keys that can appear.
 * @member flags The set of valid flags that can appear.
 * @member index An internal marker for the progress of the parser over the input.
 */
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

  /**
   * Perform the parsing of (key, value) pairs.
   * @returns The set of extracted (key, value) pairs.
   */
  parse(): Map<string, string> {
    this.index = 0; // reset the parser
    const result = new Map<string, string>();
    while (!this.finished()) {
      // A flag F may appear as !F to be parsed as false.
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

  /**
   * @returns True if the entire command has been parsed.
   */
  private finished(): boolean {
    return this.index >= this.command.length;
  }

  /**
   * @returns The next character to parse, if it exists.
   */
  private peek(): string | undefined {
    if (this.index >= this.command.length) return undefined;
    return this.command.charAt(this.index);
  }

  /**
   * Advance the internal marker over the next expected character.
   * Throws an error on unexpected characters.
   *
   * @param allowed Characters that are expected.
   */
  private consume(allowed: string[]) {
    if (this.finished()) throw `Expected ${allowed}`;
    if (allowed.includes(this.peek() ?? "")) {
      this.index += 1;
    }
  }

  /**
   * Find the next occurance of one of the provided characters, or the end of
   * the string if the characters never appear again.
   *
   * @param searchValue The characters to locate.
   */
  private findNext(searchValue: string[]) {
    let result = this.command.length;
    for (const value of searchValue) {
      const index = this.command.indexOf(value, this.index);
      if (index !== -1 && index < result) result = index;
    }
    return result;
  }

  /**
   * Starting from the internal marker, parse a single key.
   * This also advances the internal marker.
   *
   * @returns The next key.
   */
  private parseKey(): string {
    const keyEnd = this.findNext(["=", " "]);
    const key = this.command.substring(this.index, keyEnd);
    this.index = keyEnd;
    if (!this.keys.has(key) && !this.flags.has(key)) {
      throw `Unknown key: ${key}`;
    }
    return key;
  }

  /**
   * Starting from the internal marker, parse a single value.
   * This also advances the internal marker.
   *
   * Values are a single word or enclosed in matching quotes, i.e. one of:
   *    "[^"]*"
   *    '[^']*"
   *    [^'"][^ ]*
   *
   * @returns The next value.
   */
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
